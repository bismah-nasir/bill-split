import { describe, expect, it } from "vitest";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { createTrip, createUser, errorDataOf, setupTest, tripInput, updateTrip } from "./helpers";

async function aliceWithTrip() {
  const t = setupTest();
  const alice = await createUser(t, "alice");
  const carol = await createUser(t, "carol");
  const tripId = await createTrip(alice.as);
  return { t, alice, carol, tripId };
}

describe("trips.get permissions", () => {
  it("lets the owner read the bill", async () => {
    const { alice, tripId } = await aliceWithTrip();
    expect(await alice.as.query(api.trips.get, { tripId })).toMatchObject({ id: tripId, viewerRole: "owner" });
  });

  it("returns null to an unrelated user", async () => {
    const { carol, tripId } = await aliceWithTrip();
    expect(await carol.as.query(api.trips.get, { tripId })).toBeNull();
  });

  it("returns null when signed out", async () => {
    const { t, tripId } = await aliceWithTrip();
    expect(await t.query(api.trips.get, { tripId })).toBeNull();
  });

  it.each(["not-an-id", "", "trips:123"])("returns null for the malformed ID %j", async (tripId) => {
    const { alice } = await aliceWithTrip();
    expect(await alice.as.query(api.trips.get, { tripId })).toBeNull();
  });

  it("returns null for an ID from another table", async () => {
    const { alice } = await aliceWithTrip();
    expect(await alice.as.query(api.trips.get, { tripId: alice.id })).toBeNull();
  });

  it("returns null for a deleted bill, the same as no access", async () => {
    const { t, alice, tripId } = await aliceWithTrip();
    await t.run((ctx) => ctx.db.delete(tripId));
    expect(await alice.as.query(api.trips.get, { tripId })).toBeNull();
  });
});

/** All of a trip's rows, to check a refused call changed nothing. */
async function snapshot(t: ReturnType<typeof setupTest>, tripId: Id<"trips">) {
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
  }));
}

describe("trips.update and trips.remove permissions", () => {
  it("gives an unrelated user NOT_FOUND and changes nothing", async () => {
    const { t, carol, tripId } = await aliceWithTrip();
    const before = await snapshot(t, tripId);

    expect(await errorDataOf(() => updateTrip(carol.as, tripId, { details: { title: "Mine" } }))).toMatchObject({
      code: "NOT_FOUND",
    });
    expect(await errorDataOf(() => carol.as.mutation(api.trips.remove, { tripId }))).toMatchObject({
      code: "NOT_FOUND",
    });
    expect(await snapshot(t, tripId)).toEqual(before);
  });

  it("requires sign-in", async () => {
    const { t, tripId } = await aliceWithTrip();
    const before = await snapshot(t, tripId);

    expect(
      await errorDataOf(() => t.mutation(api.trips.update, { tripId, ...tripInput() })),
    ).toMatchObject({ code: "UNAUTHENTICATED" });
    expect(await errorDataOf(() => t.mutation(api.trips.remove, { tripId }))).toMatchObject({
      code: "UNAUTHENTICATED",
    });
    expect(await snapshot(t, tripId)).toEqual(before);
  });

  it("gives FORBIDDEN to a participant who can see the bill", async () => {
    const { t, carol, tripId } = await aliceWithTrip();
    // A linked person, as accepting an invitation will create in Phase 6.
    await t.run((ctx) =>
      ctx.db.insert("tripPeople", {
        tripId,
        role: "person",
        name: "Carol",
        nameNormalized: "carol",
        position: 1,
        userId: carol.id,
        linkedAt: 0,
        createdAt: 0,
        updatedAt: 0,
      }),
    );
    const before = await snapshot(t, tripId);

    expect(await carol.as.query(api.trips.get, { tripId })).toMatchObject({ viewerRole: "participant" });
    expect(await errorDataOf(() => updateTrip(carol.as, tripId))).toMatchObject({ code: "FORBIDDEN" });
    expect(await errorDataOf(() => carol.as.mutation(api.trips.remove, { tripId }))).toMatchObject({
      code: "FORBIDDEN",
    });
    expect(await snapshot(t, tripId)).toEqual(before);
  });

  it.each(["not-an-id", ""])("gives NOT_FOUND for the malformed ID %j", async (tripId) => {
    const { alice } = await aliceWithTrip();
    expect(await errorDataOf(() => updateTrip(alice.as, tripId))).toMatchObject({ code: "NOT_FOUND" });
    expect(await errorDataOf(() => alice.as.mutation(api.trips.remove, { tripId }))).toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("revokes access once the owner deletes the bill", async () => {
    const { alice, carol, tripId } = await aliceWithTrip();
    await alice.as.mutation(api.trips.remove, { tripId });

    expect(await alice.as.query(api.trips.get, { tripId })).toBeNull();
    expect(await alice.as.query(api.trips.listRecent)).toEqual([]);
    expect(await errorDataOf(() => updateTrip(alice.as, tripId))).toMatchObject({ code: "NOT_FOUND" });
    expect(await carol.as.query(api.trips.get, { tripId })).toBeNull();
  });
});

describe("trips.listRecent permissions", () => {
  it("never shows another user's bill", async () => {
    const { alice, carol, tripId } = await aliceWithTrip();
    expect(await carol.as.query(api.trips.listRecent)).toEqual([]);
    expect((await alice.as.query(api.trips.listRecent)).map((trip) => trip.id)).toEqual([tripId]);
  });

  it("returns nothing when signed out", async () => {
    const { t } = await aliceWithTrip();
    expect(await t.query(api.trips.listRecent)).toEqual([]);
  });
});
