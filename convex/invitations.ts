import { v } from "convex/values";

import {
  INVITE_MESSAGES,
  noMatchMessage,
  normalizeInviteIdentifier,
  type InviteVia,
} from "../src/domain/invitations";
import { normalizeText } from "../src/domain/normalization";
import {
  DUPLICATE_NAME_MESSAGE,
  MAX_PEOPLE_PER_TRIP,
  PEOPLE_LIMIT_MESSAGE,
  validatePersonName,
} from "../src/domain/trip-validation";
import type { InvitationReceived, InvitationSent } from "../src/domain/types";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { getCurrentUser, requireCurrentUser, requireTripOwner } from "./lib/auth";
import { appError } from "./lib/errors";

/** How many invitations one list shows (the nav badge counts one more, to show "50+"). */
const INVITATION_LIST_LIMIT = 50;

const viaValidator = v.union(v.literal("username"), v.literal("email"));

/**
 * Asks an account to be linked to one person on the bill: an existing person (`personId`) or
 * one added now (`newPersonName`). The account is found by an exact match on its username or
 * email; names are never compared. Owner only. The split never changes.
 */
export const invite = mutation({
  args: {
    tripId: v.string(),
    personId: v.optional(v.string()),
    newPersonName: v.optional(v.string()),
    via: viaValidator,
    identifier: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, trip } = await requireTripOwner(ctx, args.tripId);
    if ((args.personId === undefined) === (args.newPersonName === undefined)) {
      throw appError("VALIDATION", "Choose who this is.", { personId: "Choose who this is" });
    }

    // The person, when they're already on the bill.
    let person: Doc<"tripPeople"> | null = null;
    if (args.personId !== undefined) {
      const id = ctx.db.normalizeId("tripPeople", args.personId);
      person = id === null ? null : await ctx.db.get(id);
      if (person === null || person.tripId !== trip._id || person.role !== "person") {
        throw appError("VALIDATION", "Choose someone on this bill.", { personId: "Choose someone on this bill" });
      }
      if (person.userId !== undefined) {
        throw appError("INVITE_PERSON_LINKED", INVITE_MESSAGES.personLinked(person.name ?? "This person"));
      }
      const existingPersonId = person._id;
      const pending = await ctx.db
        .query("tripInvitations")
        .withIndex("by_person_status", (q) => q.eq("personId", existingPersonId).eq("status", "pending"))
        .first();
      if (pending !== null) throw appError("INVITE_ALREADY_PENDING", INVITE_MESSAGES.alreadyPending);
    }

    // The account.
    const invitee = await findInvitee(ctx, args.via, args.identifier);
    if (invitee === null) throw appError("INVITE_NO_MATCH", noMatchMessage(args.via));
    if (invitee._id === user._id) throw appError("INVITE_SELF", INVITE_MESSAGES.self);
    const linked = await ctx.db
      .query("tripPeople")
      .withIndex("by_trip_user", (q) => q.eq("tripId", trip._id).eq("userId", invitee._id))
      .first();
    if (linked !== null) throw appError("INVITE_ALREADY_PARTICIPANT", INVITE_MESSAGES.alreadyParticipant);
    const existing = await ctx.db
      .query("tripInvitations")
      .withIndex("by_trip_invitee", (q) => q.eq("tripId", trip._id).eq("inviteeUserId", invitee._id))
      .unique();
    if (existing?.status === "pending") throw appError("INVITE_ALREADY_PENDING", INVITE_MESSAGES.alreadyPending);

    // Someone new joins the bill only once everything else has passed.
    const now = Date.now();
    const personId = person?._id ?? (await insertNewPerson(ctx, trip._id, args.newPersonName ?? "", now));

    const fields = {
      personId,
      invitedByUserId: user._id,
      invitedVia: args.via,
      status: "pending" as const,
      createdAt: now,
      updatedAt: now,
    };
    let invitationId: Id<"tripInvitations">;
    if (existing !== null) {
      // Declined, cancelled or unlinked before: the same record is reused (one per trip and account).
      await ctx.db.patch(existing._id, { ...fields, respondedAt: undefined });
      invitationId = existing._id;
    } else {
      invitationId = await ctx.db.insert("tripInvitations", {
        ...fields,
        tripId: trip._id,
        inviteeUserId: invitee._id,
      });
    }
    return { invitationId, username: invitee.username ?? "" };
  },
});

/** The caller's pending invitations, with only what they need to decide. */
export const listReceived = query({
  args: {},
  handler: async (ctx): Promise<InvitationReceived[]> => {
    const user = await getCurrentUser(ctx);
    if (user === null) return [];
    const rows = await ctx.db
      .query("tripInvitations")
      .withIndex("by_invitee_status", (q) => q.eq("inviteeUserId", user._id).eq("status", "pending"))
      .order("desc")
      .take(INVITATION_LIST_LIMIT);
    const received = await Promise.all(
      rows.map(async (row): Promise<InvitationReceived | null> => {
        const [trip, person] = await Promise.all([ctx.db.get(row.tripId), ctx.db.get(row.personId)]);
        if (trip === null || person === null) return null;
        const owner = await ctx.db.get(trip.ownerId);
        return {
          invitationId: row._id,
          tripTitle: trip.title,
          storeName: trip.storeName ?? null,
          tripDate: trip.tripDate,
          ownerUsername: owner?.username ?? "",
          personName: person.name ?? "",
          invitedAt: row.createdAt,
        };
      }),
    );
    return received
      .filter((invitation) => invitation !== null)
      .sort((a, b) => b.invitedAt - a.invitedAt);
  },
});

/** How many invitations wait for the caller (up to 51; the badge shows "50+"). */
export const pendingCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (user === null) return 0;
    const rows = await ctx.db
      .query("tripInvitations")
      .withIndex("by_invitee_status", (q) => q.eq("inviteeUserId", user._id).eq("status", "pending"))
      .take(INVITATION_LIST_LIMIT + 1);
    return rows.length;
  },
});

/** Invitations the caller sent that are pending, accepted or declined, newest first. */
export const listSent = query({
  args: {},
  handler: async (ctx): Promise<InvitationSent[]> => {
    const user = await getCurrentUser(ctx);
    if (user === null) return [];
    const statuses = ["pending", "accepted", "declined"] as const;
    const rows = (
      await Promise.all(
        statuses.map((status) =>
          ctx.db
            .query("tripInvitations")
            .withIndex("by_invitedBy_status", (q) => q.eq("invitedByUserId", user._id).eq("status", status))
            .order("desc")
            .take(INVITATION_LIST_LIMIT),
        ),
      )
    )
      .flat()
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, INVITATION_LIST_LIMIT);
    const sent = await Promise.all(
      rows.map(async (row): Promise<InvitationSent | null> => {
        const [trip, person, invitee] = await Promise.all([
          ctx.db.get(row.tripId),
          ctx.db.get(row.personId),
          ctx.db.get(row.inviteeUserId),
        ]);
        // Only the trip's owner sees its invitations.
        if (trip === null || person === null || trip.ownerId !== user._id) return null;
        return {
          invitationId: row._id,
          tripId: trip._id,
          tripTitle: trip.title,
          personName: person.name ?? "",
          username: invitee?.username ?? "",
          status: row.status as InvitationSent["status"],
          invitedAt: row.createdAt,
          respondedAt: row.respondedAt ?? null,
        };
      }),
    );
    return sent.filter((invitation) => invitation !== null);
  },
});

/**
 * Accepts or declines one of the caller's pending invitations. Accepting links the person to
 * the caller, which is what grants access. Assignments are never touched, so the split stays
 * exactly as it was.
 */
export const respond = mutation({
  args: { invitationId: v.string(), accept: v.boolean() },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const id = ctx.db.normalizeId("tripInvitations", args.invitationId);
    const row = id === null ? null : await ctx.db.get(id);
    // Someone else's invitation is reported exactly like a missing one.
    if (row === null || row.inviteeUserId !== user._id) {
      throw appError("NOT_FOUND", INVITE_MESSAGES.notAvailable);
    }
    if (row.status !== "pending") throw appError("INVITATION_NOT_PENDING", INVITE_MESSAGES.notAvailable);
    const now = Date.now();

    if (!args.accept) {
      await ctx.db.patch(row._id, { status: "declined", respondedAt: now, updatedAt: now });
      return { tripId: null };
    }

    // Defensive: the invariants (one pending invitation per person, one record per trip and
    // account) keep this from happening. A thrown error rolls the mutation back, so the row
    // can't also be marked cancelled here.
    const person = await ctx.db.get(row.personId);
    const alreadyLinked = await ctx.db
      .query("tripPeople")
      .withIndex("by_trip_user", (q) => q.eq("tripId", row.tripId).eq("userId", user._id))
      .first();
    if (person === null || person.userId !== undefined || alreadyLinked !== null) {
      throw appError("INVITATION_NOT_PENDING", INVITE_MESSAGES.notAvailable);
    }

    await ctx.db.patch(person._id, { userId: user._id, linkedAt: now, updatedAt: now });
    await ctx.db.patch(row._id, { status: "accepted", respondedAt: now, updatedAt: now });
    return { tripId: row.tripId };
  },
});

/** Withdraws a pending invitation. Owner only. */
export const cancel = mutation({
  args: { invitationId: v.string() },
  handler: async (ctx, args) => {
    await requireCurrentUser(ctx);
    const id = ctx.db.normalizeId("tripInvitations", args.invitationId);
    const row = id === null ? null : await ctx.db.get(id);
    if (row === null) throw appError("NOT_FOUND", INVITE_MESSAGES.notAvailable);
    await requireTripOwner(ctx, row.tripId);
    if (row.status !== "pending") throw appError("INVITATION_NOT_PENDING", INVITE_MESSAGES.notAvailable);
    const now = Date.now();
    await ctx.db.patch(row._id, { status: "cancelled", updatedAt: now });
    return null;
  },
});

/**
 * Disconnects a linked person from their account, which ends that account's access at once.
 * The person stays on the bill with the same share. Owner only.
 */
export const unlink = mutation({
  args: { personId: v.string() },
  handler: async (ctx, args) => {
    await requireCurrentUser(ctx);
    const id = ctx.db.normalizeId("tripPeople", args.personId);
    const person = id === null ? null : await ctx.db.get(id);
    if (person === null) throw appError("NOT_FOUND", "This bill doesn't exist or you don't have access.");
    const { trip } = await requireTripOwner(ctx, person.tripId);
    const userId = person.userId;
    if (person.role !== "person" || userId === undefined) {
      throw appError("VALIDATION", INVITE_MESSAGES.notLinked);
    }
    const now = Date.now();
    await ctx.db.patch(person._id, { userId: undefined, linkedAt: undefined, updatedAt: now });
    const invitation = await ctx.db
      .query("tripInvitations")
      .withIndex("by_trip_invitee", (q) => q.eq("tripId", trip._id).eq("inviteeUserId", userId))
      .unique();
    if (invitation !== null && invitation.status === "accepted") {
      await ctx.db.patch(invitation._id, { status: "unlinked", updatedAt: now });
    }
    return null;
  },
});

/** The onboarded account behind an exact username or email, or `null`. */
async function findInvitee(ctx: MutationCtx, via: InviteVia, identifier: string): Promise<Doc<"users"> | null> {
  const normalized = normalizeInviteIdentifier(via, identifier);
  if (normalized === null) return null;
  const account =
    via === "username"
      ? await ctx.db
          .query("users")
          .withIndex("by_usernameNormalized", (q) => q.eq("usernameNormalized", normalized))
          .first()
      : await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", normalized))
          .first();
  // Accounts that haven't chosen a username yet can't be invited.
  return account?.username === undefined ? null : account;
}

/** Adds "Someone new" to the bill at the next position, on no items (a Rs. 0 share). */
async function insertNewPerson(
  ctx: MutationCtx,
  tripId: Id<"trips">,
  input: string,
  now: number,
): Promise<Id<"tripPeople">> {
  const name = validatePersonName(input);
  if (!name.ok) throw appError("VALIDATION", name.error, { newPersonName: name.error });
  const nameNormalized = normalizeText(name.value);
  const people = await ctx.db
    .query("tripPeople")
    .withIndex("by_trip", (q) => q.eq("tripId", tripId))
    .take(MAX_PEOPLE_PER_TRIP + 1);
  if (people.some((person) => person.nameNormalized === nameNormalized)) {
    throw appError("VALIDATION", DUPLICATE_NAME_MESSAGE, { newPersonName: DUPLICATE_NAME_MESSAGE });
  }
  if (people.length >= MAX_PEOPLE_PER_TRIP) throw appError("TRIP_PEOPLE_LIMIT", PEOPLE_LIMIT_MESSAGE);
  return await ctx.db.insert("tripPeople", {
    tripId,
    role: "person",
    name: name.value,
    nameNormalized,
    position: Math.max(...people.map((person) => person.position)) + 1,
    createdAt: now,
    updatedAt: now,
  });
}
