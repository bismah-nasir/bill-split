import { v } from "convex/values";

import {
  ITEM_SUGGESTIONS_LIMIT,
  MAX_PRODUCT_SEARCH_LENGTH,
  productSearchTerm,
  suggestProducts,
} from "../src/domain/price-history";
import type { ItemSuggestion } from "../src/domain/types";
import { query } from "./_generated/server";
import { collectAccessibleItems, PRODUCT_SEARCH_TRIPS_CAP } from "./lib/access";
import { getCurrentUser } from "./lib/auth";
import { appError } from "./lib/errors";
import { toPriceRecord } from "./lib/readModels";

/**
 * Products the caller has recorded before whose name contains `term`, for the item name field
 * of the bill form: at most 8, most recently bought first, each with its last store. From the
 * caller's most recent bills only. Fewer than 2 characters, or signed out, gives `[]`.
 */
export const suggest = query({
  args: { term: v.string() },
  handler: async (ctx, args): Promise<ItemSuggestion[]> => {
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
    return suggestProducts(records, term, ITEM_SUGGESTIONS_LIMIT);
  },
});
