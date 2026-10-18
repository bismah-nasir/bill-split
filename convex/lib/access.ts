import { HISTORY_PAGE_SIZE, MAX_HISTORY_LIMIT } from "../../src/domain/bill-history";
import { MAX_ITEMS_PER_TRIP, MAX_PEOPLE_PER_TRIP } from "../../src/domain/trip-validation";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

// MVP limits on how much one request reads (documented in the README).
export const ACCESSIBLE_TRIPS_CAP = 1000;
export const PRODUCT_SEARCH_TRIPS_CAP = 300;
export const RECENT_TRIPS_LIMIT = 5;
export { HISTORY_PAGE_SIZE, MAX_HISTORY_LIMIT, MAX_ITEMS_PER_TRIP, MAX_PEOPLE_PER_TRIP };
/** Every assignment of one trip: each item is split between at most every person. */
export const MAX_ASSIGNMENTS_PER_TRIP = MAX_ITEMS_PER_TRIP * MAX_PEOPLE_PER_TRIP;

/**
 * Every trip the user can see, newest bill date first (ties: newest created first, by
 * `_creationTime`, which unlike `createdAt` is never equal for two trips). The owner
 * has a row on their own trips and linked people on theirs; people without an account have no
 * `userId`, so they never appear here.
 */
export async function listAccessibleTrips(
  ctx: QueryCtx,
  userId: Id<"users">,
  cap: number,
): Promise<Doc<"trips">[]> {
  const rows = await ctx.db
    .query("tripPeople")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .order("desc")
    .take(cap);
  const trips = await Promise.all(rows.map((row) => ctx.db.get(row.tripId)));
  return trips
    .filter((trip) => trip !== null)
    .sort((a, b) =>
      a.tripDate === b.tripDate
        ? b._creationTime - a._creationTime
        : a.tripDate < b.tripDate
          ? 1
          : -1,
    );
}
