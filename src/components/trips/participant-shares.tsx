"use client";

import * as React from "react";
import { ChevronDown, CircleAlert, CircleCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MoneyText } from "@/components/ui/money-text";
import { cn } from "@/lib/utils";

import type { BillViewShare } from "./bill-view";

type ParticipantSharesProps = { shares: BillViewShare[]; reconciled: boolean };

/** Each person's total, expandable to the items that make it up, and the reconciliation check. */
export function ParticipantShares({ shares, reconciled }: ParticipantSharesProps) {
  const headingId = React.useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-12">
      <h2 id={headingId} className="type-h3">
        Shares
      </h2>
      <Card className="flex flex-col divide-y divide-line p-0">
        {shares.map((share) => (
          <ShareRow key={share.key} share={share} />
        ))}
      </Card>
      <ReconciliationBadge reconciled={reconciled} />
    </section>
  );
}

function ShareRow({ share }: { share: BillViewShare }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const listId = React.useId();

  return (
    <div>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={() => setIsOpen((open) => !open)}
        className="flex min-h-tap w-full items-center justify-between gap-12 rounded-lg px-16 py-12 text-left transition-colors duration-fast ease-standard hover:bg-surface-subtle"
      >
        <span className="min-w-0 truncate type-body-medium">{share.label}</span>
        <span className="flex shrink-0 items-center gap-8">
          <MoneyText paisa={share.totalPaisa} className="font-semibold" />
          <ChevronDown
            aria-hidden
            className={cn("size-icon-md text-ink-secondary", isOpen && "rotate-180")}
          />
        </span>
      </button>
      {isOpen && (
        <ul id={listId} className="flex flex-col gap-6 px-16 pb-12">
          {share.items.length === 0 && (
            <li className="type-body-sm text-ink-muted">No items</li>
          )}
          {share.items.map((item) => (
            <li key={item.key} className="flex items-baseline justify-between gap-12 type-body-sm">
              <span className="min-w-0 break-words text-ink-secondary">
                {item.name}
                {item.splitCount > 1 && (
                  <span className="text-ink-muted"> (split {item.splitCount} ways)</span>
                )}
              </span>
              <MoneyText paisa={item.amountPaisa} size="sm" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReconciliationBadge({ reconciled }: { reconciled: boolean }) {
  if (reconciled) {
    return (
      <Badge variant="success" className="self-start">
        <CircleCheck aria-hidden className="size-icon-sm" />
        Shares add up to the bill total
      </Badge>
    );
  }
  return (
    <Badge variant="error" role="alert" className="self-start">
      <CircleAlert aria-hidden className="size-icon-sm" />
      Shares don&apos;t add up to the bill total
    </Badge>
  );
}
