import { describe, expect, it } from "vitest";

import { api } from "../../convex/_generated/api";
import { createTrip, createUser, errorDataOf, setupTest, updateTrip, type TestConvex } from "./helpers";

type User = Awaited<ReturnType<typeof createUser>>;

const ONE_LITRE = "cooking oil|dalda||1l|";
const FIVE_LITRE = "cooking oil|dalda||5l|";

/** A bill with one "Cooking Oil · Dalda" item of the given pack size and price. */
function oilBill(title: string, tripDate: string, price: string, packSize = "1 l", storeName = "Imtiaz") {
  return {
    details: { title, storeName, tripDate },
    items: [{ name: "Cooking Oil", brand: "Dalda", packSize, unitPrice: price }],
  };
}

function observations(user: User, productMatchKey = ONE_LITRE) {
  return user.as.query(api.priceHistory.getObservations, { productMatchKey });
}

async function observedTrips(user: User, productMatchKey = ONE_LITRE) {
  return (await observations(user, productMatchKey))?.observations.map((observation) => observation.tripId) ?? [];
}

/** Alice's three 1 l records at 500, 540 and 540, on different dates and stores. */
async function aliceWithThreeBills(t: TestConvex) {
  const alice = await createUser(t, "alice");
  const first = await createTrip(alice.as, oilBill("September shop", "2026-09-01", "500", "1 l", "Imtiaz"));
  const second = await createTrip(alice.as, oilBill("Early October", "2026-10-01", "540", "1 litre", "Metro"));
  const third = await createTrip(alice.as, oilBill("Mid October", "2026-10-12", "540", "1 Ltr", "Carrefour"));
  return { alice, trips: [first, second, third] };
}

/** Puts Bob on `tripId` as "Bob" and invites him; returns the invitation and person IDs. */
async function inviteBob(owner: User, tripId: string) {
  const trip = await owner.as.query(api.trips.get, { tripId });
  if (!trip) throw new Error("No trip");
  await updateTrip(owner.as, tripId, {
    details: { title: trip.title, storeName: trip.storeName ?? "", tripDate: trip.tripDate },
    people: [{ key: "new:1", name: "Bob" }],
    items: trip.items.map((item) => ({
      itemId: item.id,
      name: item.name,
      brand: item.brand ?? "",
      packSize: item.packSize ?? "",
      unitPrice: String(item.unitPricePaisa / 100),
    })),
  });
  const updated = await owner.as.query(api.trips.get, { tripId });
  const personId = updated?.people.find((person) => person.name === "Bob")?.personId;
  if (!personId) throw new Error("No Bob on the bill");
  const { invitationId } = await owner.as.mutation(api.invitations.invite, {
    tripId,
    personId,
    via: "username",
    identifier: "bob",
  });
  return { invitationId, personId };
}

describe("priceHistory.getObservations", () => {
  it("lists one product's records newest first with the change from the record before", async () => {
    const t = setupTest();
    const { alice, trips } = await aliceWithThreeBills(t);

    const history = await observations(alice);
    expect(history?.observations.map(({ tripId, tripTitle, storeName, tripDate, unitPricePaisa, change }) => ({
      tripId, tripTitle, storeName, tripDate, unitPricePaisa, change,
    }))).toEqual([
      { tripId: trips[2], tripTitle: "Mid October", storeName: "Carrefour", tripDate: "2026-10-12", unitPricePaisa: 54000, change: { kind: "unchanged" } },
      { tripId: trips[1], tripTitle: "Early October", storeName: "Metro", tripDate: "2026-10-01", unitPricePaisa: 54000, change: { kind: "up", diffPaisa: 4000, percent: 8 } },
      { tripId: trips[0], tripTitle: "September shop", storeName: "Imtiaz", tripDate: "2026-09-01", unitPricePaisa: 50000, change: { kind: "first" } },
    ]);
    expect(history?.product).toEqual({
      productMatchKey: ONE_LITRE,
      name: "Cooking Oil",
      brand: "Dalda",
      variant: null,
      packSize: "1 Ltr",
      unit: null,
      observationCount: 3,
      latestPricePaisa: 54000,
      latestTripDate: "2026-10-12",
    });
    expect(history?.otherVariants).toEqual([]);
  });

  it("returns exactly the documented fields, with no account data", async () => {
    const t = setupTest();
    const { alice } = await aliceWithThreeBills(t);
    const history = await observations(alice);
    expect(Object.keys(history ?? {}).sort()).toEqual(["observations", "otherVariants", "product"]);
    expect(Object.keys(history?.observations[0] ?? {}).sort()).toEqual([
      "change", "itemId", "quantityMilli", "storeName", "tripDate", "tripId", "tripTitle", "unit", "unitPricePaisa",
    ]);
  });

  it("keeps a 5 l pack as a separate product, listed under other variants", async () => {
    const t = setupTest();
    const { alice } = await aliceWithThreeBills(t);
    const bigPack = await createTrip(alice.as, oilBill("Bulk buy", "2026-10-05", "2600", "5 l"));
    // Same name, different brand: also another variant. A different item is not.
    await createTrip(alice.as, {
      details: { title: "Other brand", tripDate: "2026-10-06" },
      items: [{ name: "cooking  OIL", brand: "Habib", packSize: "1 l" }, { name: "Olive Oil", packSize: "1 l" }],
    });

    const oneLitre = await observations(alice);
    expect(oneLitre?.observations).toHaveLength(3);
    expect(oneLitre?.otherVariants.map((product) => [product.productMatchKey, product.observationCount])).toEqual([
      ["cooking oil|habib||1l|", 1],
      [FIVE_LITRE, 1],
    ]);

    expect(await observedTrips(alice, FIVE_LITRE)).toEqual([bigPack]);
    const fiveLitre = await observations(alice, FIVE_LITRE);
    expect(fiveLitre?.observations[0].change).toEqual({ kind: "first" });
    expect(fiveLitre?.otherVariants.map((product) => product.productMatchKey)).toContain(ONE_LITRE);
  });

  it("shows Bob his own records plus the bill he's linked on, nothing else", async () => {
    const t = setupTest();
    const { alice, trips } = await aliceWithThreeBills(t);
    const bob = await createUser(t, "bob");
    const bobsOwn = await createTrip(bob.as, oilBill("Bob's shop", "2026-10-15", "560"));

    const linked = await inviteBob(alice, trips[1]);
    await bob.as.mutation(api.invitations.respond, { invitationId: linked.invitationId, accept: true });

    const history = await observations(bob);
    expect(history?.observations.map((observation) => observation.tripId)).toEqual([bobsOwn, trips[1]]);
    // Compared only with what Bob can see: 540 is his first record, 560 is +20.
    expect(history?.observations.map((observation) => observation.change)).toEqual([
      { kind: "up", diffPaisa: 2000, percent: 3.7 },
      { kind: "first" },
    ]);
    expect(history?.product.observationCount).toBe(2);
  });

  it("shows a pending, declined or unlinked invitee nothing from that bill", async () => {
    const t = setupTest();
    const { alice, trips } = await aliceWithThreeBills(t);
    const bob = await createUser(t, "bob");

    await inviteBob(alice, trips[0]);
    expect(await observations(bob)).toBeNull();

    const declined = await inviteBob(alice, trips[1]);
    await bob.as.mutation(api.invitations.respond, { invitationId: declined.invitationId, accept: false });
    expect(await observations(bob)).toBeNull();

    const unlinked = await inviteBob(alice, trips[2]);
    await bob.as.mutation(api.invitations.respond, { invitationId: unlinked.invitationId, accept: true });
    expect(await observedTrips(bob)).toEqual([trips[2]]);
    await alice.as.mutation(api.invitations.unlink, { personId: unlinked.personId });
    expect(await observations(bob)).toBeNull();
    expect(await bob.as.query(api.priceHistory.searchProducts, { term: "oil" })).toEqual([]);
  });

  it("shows nothing after an invitation is cancelled or a linked person is removed", async () => {
    const t = setupTest();
    const { alice, trips } = await aliceWithThreeBills(t);
    const bob = await createUser(t, "bob");

    const cancelled = await inviteBob(alice, trips[0]);
    await alice.as.mutation(api.invitations.cancel, { invitationId: cancelled.invitationId });
    expect(await observations(bob)).toBeNull();

    const removed = await inviteBob(alice, trips[1]);
    await bob.as.mutation(api.invitations.respond, { invitationId: removed.invitationId, accept: true });
    expect(await observedTrips(bob)).toEqual([trips[1]]);
    // Saving the bill without Bob removes him (and his access).
    await updateTrip(alice.as, trips[1], {
      details: { title: "Early October", storeName: "Metro", tripDate: "2026-10-01" },
      items: [{ name: "Cooking Oil", brand: "Dalda", packSize: "1 litre", unitPrice: "540" }],
    });
    expect(await observations(bob)).toBeNull();
    expect(await bob.as.query(api.priceHistory.searchProducts, { term: "oil" })).toEqual([]);
  });

  it("never counts Carol's records in Alice's results, or Alice's in Carol's", async () => {
    const t = setupTest();
    const { alice, trips } = await aliceWithThreeBills(t);
    const carol = await createUser(t, "carol");
    const carols = await createTrip(carol.as, oilBill("Carol's shop", "2026-10-20", "999"));

    const history = await observations(alice);
    expect(history?.observations.map((observation) => observation.tripId)).toEqual([...trips].reverse());
    expect(history?.product).toMatchObject({ observationCount: 3, latestPricePaisa: 54000, latestTripDate: "2026-10-12" });
    expect(history?.observations[0].change).toEqual({ kind: "unchanged" });

    const [aliceResult] = await alice.as.query(api.priceHistory.searchProducts, { term: "oil" });
    expect(aliceResult).toMatchObject({ observationCount: 3, latestPricePaisa: 54000 });

    expect(await observedTrips(carol)).toEqual([carols]);
    expect((await observations(carol))?.observations[0].change).toEqual({ kind: "first" });
  });

  it("drops a deleted bill's record", async () => {
    const t = setupTest();
    const { alice, trips } = await aliceWithThreeBills(t);
    await alice.as.mutation(api.trips.remove, { tripId: trips[1] });

    const history = await observations(alice);
    expect(history?.observations.map((observation) => [observation.tripId, observation.change])).toEqual([
      [trips[2], { kind: "up", diffPaisa: 4000, percent: 8 }],
      [trips[0], { kind: "first" }],
    ]);

    await alice.as.mutation(api.trips.remove, { tripId: trips[0] });
    await alice.as.mutation(api.trips.remove, { tripId: trips[2] });
    expect(await observations(alice)).toBeNull();
    expect(await alice.as.query(api.priceHistory.searchProducts, { term: "oil" })).toEqual([]);
  });

  it("changes only the edited bill's record when a price is edited", async () => {
    const t = setupTest();
    const { alice, trips } = await aliceWithThreeBills(t);
    const before = await observations(alice);
    const trip = await alice.as.query(api.trips.get, { tripId: trips[0] });
    await updateTrip(alice.as, trips[0], {
      details: { title: "September shop", storeName: "Imtiaz", tripDate: "2026-09-01" },
      items: [{ itemId: trip?.items[0].id, name: "Cooking Oil", brand: "Dalda", packSize: "1 l", unitPrice: "520" }],
    });

    const after = await observations(alice);
    expect(after?.observations.map((observation) => observation.unitPricePaisa)).toEqual([54000, 54000, 52000]);
    expect(after?.observations.map((observation) => observation.itemId)).toEqual(
      before?.observations.map((observation) => observation.itemId),
    );
    expect(after?.observations[1].change).toEqual({ kind: "up", diffPaisa: 2000, percent: 3.8 });
  });

  it("moves a record to the new product when its pack size is edited", async () => {
    const t = setupTest();
    const { alice, trips } = await aliceWithThreeBills(t);
    const trip = await alice.as.query(api.trips.get, { tripId: trips[2] });
    await updateTrip(alice.as, trips[2], {
      details: { title: "Mid October", storeName: "Carrefour", tripDate: "2026-10-12" },
      items: [{ itemId: trip?.items[0].id, name: "Cooking Oil", brand: "Dalda", packSize: "5 l", unitPrice: "2600" }],
    });
    expect(await observedTrips(alice)).toEqual([trips[1], trips[0]]);
    expect(await observedTrips(alice, FIVE_LITRE)).toEqual([trips[2]]);
  });

  it("returns null when signed out, for a malformed key, or for a product nobody recorded", async () => {
    const t = setupTest();
    const { alice } = await aliceWithThreeBills(t);
    expect(await t.query(api.priceHistory.getObservations, { productMatchKey: ONE_LITRE })).toBeNull();
    expect(await observations(alice, "not a key")).toBeNull();
    expect(await observations(alice, "")).toBeNull();
    expect(await observations(alice, "sugar||||")).toBeNull();
  });
});

describe("priceHistory.searchProducts", () => {
  it("finds products by a case-insensitive part of the item name, variants listed separately", async () => {
    const t = setupTest();
    const { alice } = await aliceWithThreeBills(t);
    await createTrip(alice.as, oilBill("Bulk buy", "2026-10-05", "2600", "5 l"));
    await createTrip(alice.as, {
      details: { title: "Oily title", storeName: "Oil Mart", tripDate: "2026-10-06" },
      items: [{ name: "Rice" }],
    });

    const results = await alice.as.query(api.priceHistory.searchProducts, { term: "  OIL " });
    expect(results).toEqual([
      {
        productMatchKey: ONE_LITRE,
        name: "Cooking Oil",
        brand: "Dalda",
        variant: null,
        packSize: "1 Ltr",
        unit: null,
        observationCount: 3,
        latestPricePaisa: 54000,
        latestTripDate: "2026-10-12",
      },
      expect.objectContaining({ productMatchKey: FIVE_LITRE, observationCount: 1, latestTripDate: "2026-10-05" }),
    ]);
    expect(await alice.as.query(api.priceHistory.searchProducts, { term: "king o" })).toHaveLength(2);
    expect(await alice.as.query(api.priceHistory.searchProducts, { term: "sugar" })).toEqual([]);
  });

  it("needs at least 2 characters", async () => {
    const t = setupTest();
    const { alice } = await aliceWithThreeBills(t);
    expect(await alice.as.query(api.priceHistory.searchProducts, { term: "o" })).toEqual([]);
    expect(await alice.as.query(api.priceHistory.searchProducts, { term: "   " })).toEqual([]);
    expect(await alice.as.query(api.priceHistory.searchProducts, { term: "oi" })).toHaveLength(1);
  });

  it("returns at most 20 products, most recently bought first", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    await createTrip(alice.as, {
      details: { tripDate: "2026-09-01" },
      items: Array.from({ length: 25 }, (_, index) => ({ name: `Tea ${index + 1}` })),
    });
    await createTrip(alice.as, { details: { tripDate: "2026-10-01" }, items: [{ name: "Green tea" }] });

    const results = await alice.as.query(api.priceHistory.searchProducts, { term: "tea" });
    expect(results).toHaveLength(20);
    expect(results[0].name).toBe("Green tea");
  });

  it("only searches bills the caller can see", async () => {
    const t = setupTest();
    await aliceWithThreeBills(t);
    const carol = await createUser(t, "carol");
    expect(await carol.as.query(api.priceHistory.searchProducts, { term: "oil" })).toEqual([]);
  });

  it("returns [] when signed out", async () => {
    const t = setupTest();
    await aliceWithThreeBills(t);
    expect(await t.query(api.priceHistory.searchProducts, { term: "oil" })).toEqual([]);
  });

  it("rejects a search over 80 characters", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    expect(
      await errorDataOf(() => alice.as.query(api.priceHistory.searchProducts, { term: "a".repeat(81) })),
    ).toMatchObject({ code: "VALIDATION", fieldErrors: { term: expect.any(String) } });
    expect(await alice.as.query(api.priceHistory.searchProducts, { term: "a".repeat(80) })).toEqual([]);
  });
});
