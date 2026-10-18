import { describe, expect, it } from "vitest";

import { api } from "../../convex/_generated/api";
import { createTrip, createUser, setupTest } from "./helpers";

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
