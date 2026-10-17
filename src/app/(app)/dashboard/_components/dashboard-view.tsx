"use client";

import { ReceiptText } from "lucide-react";

import { useAccount } from "@/components/layout/account-gate";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export function DashboardView() {
  const { user } = useAccount();

  return (
    <div className="flex flex-col gap-24">
      <PageHeader title={`Hi, ${user.name}`} />
      <EmptyState icon={ReceiptText} title="Your bills will appear here." />
    </div>
  );
}
