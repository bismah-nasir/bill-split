import { describe, expect, it } from "vitest";

import { api } from "../../convex/_generated/api";
import { createTrip, createUser, errorDataOf, setupTest } from "./helpers";

type User = Awaited<ReturnType<typeof createUser>>;

function summary(user: User, month = "2026-10") {
  return user.as.query(api.trips.spendingSummary, { month });
}

/** A solo bill of one item at `price` rupees, paid by the owner. */
function solo(owner: User, title: string, tripDate: string, price: string) {
  return createTrip(owner.as, {
    details: { title, tripDate },
    items: [{ name: "Thing", unitPrice: price }],
  });
}

/**
 * Alice's dinner with Bob and Ben (Ben has no account): Pizza Rs. 3,000 split three ways and
 * Drinks Rs. 600 for Bob alone. Alice 1,000 / Bob 1,600 / Ben 1,000; total 3,600.
 * Returns the trip and Bob's person ID.
 */
async function dinner(alice: User, tripDate: string) {
  const tripId = await createTrip(alice.as, {
    details: { title: "Dinner", tripDate, category: "restaurant" },
    people: [
      { key: "new:1", name: "Bob" },
      { key: "new:2", name: "Ben" },
    ],
    items: [
      { name: "Pizza", unitPrice: "3000", assigneeKeys: ["owner", "new:1", "new:2"] },
      { name: "Drinks", unitPrice: "600", assigneeKeys: ["new:1"] },
    ],
  });
  const trip = await alice.as.query(api.trips.get, { tripId });
  const bobPersonId = trip?.people.find((person) => person.name === "Bob")?.personId;
  if (!bobPersonId) throw new Error("No Bob on the bill");
  return { tripId, bobPersonId };
}

async function linkBob(alice: User, bob: User, tripId: string, personId: string, accept = true) {
  const { invitationId } = await alice.as.mutation(api.invitations.invite, {
    tripId,
    personId,
    via: "username",
    identifier: "bob",
  });
  await bob.as.mutation(api.invitations.respond, { invitationId, accept });
  return invitationId;
}

describe("trips.spendingSummary", () => {
  it("counts a solo bill in both figures", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    await solo(alice, "Groceries", "2026-10-05", "1250.50");

    expect(await summary(alice)).toEqual({
      month: "2026-10",
      yourSharePaisa: 125050,
      yourShareBillCount: 1,
      createdTotalPaisa: 125050,
      createdBillCount: 1,
    });
  });

  it("counts a shared bill fully in the creator's total and only the allocations in each share", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const bob = await createUser(t, "bob");
    await solo(alice, "Groceries", "2026-10-05", "500");
    const { tripId, bobPersonId } = await dinner(alice, "2026-10-12");
    await linkBob(alice, bob, tripId, bobPersonId);
    await solo(bob, "Bob's groceries", "2026-10-20", "200");

    // Manual sums for October: Alice 500 + 1,000; she created 500 + 3,600.
    expect(await summary(alice)).toEqual({
      month: "2026-10",
      yourSharePaisa: 150000,
      yourShareBillCount: 2,
      createdTotalPaisa: 410000,
      createdBillCount: 2,
    });
    // Bob: 1,600 on Alice's dinner + 200 of his own; he created only his own bill.
    expect(await summary(bob)).toEqual({
      month: "2026-10",
      yourSharePaisa: 180000,
      yourShareBillCount: 2,
      createdTotalPaisa: 20000,
      createdBillCount: 1,
    });
  });

  it("counts a shared bill only in the share of someone who didn't create it", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const bob = await createUser(t, "bob");
    const { tripId, bobPersonId } = await dinner(alice, "2026-10-12");
    await linkBob(alice, bob, tripId, bobPersonId);

    expect(await summary(bob)).toMatchObject({
      yourSharePaisa: 160000,
      yourShareBillCount: 1,
      createdTotalPaisa: 0,
      createdBillCount: 0,
    });
  });

  it("counts only bills dated in the month, both ends included", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    await solo(alice, "Last of September", "2026-09-30", "100");
    await solo(alice, "First of October", "2026-10-01", "200");
    await solo(alice, "Last of October", "2026-10-31", "300");
    await solo(alice, "First of November", "2026-11-01", "400");
    await solo(alice, "October a year earlier", "2025-10-15", "500");

    expect(await summary(alice)).toMatchObject({
      yourSharePaisa: 50000,
      yourShareBillCount: 2,
      createdTotalPaisa: 50000,
      createdBillCount: 2,
    });
    expect(await summary(alice, "2026-09")).toMatchObject({ yourSharePaisa: 10000, createdTotalPaisa: 10000 });
    expect(await summary(alice, "2025-10")).toMatchObject({ yourSharePaisa: 50000, createdBillCount: 1 });
  });

  it("follows the bill date when a bill is edited into another month or deleted", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const tripId = await solo(alice, "Groceries", "2026-10-05", "500");
    await solo(alice, "Other", "2026-10-06", "100");

    const trip = await alice.as.query(api.trips.get, { tripId });
    await alice.as.mutation(api.trips.update, {
      tripId,
      details: { title: "Groceries", storeName: "", tripDate: "2026-09-05", category: "grocery" },
      people: [],
      items: [{
        itemId: trip?.items[0].id,
        name: "Thing", brand: "", variant: "", packSize: "", unit: "",
        quantity: "1", unitPrice: "500", assigneeKeys: ["owner"],
      }],
    });
    expect(await summary(alice)).toMatchObject({ yourSharePaisa: 10000, createdBillCount: 1 });
    expect(await summary(alice, "2026-09")).toMatchObject({ yourSharePaisa: 50000, createdBillCount: 1 });

    await alice.as.mutation(api.trips.remove, { tripId });
    expect(await summary(alice, "2026-09")).toMatchObject({ yourSharePaisa: 0, createdBillCount: 0 });
  });

  it("leaves out bills the caller was unlinked from or never linked to", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const bob = await createUser(t, "bob");
    const unlinked = await dinner(alice, "2026-10-10");
    await linkBob(alice, bob, unlinked.tripId, unlinked.bobPersonId);
    await alice.as.mutation(api.invitations.unlink, { personId: unlinked.bobPersonId });
    const declined = await dinner(alice, "2026-10-11");
    await linkBob(alice, bob, declined.tripId, declined.bobPersonId, false);
    const pending = await dinner(alice, "2026-10-12");
    await alice.as.mutation(api.invitations.invite, {
      tripId: pending.tripId,
      personId: pending.bobPersonId,
      via: "username",
      identifier: "bob",
    });

    expect(await summary(bob)).toEqual({
      month: "2026-10",
      yourSharePaisa: 0,
      yourShareBillCount: 0,
      createdTotalPaisa: 0,
      createdBillCount: 0,
    });
  });

  it("counts the shares of people without accounts toward nobody", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const bob = await createUser(t, "bob");
    const { tripId, bobPersonId } = await dinner(alice, "2026-10-12");
    await linkBob(alice, bob, tripId, bobPersonId);

    const aliceShare = (await summary(alice)).yourSharePaisa;
    const bobShare = (await summary(bob)).yourSharePaisa;
    // Ben's Rs. 1,000 belongs to no account.
    expect(aliceShare + bobShare).toBe(360000 - 100000);
  });

  it("keeps Carol's figures apart from Alice's bills", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const carol = await createUser(t, "carol");
    await createUser(t, "bob");
    await dinner(alice, "2026-10-12");
    await solo(alice, "Groceries", "2026-10-05", "500");
    await solo(carol, "Carol's groceries", "2026-10-07", "75.25");

    expect(await summary(carol)).toEqual({
      month: "2026-10",
      yourSharePaisa: 7525,
      yourShareBillCount: 1,
      createdTotalPaisa: 7525,
      createdBillCount: 1,
    });
    expect(await summary(alice)).toMatchObject({ createdTotalPaisa: 410000, createdBillCount: 2 });
  });

  it("returns zeros for a month without bills and when signed out", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    await solo(alice, "Groceries", "2026-10-05", "500");

    const zeros = { yourSharePaisa: 0, yourShareBillCount: 0, createdTotalPaisa: 0, createdBillCount: 0 };
    expect(await summary(alice, "2026-08")).toEqual({ month: "2026-08", ...zeros });
    expect(await t.query(api.trips.spendingSummary, { month: "2026-10" })).toEqual({
      month: "2026-10",
      ...zeros,
    });
  });

  it.each(["2026-13", "2026-00", "2026-1", "26-10", "2026-10-01", "", "October"])(
    "rejects the month %j with VALIDATION",
    async (month) => {
      const t = setupTest();
      const alice = await createUser(t, "alice");
      expect(await errorDataOf(() => summary(alice, month))).toMatchObject({
        code: "VALIDATION",
        fieldErrors: { month: "Enter a valid month" },
      });
    },
  );
});
