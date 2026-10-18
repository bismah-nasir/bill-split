import type { Metadata } from "next";

import { InvitationsView } from "./_components/invitations-view";

export const metadata: Metadata = { title: "Invitations" };

// App pages render only once AccountGate has loaded the user on the client, so the server
// never renders this segment and instant-navigation validation can't check it.
export const instant = false;

export default function InvitationsPage() {
  return <InvitationsView />;
}
