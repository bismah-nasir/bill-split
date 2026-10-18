/**
 * Rules for invitations, which connect one person on a bill to one account. Used by the invite
 * dialog and by Convex. An account is found only by an exact match on a normalized username or
 * email: never by a person's name, and never by a partial match.
 */
import { isValidEmail, isValidUsername, normalizeEmail, normalizeUsername } from "./normalization";

export type InviteVia = "username" | "email";

export type InvitationStatus = "pending" | "accepted" | "declined" | "cancelled" | "unlinked";

/**
 * The value to look an account up by, or `null` when the identifier can't belong to any
 * account. A malformed identifier is treated like an unknown one, so the reply never hints
 * at the format.
 */
export function normalizeInviteIdentifier(via: InviteVia, identifier: string): string | null {
  if (via === "username") {
    // A leading "@" is how usernames are shown, so people may type it.
    const username = normalizeUsername(identifier.trim().replace(/^@/, ""));
    return isValidUsername(username) ? username : null;
  }
  const email = normalizeEmail(identifier);
  return isValidEmail(email) ? email : null;
}

/** The one reply for every identifier that doesn't match an account with a username. */
export function noMatchMessage(via: InviteVia): string {
  return `No account matches that ${via}. Ask your friend to sign up and finish setting up their account.`;
}

export const INVITE_MESSAGES = {
  self: "You can't invite yourself",
  alreadyPending: "Already invited",
  alreadyParticipant: "Already on this bill",
  personLinked: (name: string) => `${name} is already connected to an account`,
  notAvailable: "This invitation is no longer available.",
  notLinked: "This person isn't connected to an account.",
} as const;

/** "Pending", "Accepted", … as shown on Invitations → Sent. */
export function invitationStatusLabel(status: InvitationStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
