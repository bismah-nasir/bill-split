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

  it("never shows an unrelated user the names on a bill", async () => {
    const { alice, carol } = await aliceWithTrip();
    const tripId = await createTrip(alice.as, {
      details: { title: "Dinner" },
      people: [
        { key: "new:1", name: "Ben" },
        { key: "new:2", name: "Sara" },
      ],
      items: [{ assigneeKeys: ["owner", "new:1", "new:2"] }],
    });
    expect(await carol.as.query(api.trips.get, { tripId })).toBeNull();
    const recent = await carol.as.query(api.trips.listRecent, {});
    expect(JSON.stringify(recent)).not.toMatch(/Ben|Sara|Dinner/);
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
    // A linked person, inserted directly (as accepting an invitation does).
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

/**
 * Alice's bill with one person per access state: each account below was invited for its own
 * person and then accepted, declined, was cancelled, unlinked or removed from the bill.
 */
async function accessFixture() {
  const t = setupTest();
  const alice = await createUser(t, "alice", { name: "Alice Account" });
  const names = ["linked", "pending", "declined", "cancelled", "unlinked", "removed", "unrelated"] as const;
  const users = Object.fromEntries(
    await Promise.all(
      names.map(async (name) => [name, await createUser(t, name, { name: `${name} Account Name` })] as const),
    ),
  ) as Record<(typeof names)[number], Awaited<ReturnType<typeof createUser>>>;
  const people = names.slice(0, 6).map((name, index) => ({ key: `new:${index + 1}`, name: `P-${name}` }));
  const tripId = await createTrip(alice.as, {
    details: { title: "Dinner" },
    people,
    items: [{ assigneeKeys: ["owner", ...people.map((person) => person.key)] }],
  });
  const trip = await alice.as.query(api.trips.get, { tripId });
  const personOf = (name: string) => trip!.people.find((person) => person.name === `P-${name}`)!.personId;
  const invite = (name: (typeof names)[number]) =>
    alice.as.mutation(api.invitations.invite, { tripId, personId: personOf(name), via: "username", identifier: name });
  const respond = (name: (typeof names)[number], invitationId: string, accept: boolean) =>
    users[name].as.mutation(api.invitations.respond, { invitationId, accept });

  await respond("linked", (await invite("linked")).invitationId, true);
  await invite("pending");
  await respond("declined", (await invite("declined")).invitationId, false);
  await alice.as.mutation(api.invitations.cancel, { invitationId: (await invite("cancelled")).invitationId });
  await respond("unlinked", (await invite("unlinked")).invitationId, true);
  await alice.as.mutation(api.invitations.unlink, { personId: personOf("unlinked") });
  await respond("removed", (await invite("removed")).invitationId, true);
  const kept = names.slice(0, 5).map((name) => ({ key: personOf(name), personId: personOf(name), name: `P-${name}` }));
  await updateTrip(alice.as, tripId, {
    details: { title: "Dinner" },
    people: kept,
    items: [{ assigneeKeys: ["owner", ...kept.map((person) => person.key)] }],
  });

  return { t, alice, users, tripId };
}

describe("access matrix", () => {
  it("lets the owner read, list, edit and delete", async () => {
    const { alice, tripId } = await accessFixture();
    expect(await alice.as.query(api.trips.get, { tripId })).toMatchObject({ viewerRole: "owner" });
    expect((await alice.as.query(api.trips.listRecent)).map((trip) => trip.id)).toEqual([tripId]);
    await updateTrip(alice.as, tripId, { details: { title: "Dinner" } });
    await alice.as.mutation(api.trips.remove, { tripId });
    expect(await alice.as.query(api.trips.get, { tripId })).toBeNull();
  });

  it("lets a linked participant read and list, read-only", async () => {
    const { t, users, tripId } = await accessFixture();
    const { as } = users.linked;
    const detail = await as.query(api.trips.get, { tripId });
    expect(detail).toMatchObject({ viewerRole: "participant", owner: { username: "alice" } });
    expect(detail?.people.every((person) => person.link === null)).toBe(true);
    expect((await as.query(api.trips.listRecent)).map((trip) => [trip.id, trip.isOwner])).toEqual([[tripId, false]]);
    const before = await snapshot(t, tripId as Id<"trips">);
    expect(await errorDataOf(() => updateTrip(as, tripId))).toMatchObject({ code: "FORBIDDEN" });
    expect(await errorDataOf(() => as.mutation(api.trips.remove, { tripId }))).toMatchObject({ code: "FORBIDDEN" });
    expect(await snapshot(t, tripId as Id<"trips">)).toEqual(before);
  });

  it.each(["pending", "declined", "cancelled", "unlinked", "removed", "unrelated"] as const)(
    "gives a %s account no access at all",
    async (name) => {
      const { t, users, tripId } = await accessFixture();
      const { as } = users[name];
      expect(await as.query(api.trips.get, { tripId })).toBeNull();
      expect(await as.query(api.trips.listRecent)).toEqual([]);
      const before = await snapshot(t, tripId as Id<"trips">);
      expect(await errorDataOf(() => updateTrip(as, tripId))).toMatchObject({ code: "NOT_FOUND" });
      expect(await errorDataOf(() => as.mutation(api.trips.remove, { tripId }))).toMatchObject({ code: "NOT_FOUND" });
      expect(await snapshot(t, tripId as Id<"trips">)).toEqual(before);
    },
  );

  it("gives a signed-out caller nothing", async () => {
    const { t, tripId } = await accessFixture();
    expect(await t.query(api.trips.get, { tripId })).toBeNull();
    expect(await t.query(api.trips.listRecent)).toEqual([]);
    expect(await errorDataOf(() => t.mutation(api.trips.update, { tripId, ...tripInput() }))).toMatchObject({
      code: "UNAUTHENTICATED",
    });
    expect(await errorDataOf(() => t.mutation(api.trips.remove, { tripId }))).toMatchObject({
      code: "UNAUTHENTICATED",
    });
  });

  it("never shows a participant an account's email or name", async () => {
    const { users, tripId } = await accessFixture();
    const detail = await users.linked.as.query(api.trips.get, { tripId });
    const keys = new Set<string>();
    const collectKeys = (value: unknown) => {
      if (Array.isArray(value)) value.forEach(collectKeys);
      else if (value !== null && typeof value === "object") {
        for (const [key, child] of Object.entries(value)) {
          keys.add(key);
          collectKeys(child);
        }
      }
    };
    collectKeys(detail);
    expect(keys.has("email")).toBe(false);
    const json = JSON.stringify(detail);
    expect(json).not.toMatch(/Account Name|Alice Account|@example\.com/);
  });
});
