"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Plus, ReceiptText, SearchX } from "lucide-react";

import { BillHistoryFilters } from "@/components/bills/bill-history-filters";
import { PageHeader } from "@/components/layout/page-header";
import { TripCardList, TripCardListSkeleton } from "@/components/trips/trip-card-list";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DEFAULT_HISTORY_FILTERS,
  formatBillCount,
  HISTORY_PAGE_SIZE,
  historyFiltersToQuery,
  MAX_HISTORY_LIMIT,
  parseHistoryParams,
  type HistoryFilters,
} from "@/domain/bill-history";
import { useBillHistory } from "@/lib/db/trips";

export function BillHistoryView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // The URL is the source of truth, so reloads and back navigation keep the filters.
  const filters = React.useMemo(() => parseHistoryParams(searchParams), [searchParams]);
  const query = historyFiltersToQuery(filters);

  // "Load more" grows the page; any change of filters starts again from the first page.
  const [paging, setPaging] = React.useState({ query, limit: HISTORY_PAGE_SIZE });
  const limit = paging.query === query ? paging.limit : HISTORY_PAGE_SIZE;
  const { page, isUpdating } = useBillHistory(filters, limit);

  const applyFilters = (patch: Partial<HistoryFilters>) => {
    // Merge into the URL as it is now: `useSearchParams` can be a render behind the last
    // change, so two quick changes (From, then To) would otherwise drop the first.
    const current = parseHistoryParams(new URLSearchParams(window.location.search));
    const nextQuery = historyFiltersToQuery({ ...current, ...patch });
    if (nextQuery === historyFiltersToQuery(current)) return;
    // The native history API updates `useSearchParams` without a server navigation (Next.js
    // integrates it into the router), so filters apply at once and don't refetch the page.
    window.history.replaceState(null, "", nextQuery ? `${pathname}?${nextQuery}` : pathname);
  };
  const clearFilters = () => applyFilters(DEFAULT_HISTORY_FILTERS);
  const loadMore = () =>
    setPaging({ query, limit: Math.min(limit + HISTORY_PAGE_SIZE, MAX_HISTORY_LIMIT) });

  const hasNoBills = page !== undefined && page.totalAccessible === 0;

  return (
    <div className="flex flex-col gap-24">
      <PageHeader
        title="Bills"
        actions={
          <Button asChild size="lg">
            <Link href="/trips/new">
              <Plus aria-hidden className="size-icon-md" />
              New bill
            </Link>
          </Button>
        }
      />

      {page === undefined ? (
        <TripCardListSkeleton count={3} />
      ) : hasNoBills ? (
        <EmptyState
          icon={ReceiptText}
          title="No bills yet"
          description="Bills you create or that are shared with you will show up here."
          action={
            <Button asChild>
              <Link href="/trips/new">New bill</Link>
            </Button>
          }
        />
      ) : (
        <>
          <BillHistoryFilters filters={filters} onChange={applyFilters} onClear={clearFilters} />
          <section aria-label="Results" className="flex flex-col gap-12">
            <p aria-live="polite" className="type-body-sm text-ink-secondary">
              {formatBillCount(page.totalMatches)}
            </p>
            {page.trips.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No bills match your search"
                description="Try other words or fewer filters."
                action={
                  <Button type="button" variant="secondary" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <TripCardList trips={page.trips} isUpdating={isUpdating} />
            )}
            {page.hasMore &&
              (limit < MAX_HISTORY_LIMIT ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={loadMore}
                  disabled={isUpdating}
                  className="self-center"
                >
                  {isUpdating ? "Loading…" : "Load more"}
                </Button>
              ) : (
                <p className="text-center type-caption text-ink-muted">
                  Showing the first {MAX_HISTORY_LIMIT} bills. Search or filter to find the others.
                </p>
              ))}
          </section>
        </>
      )}
    </div>
  );
}
