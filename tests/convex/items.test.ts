import { describe, expect, it } from "vitest";

import { api } from "../../convex/_generated/api";
import { PRODUCT_SEARCH_TRIPS_CAP } from "../../convex/lib/access";
import { addAndInvite, createTrip, createUser, errorDataOf, setupTest } from "./helpers";

type User = Awaited<ReturnType<typeof createUser>>;

function suggest(user: User, term: string) {
  return user.as.query(api.items.suggest, { term });
}

async function suggestedKeys(user: User, term: string) {
  return (await suggest(user, term)).map((suggestion) => suggestion.productMatchKey);
}

describe("items.suggest", () => {
  it("suggests a product recorded before, with its latest price and store", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    await createTrip(alice.as, {
      details: { storeName: "Metro", tripDate: "2026-09-01" },
      items: [{ name: "Cooking Oil", brand: "Dalda", packSize: "1 l", unitPrice: "500" }],
    });
    await createTrip(alice.as, {
      details: { storeName: "Imtiaz", tripDate: "2026-10-12" },
      items: [{ name: "cooking oil", brand: "Dalda", packSize: "1 litre", unitPrice: "560" }],
    });

    expect(await suggest(alice, "coo")).toEqual([
      {
        productMatchKey: "cooking oil|dalda||1l|",
        name: "cooking oil",
        brand: "Dalda",
        variant: null,
        packSize: "1 litre",
        unit: null,
        observationCount: 2,
        latestPricePaisa: 56000,
        latestTripDate: "2026-10-12",
        lastStoreName: "Imtiaz",
      },
    ]);
  });

  it("gives one suggestion per product: variants stay separate, repeats are merged", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    await createTrip(alice.as, {
      details: { tripDate: "2026-10-01" },
      items: [
        { name: "Cooking Oil", brand: "Dalda", packSize: "1 l" },
        { name: "COOKING  oil", brand: "dalda", packSize: "1L" },
        { name: "Cooking Oil", brand: "Dalda", packSize: "5 l" },
      ],
    });
    await createTrip(alice.as, {
      details: { storeName: "", tripDate: "2026-10-02" },
      items: [{ name: "Cooking Oil", brand: "Habib", packSize: "1 l" }],
    });

    const suggestions = await suggest(alice, "oil");
    expect(suggestions.map((suggestion) => [suggestion.productMatchKey, suggestion.observationCount])).toEqual([
      ["cooking oil|habib||1l|", 1],
      ["cooking oil|dalda||1l|", 2],
      ["cooking oil|dalda||5l|", 1],
    ]);
    expect(suggestions[0].lastStoreName).toBeNull();
  });

  it("returns at most 8 suggestions, most recently bought first", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    await createTrip(alice.as, {
      details: { tripDate: "2026-09-01" },
      items: Array.from({ length: 12 }, (_, index) => ({ name: `Tea ${index + 1}` })),
    });
    await createTrip(alice.as, { details: { tripDate: "2026-10-01" }, items: [{ name: "Green tea" }] });

    const suggestions = await suggest(alice, "tea");
    expect(suggestions).toHaveLength(8);
    expect(suggestions[0].name).toBe("Green tea");
  });

  it(`only reads the ${PRODUCT_SEARCH_TRIPS_CAP} most recent bills`, async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    await createTrip(alice.as, { details: { tripDate: "2025-01-01" }, items: [{ name: "Old tea" }] });
    for (let index = 0; index < PRODUCT_SEARCH_TRIPS_CAP; index += 1) {
      await createTrip(alice.as, { details: { tripDate: "2026-01-01" }, items: [{ name: "Bread" }] });
    }

    expect(await suggest(alice, "tea")).toEqual([]);
    expect(await suggestedKeys(alice, "bread")).toEqual(["bread||||"]);
  }, 60_000);

  it("only suggests from bills the caller can see", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const bob = await createUser(t, "bob");
    const carol = await createUser(t, "carol");
    const shared = await createTrip(alice.as, { details: { tripDate: "2026-10-01" }, items: [{ name: "Shared rice" }] });
    const pending = await createTrip(alice.as, { details: { tripDate: "2026-10-02" }, items: [{ name: "Pending rice" }] });
    await createTrip(alice.as, { details: { tripDate: "2026-10-03" }, items: [{ name: "Private rice" }] });
    await createTrip(bob.as, { details: { tripDate: "2026-10-04" }, items: [{ name: "Bob's rice" }] });
    await createTrip(carol.as, { details: { tripDate: "2026-10-05" }, items: [{ name: "Carol's rice" }] });

    const { invitationId } = await addAndInvite(alice, shared, "Bob", "bob");
    await bob.as.mutation(api.invitations.respond, { invitationId, accept: true });
    await addAndInvite(alice, pending, "Bob", "bob");

    expect((await suggest(bob, "rice")).map((suggestion) => suggestion.name)).toEqual(["Bob's rice", "Shared rice"]);
    expect((await suggest(carol, "rice")).map((suggestion) => suggestion.name)).toEqual(["Carol's rice"]);
    expect((await suggest(alice, "rice")).map((suggestion) => suggestion.name)).toEqual([
      "Private rice",
      "Pending rice",
      "Shared rice",
    ]);
  });

  it("drops a deleted bill's items", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const tripId = await createTrip(alice.as, { items: [{ name: "Cooking Oil" }] });
    expect(await suggest(alice, "oil")).toHaveLength(1);

    await alice.as.mutation(api.trips.remove, { tripId });
    expect(await suggest(alice, "oil")).toEqual([]);
  });

  it("needs at least 2 characters", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    await createTrip(alice.as, { items: [{ name: "Cooking Oil" }] });

    expect(await suggest(alice, "c")).toEqual([]);
    expect(await suggest(alice, "  c  ")).toEqual([]);
    expect(await suggest(alice, " CO ")).toHaveLength(1);
  });

  it("returns [] when signed out", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    await createTrip(alice.as, { items: [{ name: "Cooking Oil" }] });
    expect(await t.query(api.items.suggest, { term: "oil" })).toEqual([]);
  });

  it("rejects a search over 80 characters", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    expect(await errorDataOf(() => suggest(alice, "a".repeat(81)))).toMatchObject({
      code: "VALIDATION",
      fieldErrors: { term: "Search must be 80 characters or fewer" },
    });
  });
});
