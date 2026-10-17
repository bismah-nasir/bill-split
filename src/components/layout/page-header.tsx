import * as React from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Page-level actions, e.g. a "New bill" button. */
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-16 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <h1 className="type-h1 break-words">{title}</h1>
        {description && <p className="type-body-sm text-ink-secondary">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-8">{actions}</div>}
    </header>
  );
}
