import { v } from "convex/values";

import {
  buildPriceHistory,
  MAX_PRODUCT_SEARCH_LENGTH,
  PRODUCT_RESULTS_LIMIT,
  productKeyPrefix,
  productSearchTerm,
  searchProducts as matchProducts,
} from "../src/domain/price-history";
import type { PriceHistory, ProductResult } from "../src/domain/types";
import { query } from "./_generated/server";
import {
  ACCESSIBLE_TRIPS_CAP,
  collectAccessibleItems,
  listAccessibleTrips,
  MAX_ITEMS_PER_TRIP,
  PRODUCT_SEARCH_TRIPS_CAP,
} from "./lib/access";
import { getCurrentUser } from "./lib/auth";
import { appError } from "./lib/errors";
import { toPriceRecord } from "./lib/readModels";

/**
 * Products whose item name contains `term` (case-insensitive), from the caller's most recent
 * bills only, most recently bought first. Fewer than 2 characters, or signed out, gives `[]`.
 */
export const searchProducts = query({
  args: { term: v.string() },
  handler: async (ctx, args): Promise<ProductResult[]> => {
    if (args.term.length > MAX_PRODUCT_SEARCH_LENGTH) {
      throw appError("VALIDATION", "Some fields need attention.", {
        term: `Search must be ${MAX_PRODUCT_SEARCH_LENGTH} characters or fewer`,
      });
    }
    const term = productSearchTerm(args.term);
    if (term === null) return [];
    const user = await getCurrentUser(ctx);
    if (user === null) return [];

    const rows = await collectAccessibleItems(ctx, user._id, PRODUCT_SEARCH_TRIPS_CAP);
    const records = rows.map(({ trip, item }) => toPriceRecord(trip, item));
    return matchProducts(records, term, PRODUCT_RESULTS_LIMIT);
  },
});

/**
 * One product's prices on the caller's bills, newest first, each with its change from the
 * record before it, plus the other variants of the same item name. `null` when signed out or
 * when no accessible bill has the product.
 */
export const getObservations = query({
  args: { productMatchKey: v.string() },
  handler: async (ctx, args): Promise<PriceHistory | null> => {
    const user = await getCurrentUser(ctx);
    if (user === null) return null;
    const prefix = productKeyPrefix(args.productMatchKey);
    if (prefix === null) return null;
    // Every key with this item name sorts between "name|" and "name}" ("}" follows "|").
    const upper = `${prefix.slice(0, -1)}}`;

    const trips = await listAccessibleTrips(ctx, user._id, ACCESSIBLE_TRIPS_CAP);
    const perTrip = await Promise.all(
      trips.map(async (trip) => {
        const items = await ctx.db
          .query("items")
          .withIndex("by_trip_productMatchKey", (q) =>
            q.eq("tripId", trip._id).gte("productMatchKey", prefix).lt("productMatchKey", upper),
          )
          .take(MAX_ITEMS_PER_TRIP);
        return items.map((item) => toPriceRecord(trip, item));
      }),
    );
    return buildPriceHistory(args.productMatchKey, perTrip.flat());
  },
});
