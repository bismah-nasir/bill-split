"use client";

import { cn } from "@/lib/utils";
import { usePendingInvitationCount } from "@/lib/db/invitations";

type PendingInvitationsBadgeProps = {
  className?: string;
  /**
   * Leaves out the screen-reader text, for a badge drawn before its label (e.g. on an icon);
   * place `PendingInvitationsText` after the label instead.
   */
  decorative?: boolean;
};

/** The number of invitations waiting for the user ("50+" past 50); nothing when there are none. */
export function PendingInvitationsBadge({ className, decorative }: PendingInvitationsBadgeProps) {
  const label = usePendingLabel();
  if (label === null) return null;
  return (
    <span
      className={cn(
        "inline-flex h-icon-xl min-w-icon-xl items-center justify-center rounded-pill bg-primary px-4 type-caption font-semibold text-ink-inverse",
        className,
      )}
    >
      <span aria-hidden>{label}</span>
      {!decorative && <PendingInvitationsText />}
    </span>
  );
}

/** ", 3 pending" for screen readers only, read after the label it belongs to. */
export function PendingInvitationsText() {
  const label = usePendingLabel();
  if (label === null) return null;
  return <span className="sr-only">, {label} pending</span>;
}

function usePendingLabel(): string | null {
  const count = usePendingInvitationCount();
  if (!count) return null;
  return count > 50 ? "50+" : String(count);
}
