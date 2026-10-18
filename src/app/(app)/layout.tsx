import { AccountGate } from "@/components/layout/account-gate";
import { AppShell } from "@/components/layout/app-shell";
import { ToastProvider } from "@/components/ui/toast";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AccountGate>
      <ToastProvider>
        <AppShell>{children}</AppShell>
      </ToastProvider>
    </AccountGate>
  );
}
