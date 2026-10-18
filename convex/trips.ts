import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { ACCESSIBLE_TRIPS_CAP, listAccessibleTrips, RECENT_TRIPS_LIMIT } from "./lib/access";
import { findTripAccess, getCurrentUser, requireOnboardedUser, requireTripOwner } from "./lib/auth";
import { appError } from "./lib/errors";
import { toTripCard, toTripDetail } from "./lib/readModels";
import { deleteTrip, validateOrThrow, writeNewTrip, writeTripUpdate } from "./lib/tripWrite";
import { categoryValidator } from "./schema";

// Quantities and prices arrive as the strings the user typed; the server parses them with the
// same domain functions as the form. IDs arrive as strings and are checked with normalizeId.
const detailsValidator = v.object({
  title: v.string(),
  storeName: v.string(),
  tripDate: v.string(),
  category: categoryValidator,
});

const personInputValidator = v.object({
  key: v.string(),
  personId: v.optional(v.string()),
  name: v.string(),
});

const itemInputValidator = v.object({
  itemId: v.optional(v.string()),
  name: v.string(),
  brand: v.string(),
  variant: v.string(),
  packSize: v.string(),
  unit: v.string(),
  quantity: v.string(),
  unitPrice: v.string(),
  assigneeKeys: v.array(v.string()),
});

export const create = mutation({
  args: {
    details: detailsValidator,
    people: v.array(personInputValidator),
    items: v.array(itemInputValidator),
  },
  handler: async (ctx, args) => {
    const owner = await requireOnboardedUser(ctx);
    // A new bill can't refer to saved people or items.
    if (args.people.some((person) => person.personId !== undefined) ||
        args.items.some((item) => item.itemId !== undefined)) {
      throw appError("VALIDATION", "Some fields need attention.");
    }
    const validated = validateOrThrow(args);
    const tripId = await writeNewTrip(ctx, owner, validated);
    return { tripId };
  },
});

/** The bill, or `null` when it doesn't exist, the ID is malformed or the caller can't see it. */
export const get = query({
  args: { tripId: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (user === null) return null;
    const access = await findTripAccess(ctx, args.tripId, user._id);
    if (access === null) return null;
    return await toTripDetail(ctx, access.trip, user._id);
  },
});

/** The caller's most recent bills by bill date, owned or shared with them. */
export const listRecent = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (user === null) return [];
    const trips = await listAccessibleTrips(ctx, user._id, ACCESSIBLE_TRIPS_CAP);
    return await Promise.all(
      trips.slice(0, RECENT_TRIPS_LIMIT).map((trip) => toTripCard(ctx, trip, user._id)),
    );
  },
});

/**
 * Saves an edited bill. Owner only: anyone else gets `NOT_FOUND` (or `FORBIDDEN` if they can
 * see the bill). Saved people and items must belong to this bill.
 */
export const update = mutation({
  args: {
    tripId: v.string(),
    details: detailsValidator,
    people: v.array(personInputValidator),
    items: v.array(itemInputValidator),
  },
  handler: async (ctx, args) => {
    const { trip } = await requireTripOwner(ctx, args.tripId);
    const validated = validateOrThrow(args);
    await writeTripUpdate(ctx, trip, validated);
    return null;
  },
});

/** Permanently deletes a bill with its people, items and assignments. Owner only. */
export const remove = mutation({
  args: { tripId: v.string() },
  handler: async (ctx, args) => {
    const { trip } = await requireTripOwner(ctx, args.tripId);
    await deleteTrip(ctx, trip._id);
    return null;
  },
});
