import { ArrowDown, ArrowUp, CircleDot, Equal, type LucideIcon } from "lucide-react";

import { formatPaisa, formatPercent } from "@/domain/format";
import type { PriceChange as PriceChangeData } from "@/domain/price-change";
import { cn } from "@/lib/utils";

type ChangeLook = { icon: LucideIcon; className: string; srPrefix?: string; text: string };

function changeLook(change: PriceChangeData): ChangeLook {
  switch (change.kind) {
    case "first":
      return { icon: CircleDot, className: "text-ink-muted", text: "First record" };
    case "unchanged":
      return { icon: Equal, className: "text-ink-secondary", text: "Unchanged" };
    case "up":
    case "down": {
      const amount = formatPaisa(Math.abs(change.diffPaisa));
      const percent = change.percent === null ? "" : ` (${formatPercent(change.percent)})`;
      return change.kind === "up"
        ? { icon: ArrowUp, className: "text-error", srPrefix: "Up ", text: `${amount}${percent}` }
        : { icon: ArrowDown, className: "text-success", srPrefix: "Down ", text: `${amount}${percent}` };
    }
  }
}

/** The change from the previous price, as an icon plus text, never colour alone. */
export function PriceChange({ change, className }: { change: PriceChangeData; className?: string }) {
  const { icon: Icon, className: tone, srPrefix, text } = changeLook(change);
  return (
    <span className={cn("inline-flex items-center gap-4 type-body-sm whitespace-nowrap", tone, className)}>
      <Icon aria-hidden className="size-icon-md shrink-0" />
      {srPrefix && <span className="sr-only">{srPrefix}</span>}
      <span className="tabular-nums">{text}</span>
    </span>
  );
}
