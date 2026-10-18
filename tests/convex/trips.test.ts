import { describe, expect, it } from "vitest";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { createTrip, createUser, errorDataOf, setupTest, tripInput, type TestConvex } from "./helpers";

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
