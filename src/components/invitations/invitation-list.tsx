"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Inbox, Send } from "lucide-react";

import { tripMetaLine } from "@/components/trips/trip-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/loading-state";
import { useToast } from "@/components/ui/toast";
import { invitationStatusLabel } from "@/domain/invitations";
import type { InvitationReceived, InvitationSent } from "@/domain/types";
import {
  useCancelInvitation,
  useReceivedInvitations,
  useRespondToInvitation,
  useSentInvitations,
} from "@/lib/db/invitations";

import { cancelInvitationCopy } from "./invitation-copy";

/** Invitations waiting for the user, each with **Accept** / **Decline**. */
export function ReceivedInvitations() {
  const invitations = useReceivedInvitations();
  const router = useRouter();
  const showToast = useToast();
  const { respond } = useRespondToInvitation();
  const [respondingId, setRespondingId] = React.useState<string | null>(null);

  async function answer(invitation: InvitationReceived, accept: boolean) {
    setRespondingId(invitation.invitationId);
    const result = await respond(invitation.invitationId, accept);
    if (!result.ok) {
      setRespondingId(null);
      // The list is live, so an invitation that's no longer available drops out by itself.
      showToast(result.error.message, "error");
      return;
    }
    if (accept && result.tripId) {
      router.push(`/trips/${result.tripId}`);
      return;
    }
    setRespondingId(null);
    showToast("Invitation declined", "info");
  }

  if (invitations === undefined) return <ListSkeleton label="Loading invitations…" />;
  if (invitations.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No pending invitations"
        description="When someone connects you to a bill, it shows up here."
      />
    );
  }
  return (
    <ul className="flex flex-col gap-12">
      {invitations.map((invitation) => {
        const isResponding = respondingId === invitation.invitationId;
        return (
          <li key={invitation.invitationId}>
            <Card className="flex flex-col gap-12 p-16 md:p-20">
              <div className="flex flex-col gap-4">
                <p className="type-body">
                  @{invitation.ownerUsername} invited you to <strong>{invitation.tripTitle}</strong> as{" "}
                  <strong>{invitation.personName}</strong>
                </p>
                <p className="type-body-sm text-ink-secondary">
                  {tripMetaLine(invitation.storeName, invitation.tripDate)}
                </p>
              </div>
              <div className="flex gap-8">
                <Button
                  size="sm"
                  disabled={respondingId !== null}
                  onClick={() => void answer(invitation, true)}
                >
                  {isResponding ? "Accepting…" : "Accept"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={respondingId !== null}
                  onClick={() => void answer(invitation, false)}
                >
                  Decline
                </Button>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

const STATUS_VARIANTS = { pending: "warning", accepted: "success", declined: "neutral" } as const;

/** Invitations the user sent, with their status; pending ones can be cancelled. */
export function SentInvitations() {
  const invitations = useSentInvitations();
  const { cancel, isCancelling } = useCancelInvitation();
  const [cancelling, setCancelling] = React.useState<InvitationSent | null>(null);
  const [cancelError, setCancelError] = React.useState<string | null>(null);

  // A dialog left open shouldn't greet the user on their next visit.
  React.useLayoutEffect(() => () => setCancelling(null), []);

  async function confirmCancel() {
    if (cancelling === null) return;
    const result = await cancel(cancelling.invitationId);
    if (!result.ok) {
      setCancelError(result.error.message);
      return;
    }
    setCancelling(null);
  }

  if (invitations === undefined) return <ListSkeleton label="Loading invitations…" />;
  if (invitations.length === 0) {
    return (
      <EmptyState
        icon={Send}
        title="You haven't invited anyone yet"
        description="Open one of your bills and invite the people on it."
      />
    );
  }
  return (
    <>
      <ul className="flex flex-col gap-12">
        {invitations.map((invitation) => (
          <li key={invitation.invitationId}>
            <Card className="flex flex-wrap items-center gap-12 p-16 md:p-20">
              <div className="flex min-w-0 flex-1 flex-col gap-4">
                <p className="type-body">
                  @{invitation.username} as <strong>{invitation.personName}</strong>
                </p>
                <Link
                  href={`/trips/${invitation.tripId}`}
                  className="w-fit type-body-sm text-primary underline-offset-4 hover:underline"
                >
                  {invitation.tripTitle}
                </Link>
              </div>
              <Badge variant={STATUS_VARIANTS[invitation.status]}>{invitationStatusLabel(invitation.status)}</Badge>
              {invitation.status === "pending" && (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Cancel the invitation to @${invitation.username}`}
                  onClick={() => {
                    setCancelError(null);
                    setCancelling(invitation);
                  }}
                >
                  Cancel
                </Button>
              )}
            </Card>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={cancelling !== null}
        onOpenChange={(open) => {
          if (!open) setCancelling(null);
        }}
        {...cancelInvitationCopy(cancelling?.username ?? "")}
        variant="danger"
        isPending={isCancelling}
        error={cancelError}
        onConfirm={() => void confirmCancel()}
      />
    </>
  );
}

function ListSkeleton({ label }: { label: string }) {
  return (
    <div role="status" className="flex flex-col gap-12">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-bubble w-full rounded-lg" />
      <Skeleton className="h-bubble w-full rounded-lg" />
    </div>
  );
}
