"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cancelInvitationCopy } from "@/components/invitations/invitation-copy";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { personLabel } from "@/domain/people";
import type { BillPerson } from "@/domain/types";
import { useCancelInvitation, useUnlinkPerson } from "@/lib/db/invitations";

import { InviteDialog } from "./invite-dialog";

type PeopleListProps = {
  tripId: string;
  /** Bill order. */
  people: BillPerson[];
  /** Only the owner sees link states and actions. */
  isOwner: boolean;
};

type PendingAction =
  | { kind: "cancel"; invitationId: string; username: string }
  | { kind: "unlink"; personId: string; name: string; username: string };

/**
 * Everyone on a saved bill. The owner also sees whether each person is connected to an
 * account, and can invite, cancel a pending invitation or unlink; none of it changes the split.
 */
export function PeopleList({ tripId, people, isOwner }: PeopleListProps) {
  const headingId = React.useId();
  const [inviteFor, setInviteFor] = React.useState<{ personId?: string } | null>(null);
  const [pending, setPending] = React.useState<PendingAction | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const { cancel, isCancelling } = useCancelInvitation();
  const { unlink, isUnlinking } = useUnlinkPerson();

  // Dialogs left open shouldn't greet the user on their next visit.
  React.useLayoutEffect(
    () => () => {
      setInviteFor(null);
      setPending(null);
    },
    [],
  );

  function confirmAction(action: PendingAction) {
    setActionError(null);
    setPending(action);
  }

  async function runPending() {
    if (pending === null) return;
    const result = pending.kind === "cancel" ? await cancel(pending.invitationId) : await unlink(pending.personId);
    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }
    setPending(null);
  }

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-12">
      <div className="flex items-center justify-between gap-12">
        <h2 id={headingId} className="type-h3">
          People
        </h2>
        {isOwner && (
          <Button variant="secondary" size="sm" onClick={() => setInviteFor({})}>
            <UserPlus aria-hidden className="size-icon-md" />
            Invite
          </Button>
        )}
      </div>

      <Card className="p-0">
        <ul className="flex flex-col divide-y divide-line">
          {people.map((person) => (
            <li key={person.personId} className="flex flex-wrap items-center gap-x-12 gap-y-8 px-16 py-12 md:px-24">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-8">
                <span className="min-w-0 truncate type-body-medium">{personLabel(person, null)}</span>
                {person.isOwner && <Badge>Owner</Badge>}
                {person.isViewer && <Badge variant="primary">You</Badge>}
                {isOwner && <LinkBadge person={person} />}
              </div>
              {isOwner && !person.isOwner && (
                <PersonAction
                  person={person}
                  onInvite={() => setInviteFor({ personId: person.personId })}
                  onConfirm={confirmAction}
                />
              )}
            </li>
          ))}
        </ul>
      </Card>

      {isOwner && (
        <>
          <InviteDialog
            open={inviteFor !== null}
            onOpenChange={(open) => {
              if (!open) setInviteFor(null);
            }}
            tripId={tripId}
            people={people}
            personId={inviteFor?.personId}
          />
          <ConfirmDialog
            open={pending !== null}
            onOpenChange={(open) => {
              if (!open) setPending(null);
            }}
            {...confirmCopy(pending)}
            variant="danger"
            isPending={isCancelling || isUnlinking}
            error={actionError}
            onConfirm={() => void runPending()}
          />
        </>
      )}
    </section>
  );
}

function LinkBadge({ person }: { person: BillPerson }) {
  switch (person.link?.state) {
    case "pending":
      return <Badge variant="warning">Invited @{person.link.username}</Badge>;
    case "declined":
      return <Badge>Declined</Badge>;
    default:
      return null;
  }
}

type PersonActionProps = {
  person: BillPerson;
  onInvite: () => void;
  onConfirm: (action: PendingAction) => void;
};

function PersonAction({ person, onInvite, onConfirm }: PersonActionProps) {
  const name = person.name ?? "";
  const link = person.link;
  if (link === null) return null;

  if (link.state === "pending") {
    return (
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Cancel the invitation to @${link.username}`}
        onClick={() => onConfirm({ kind: "cancel", invitationId: link.invitationId, username: link.username })}
      >
        Cancel
      </Button>
    );
  }
  if (link.state === "linked") {
    return (
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Unlink ${name}`}
        onClick={() =>
          onConfirm({ kind: "unlink", personId: person.personId, name, username: person.username ?? "" })
        }
      >
        Unlink
      </Button>
    );
  }
  return (
    <Button variant="secondary" size="sm" aria-label={`Invite ${name}`} onClick={onInvite}>
      Invite
    </Button>
  );
}

function confirmCopy(action: PendingAction | null) {
  if (action?.kind === "unlink") {
    return {
      title: `Unlink @${action.username} from ${action.name}?`,
      description: `They'll lose access to this bill. ${action.name} stays on the bill and the shares don't change.`,
      confirmLabel: "Unlink",
      pendingLabel: "Unlinking…",
    };
  }
  return cancelInvitationCopy(action?.username ?? "");
}
