import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** At most one primary action, e.g. a "New bill" button. */
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-12 rounded-lg border border-line bg-surface px-24 py-40 text-center",
        className,
      )}
    >
      <span className="flex size-bubble items-center justify-center rounded-pill bg-primary-soft text-primary">
        <Icon aria-hidden className="size-icon-xxl" />
      </span>
      <p className="type-body-medium">{title}</p>
      {description && <p className="type-body-sm text-ink-secondary">{description}</p>}
      {action && <div className="pt-4">{action}</div>}
    </div>
  );
}
