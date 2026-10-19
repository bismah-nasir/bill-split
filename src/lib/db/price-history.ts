"use client";

import { useQuery } from "convex/react";
import { useState } from "react";

import { MAX_PRODUCT_SEARCH_LENGTH, productSearchTerm } from "@/domain/price-history";
import type { ItemSuggestion, PriceHistory, ProductResult } from "@/domain/types";

import { api } from "../../../convex/_generated/api";

/**
 * Products from the user's bills whose name contains `term`. `results` is `null` while the
 * term is shorter than 2 characters (nothing is searched) and `undefined` on the first load.
 * While a new term loads, the previous results stay on screen with `isUpdating` true.
 */
export function useProductSearch(term: string): {
  results: ProductResult[] | null | undefined;
  isUpdating: boolean;
} {
  const searchable = productSearchTerm(term) !== null;
  const current = useQuery(api.priceHistory.searchProducts, searchable ? { term: term.trim() } : "skip");
  const [previous, setPrevious] = useState<ProductResult[] | undefined>(current);
  if (current !== undefined && current !== previous) setPrevious(current);
  if (!searchable) return { results: null, isUpdating: false };
  return { results: current ?? previous, isUpdating: current === undefined && previous !== undefined };
}

/**
 * A product's price records and other variants. `undefined` while loading (or when `key` is
 * `null`), `null` when no bill the user can see has the product.
 */
export function usePriceObservations(productMatchKey: string | null): PriceHistory | null | undefined {
  return useQuery(
    api.priceHistory.getObservations,
    productMatchKey === null ? "skip" : { productMatchKey },
  );
}

/**
 * Products the user has recorded before whose name contains `term`, for the item name field.
 * `null` while the term is shorter than 2 characters or longer than a search allows (nothing
 * is searched), `undefined` on the first load. While a new term loads, the previous
 * suggestions stay with `isUpdating` true.
 */
export function useItemSuggestions(term: string): {
  suggestions: ItemSuggestion[] | null | undefined;
  isUpdating: boolean;
} {
  const trimmed = term.trim();
  const searchable = productSearchTerm(trimmed) !== null && trimmed.length <= MAX_PRODUCT_SEARCH_LENGTH;
  const current = useQuery(api.items.suggest, searchable ? { term: trimmed } : "skip");
  const [previous, setPrevious] = useState<ItemSuggestion[] | undefined>(current);
  // Forget old suggestions once the field no longer searches, so they never reappear for an
  // unrelated term.
  const latest = searchable ? (current ?? previous) : undefined;
  if (latest !== previous) setPrevious(latest);
  if (!searchable) return { suggestions: null, isUpdating: false };
  return { suggestions: latest, isUpdating: current === undefined && previous !== undefined };
}
