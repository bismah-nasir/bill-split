import * as React from "react";

import { Card } from "@/components/ui/card";
import { MoneyText } from "@/components/ui/money-text";

import { ReconciliationBadge } from "./participant-shares";

export type SplitSummaryLine = { key: string; label: string; totalPaisa: number };

type SplitSummaryProps = {
  title: string;
  /** "Imtiaz · 16 Oct 2026". */
  meta: string;
  /** E.g. the category and ownership badges. */
  badges?: React.ReactNode;
  totalPaisa: number;
  /** One per person, in bill order. */
  lines: SplitSummaryLine[];
  reconciled: boolean;
};

/**
 * The top of a saved bill: who owes what at a glance. It's sized so that, with up to 8 people,
 * one 360 × 640 phone screenshot captures it for sending in any chat app; so it has no buttons,
 * and it holds the page's heading.
 */
export function SplitSummary({ title, meta, badges, totalPaisa, lines, reconciled }: SplitSummaryProps) {
  const peopleHeadingId = React.useId();

  return (
    <Card className="flex flex-col gap-12 p-16 md:p-24">
      <div className="flex flex-col gap-4">
        <h1 className="type-h1 break-words">{title}</h1>
        <p className="type-body-sm text-ink-secondary">{meta}</p>
        {badges && <div className="flex flex-wrap items-center gap-8 pt-4">{badges}</div>}
      </div>

      <div className="flex items-baseline justify-between gap-12 border-y border-line py-12">
        <span className="type-body-medium">Total</span>
        <MoneyText paisa={totalPaisa} size="h3" />
      </div>

      <h2 id={peopleHeadingId} className="sr-only">
        Each person&apos;s share
      </h2>
      <ul aria-labelledby={peopleHeadingId} className="flex flex-col gap-4">
        {lines.map((line) => (
          <li key={line.key} className="flex items-baseline justify-between gap-12 type-body-sm">
            <span className="min-w-0 truncate text-ink">{line.label}</span>
            <MoneyText paisa={line.totalPaisa} size="sm" className="font-semibold" />
          </li>
        ))}
      </ul>

      <ReconciliationBadge reconciled={reconciled} />
    </Card>
  );
}
