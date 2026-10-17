import * as React from "react";

import { cn } from "@/lib/utils";

/** A grey placeholder block; size it with `className`. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("rounded-sm bg-surface-muted motion-safe:animate-pulse", className)}
      {...props}
    />
  );
}

type LoadingStateProps = {
  /** Fill the viewport, for whole-page loads such as the account check. */
  fullPage?: boolean;
  /** Read by screen readers instead of the skeleton. */
  label?: string;
  className?: string;
};

/** Skeleton stand-in for a heading and a card while data loads. */
export function LoadingState({ fullPage = false, label = "Loading…", className }: LoadingStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex w-full flex-col gap-16",
        fullPage && "mx-auto min-h-dvh max-w-content justify-center px-16 md:px-24",
        className,
      )}
    >
      <span className="sr-only">{label}</span>
      <Skeleton className="h-control-sm w-1/2" />
      <Skeleton className="h-control-lg w-full" />
      <Skeleton className="h-control-lg w-full" />
    </div>
  );
}
