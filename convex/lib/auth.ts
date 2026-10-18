import { getAuthUserId } from "@convex-dev/auth/server";

import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { appError } from "./errors";

type Ctx = QueryCtx | MutationCtx;

export type OnboardedUser = Doc<"users"> & { username: string; usernameNormalized: string };

/** The caller's user row, from the verified Convex Auth identity, or `null`. */
export async function getCurrentUser(ctx: Ctx): Promise<Doc<"users"> | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  return await ctx.db.get(userId);
}

export async function requireCurrentUser(ctx: Ctx): Promise<Doc<"users">> {
  const user = await getCurrentUser(ctx);
  if (user === null) throw appError("UNAUTHENTICATED", "Please sign in to continue.");
  return user;
}

/** Like `requireCurrentUser`, but also requires a chosen username. */
export async function requireOnboardedUser(ctx: Ctx): Promise<OnboardedUser> {
  const user = await requireCurrentUser(ctx);
  if (user.username === undefined || user.usernameNormalized === undefined) {
    throw appError("ONBOARDING_REQUIRED", "Choose a username to continue.");
  }
  return { ...user, username: user.username, usernameNormalized: user.usernameNormalized };
}

export type TripAccess = {
  trip: Doc<"trips">;
  role: "owner" | "participant";
  /** The caller's own person on the trip. */
  personId: Id<"tripPeople">;
};

/**
 * The caller's access to a trip, or `null` when the trip doesn't exist or isn't theirs to see.
 * Only the owner and accounts linked to a person on the trip have a `by_trip_user` row.
 */
export async function getTripAccess(
  ctx: Ctx,
  tripId: Id<"trips">,
  userId: Id<"users">,
): Promise<TripAccess | null> {
  const trip = await ctx.db.get(tripId);
  if (trip === null) return null;
  const person = await ctx.db
    .query("tripPeople")
    .withIndex("by_trip_user", (q) => q.eq("tripId", tripId).eq("userId", userId))
    .first();
  if (person === null) return null;
  return { trip, role: trip.ownerId === userId ? "owner" : "participant", personId: person._id };
}

/**
 * Like `getTripAccess`, for a trip ID from a URL: a malformed ID is simply "no access".
 * Never throws, so queries can return `null` for every failure alike.
 */
export async function findTripAccess(
  ctx: Ctx,
  tripId: string,
  userId: Id<"users">,
): Promise<TripAccess | null> {
  const id = ctx.db.normalizeId("trips", tripId);
  return id === null ? null : await getTripAccess(ctx, id, userId);
}

/** The caller and their access to a trip. Missing and inaccessible trips both give `NOT_FOUND`. */
export async function requireTripViewer(ctx: Ctx, tripId: string) {
  const user = await requireCurrentUser(ctx);
  const access = await findTripAccess(ctx, tripId, user._id);
  if (access === null) throw appError("NOT_FOUND", TRIP_NOT_FOUND_MESSAGE);
  return { user, ...access };
}

/** Like `requireTripViewer`, but participants get `FORBIDDEN`. */
export async function requireTripOwner(ctx: Ctx, tripId: string) {
  const viewer = await requireTripViewer(ctx, tripId);
  if (viewer.role !== "owner") throw appError("FORBIDDEN", "Only the bill owner can do that.");
  return viewer;
}

const TRIP_NOT_FOUND_MESSAGE = "This bill doesn't exist or you don't have access.";
