import * as React from "react";

import { Skeleton } from "@/components/ui/loading-state";
import { cn } from "@/lib/utils";

type StatTileProps = {
  label: string;
  /** The figure itself, e.g. a `MoneyText` with `size="stat"`. */
  value: React.ReactNode;
  /** What the figure covers, e.g. "Your portion of 3 bills dated in October". */
  caption: string;
  className?: string;
};

/** One headline figure with its label and a caption saying exactly what it counts. */
export function StatTile({ label, value, caption, className }: StatTileProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-4 rounded-lg bg-surface p-20 shadow-card", className)}>
      <p className="type-body-medium text-ink-secondary">{label}</p>
      <p className="text-ink">{value}</p>
      <p className="type-caption text-ink-muted">{caption}</p>
    </div>
  );
}

/** Placeholder with a `StatTile`'s shape, so the layout doesn't jump when the figure loads. */
export function StatTileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-8 rounded-lg bg-surface p-20 shadow-card", className)}>
      <Skeleton className="h-icon-xl w-1/3" />
      <Skeleton className="h-control-md w-2/3" />
      <Skeleton className="h-icon-md w-3/4" />
    </div>
  );
}
