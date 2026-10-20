"use client";

import * as React from "react";
import { ArrowLeft, PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { productDetailsLine } from "@/domain/price-history";
import { usePriceObservations } from "@/lib/db/price-history";

import { PriceChart } from "./price-chart";
import { PriceHistoryList } from "./price-history-list";
import { ProductList, productSummaryLine } from "./product-search";

type ProductPriceHistoryProps = {
  productMatchKey: string;
  /** Selects another product (an other variant). */
  onSelect: (productMatchKey: string) => void;
  /** Returns to the search results. */
  onBack: () => void;
};

/** The selected product: its prices newest first, then its other variants. */
export function ProductPriceHistory({ productMatchKey, onSelect, onBack }: ProductPriceHistoryProps) {
  const history = usePriceObservations(productMatchKey);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const variantsHeadingId = React.useId();
  const loaded = history !== undefined && history !== null;

  // The results the user picked from are gone, so move focus to what replaced them.
  React.useEffect(() => {
    if (loaded) headingRef.current?.focus();
  }, [loaded, productMatchKey]);

  const back = (
    <Button type="button" variant="ghost" size="sm" onClick={onBack} className="self-start">
      <ArrowLeft aria-hidden className="size-icon-md" />
      Back to results
    </Button>
  );

  if (history === undefined) {
    return (
      <div className="flex flex-col gap-16">
        {back}
        <LoadingState label="Loading prices…" />
      </div>
    );
  }
  if (history === null) {
    return (
      <div className="flex flex-col gap-16">
        {back}
        <EmptyState
          icon={PackageSearch}
          title="No price records for this item"
          description="It isn't on any bill you can see, or its bills were deleted."
        />
      </div>
    );
  }

  const { product, observations, otherVariants } = history;
  const details = productDetailsLine(product);
  return (
    <div className="flex flex-col gap-24">
      <div className="flex flex-col gap-12">
        {back}
        <div className="flex flex-col gap-2">
          <h2 ref={headingRef} tabIndex={-1} className="type-h2 break-words outline-none">
            {product.name}
          </h2>
          {details && <p className="type-body-sm text-ink-secondary">{details}</p>}
          <p aria-live="polite" className="type-caption text-ink-muted">
            {productSummaryLine(product)}
          </p>
        </div>
      </div>

      <PriceChart observations={observations} />
      <PriceHistoryList observations={observations} />

      {otherVariants.length > 0 && (
        <section aria-labelledby={variantsHeadingId} className="flex flex-col gap-12">
          <div className="flex flex-col gap-2">
            <h3 id={variantsHeadingId} className="type-h3 break-words">
              {`Other variants of '${product.name}'`}
            </h3>
            <p className="type-body-sm text-ink-secondary">
              Different pack size, unit or variant, so not compared directly
            </p>
          </div>
          <ProductList products={otherVariants} onSelect={onSelect} label="Other variants" />
        </section>
      )}
    </div>
  );
}
