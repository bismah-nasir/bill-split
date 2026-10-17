import { AccountGate } from "@/components/layout/account-gate";
import { AppShell } from "@/components/layout/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AccountGate>
      <AppShell>{children}</AppShell>
    </AccountGate>
  );
}
