"use client";

import { useQuery } from "convex/react";
import { useCallback } from "react";

import type { InviteVia } from "@/domain/invitations";
import type { InvitationReceived, InvitationSent } from "@/domain/types";

import { api } from "../../../convex/_generated/api";
import type { AppError } from "./errors";
import { useAppMutation } from "./use-app-mutation";

type Outcome<T = object> = ({ ok: true } & T) | { ok: false; error: AppError };

export type InviteInput = {
  tripId: string;
  /** Exactly one of `personId` (someone already on the bill) and `newPersonName`. */
  target: { personId: string } | { newPersonName: string };
  via: InviteVia;
  identifier: string;
};

/** Invites an account to be linked to one person on the bill (owner only). */
export function useInvite() {
  const { run, isPending } = useAppMutation(api.invitations.invite);
  const invite = useCallback(
    async ({ tripId, target, via, identifier }: InviteInput): Promise<Outcome<{ username: string }>> => {
      const result = await run({ tripId, via, identifier, ...target });
      return result.ok ? { ok: true, username: result.value.username } : result;
    },
    [run],
  );
  return { invite, isInviting: isPending };
}

/** The user's pending invitations; `undefined` while loading. */
export function useReceivedInvitations(): InvitationReceived[] | undefined {
  return useQuery(api.invitations.listReceived);
}

/** How many invitations wait for the user (capped at 51, shown as "50+"); `undefined` while loading. */
export function usePendingInvitationCount(): number | undefined {
  return useQuery(api.invitations.pendingCount);
}

/** Invitations the user sent; `undefined` while loading. */
export function useSentInvitations(): InvitationSent[] | undefined {
  return useQuery(api.invitations.listSent);
}

/** Accepts (resolving to the bill's ID) or declines an invitation. */
export function useRespondToInvitation() {
  const { run, isPending } = useAppMutation(api.invitations.respond);
  const respond = useCallback(
    async (invitationId: string, accept: boolean): Promise<Outcome<{ tripId: string | null }>> => {
      const result = await run({ invitationId, accept });
      return result.ok ? { ok: true, tripId: result.value.tripId } : result;
    },
    [run],
  );
  return { respond, isResponding: isPending };
}

/** Withdraws a pending invitation (owner only). */
export function useCancelInvitation() {
  const { run, isPending } = useAppMutation(api.invitations.cancel);
  const cancel = useCallback(
    async (invitationId: string): Promise<Outcome> => {
      const result = await run({ invitationId });
      return result.ok ? { ok: true } : result;
    },
    [run],
  );
  return { cancel, isCancelling: isPending };
}

/** Disconnects a linked person from their account; they stay on the bill (owner only). */
export function useUnlinkPerson() {
  const { run, isPending } = useAppMutation(api.invitations.unlink);
  const unlink = useCallback(
    async (personId: string): Promise<Outcome> => {
      const result = await run({ personId });
      return result.ok ? { ok: true } : result;
    },
    [run],
  );
  return { unlink, isUnlinking: isPending };
}
