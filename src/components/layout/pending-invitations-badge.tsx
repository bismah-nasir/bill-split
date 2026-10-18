"use client";

import { cn } from "@/lib/utils";
import { usePendingInvitationCount } from "@/lib/db/invitations";

/** The number of invitations waiting for the user ("50+" past 50); nothing when there are none. */
export function PendingInvitationsBadge({ className }: { className?: string }) {
  const count = usePendingInvitationCount();
  if (!count) return null;
  const label = count > 50 ? "50+" : String(count);
  return (
    <span
      className={cn(
        "inline-flex h-icon-xl min-w-icon-xl items-center justify-center rounded-pill bg-primary px-4 type-caption font-semibold text-ink-inverse",
        className,
      )}
    >
      <span aria-hidden>{label}</span>
      <span className="sr-only">, {label} pending</span>
    </span>
  );
}
