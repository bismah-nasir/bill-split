import { describe, expect, it } from "vitest";

import { api } from "../../convex/_generated/api";
import { createTrip, createUser, errorDataOf, setupTest, type TripOverrides } from "./helpers";

type User = Awaited<ReturnType<typeof createUser>>;
type HistoryArgs = Partial<{
  search: string;
  category: "grocery" | "restaurant" | "shopping" | "other";
  from: string;
  to: string;
  ownership: "all" | "owned" | "shared";
  sort: "date_desc" | "date_asc" | "total_desc" | "total_asc";
  limit: number;
}>;

function history(user: User, args: HistoryArgs = {}) {
  return user.as.query(api.trips.listHistory, { ownership: "all", sort: "date_desc", ...args });
}

async function titles(user: User, args: HistoryArgs = {}) {
  return (await history(user, args)).trips.map((trip) => trip.title);
}

/** A bill with one item at `price` rupees, so its total is easy to order by. */
function bill(title: string, tripDate: string, price: string, overrides: TripOverrides = {}): TripOverrides {
  return {
    ...overrides,
    details: { title, storeName: "", tripDate, ...overrides.details },
    items: overrides.items ?? [{ name: "Thing", unitPrice: price }],
  };
}

/** Creates a bill of `owner`'s with Bob on it and returns the trip and Bob's person ID. */
async function billWithBob(owner: User, title: string, tripDate: string) {
  const tripId = await createTrip(owner.as, {
    ...bill(title, tripDate, "100"),
    people: [{ key: "new:1", name: "Bob" }],
  });
  const trip = await owner.as.query(api.trips.get, { tripId });
  const personId = trip?.people.find((person) => person.name === "Bob")?.personId;
  if (!personId) throw new Error("No Bob on the bill");
  return { tripId, personId };
}

async function inviteBob(owner: User, bob: User, title: string, tripDate: string) {
  const { tripId, personId } = await billWithBob(owner, title, tripDate);
  const { invitationId } = await owner.as.mutation(api.invitations.invite, {
    tripId,
    personId,
    via: "username",
    identifier: "bob",
  });
  return { tripId, personId, invitationId };
}

async function respond(bob: User, invitationId: string, accept: boolean) {
  await bob.as.mutation(api.invitations.respond, { invitationId, accept });
}

describe("trips.listHistory access", () => {
  it("shows Bob his own bills and bills he's linked on, nothing else", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const bob = await createUser(t, "bob");
    const carol = await createUser(t, "carol");

    await createTrip(bob.as, bill("Bob's groceries", "2026-03-01", "300"));
    const linked = await inviteBob(alice, bob, "Linked dinner", "2026-04-01");
    await respond(bob, linked.invitationId, true);
    await inviteBob(alice, bob, "Pending dinner", "2026-04-02");
    const declined = await inviteBob(alice, bob, "Declined dinner", "2026-04-03");
    await respond(bob, declined.invitationId, false);
    const unlinked = await inviteBob(alice, bob, "Unlinked dinner", "2026-04-04");
    await respond(bob, unlinked.invitationId, true);
    await alice.as.mutation(api.invitations.unlink, { personId: unlinked.personId });
    await billWithBob(alice, "Alice's own", "2026-04-05");
    await createTrip(carol.as, bill("Carol's bill", "2026-04-06", "50"));

    const result = await history(bob);
    expect(result.trips.map((trip) => trip.title)).toEqual(["Linked dinner", "Bob's groceries"]);
    expect(result.totalAccessible).toBe(2);
    expect(result.totalMatches).toBe(2);
    expect(result.trips.map((trip) => trip.isOwner)).toEqual([false, true]);
  });

  it("doesn't let Carol find Alice's bills, and counts only Carol's", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const carol = await createUser(t, "carol");
    await createTrip(alice.as, bill("Monthly shop", "2026-05-01", "500", {
      items: [{ name: "Saffron", unitPrice: "900" }],
    }));
    await createTrip(carol.as, bill("Carol's bill", "2026-05-02", "50"));

    const result = await history(carol, { search: "saffron" });
    expect(result.trips).toEqual([]);
    expect(result.totalMatches).toBe(0);
    expect(result.totalAccessible).toBe(1);
  });

  it("returns an empty page when signed out", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    await createTrip(alice.as, bill("Monthly shop", "2026-05-01", "500"));
    const result = await t.query(api.trips.listHistory, { ownership: "all", sort: "date_desc" });
    expect(result).toEqual({ trips: [], hasMore: false, totalMatches: 0, totalAccessible: 0 });
  });
});

describe("trips.listHistory search", () => {
  async function setup() {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    await createTrip(alice.as, {
      details: { title: "Monthly shop", storeName: "Imtiaz", tripDate: "2026-05-01" },
      items: [{ name: "Cooking Oil" }, { name: "Basmati Rice" }],
    });
    await createTrip(alice.as, {
      details: { title: "Dinner out", storeName: "Kolachi", tripDate: "2026-05-02", category: "restaurant" },
      items: [{ name: "Pizza" }],
    });
    return alice;
  }

  it("matches item names that aren't in the title", async () => {
    const alice = await setup();
    expect(await titles(alice, { search: "oil" })).toEqual(["Monthly shop"]);
  });

  it("matches the store name and the title", async () => {
    const alice = await setup();
    expect(await titles(alice, { search: "kolachi" })).toEqual(["Dinner out"]);
    expect(await titles(alice, { search: "monthly" })).toEqual(["Monthly shop"]);
  });

  it("ignores letter case and extra spaces", async () => {
    const alice = await setup();
    expect(await titles(alice, { search: "  COOKING   oil " })).toEqual(["Monthly shop"]);
    expect(await titles(alice, { search: "IMTIAZ" })).toEqual(["Monthly shop"]);
  });

  it("finds an item added by editing the bill", async () => {
    const alice = await setup();
    const [shop] = (await history(alice, { search: "monthly" })).trips;
    await alice.as.mutation(api.trips.update, {
      tripId: shop.id,
      details: { title: "Monthly shop", storeName: "Imtiaz", tripDate: "2026-05-01", category: "grocery" },
      people: [],
      items: [
        { name: "Sugar", brand: "", variant: "", packSize: "", unit: "", quantity: "1", unitPrice: "200", assigneeKeys: ["owner"] },
      ],
    });
    expect(await titles(alice, { search: "sugar" })).toEqual(["Monthly shop"]);
    expect(await titles(alice, { search: "oil" })).toEqual([]);
  });

  it("treats an empty or whitespace search as no search", async () => {
    const alice = await setup();
    expect(await titles(alice, { search: "   " })).toHaveLength(2);
  });
});

describe("trips.listHistory filters and sorting", () => {
  async function setup() {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const bob = await createUser(t, "bob");
    await createTrip(alice.as, bill("Jan groceries", "2026-01-10", "400"));
    await createTrip(alice.as, bill("Feb dinner", "2026-02-10", "900", { details: { category: "restaurant" } }));
    await createTrip(alice.as, bill("Mar shoes", "2026-03-10", "2500", { details: { category: "shopping" } }));
    await createTrip(alice.as, bill("Apr groceries", "2026-04-10", "150"));
    // Bob's bill with Alice linked on it.
    const tripId = await createTrip(bob.as, {
      ...bill("Bob's dinner", "2026-03-20", "1200", { details: { category: "restaurant" } }),
      people: [{ key: "new:1", name: "Alice" }],
    });
    const trip = await bob.as.query(api.trips.get, { tripId });
    const personId = trip?.people.find((person) => person.name === "Alice")?.personId ?? "";
    const { invitationId } = await bob.as.mutation(api.invitations.invite, {
      tripId,
      personId,
      via: "username",
      identifier: "alice",
    });
    await alice.as.mutation(api.invitations.respond, { invitationId, accept: true });
    return alice;
  }

  it("filters by category", async () => {
    const alice = await setup();
    expect(await titles(alice, { category: "restaurant" })).toEqual(["Bob's dinner", "Feb dinner"]);
    expect(await titles(alice, { category: "other" })).toEqual([]);
  });

  it("filters by an inclusive date range", async () => {
    const alice = await setup();
    expect(await titles(alice, { from: "2026-02-10", to: "2026-03-20" })).toEqual([
      "Bob's dinner",
      "Mar shoes",
      "Feb dinner",
    ]);
    expect(await titles(alice, { from: "2026-03-11" })).toEqual(["Apr groceries", "Bob's dinner"]);
    expect(await titles(alice, { to: "2026-01-10" })).toEqual(["Jan groceries"]);
  });

  it("swaps a date range given backwards", async () => {
    const alice = await setup();
    expect(await titles(alice, { from: "2026-03-20", to: "2026-02-10" })).toEqual(
      await titles(alice, { from: "2026-02-10", to: "2026-03-20" }),
    );
  });

  it("filters by ownership", async () => {
    const alice = await setup();
    expect(await titles(alice, { ownership: "shared" })).toEqual(["Bob's dinner"]);
    expect(await titles(alice, { ownership: "owned" })).toEqual([
      "Apr groceries",
      "Mar shoes",
      "Feb dinner",
      "Jan groceries",
    ]);
  });

  it("combines filters with search", async () => {
    const alice = await setup();
    expect(await titles(alice, { search: "groceries", from: "2026-02-01", ownership: "owned" })).toEqual([
      "Apr groceries",
    ]);
    expect(await titles(alice, { search: "dinner", category: "restaurant", ownership: "owned" })).toEqual([
      "Feb dinner",
    ]);
  });

  it("orders by each sort", async () => {
    const alice = await setup();
    expect(await titles(alice, { sort: "date_desc" })).toEqual([
      "Apr groceries",
      "Bob's dinner",
      "Mar shoes",
      "Feb dinner",
      "Jan groceries",
    ]);
    expect(await titles(alice, { sort: "date_asc" })).toEqual([
      "Jan groceries",
      "Feb dinner",
      "Mar shoes",
      "Bob's dinner",
      "Apr groceries",
    ]);
    expect(await titles(alice, { sort: "total_desc" })).toEqual([
      "Mar shoes",
      "Bob's dinner",
      "Feb dinner",
      "Jan groceries",
      "Apr groceries",
    ]);
    expect(await titles(alice, { sort: "total_asc" })).toEqual([
      "Apr groceries",
      "Jan groceries",
      "Feb dinner",
      "Bob's dinner",
      "Mar shoes",
    ]);
  });

  it("orders equal totals newest first", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    await createTrip(alice.as, bill("Older", "2026-01-01", "100"));
    await createTrip(alice.as, bill("Newer", "2026-02-01", "100"));
    expect(await titles(alice, { sort: "total_desc" })).toEqual(["Newer", "Older"]);
    expect(await titles(alice, { sort: "total_asc" })).toEqual(["Newer", "Older"]);
  });
});

describe("trips.listHistory paging and validation", () => {
  async function setup(count: number) {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    for (let index = 1; index <= count; index++) {
      await createTrip(alice.as, bill(`Bill ${index}`, `2026-01-${String(index).padStart(2, "0")}`, "100"));
    }
    return alice;
  }

  it("returns the first `limit` bills and says whether there are more", async () => {
    const alice = await setup(5);
    const first = await history(alice, { limit: 2 });
    expect(first.trips.map((trip) => trip.title)).toEqual(["Bill 5", "Bill 4"]);
    expect(first.hasMore).toBe(true);
    expect(first.totalMatches).toBe(5);

    const all = await history(alice, { limit: 5 });
    expect(all.trips).toHaveLength(5);
    expect(all.hasMore).toBe(false);

    expect((await history(alice, { limit: 200 })).hasMore).toBe(false);
  });

  it("defaults to 20 bills", async () => {
    const alice = await setup(21);
    const result = await history(alice);
    expect(result.trips).toHaveLength(20);
    expect(result.hasMore).toBe(true);
    expect(result.totalMatches).toBe(21);
  });

  it("counts matches, not just the page, when filtering", async () => {
    const alice = await setup(5);
    const result = await history(alice, { limit: 1, from: "2026-01-02", to: "2026-01-04" });
    expect(result.trips.map((trip) => trip.title)).toEqual(["Bill 4"]);
    expect(result.totalMatches).toBe(3);
    expect(result.totalAccessible).toBe(5);
    expect(result.hasMore).toBe(true);
  });

  it.each([0, -1, 201, 1.5, Number.NaN])("rejects limit %s", async (limit) => {
    const alice = await setup(1);
    const error = await errorDataOf(() => history(alice, { limit }));
    expect(error).toMatchObject({ code: "VALIDATION", fieldErrors: { limit: expect.any(String) } });
  });

  it("rejects a search longer than 80 characters", async () => {
    const alice = await setup(1);
    expect(await titles(alice, { search: "x".repeat(80) })).toEqual([]);
    const error = await errorDataOf(() => history(alice, { search: "x".repeat(81) }));
    expect(error).toMatchObject({ code: "VALIDATION", fieldErrors: { search: expect.any(String) } });
  });

  it.each(["2026-13-01", "2026-02-30", "01/02/2026", ""])("rejects the date %j", async (date) => {
    const alice = await setup(1);
    const error = await errorDataOf(() => history(alice, { from: date, to: date }));
    expect(error).toMatchObject({
      code: "VALIDATION",
      fieldErrors: { from: "Enter a valid date", to: "Enter a valid date" },
    });
  });
});
