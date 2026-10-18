import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MoneyText } from "@/components/ui/money-text";
import { formatPaisa } from "@/domain/format";

import type { BillView, BillViewItem } from "./bill-view";
import { ParticipantShares } from "./participant-shares";

/** A bill's items, total and per-person shares: the review before saving, and the bill page. */
export function TripSummary({ bill }: { bill: BillView }) {
  const headingId = React.useId();
  return (
    <div className="flex flex-col gap-24">
      <section aria-labelledby={headingId} className="flex flex-col gap-12">
        <h2 id={headingId} className="type-h3">
          Items
        </h2>
        <Card className="flex flex-col p-0">
          <ul className="flex flex-col divide-y divide-line">
            {bill.items.map((item) => (
              <SummaryItem key={item.key} item={item} />
            ))}
          </ul>
          <div className="flex items-baseline justify-between gap-12 rounded-b-lg border-t border-line-strong bg-surface-subtle px-16 py-16">
            <span className="type-body-medium">Total</span>
            <MoneyText paisa={bill.totalPaisa} size="h3" />
          </div>
        </Card>
      </section>
      <ParticipantShares shares={bill.shares} reconciled={bill.reconciled} />
    </div>
  );
}

function SummaryItem({ item }: { item: BillViewItem }) {
  return (
    <li className="flex flex-col gap-4 px-16 py-12">
      <div className="flex items-baseline justify-between gap-12">
        <p className="min-w-0 type-body-medium break-words">{item.name}</p>
        <MoneyText paisa={item.lineTotalPaisa} className="font-semibold" />
      </div>
      {item.details && <p className="type-caption text-ink-muted">{item.details}</p>}
      <p className="flex flex-wrap items-center gap-8 type-body-sm text-ink-secondary">
        <span className="font-numeric tabular-nums">
          {item.quantityLabel} × {formatPaisa(item.unitPricePaisa)}
        </span>
        {item.unitPricePaisa === 0 && <Badge variant="success">Free</Badge>}
      </p>
      <p className="type-caption text-ink-muted">{payersLine(item.assignees)}</p>
    </li>
  );
}

/** "Paid by you", or "Split 3 ways: You Rs. 1,666.67 · Ben Rs. 1,666.67 · …". */
function payersLine(assignees: BillViewItem["assignees"]): string {
  if (assignees.length === 1) {
    const [payer] = assignees;
    return payer.label === "You" ? "Paid by you" : `Paid by ${payer.label}`;
  }
  const amounts = assignees.map((assignee) => `${assignee.label} ${formatPaisa(assignee.amountPaisa)}`);
  return `Split ${assignees.length} ways: ${amounts.join(" · ")}`;
}
