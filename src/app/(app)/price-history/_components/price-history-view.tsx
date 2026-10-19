"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { ProductPriceHistory } from "@/components/price-history/product-price-history";
import { ProductSearchBox, ProductSearchResults } from "@/components/price-history/product-search";
import {
  parsePriceHistoryParams,
  priceHistoryParamsToQuery,
  type PriceHistoryParams,
} from "@/domain/price-history";

export function PriceHistoryView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // The URL is the source of truth, so reloads and back navigation keep the search and product.
  const { search, product } = React.useMemo(() => parsePriceHistoryParams(searchParams), [searchParams]);

  const navigate = (patch: Partial<PriceHistoryParams>, mode: "push" | "replace") => {
    // Merge into the URL as it is now: `useSearchParams` can be a render behind the last change.
    const current = parsePriceHistoryParams(new URLSearchParams(window.location.search));
    const nextQuery = priceHistoryParamsToQuery({ ...current, ...patch });
    if (nextQuery === priceHistoryParamsToQuery(current)) return;
    // The native history API updates `useSearchParams` without a server navigation.
    const url = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    if (mode === "push") window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  };

  // Typing a new search goes back to the results. Picking a product adds a history entry, so
  // the browser's Back button returns to the results too.
  const changeSearch = (next: string) => navigate({ search: next, product: null }, "replace");
  const selectProduct = (key: string) => {
    navigate({ product: key }, "push");
    window.scrollTo({ top: 0 });
  };
  const backToResults = () => navigate({ product: null }, "replace");

  return (
    <div className="flex flex-col gap-24">
      <PageHeader
        title="Price History"
        description="See what you paid for an item across your bills."
      />
      <ProductSearchBox term={search} onTermChange={changeSearch} />
      {product === null ? (
        <ProductSearchResults term={search} onSelect={selectProduct} />
      ) : (
        <ProductPriceHistory productMatchKey={product} onSelect={selectProduct} onBack={backToResults} />
      )}
    </div>
  );
}
