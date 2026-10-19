"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/ui/money-text";
import { StatTile, StatTileSkeleton } from "@/components/ui/stat-tile";
import {
  createdTotalCaption,
  currentMonth,
  formatMonthLong,
  formatMonthShort,
  shiftMonth,
  yourShareCaption,
} from "@/domain/spending-summary";
import { useSpendingSummary } from "@/lib/db/trips";
import { cn } from "@/lib/utils";

/**
 * The dashboard's monthly figures: **Your share** (what the user owes across every bill they're
 * on) and **Bills you created** (the full totals of their own bills), kept in separate tiles.
 */
export function SpendingSummary() {
  const thisMonth = currentMonth();
  const [month, setMonth] = React.useState(thisMonth);
  const { summary, isUpdating } = useSpendingSummary(month);
  const headingId = React.useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-12">
      <div className="flex items-center justify-between gap-12">
        <h2 id={headingId} className="type-h3">
          Spending
        </h2>
        <MonthSwitcher month={month} latest={thisMonth} onChange={setMonth} />
      </div>
      {summary === undefined ? (
        <div role="status" className="grid gap-12 md:grid-cols-2">
          <span className="sr-only">Loading spending…</span>
          <StatTileSkeleton />
          <StatTileSkeleton />
        </div>
      ) : (
        <div
          aria-busy={isUpdating || undefined}
          className={cn(
            "grid gap-12 transition-opacity duration-fast ease-standard md:grid-cols-2",
            isUpdating && "opacity-60",
          )}
        >
          <StatTile
            label="Your share"
            value={<MoneyText paisa={summary.yourSharePaisa} size="stat" />}
            caption={yourShareCaption(summary.yourShareBillCount, summary.month)}
          />
          <StatTile
            label="Bills you created"
            value={<MoneyText paisa={summary.createdTotalPaisa} size="stat" />}
            caption={createdTotalCaption(summary.createdBillCount, summary.month)}
          />
        </div>
      )}
      <p className="flex gap-8 type-caption text-ink-secondary">
        <Info aria-hidden className="mt-2 size-icon-sm shrink-0" />
        <span>
          Your share is what you owe on every bill you&apos;re on, including bills shared with you.
          Bills you created is the full total of the bills you own, whoever pays.
        </span>
      </p>
    </section>
  );
}

type MonthSwitcherProps = {
  month: string;
  /** The newest month that can be shown (the current one). */
  latest: string;
  onChange: (month: string) => void;
};

/** ‹ Oct 2026 ›, with the months after `latest` unavailable. */
function MonthSwitcher({ month, latest, onChange }: MonthSwitcherProps) {
  return (
    <div className="flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Previous month"
        onClick={() => onChange(shiftMonth(month, -1))}
      >
        <ChevronLeft aria-hidden className="size-icon-lg" />
      </Button>
      <p aria-live="polite" className="type-body-medium whitespace-nowrap text-ink">
        <span aria-hidden>{formatMonthShort(month)}</span>
        <span className="sr-only">{formatMonthLong(month)}</span>
      </p>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Next month"
        disabled={month >= latest}
        onClick={() => onChange(shiftMonth(month, 1))}
      >
        <ChevronRight aria-hidden className="size-icon-lg" />
      </Button>
    </div>
  );
}
