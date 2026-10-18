import { describe, expect, it } from "vitest";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  createTrip,
  createUser,
  errorDataOf,
  setupTest,
  tripInput,
  updateTrip,
  type TestConvex,
} from "./helpers";

async function rowsOf(t: TestConvex, tripId: Id<"trips">) {
  return await t.run(async (ctx) => ({
    trip: await ctx.db.get(tripId),
    people: await ctx.db
      .query("tripPeople")
      .withIndex("by_trip", (q) => q.eq("tripId", tripId))
      .collect(),
    items: await ctx.db
      .query("items")
      .withIndex("by_trip", (q) => q.eq("tripId", tripId))
      .collect(),
    assignments: await ctx.db
      .query("itemAssignments")
      .withIndex("by_trip_person", (q) => q.eq("tripId", tripId))
      .collect(),
  }));
}

describe("trips.create", () => {
  it("stores totals, line totals, the owner row, allocations, product keys and search text", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const tripId = await createTrip(alice.as, {
      details: { title: "Imtiaz Grocery", storeName: "Imtiaz" },
      items: [
        { name: "Cooking  Oil", packSize: "1 Litre", unitPrice: "500" },
        { name: "Rice", quantity: "1.5", unitPrice: "333.33" },
        { name: "Bread", quantity: "2", unitPrice: "125.50" },
      ],
    });

    const { trip, people, items, assignments } = await rowsOf(t, tripId);
    expect(trip).toMatchObject({
      ownerId: alice.id,
      title: "Imtiaz Grocery",
      storeName: "Imtiaz",
      currency: "PKR",
      // 500.00 + 1.5 × 333.33 (499.995 → 500.00) + 2 × 125.50
      totalPaisa: 50000 + 50000 + 25100,
      itemCount: 3,
      searchText: "imtiaz grocery imtiaz cooking oil rice bread",
    });

    expect(people).toHaveLength(1);
    expect(people[0]).toMatchObject({ role: "owner", position: 0, userId: alice.id });

    expect(items.map((item) => [item.position, item.name, item.lineTotalPaisa])).toEqual([
      [0, "Cooking  Oil", 50000],
      [1, "Rice", 50000],
      [2, "Bread", 25100],
    ]);
    expect(items[0]).toMatchObject({
      normalizedName: "cooking oil",
      packSize: "1 Litre",
      productMatchKey: "cooking oil|||1l|",
    });
    expect(items[1]).toMatchObject({ quantityMilli: 1500, unitPricePaisa: 33333 });
    // Empty optional fields are left out, not stored as "".
    expect(items[1]).not.toHaveProperty("brand");

    expect(assignments).toHaveLength(3);
    for (const assignment of assignments) {
      const item = items.find((row) => row._id === assignment.itemId);
      expect(assignment.personId).toBe(people[0]._id);
      expect(assignment.allocatedAmountPaisa).toBe(item?.lineTotalPaisa);
    }
  });

  it("parses the strings the client sends itself", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const tripId = await createTrip(alice.as, {
      details: { storeName: "  " },
      items: [{ quantity: " 2 ", unitPrice: " 1,000.5 " }],
    });

    const { trip, items } = await rowsOf(t, tripId);
    expect(items[0]).toMatchObject({ quantityMilli: 2000, unitPricePaisa: 100050, lineTotalPaisa: 200100 });
    expect(trip?.totalPaisa).toBe(200100);
    expect(trip).not.toHaveProperty("storeName");
  });

  it("rejects invalid input with field errors and saves nothing", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const data = await errorDataOf(() =>
      alice.as.mutation(
        api.trips.create,
        tripInput({
          details: { title: " " },
          items: [{}, { unitPrice: "" }, { quantity: "0" }],
        }),
      ),
    );

    expect(data).toMatchObject({
      code: "VALIDATION",
      fieldErrors: {
        title: "Enter a title",
        "items.1.unitPrice": "Enter a price",
        "items.2.quantity": "Quantity must be greater than 0",
      },
    });
    expect(await t.run((ctx) => ctx.db.query("trips").collect())).toHaveLength(0);
  });

  it("rejects an assignee key that isn't on the bill", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const data = await errorDataOf(() =>
      alice.as.mutation(api.trips.create, tripInput({ items: [{ assigneeKeys: ["owner", "new:1"] }] })),
    );
    expect(data).toMatchObject({
      code: "VALIDATION",
      fieldErrors: { "items.0.assignees": "Choose people from this bill" },
    });
  });

  it("rejects another trip's person ID as an assignee", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const bob = await createUser(t, "bob");
    const bobsTrip = await createTrip(bob.as);
    const { people } = await rowsOf(t, bobsTrip);

    const data = await errorDataOf(() =>
      alice.as.mutation(api.trips.create, tripInput({ items: [{ assigneeKeys: [people[0]._id] }] })),
    );
    expect(data).toMatchObject({ code: "VALIDATION", fieldErrors: { "items.0.assignees": expect.any(String) } });
  });

  it("rejects saved person or item IDs on a new bill", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const tripId = await createTrip(alice.as);
    const { items, people } = await rowsOf(t, tripId);

    for (const input of [
      tripInput({ items: [{ itemId: items[0]._id }] }),
      tripInput({ people: [{ key: "p1", personId: people[0]._id, name: "Ben" }] }),
    ]) {
      const data = await errorDataOf(() => alice.as.mutation(api.trips.create, input));
      expect(data).toMatchObject({ code: "VALIDATION" });
    }
  });

  it("requires sign-in and a username", async () => {
    const t = setupTest();
    const newcomer = await createUser(t, "newcomer", { skipUsername: true });

    expect(await errorDataOf(() => t.mutation(api.trips.create, tripInput()))).toMatchObject({
      code: "UNAUTHENTICATED",
    });
    expect(await errorDataOf(() => newcomer.as.mutation(api.trips.create, tripInput()))).toMatchObject({
      code: "ONBOARDING_REQUIRED",
    });
  });
});

describe("trips.get", () => {
  it("returns the bill with items, assignees and reconciled shares", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice", { name: "Alice Account", email: "alice@example.com" });
    const tripId = await createTrip(alice.as, {
      items: [
        { name: "Oil", brand: "Dalda", unit: "l", unitPrice: "500" },
        { name: "Rice", quantity: "1.5", unitPrice: "333.33" },
      ],
    });

    const trip = await alice.as.query(api.trips.get, { tripId });
    expect(trip).toMatchObject({
      id: tripId,
      title: "Imtiaz Grocery",
      storeName: "Imtiaz",
      tripDate: "2026-10-16",
      category: "grocery",
      currency: "PKR",
      totalPaisa: 100000,
      viewerRole: "owner",
      owner: { username: "alice" },
      reconciled: true,
    });
    expect(trip?.people).toEqual([
      {
        personId: trip?.viewerPersonId,
        isOwner: true,
        isViewer: true,
        name: null,
        username: "alice",
        link: null,
      },
    ]);
    expect(trip?.items.map((item) => [item.name, item.brand, item.unit, item.lineTotalPaisa])).toEqual([
      ["Oil", "Dalda", "l", 50000],
      ["Rice", null, null, 50000],
    ]);
    expect(trip?.items[0].assignees).toEqual([{ personId: trip?.viewerPersonId, amountPaisa: 50000 }]);
    expect(trip?.shares).toEqual([
      {
        personId: trip?.viewerPersonId,
        totalPaisa: 100000,
        items: [
          { itemId: trip?.items[0].id, name: "Oil", amountPaisa: 50000, splitCount: 1 },
          { itemId: trip?.items[1].id, name: "Rice", amountPaisa: 50000, splitCount: 1 },
        ],
      },
    ]);
  });

  it("never includes an account's name or email", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice", { name: "Alice Account", email: "alice@example.com" });
    const tripId = await createTrip(alice.as);

    const trip = await alice.as.query(api.trips.get, { tripId });
    const json = JSON.stringify(trip);
    expect(json).not.toContain("Alice Account");
    expect(json).not.toContain("alice@example.com");
    for (const person of trip?.people ?? []) {
      expect(Object.keys(person).sort()).toEqual(["isOwner", "isViewer", "link", "name", "personId", "username"]);
    }
  });
});

describe("trips.listRecent", () => {
  it("lists the 5 most recent bills by bill date, newest first", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const dates = ["2026-01-05", "2026-03-01", "2025-12-31", "2026-03-01", "2026-02-10", "2026-04-20"];
    for (const [index, tripDate] of dates.entries()) {
      await createTrip(alice.as, { details: { title: `Bill ${index}`, tripDate } });
    }

    const recent = await alice.as.query(api.trips.listRecent);
    // Same date: the one created later comes first.
    expect(recent.map((trip) => trip.title)).toEqual(["Bill 5", "Bill 3", "Bill 1", "Bill 4", "Bill 0"]);
    expect(recent[0]).toEqual({
      id: expect.any(String),
      title: "Bill 5",
      storeName: "Imtiaz",
      tripDate: "2026-04-20",
      category: "grocery",
      totalPaisa: 50000,
      itemCount: 1,
      peopleLabels: ["You"],
      isOwner: true,
    });
  });

  it("is empty for a new user", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    expect(await alice.as.query(api.trips.listRecent)).toEqual([]);
  });
});

const OIL_1L = { name: "Cooking Oil", packSize: "1 l", unitPrice: "500" };

describe("trips.update", () => {
  it("changes only the edited trip, even when another has the same product", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const tripA = await createTrip(alice.as, { details: { title: "A" }, items: [OIL_1L] });
    const tripB = await createTrip(alice.as, { details: { title: "B" }, items: [OIL_1L] });
    const before = await rowsOf(t, tripB);
    const [itemA] = (await rowsOf(t, tripA)).items;

    await updateTrip(alice.as, tripA, {
      details: { title: "A" },
      items: [{ ...OIL_1L, itemId: itemA._id, unitPrice: "550" }],
    });

    const a = await rowsOf(t, tripA);
    expect(a.trip?.totalPaisa).toBe(55000);
    expect(a.items).toHaveLength(1);
    expect(a.items[0]).toMatchObject({ _id: itemA._id, unitPricePaisa: 55000, lineTotalPaisa: 55000 });
    expect(a.assignments.map((row) => row.allocatedAmountPaisa)).toEqual([55000]);

    const after = await rowsOf(t, tripB);
    expect(after).toEqual(before);
    expect(after.items[0].unitPricePaisa).toBe(50000);
  });

  it("patches, adds and removes items and recomputes the trip", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const tripId = await createTrip(alice.as, {
      details: { title: "Imtiaz Grocery", storeName: "Imtiaz" },
      items: [
        { name: "Oil", brand: "Dalda", unitPrice: "500" },
        { name: "Rice", quantity: "2", unitPrice: "300" },
        { name: "Bread", unitPrice: "150" },
      ],
    });
    const before = await rowsOf(t, tripId);
    const [oil, rice, bread] = before.items;

    await updateTrip(alice.as, tripId, {
      details: { title: "Weekly shop", storeName: "", tripDate: "2026-10-10", category: "other" },
      items: [
        { itemId: bread._id, name: "Bread", unitPrice: "160" },
        { name: "Eggs", quantity: "12", unitPrice: "30.50" },
        // The brand is cleared.
        { itemId: oil._id, name: "Oil", unitPrice: "500" },
      ],
    });

    const { trip, people, items, assignments } = await rowsOf(t, tripId);
    expect(trip).toMatchObject({
      title: "Weekly shop",
      tripDate: "2026-10-10",
      category: "other",
      totalPaisa: 16000 + 36600 + 50000,
      itemCount: 3,
      searchText: "weekly shop bread eggs oil",
      createdAt: before.trip?.createdAt,
    });
    expect(trip).not.toHaveProperty("storeName");
    expect(trip?.updatedAt).toBeGreaterThanOrEqual(before.trip?.updatedAt ?? 0);

    // Renumbered in the order sent; saved items keep their IDs.
    expect(items.map((item) => [item.position, item.name, item.lineTotalPaisa])).toEqual([
      [0, "Bread", 16000],
      [1, "Eggs", 36600],
      [2, "Oil", 50000],
    ]);
    expect(items[0]._id).toBe(bread._id);
    expect(items[2]._id).toBe(oil._id);
    expect(items[2]).not.toHaveProperty("brand");
    expect(items[2].createdAt).toBe(oil.createdAt);
    expect(items.some((item) => item._id === rice._id)).toBe(false);

    // The owner row is untouched; every item has exactly its line total assigned.
    expect(people).toEqual(before.people);
    expect(assignments).toHaveLength(3);
    for (const item of items) {
      const rows = assignments.filter((row) => row.itemId === item._id);
      expect(rows.map((row) => [row.personId, row.allocatedAmountPaisa])).toEqual([
        [people[0]._id, item.lineTotalPaisa],
      ]);
    }
  });

  it("deletes a removed item's assignments", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const tripId = await createTrip(alice.as, { items: [{ name: "Oil" }, { name: "Rice" }] });
    const [oil, rice] = (await rowsOf(t, tripId)).items;

    await updateTrip(alice.as, tripId, { items: [{ itemId: oil._id, name: "Oil" }] });

    const orphans = await t.run((ctx) =>
      ctx.db
        .query("itemAssignments")
        .withIndex("by_item", (q) => q.eq("itemId", rice._id))
        .collect(),
    );
    expect(orphans).toEqual([]);
    expect(await t.run((ctx) => ctx.db.get(rice._id))).toBeNull();
    expect((await rowsOf(t, tripId)).assignments).toHaveLength(1);
  });

  it("adds, renames and removes named people, keeping positions and splitting in bill order", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const tripId = await createTrip(alice.as, { items: [{ name: "Pizza", unitPrice: "1000.01" }] });
    const [pizza] = (await rowsOf(t, tripId)).items;

    await updateTrip(alice.as, tripId, {
      people: [
        { key: "new:1", name: "Ben" },
        { key: "new:2", name: "Sara" },
      ],
      items: [{ itemId: pizza._id, name: "Pizza", unitPrice: "1000.01", assigneeKeys: ["new:2", "owner", "new:1"] }],
    });
    let rows = await rowsOf(t, tripId);
    const [, ben, sara] = rows.people;
    expect(rows.people.map((person) => [person.position, person.role, person.name ?? null])).toEqual([
      [0, "owner", null],
      [1, "person", "Ben"],
      [2, "person", "Sara"],
    ]);
    // 100001 / 3: the 2 extra paisa go to the first two in bill order, not in the order listed.
    const amounts = (current: typeof rows) =>
      current.people.map(
        (person) => current.assignments.find((row) => row.personId === person._id)?.allocatedAmountPaisa ?? null,
      );
    expect(amounts(rows)).toEqual([33334, 33334, 33333]);

    // Rename Ben, drop Sara, add Zoe (listed first, but positioned after everyone so far).
    await updateTrip(alice.as, tripId, {
      people: [
        { key: "new:9", name: "Zoe" },
        { key: ben._id, personId: ben._id, name: "Benjamin" },
      ],
      items: [{ itemId: pizza._id, name: "Pizza", unitPrice: "1000.01", assigneeKeys: ["new:9", ben._id] }],
    });
    rows = await rowsOf(t, tripId);
    expect(rows.people.map((person) => [person.position, person.name ?? null])).toEqual([
      [0, null],
      [1, "Benjamin"],
      [3, "Zoe"],
    ]);
    expect(rows.people[1]._id).toBe(ben._id);
    expect(rows.people[1].nameNormalized).toBe("benjamin");
    expect(await t.run((ctx) => ctx.db.get(sara._id))).toBeNull();
    expect(amounts(rows)).toEqual([null, 50001, 50000]);
  });

  it("rejects an item from another trip and changes nothing", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const tripA = await createTrip(alice.as, { details: { title: "A" } });
    const tripB = await createTrip(alice.as, { details: { title: "B" } });
    const before = { a: await rowsOf(t, tripA), b: await rowsOf(t, tripB) };
    const [itemB] = before.b.items;

    const data = await errorDataOf(() =>
      updateTrip(alice.as, tripA, { items: [{ itemId: itemB._id, unitPrice: "999" }] }),
    );
    expect(data).toMatchObject({ code: "VALIDATION" });
    expect(await rowsOf(t, tripA)).toEqual(before.a);
    expect(await rowsOf(t, tripB)).toEqual(before.b);
  });

  it("rejects unknown, malformed, repeated or owner IDs for items and people", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const tripId = await createTrip(alice.as);
    const before = await rowsOf(t, tripId);
    const [item] = before.items;
    const [owner] = before.people;

    for (const overrides of [
      { items: [{ itemId: "not-an-id" }] },
      { items: [{ itemId: tripId }] },
      { items: [{ itemId: item._id }, { itemId: item._id }] },
      { people: [{ key: owner._id, personId: owner._id, name: "Me" }] },
      { people: [{ key: "p", personId: item._id, name: "Ben" }] },
    ]) {
      expect(await errorDataOf(() => updateTrip(alice.as, tripId, overrides))).toMatchObject({
        code: "VALIDATION",
      });
    }
    expect(await rowsOf(t, tripId)).toEqual(before);
  });

  it("rejects invalid input with field errors and changes nothing", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const tripId = await createTrip(alice.as);
    const before = await rowsOf(t, tripId);

    const data = await errorDataOf(() =>
      updateTrip(alice.as, tripId, { details: { title: "" }, items: [{ quantity: "0" }] }),
    );
    expect(data).toMatchObject({
      code: "VALIDATION",
      fieldErrors: { title: "Enter a title", "items.0.quantity": "Quantity must be greater than 0" },
    });
    expect(await rowsOf(t, tripId)).toEqual(before);
  });
});

describe("splitting between people without accounts", () => {
  const dinner = {
    details: { title: "Dinner", category: "restaurant" as const },
    people: [
      { key: "new:1", name: "Ben" },
      { key: "new:2", name: "Sara" },
    ],
    items: [
      { name: "Pizza", unitPrice: "5,000", assigneeKeys: ["owner", "new:1", "new:2"] },
      { name: "Drink", unitPrice: "900", assigneeKeys: ["new:1"] },
      { name: "Rice", unitPrice: "1,200", assigneeKeys: ["new:2", "owner"] },
    ],
  };

  it("splits the PRD dinner to the paisa and reconciles", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const tripId = await createTrip(alice.as, dinner);

    const trip = await alice.as.query(api.trips.get, { tripId });
    expect(trip?.totalPaisa).toBe(710000);
    expect(trip?.reconciled).toBe(true);
    expect(trip?.people.map((person) => [person.isOwner, person.name, person.username])).toEqual([
      [true, null, "alice"],
      [false, "Ben", null],
      [false, "Sara", null],
    ]);
    // Pizza 500000 / 3 = 166666 r 2: the extra paisa go to Alice and Ben, first in bill order.
    expect(trip?.shares.map((share) => share.totalPaisa)).toEqual([226667, 256667, 226666]);
    expect(trip?.shares[0].items.map((item) => [item.name, item.amountPaisa, item.splitCount])).toEqual([
      ["Pizza", 166667, 3],
      ["Rice", 60000, 2],
    ]);
    // Assignees come back in bill order, whatever order they were sent in.
    const [owner, ben, sara] = trip?.people.map((person) => person.personId) ?? [];
    expect(trip?.items[2].assignees).toEqual([
      { personId: owner, amountPaisa: 60000 },
      { personId: sara, amountPaisa: 60000 },
    ]);
    expect(trip?.items[1].assignees).toEqual([{ personId: ben, amountPaisa: 90000 }]);

    const [card] = await alice.as.query(api.trips.listRecent, {});
    expect(card.peopleLabels).toEqual(["You", "Ben", "Sara"]);
  });

  it("gives everyone a share, including people with Rs. 0", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const tripId = await createTrip(alice.as, { people: [{ key: "new:1", name: "Ben" }] });

    const trip = await alice.as.query(api.trips.get, { tripId });
    expect(trip?.shares.map((share) => [share.totalPaisa, share.items.length])).toEqual([
      [50000, 1],
      [0, 0],
    ]);
  });

  it("rejects duplicate names, ignoring case and spaces", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const data = await errorDataOf(() =>
      createTrip(alice.as, {
        people: [
          { key: "new:1", name: "Ben" },
          { key: "new:2", name: " ben " },
        ],
      }),
    );
    expect(data).toMatchObject({
      code: "VALIDATION",
      fieldErrors: { "people.1.name": "Someone on this bill already has that name" },
    });
  });

  it("rejects more than 20 people including the owner", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const people = Array.from({ length: 20 }, (_, index) => ({ key: `new:${index}`, name: `Person ${index}` }));

    expect(await errorDataOf(() => createTrip(alice.as, { people }))).toMatchObject({
      code: "VALIDATION",
      fieldErrors: { people: expect.any(String) },
    });
    const tripId = await createTrip(alice.as, { people: people.slice(1) });
    expect((await rowsOf(t, tripId)).people).toHaveLength(20);
  });

  it("deduplicates repeated assignee keys", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const tripId = await createTrip(alice.as, {
      people: [{ key: "new:1", name: "Ben" }],
      items: [{ unitPrice: "100", assigneeKeys: ["new:1", "owner", "new:1"] }],
    });
    const { assignments } = await rowsOf(t, tripId);
    expect(assignments.map((row) => row.allocatedAmountPaisa)).toEqual([5000, 5000]);
  });

  it("keeps every amount when a person is renamed", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const tripId = await createTrip(alice.as, dinner);
    const before = await alice.as.query(api.trips.get, { tripId });
    if (!before) throw new Error("Expected the bill");
    const [, ben, sara] = before.people;

    await updateTrip(alice.as, tripId, {
      ...dinner,
      people: [
        { key: ben.personId, personId: ben.personId, name: "Ben D." },
        { key: sara.personId, personId: sara.personId, name: "Sara" },
      ],
      items: before.items.map((item) => ({
        itemId: item.id,
        name: item.name,
        unitPrice: String(item.unitPricePaisa / 100),
        assigneeKeys: item.assignees.map((assignee) =>
          assignee.personId === before.viewerPersonId ? "owner" : assignee.personId,
        ),
      })),
    });

    const after = await alice.as.query(api.trips.get, { tripId });
    expect(after?.people[1]).toMatchObject({ personId: ben.personId, name: "Ben D." });
    expect(after?.shares).toEqual(before.shares);
    expect(after?.items).toEqual(before.items);
    const positions = (await rowsOf(t, tripId)).people.map((person) => [person.name ?? null, person.position]);
    expect(positions).toEqual([
      [null, 0],
      ["Ben D.", 1],
      ["Sara", 2],
    ]);
  });

  it("adds a new person after everyone else without moving anyone's extra paisa", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const tripId = await createTrip(alice.as, {
      people: [{ key: "new:1", name: "Ben" }],
      items: [{ name: "Pizza", unitPrice: "0.05", assigneeKeys: ["owner", "new:1"] }],
    });
    const { people, items } = await rowsOf(t, tripId);
    const [, ben] = people;
    const [pizza] = items;

    // Zoe is listed first but gets the next position, so the extra paisa of 5 / 3 stay with
    // Alice and Ben.
    await updateTrip(alice.as, tripId, {
      people: [
        { key: "new:1", name: "Zoe" },
        { key: ben._id, personId: ben._id, name: "Ben" },
      ],
      items: [{ itemId: pizza._id, name: "Pizza", unitPrice: "0.05", assigneeKeys: ["new:1", ben._id, "owner"] }],
    });
    const trip = await alice.as.query(api.trips.get, { tripId });
    expect(trip?.people.map((person) => person.name)).toEqual([null, "Ben", "Zoe"]);
    expect(trip?.shares.map((share) => share.totalPaisa)).toEqual([2, 2, 1]);
  });

  it("removes a person with their assignments, leaving the others' positions alone", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const tripId = await createTrip(alice.as, dinner);
    const before = await rowsOf(t, tripId);
    const [owner, ben, sara] = before.people;
    const [pizza, drink, rice] = before.items;

    // What the form sends after removing Sara: Rice is Alice's alone, Pizza is Alice's and Ben's.
    await updateTrip(alice.as, tripId, {
      ...dinner,
      people: [{ key: ben._id, personId: ben._id, name: "Ben" }],
      items: [
        { itemId: pizza._id, name: "Pizza", unitPrice: "5000", assigneeKeys: ["owner", ben._id] },
        { itemId: drink._id, name: "Drink", unitPrice: "900", assigneeKeys: [ben._id] },
        { itemId: rice._id, name: "Rice", unitPrice: "1200", assigneeKeys: ["owner"] },
      ],
    });

    const after = await rowsOf(t, tripId);
    expect(after.people.map((person) => [person._id, person.position])).toEqual([
      [owner._id, 0],
      [ben._id, 1],
    ]);
    expect(await t.run((ctx) => ctx.db.get(sara._id))).toBeNull();
    expect(after.assignments.some((row) => row.personId === sara._id)).toBe(false);
    const trip = await alice.as.query(api.trips.get, { tripId });
    expect(trip?.shares.map((share) => share.totalPaisa)).toEqual([250000 + 120000, 250000 + 90000]);
    expect(trip?.reconciled).toBe(true);
  });

  it("rejects a person from another trip and changes nothing", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const tripA = await createTrip(alice.as, { details: { title: "A" } });
    const tripB = await createTrip(alice.as, { details: { title: "B" }, people: [{ key: "new:1", name: "Ben" }] });
    const [, benOnB] = (await rowsOf(t, tripB)).people;
    const before = { a: await rowsOf(t, tripA), b: await rowsOf(t, tripB) };

    const data = await errorDataOf(() =>
      updateTrip(alice.as, tripA, { people: [{ key: benOnB._id, personId: benOnB._id, name: "Ben" }] }),
    );
    expect(data).toMatchObject({ code: "VALIDATION" });
    expect(await rowsOf(t, tripA)).toEqual(before.a);
    expect(await rowsOf(t, tripB)).toEqual(before.b);
  });
});

describe("trips.remove", () => {
  it("deletes the trip with all its people, items and assignments, and nothing else", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const tripId = await createTrip(alice.as, {
      people: [{ key: "new:1", name: "Ben" }],
      items: [OIL_1L, { name: "Rice", assigneeKeys: ["owner", "new:1"] }],
    });
    const otherTrip = await createTrip(alice.as, { items: [OIL_1L] });
    const other = await rowsOf(t, otherTrip);

    await alice.as.mutation(api.trips.remove, { tripId });

    const rows = await rowsOf(t, tripId);
    expect(rows).toEqual({ trip: null, people: [], items: [], assignments: [] });
    expect(await rowsOf(t, otherTrip)).toEqual(other);
    expect(await alice.as.query(api.trips.get, { tripId })).toBeNull();
    expect((await alice.as.query(api.trips.listRecent)).map((trip) => trip.id)).toEqual([otherTrip]);
  });

  it("gives NOT_FOUND for a bill that's already deleted", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const tripId = await createTrip(alice.as);
    await alice.as.mutation(api.trips.remove, { tripId });

    expect(await errorDataOf(() => alice.as.mutation(api.trips.remove, { tripId }))).toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
