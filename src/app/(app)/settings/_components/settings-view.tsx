"use client";

import { LogOut } from "lucide-react";

import { useAccount } from "@/components/layout/account-gate";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { NameSetting } from "./name-setting";
import { SettingRow } from "./setting-row";
import { UsernameSetting } from "./username-setting";

export function SettingsView() {
  const { user, signOut } = useAccount();

  return (
    <div className="flex flex-col gap-24">
      <PageHeader title="Settings" />

      <Card className="flex flex-col divide-y divide-line py-4 *:py-20">
        <NameSetting />
        <UsernameSetting />
        <SettingRow title="Email" badge={<Badge>Read-only</Badge>} value={user.email}>
          <div className="flex flex-col gap-4 type-body-sm text-ink-secondary">
            <p>Your email can&apos;t be changed in this version.</p>
            <p>
              Friends can invite you by username or email. Your name and email are never shown to
              other users.
            </p>
          </div>
        </SettingRow>
      </Card>

      <Button variant="danger-soft" className="self-start" onClick={() => void signOut()}>
        <LogOut aria-hidden className="size-icon-md" />
        Sign out
      </Button>
    </div>
  );
}
