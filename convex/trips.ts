import { v } from "convex/values";

import {
  matchesHistoryQuery,
  MAX_HISTORY_SEARCH_LENGTH,
  orderDateRange,
  sortHistory,
} from "../src/domain/bill-history";
import type { FieldErrors } from "../src/domain/errors";
import { isDateInMonth, isMonth, monthDateRange } from "../src/domain/spending-summary";
import { isIsoDate } from "../src/domain/trip-validation";
import type { BillHistoryPage, SpendingSummary } from "../src/domain/types";
import { mutation, query } from "./_generated/server";
import {
  ACCESSIBLE_TRIPS_CAP,
  HISTORY_PAGE_SIZE,
  listAccessibleTrips,
  MAX_HISTORY_LIMIT,
  MAX_ITEMS_PER_TRIP,
  RECENT_TRIPS_LIMIT,
} from "./lib/access";
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
 * Bill History: every bill the caller owns or is linked on, filtered, sorted and cut to
 * `limit` (1–200, default 20). The search is a case-insensitive substring of the title, store
 * and item names; `from` / `to` are inclusive `YYYY-MM-DD` dates, and a range given backwards
 * is swapped rather than rejected. "Shared" means bills the caller is linked on but doesn't own.
 */
export const listHistory = query({
  args: {
    search: v.optional(v.string()),
    category: v.optional(categoryValidator),
    from: v.optional(v.string()),
    to: v.optional(v.string()),
    ownership: v.union(v.literal("all"), v.literal("owned"), v.literal("shared")),
    sort: v.union(
      v.literal("date_desc"),
      v.literal("date_asc"),
      v.literal("total_desc"),
      v.literal("total_asc"),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<BillHistoryPage> => {
    const limit = args.limit ?? HISTORY_PAGE_SIZE;
    const fieldErrors: FieldErrors = {};
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_HISTORY_LIMIT) {
      fieldErrors.limit = `Limit must be a whole number from 1 to ${MAX_HISTORY_LIMIT}`;
    }
    if ((args.search ?? "").length > MAX_HISTORY_SEARCH_LENGTH) {
      fieldErrors.search = `Search must be ${MAX_HISTORY_SEARCH_LENGTH} characters or fewer`;
    }
    if (args.from !== undefined && !isIsoDate(args.from)) fieldErrors.from = "Enter a valid date";
    if (args.to !== undefined && !isIsoDate(args.to)) fieldErrors.to = "Enter a valid date";
    if (Object.keys(fieldErrors).length > 0) {
      throw appError("VALIDATION", "Some filters need attention.", fieldErrors);
    }

    const user = await getCurrentUser(ctx);
    if (user === null) return { trips: [], hasMore: false, totalMatches: 0, totalAccessible: 0 };

    const accessible = await listAccessibleTrips(ctx, user._id, ACCESSIBLE_TRIPS_CAP);
    const query = {
      search: args.search ?? "",
      category: args.category ?? null,
      ...orderDateRange(args.from ?? "", args.to ?? ""),
      ownership: args.ownership,
      sort: args.sort,
    };
    const candidates = accessible.map((trip) => ({
      trip,
      searchText: trip.searchText,
      category: trip.category,
      tripDate: trip.tripDate,
      totalPaisa: trip.totalPaisa,
      isOwner: trip.ownerId === user._id,
    }));
    const matches = sortHistory(
      candidates.filter((candidate) => matchesHistoryQuery(candidate, query)),
      query.sort,
    );
    const trips = await Promise.all(
      matches.slice(0, limit).map(({ trip }) => toTripCard(ctx, trip, user._id)),
    );
    return {
      trips,
      hasMore: matches.length > limit,
      totalMatches: matches.length,
      totalAccessible: accessible.length,
    };
  },
});

/**
 * The dashboard's monthly figures for bills dated in `month` ("YYYY-MM"). "Your share" sums
 * the allocations of the caller's own person (owner row or linked person) on every bill they
 * can see; "Bills you created" sums the full totals of the bills they own. People without an
 * account have no `userId`, so their shares count toward nobody's summary.
 */
export const spendingSummary = query({
  args: { month: v.string() },
  handler: async (ctx, args): Promise<SpendingSummary> => {
    if (!isMonth(args.month)) {
      throw appError("VALIDATION", "Some fields need attention.", { month: "Enter a valid month" });
    }
    const empty = {
      month: args.month,
      yourSharePaisa: 0,
      yourShareBillCount: 0,
      createdTotalPaisa: 0,
      createdBillCount: 0,
    };
    const user = await getCurrentUser(ctx);
    if (user === null) return empty;

    // The caller's own person on each bill they can see, then that person's assignments.
    const rows = await ctx.db
      .query("tripPeople")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(ACCESSIBLE_TRIPS_CAP);
    const shares = await Promise.all(
      rows.map(async (row) => {
        const trip = await ctx.db.get(row.tripId);
        if (trip === null || !isDateInMonth(trip.tripDate, args.month)) return null;
        const assignments = await ctx.db
          .query("itemAssignments")
          .withIndex("by_trip_person", (q) => q.eq("tripId", trip._id).eq("personId", row._id))
          .take(MAX_ITEMS_PER_TRIP);
        return assignments.reduce((sum, assignment) => sum + assignment.allocatedAmountPaisa, 0);
      }),
    );
    const inMonth = shares.filter((share) => share !== null);

    const { from, to } = monthDateRange(args.month);
    const created = await ctx.db
      .query("trips")
      .withIndex("by_owner_date", (q) =>
        q.eq("ownerId", user._id).gte("tripDate", from).lte("tripDate", to),
      )
      .take(ACCESSIBLE_TRIPS_CAP);

    return {
      month: args.month,
      yourSharePaisa: inMonth.reduce((sum, share) => sum + share, 0),
      yourShareBillCount: inMonth.length,
      createdTotalPaisa: created.reduce((sum, trip) => sum + trip.totalPaisa, 0),
      createdBillCount: created.length,
    };
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
