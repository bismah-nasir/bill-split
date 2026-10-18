/** Confirmation text for cancelling a pending invitation, wherever the owner does it. */
export function cancelInvitationCopy(username: string) {
  return {
    title: `Cancel the invitation to @${username}?`,
    description: "They won't be able to accept it. You can invite them again later.",
    confirmLabel: "Cancel invitation",
    pendingLabel: "Cancelling…",
    cancelLabel: "Keep invitation",
  };
}
