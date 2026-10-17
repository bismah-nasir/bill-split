import * as React from "react";
import { CircleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "./button";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  /** Replaces the default "Try again" button, e.g. a link back to the dashboard. */
  action?: React.ReactNode;
  className?: string;
};

/** Friendly failure message for a data view. Never shows technical details. */
export function ErrorState({
  title = "Something went wrong",
  description = "Please try again. If it keeps happening, reload the page.",
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-12 rounded-lg border border-line bg-surface px-24 py-40 text-center",
        className,
      )}
    >
      <span className="flex size-bubble items-center justify-center rounded-pill bg-error-soft text-error">
        <CircleAlert aria-hidden className="size-icon-xxl" />
      </span>
      <p className="type-body-medium">{title}</p>
      <p className="type-body-sm text-ink-secondary">{description}</p>
      <div className="pt-4">
        {action ??
          (onRetry && (
            <Button variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          ))}
      </div>
    </div>
  );
}
