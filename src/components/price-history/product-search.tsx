"use client";

import { ChevronRight, Search, SearchX } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/loading-state";
import { SearchInput } from "@/components/ui/search-input";
import { formatPaisa, formatTripDate } from "@/domain/format";
import { MAX_PRODUCT_SEARCH_LENGTH, productDetailsLine } from "@/domain/price-history";
import type { ProductResult } from "@/domain/types";
import { useProductSearch } from "@/lib/db/price-history";
import { cn } from "@/lib/utils";

type ProductSearchBoxProps = {
  /** The applied search (from the URL). */
  term: string;
  onTermChange: (term: string) => void;
};

/** The debounced item search at the top of Price History. */
export function ProductSearchBox({ term, onTermChange }: ProductSearchBoxProps) {
  return (
    <SearchInput
      label="Search items"
      placeholder="Search items, e.g. cooking oil"
      value={term}
      onDebouncedChange={onTermChange}
      maxLength={MAX_PRODUCT_SEARCH_LENGTH}
    />
  );
}

type ProductSearchResultsProps = {
  term: string;
  onSelect: (productMatchKey: string) => void;
};

/** The products matching `term`, or a hint while it's too short. */
export function ProductSearchResults({ term, onSelect }: ProductSearchResultsProps) {
  const { results, isUpdating } = useProductSearch(term);

  if (results === null) {
    return (
      <EmptyState
        icon={Search}
        title="Type at least 2 letters"
        description="Search for an item to see what you paid for it across your bills."
      />
    );
  }
  if (results === undefined) return <ProductListSkeleton />;
  if (results.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="No items found in your bills."
        description="Prices appear here after you save bills with that item."
      />
    );
  }
  return <ProductList products={results} onSelect={onSelect} isUpdating={isUpdating} label="Items" />;
}

type ProductListProps = {
  products: ProductResult[];
  onSelect: (productMatchKey: string) => void;
  /** Read by screen readers as the list's name. */
  label: string;
  /** Newer results are loading; the list stays visible but is marked busy. */
  isUpdating?: boolean;
};

/** Products as selectable rows (search results, other variants). */
export function ProductList({ products, onSelect, label, isUpdating = false }: ProductListProps) {
  return (
    <ul
      aria-label={label}
      aria-busy={isUpdating || undefined}
      className={cn(
        "flex flex-col gap-12 transition-opacity duration-fast ease-standard",
        isUpdating && "opacity-60",
      )}
    >
      {products.map((product) => (
        <li key={product.productMatchKey}>
          <ProductRow product={product} onSelect={() => onSelect(product.productMatchKey)} />
        </li>
      ))}
    </ul>
  );
}

function ProductRow({ product, onSelect }: { product: ProductResult; onSelect: () => void }) {
  const details = productDetailsLine(product);
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-12 rounded-lg bg-surface p-16 text-left shadow-card transition-colors duration-fast ease-standard hover:bg-surface-subtle md:p-20"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="truncate type-body-medium">{product.name}</span>
        {details && <span className="truncate type-body-sm text-ink-secondary">{details}</span>}
        <span className="type-caption text-ink-muted">{productSummaryLine(product)}</span>
      </span>
      <ChevronRight aria-hidden className="size-icon-md shrink-0 text-ink-muted" />
    </button>
  );
}

/** "5 records · latest Rs. 560.00 on 12 Oct 2026". */
export function productSummaryLine(product: ProductResult): string {
  const records = product.observationCount === 1 ? "1 record" : `${product.observationCount} records`;
  return `${records} · latest ${formatPaisa(product.latestPricePaisa)} on ${formatTripDate(product.latestTripDate)}`;
}

function ProductListSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-12">
      <span className="sr-only">Searching…</span>
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-bubble w-full rounded-lg" />
      ))}
    </div>
  );
}
