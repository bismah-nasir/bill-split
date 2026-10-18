"use client";

import { ReceivedInvitations, SentInvitations } from "@/components/invitations/invitation-list";
import { PageHeader } from "@/components/layout/page-header";
import { PendingInvitationsBadge } from "@/components/layout/pending-invitations-badge";
import { Tabs } from "@/components/ui/tabs";

export function InvitationsView() {
  return (
    <div className="flex flex-col gap-24">
      <PageHeader title="Invitations" />
      <Tabs
        label="Invitations"
        defaultValue="received"
        items={[
          {
            value: "received",
            label: "Received",
            badge: <PendingInvitationsBadge />,
            content: <ReceivedInvitations />,
          },
          { value: "sent", label: "Sent", content: <SentInvitations /> },
        ]}
      />
    </div>
  );
}
