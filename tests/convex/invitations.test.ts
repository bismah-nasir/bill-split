import { describe, expect, it } from "vitest";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { createTrip, createUser, errorDataOf, setupTest, updateTrip, type TestConvex } from "./helpers";

type User = Awaited<ReturnType<typeof createUser>>;

/** The PRD dinner: Alice (owner) with Ben and Sara, who have no accounts. */
const DINNER = {
  details: { title: "Dinner", storeName: "Kolachi" },
  people: [
    { key: "new:1", name: "Ben" },
    { key: "new:2", name: "Sara" },
  ],
  items: [
    { name: "Pizza", unitPrice: "5000", assigneeKeys: ["owner", "new:1", "new:2"] },
    { name: "Drink", unitPrice: "900", assigneeKeys: ["new:1"] },
    { name: "Rice", unitPrice: "1200", assigneeKeys: ["owner", "new:2"] },
  ],
};

async function setup() {
  const t = setupTest();
  const alice = await createUser(t, "alice", { name: "Alice Khan" });
  const bob = await createUser(t, "bob", { name: "Bob Ali" });
  const carol = await createUser(t, "carol", { name: "Carol Shah" });
  const ben = await createUser(t, "ben_doe", { name: "Ben Doe", email: "ben@example.com" });
  const tripId = await createTrip(alice.as, DINNER);
  const trip = await alice.as.query(api.trips.get, { tripId });
  const personId = (name: string) => {
    const person = trip?.people.find((candidate) => candidate.name === name);
    if (!person) throw new Error(`No person ${name}`);
    return person.personId;
  };
  return { t, alice, bob, carol, ben, tripId, benId: personId("Ben"), saraId: personId("Sara") };
}

function invite(
  owner: User,
  tripId: string,
  personId: string,
  identifier: string,
  via: "username" | "email" = "username",
) {
  return owner.as.mutation(api.invitations.invite, { tripId, personId, via, identifier });
}

function respond(user: User, invitationId: string, accept: boolean) {
  return user.as.mutation(api.invitations.respond, { invitationId, accept });
}

async function sharesOf(owner: User, tripId: string) {
  return (await owner.as.query(api.trips.get, { tripId }))?.shares;
}

async function invitationRows(t: TestConvex, tripId: Id<"trips">) {
  return await t.run((ctx) =>
    ctx.db
      .query("tripInvitations")
      .withIndex("by_trip", (q) => q.eq("tripId", tripId))
      .collect(),
  );
}

describe("invitations.invite", () => {
  it("invites by username, ignoring letter case and a leading @", async () => {
    const { t, alice, ben, tripId, benId } = await setup();
    const result = await invite(alice, tripId, benId, " @Ben_Doe ");

    expect(Object.keys(result).sort()).toEqual(["invitationId", "username"]);
    expect(result.username).toBe("ben_doe");
    const [row] = await invitationRows(t, tripId);
    expect(row).toMatchObject({ personId: benId, inviteeUserId: ben.id, status: "pending", invitedVia: "username" });
  });

  it("invites by email, trimmed and ignoring letter case", async () => {
    const { t, alice, bob, tripId, benId } = await setup();
    const result = await invite(alice, tripId, benId, " Bob@Example.com ", "email");

    expect(result).toEqual({ invitationId: expect.any(String), username: "bob" });
    const [row] = await invitationRows(t, tripId);
    expect(row).toMatchObject({ inviteeUserId: bob.id, invitedVia: "email" });
  });

  it("adds Someone new at the next position with a Rs. 0 share", async () => {
    const { alice, bob, tripId } = await setup();
    const before = await sharesOf(alice, tripId);
    await alice.as.mutation(api.invitations.invite, {
      tripId,
      newPersonName: " Bob ",
      via: "username",
      identifier: "bob",
    });

    const trip = await alice.as.query(api.trips.get, { tripId });
    const newPerson = trip?.people.at(-1);
    expect(trip?.people.map((person) => person.name)).toEqual([null, "Ben", "Sara", "Bob"]);
    expect(newPerson?.link).toMatchObject({ state: "pending", username: "bob" });
    expect(trip?.shares.at(-1)).toEqual({ personId: newPerson?.personId, totalPaisa: 0, items: [] });
    expect(trip?.shares.slice(0, 3)).toEqual(before);
    expect(await bob.as.query(api.trips.get, { tripId })).toBeNull();
  });

  it("never matches a person's name to an account", async () => {
    const { t, alice } = await setup();
    // A person called "bob" on the bill, and an account @bob.
    const tripId = await createTrip(alice.as, { people: [{ key: "new:1", name: "bob" }] });
    const bob = await createUser(t, "bobby");
    await t.run((ctx) => ctx.db.patch(bob.id, { name: "bob" }));

    expect(await bob.as.query(api.trips.get, { tripId })).toBeNull();
    expect(await bob.as.query(api.trips.listRecent)).toEqual([]);
    expect(await bob.as.query(api.invitations.listReceived)).toEqual([]);
    const trip = await alice.as.query(api.trips.get, { tripId });
    expect(trip?.people[1]).toMatchObject({ name: "bob", username: null, link: { state: "none" } });
  });

  it("gives the same INVITE_NO_MATCH for unknown, malformed and not-onboarded accounts", async () => {
    const { t, alice, tripId, benId } = await setup();
    await createUser(t, "pending_user", { skipUsername: true, email: "new@example.com" });
    const cases: [string, "username" | "email"][] = [
      ["nobody", "username"],
      ["1bad", "username"],
      ["", "username"],
      ["nobody@example.com", "email"],
      ["not-an-email", "email"],
      ["new@example.com", "email"],
    ];
    for (const [identifier, via] of cases) {
      const error = await errorDataOf(() => invite(alice, tripId, benId, identifier, via));
      expect(error).toEqual({
        code: "INVITE_NO_MATCH",
        message: `No account matches that ${via}. Ask your friend to sign up and finish setting up their account.`,
      });
    }
    expect(await invitationRows(t, tripId)).toEqual([]);
  });

  it("refuses to invite yourself", async () => {
    const { alice, tripId, benId } = await setup();
    expect(await errorDataOf(() => invite(alice, tripId, benId, "alice"))).toMatchObject({ code: "INVITE_SELF" });
  });

  it("refuses an account already linked to someone on the bill", async () => {
    const { alice, ben, tripId, benId, saraId } = await setup();
    const { invitationId } = await invite(alice, tripId, benId, "ben_doe");
    await respond(ben, invitationId, true);

    expect(await errorDataOf(() => invite(alice, tripId, saraId, "ben_doe"))).toMatchObject({
      code: "INVITE_ALREADY_PARTICIPANT",
    });
  });

  it("refuses a person who is already linked", async () => {
    const { alice, ben, tripId, benId } = await setup();
    const { invitationId } = await invite(alice, tripId, benId, "ben_doe");
    await respond(ben, invitationId, true);

    expect(await errorDataOf(() => invite(alice, tripId, benId, "carol"))).toEqual({
      code: "INVITE_PERSON_LINKED",
      message: "Ben is already connected to an account",
    });
  });

  it("refuses a second pending invitation for a person or for an account", async () => {
    const { alice, tripId, benId, saraId } = await setup();
    await invite(alice, tripId, benId, "ben_doe");

    expect(await errorDataOf(() => invite(alice, tripId, benId, "carol"))).toMatchObject({
      code: "INVITE_ALREADY_PENDING",
    });
    expect(await errorDataOf(() => invite(alice, tripId, saraId, "ben_doe"))).toMatchObject({
      code: "INVITE_ALREADY_PENDING",
    });
  });

  it("refuses the owner's own person and people from other bills", async () => {
    const { alice, tripId } = await setup();
    const trip = await alice.as.query(api.trips.get, { tripId });
    const otherTripId = await createTrip(alice.as, { people: [{ key: "new:1", name: "Zed" }] });
    const other = await alice.as.query(api.trips.get, { tripId: otherTripId });

    for (const personId of [trip!.viewerPersonId, other!.people[1].personId, "not-an-id", tripId]) {
      expect(await errorDataOf(() => invite(alice, tripId, personId, "carol"))).toMatchObject({
        code: "VALIDATION",
      });
    }
  });

  it("needs exactly one of personId and newPersonName", async () => {
    const { alice, tripId, benId } = await setup();
    const base = { tripId, via: "username" as const, identifier: "carol" };

    expect(await errorDataOf(() => alice.as.mutation(api.invitations.invite, base))).toMatchObject({
      code: "VALIDATION",
    });
    expect(
      await errorDataOf(() =>
        alice.as.mutation(api.invitations.invite, { ...base, personId: benId, newPersonName: "Carol" }),
      ),
    ).toMatchObject({ code: "VALIDATION" });
  });

  it("refuses a new person whose name is taken or empty, without inviting", async () => {
    const { t, alice, tripId } = await setup();
    for (const newPersonName of [" ben ", "", "x".repeat(41)]) {
      const error = await errorDataOf(() =>
        alice.as.mutation(api.invitations.invite, { tripId, newPersonName, via: "username", identifier: "carol" }),
      );
      expect(error).toMatchObject({ code: "VALIDATION", fieldErrors: { newPersonName: expect.any(String) } });
    }
    expect(await invitationRows(t, tripId)).toEqual([]);
  });

  it("refuses Someone new once the bill has 20 people", async () => {
    const { t, alice } = await setup();
    const people = Array.from({ length: 19 }, (_, index) => ({ key: `new:${index + 1}`, name: `P${index + 1}` }));
    const tripId = await createTrip(alice.as, { people });

    expect(
      await errorDataOf(() =>
        alice.as.mutation(api.invitations.invite, { tripId, newPersonName: "Carol", via: "username", identifier: "carol" }),
      ),
    ).toMatchObject({ code: "TRIP_PEOPLE_LIMIT" });
    expect(await invitationRows(t, tripId)).toEqual([]);
  });

  it("reuses one record per bill and account after decline, cancel and unlink", async () => {
    const { t, alice, ben, tripId, benId, saraId } = await setup();

    const first = await invite(alice, tripId, benId, "ben_doe");
    await respond(ben, first.invitationId, false);
    const second = await invite(alice, tripId, saraId, "ben_doe");
    await alice.as.mutation(api.invitations.cancel, { invitationId: second.invitationId });
    const third = await invite(alice, tripId, benId, "ben_doe");
    await respond(ben, third.invitationId, true);
    await alice.as.mutation(api.invitations.unlink, { personId: benId });
    const fourth = await invite(alice, tripId, saraId, "BEN@example.com", "email");

    expect(new Set([first, second, third, fourth].map((result) => result.invitationId)).size).toBe(1);
    const rows = await invitationRows(t, tripId);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ personId: saraId, status: "pending", invitedVia: "email" });
    expect(rows[0].respondedAt).toBeUndefined();
  });

  it("is owner only: a participant gets FORBIDDEN, anyone else NOT_FOUND", async () => {
    const { alice, ben, carol, tripId, benId, saraId } = await setup();
    const { invitationId } = await invite(alice, tripId, benId, "ben_doe");
    await respond(ben, invitationId, true);

    expect(await errorDataOf(() => invite(ben, tripId, saraId, "carol"))).toMatchObject({ code: "FORBIDDEN" });
    expect(await errorDataOf(() => invite(carol, tripId, saraId, "bob"))).toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("invitations.listReceived and pendingCount", () => {
  it("shows the invitee only the bill's title, store, date, owner and their name on it", async () => {
    const { alice, ben, tripId, benId } = await setup();
    const { invitationId } = await invite(alice, tripId, benId, "ben_doe");

    const received = await ben.as.query(api.invitations.listReceived);
    expect(received).toEqual([
      {
        invitationId,
        tripTitle: "Dinner",
        storeName: "Kolachi",
        tripDate: "2026-10-16",
        ownerUsername: "alice",
        personName: "Ben",
        invitedAt: expect.any(Number),
      },
    ]);
    expect(JSON.stringify(received)).not.toMatch(/Sara|Pizza|Alice Khan|alice@example.com/);
    expect(await ben.as.query(api.invitations.pendingCount)).toBe(1);
  });

  it("drops invitations once answered, and shows nothing to others or when signed out", async () => {
    const { t, alice, ben, carol, tripId, benId } = await setup();
    const { invitationId } = await invite(alice, tripId, benId, "ben_doe");

    expect(await carol.as.query(api.invitations.listReceived)).toEqual([]);
    expect(await t.query(api.invitations.listReceived)).toEqual([]);
    expect(await t.query(api.invitations.pendingCount)).toBe(0);
    await respond(ben, invitationId, false);
    expect(await ben.as.query(api.invitations.listReceived)).toEqual([]);
    expect(await ben.as.query(api.invitations.pendingCount)).toBe(0);
  });
});

describe("invitations.listSent", () => {
  it("lists pending, accepted and declined invitations newest first, without cancelled ones", async () => {
    const { t, alice, bob, ben, tripId, benId, saraId } = await setup();
    const toBen = await invite(alice, tripId, benId, "ben_doe");
    await respond(ben, toBen.invitationId, true);
    const toCarol = await invite(alice, tripId, saraId, "carol");
    await alice.as.mutation(api.invitations.cancel, { invitationId: toCarol.invitationId });
    const toBob = await invite(alice, tripId, saraId, "bob");
    await respond(bob, toBob.invitationId, false);
    await alice.as.mutation(api.invitations.invite, {
      tripId,
      newPersonName: "Carol",
      via: "email",
      identifier: "carol@example.com",
    });

    const sent = await alice.as.query(api.invitations.listSent);
    expect(sent.map((row) => [row.username, row.personName, row.status])).toEqual([
      ["carol", "Carol", "pending"],
      ["bob", "Sara", "declined"],
      ["ben_doe", "Ben", "accepted"],
    ]);
    expect(sent[0]).toMatchObject({ tripId, tripTitle: "Dinner", respondedAt: null });
    expect(JSON.stringify(sent)).not.toMatch(/Ben Doe|Bob Ali|@example.com/);
    expect(await ben.as.query(api.invitations.listSent)).toEqual([]);
    expect(await t.query(api.invitations.listSent)).toEqual([]);
  });
});

describe("invitations.respond", () => {
  it("accepting links the person and grants read-only access; the split never changes", async () => {
    const { alice, ben, tripId, benId } = await setup();
    const before = await sharesOf(alice, tripId);
    const { invitationId } = await invite(alice, tripId, benId, "ben_doe");
    expect(await sharesOf(alice, tripId)).toEqual(before);
    expect(await ben.as.query(api.trips.get, { tripId })).toBeNull();

    expect(await respond(ben, invitationId, true)).toEqual({ tripId });

    const asBen = await ben.as.query(api.trips.get, { tripId });
    expect(asBen).toMatchObject({ viewerRole: "participant", viewerPersonId: benId, owner: { username: "alice" } });
    expect(asBen?.shares).toEqual(before);
    expect(asBen?.shares.find((share) => share.personId === benId)?.totalPaisa).toBe(256_667);
    expect(asBen?.people.every((person) => person.link === null)).toBe(true);
    const asAlice = await alice.as.query(api.trips.get, { tripId });
    expect(asAlice?.shares).toEqual(before);
    expect(asAlice?.people[1]).toMatchObject({ name: "Ben", username: "ben_doe", link: { state: "linked" } });
    expect(JSON.stringify(asAlice)).not.toContain("Ben Doe");
    expect((await ben.as.query(api.trips.listRecent)).map((trip) => [trip.id, trip.isOwner])).toEqual([
      [tripId, false],
    ]);
  });

  it("declining leaves the person as a plain name with no access and the same split", async () => {
    const { alice, bob, tripId, saraId } = await setup();
    const before = await sharesOf(alice, tripId);
    const { invitationId } = await invite(alice, tripId, saraId, "bob");

    expect(await respond(bob, invitationId, false)).toEqual({ tripId: null });
    expect(await bob.as.query(api.trips.get, { tripId })).toBeNull();
    const trip = await alice.as.query(api.trips.get, { tripId });
    expect(trip?.shares).toEqual(before);
    expect(trip?.people[2]).toMatchObject({
      name: "Sara",
      username: null,
      link: { state: "declined", invitationId, username: "bob", respondedAt: expect.any(Number) },
    });
  });

  it("gives NOT_FOUND for someone else's or a malformed invitation", async () => {
    const { alice, carol, tripId, benId } = await setup();
    const { invitationId } = await invite(alice, tripId, benId, "ben_doe");

    for (const user of [carol, alice]) {
      expect(await errorDataOf(() => respond(user, invitationId, true))).toMatchObject({ code: "NOT_FOUND" });
    }
    expect(await errorDataOf(() => respond(carol, "nope", true))).toMatchObject({ code: "NOT_FOUND" });
    expect(await carol.as.query(api.trips.get, { tripId })).toBeNull();
  });

  it("refuses to answer twice", async () => {
    const { alice, ben, tripId, benId } = await setup();
    const { invitationId } = await invite(alice, tripId, benId, "ben_doe");
    await respond(ben, invitationId, false);

    expect(await errorDataOf(() => respond(ben, invitationId, true))).toMatchObject({
      code: "INVITATION_NOT_PENDING",
    });
    expect(await ben.as.query(api.trips.get, { tripId })).toBeNull();
  });

  it("refuses a cancelled invitation", async () => {
    const { alice, carol, tripId, saraId } = await setup();
    const { invitationId } = await invite(alice, tripId, saraId, "carol");
    await alice.as.mutation(api.invitations.cancel, { invitationId });

    expect(await carol.as.query(api.invitations.listReceived)).toEqual([]);
    expect(await errorDataOf(() => respond(carol, invitationId, true))).toMatchObject({
      code: "INVITATION_NOT_PENDING",
    });
    expect(await carol.as.query(api.trips.get, { tripId })).toBeNull();
  });

  it("can't accept once the person is removed from the bill (the invitation is gone)", async () => {
    const { alice, ben, tripId, benId, saraId } = await setup();
    const { invitationId } = await invite(alice, tripId, benId, "ben_doe");
    await updateTrip(alice.as, tripId, {
      details: DINNER.details,
      people: [{ key: saraId, personId: saraId, name: "Sara" }],
      items: [{ name: "Pizza", unitPrice: "5000", assigneeKeys: ["owner", saraId] }],
    });

    expect(await ben.as.query(api.invitations.listReceived)).toEqual([]);
    expect(await errorDataOf(() => respond(ben, invitationId, true))).toMatchObject({ code: "NOT_FOUND" });
    expect(await ben.as.query(api.trips.get, { tripId })).toBeNull();
  });

  it("can't accept once the person is linked to someone else", async () => {
    const { t, alice, ben, carol, tripId, benId } = await setup();
    const { invitationId } = await invite(alice, tripId, benId, "ben_doe");
    // Not reachable through the API (one pending invitation per person); forced to test the guard.
    await t.run((ctx) => ctx.db.patch(benId as Id<"tripPeople">, { userId: carol.id, linkedAt: 0 }));

    expect(await errorDataOf(() => respond(ben, invitationId, true))).toMatchObject({
      code: "INVITATION_NOT_PENDING",
    });
    expect(await ben.as.query(api.trips.get, { tripId })).toBeNull();
  });
});

describe("invitations.cancel", () => {
  it("withdraws a pending invitation; the split never changes", async () => {
    const { alice, carol, tripId, saraId } = await setup();
    const before = await sharesOf(alice, tripId);
    const { invitationId } = await invite(alice, tripId, saraId, "carol");

    await alice.as.mutation(api.invitations.cancel, { invitationId });
    const trip = await alice.as.query(api.trips.get, { tripId });
    expect(trip?.shares).toEqual(before);
    expect(trip?.people[2].link).toEqual({ state: "none" });
    expect(await carol.as.query(api.invitations.pendingCount)).toBe(0);
  });

  it("is owner only, and only for pending invitations", async () => {
    const { alice, ben, carol, tripId, benId, saraId } = await setup();
    const toBen = await invite(alice, tripId, benId, "ben_doe");
    const toCarol = await invite(alice, tripId, saraId, "carol");
    await respond(ben, toBen.invitationId, true);

    expect(
      await errorDataOf(() => carol.as.mutation(api.invitations.cancel, { invitationId: toCarol.invitationId })),
    ).toMatchObject({ code: "NOT_FOUND" });
    expect(
      await errorDataOf(() => ben.as.mutation(api.invitations.cancel, { invitationId: toCarol.invitationId })),
    ).toMatchObject({ code: "FORBIDDEN" });
    expect(
      await errorDataOf(() => alice.as.mutation(api.invitations.cancel, { invitationId: toBen.invitationId })),
    ).toMatchObject({ code: "INVITATION_NOT_PENDING" });
    expect(await carol.as.query(api.invitations.pendingCount)).toBe(1);
  });
});

describe("invitations.unlink", () => {
  it("ends access at once and keeps the person and every share", async () => {
    const { t, alice, ben, tripId, benId } = await setup();
    const before = await sharesOf(alice, tripId);
    const { invitationId } = await invite(alice, tripId, benId, "ben_doe");
    await respond(ben, invitationId, true);

    await alice.as.mutation(api.invitations.unlink, { personId: benId });

    expect(await ben.as.query(api.trips.get, { tripId })).toBeNull();
    expect(await ben.as.query(api.trips.listRecent)).toEqual([]);
    const trip = await alice.as.query(api.trips.get, { tripId });
    expect(trip?.shares).toEqual(before);
    expect(trip?.people[1]).toMatchObject({ name: "Ben", username: null, link: { state: "none" } });
    const [row] = await invitationRows(t, tripId);
    expect(row.status).toBe("unlinked");
  });

  it("is owner only, and only for linked people", async () => {
    const { alice, ben, carol, tripId, benId, saraId } = await setup();
    const { invitationId } = await invite(alice, tripId, benId, "ben_doe");
    await respond(ben, invitationId, true);
    const ownerPersonId = (await alice.as.query(api.trips.get, { tripId }))!.viewerPersonId;

    expect(await errorDataOf(() => carol.as.mutation(api.invitations.unlink, { personId: benId }))).toMatchObject({
      code: "NOT_FOUND",
    });
    expect(await errorDataOf(() => ben.as.mutation(api.invitations.unlink, { personId: benId }))).toMatchObject({
      code: "FORBIDDEN",
    });
    for (const personId of [saraId, ownerPersonId]) {
      expect(await errorDataOf(() => alice.as.mutation(api.invitations.unlink, { personId }))).toMatchObject({
        code: "VALIDATION",
      });
    }
    expect(await errorDataOf(() => alice.as.mutation(api.invitations.unlink, { personId: "nope" }))).toMatchObject({
      code: "NOT_FOUND",
    });
    expect(await ben.as.query(api.trips.get, { tripId })).toMatchObject({ viewerRole: "participant" });
  });
});

describe("removing people and bills", () => {
  it("removing a linked person through trips.update deletes their invitation and ends access", async () => {
    const { t, alice, ben, carol, tripId, benId, saraId } = await setup();
    const toBen = await invite(alice, tripId, benId, "ben_doe");
    await respond(ben, toBen.invitationId, true);
    await invite(alice, tripId, saraId, "carol");

    await updateTrip(alice.as, tripId, {
      details: DINNER.details,
      people: [{ key: saraId, personId: saraId, name: "Sara" }],
      items: [{ name: "Pizza", unitPrice: "5000", assigneeKeys: ["owner", saraId] }],
    });

    expect(await ben.as.query(api.trips.get, { tripId })).toBeNull();
    expect(await ben.as.query(api.trips.listRecent)).toEqual([]);
    const rows = await invitationRows(t, tripId);
    expect(rows.map((row) => [row.inviteeUserId, row.status])).toEqual([[carol.id, "pending"]]);
  });

  it("trips.remove deletes every invitation of the bill", async () => {
    const { t, alice, ben, carol, tripId, benId, saraId } = await setup();
    const toBen = await invite(alice, tripId, benId, "ben_doe");
    await respond(ben, toBen.invitationId, true);
    await invite(alice, tripId, saraId, "carol");

    await alice.as.mutation(api.trips.remove, { tripId });

    expect(await invitationRows(t, tripId)).toEqual([]);
    expect(await carol.as.query(api.invitations.listReceived)).toEqual([]);
    expect(await alice.as.query(api.invitations.listSent)).toEqual([]);
    expect(await ben.as.query(api.trips.listRecent)).toEqual([]);
  });
});
