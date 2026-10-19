"use client";

import { useQuery } from "convex/react";
import { useState } from "react";

import { productSearchTerm } from "@/domain/price-history";
import type { PriceHistory, ProductResult } from "@/domain/types";

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
