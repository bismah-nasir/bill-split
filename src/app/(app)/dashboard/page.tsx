import type { Metadata } from "next";

import { DashboardView } from "./_components/dashboard-view";

export const metadata: Metadata = { title: "Home" };

// App pages render only once AccountGate has loaded the user on the client, so the server
// never renders this segment and instant-navigation validation can't check it.
export const instant = false;

export default function DashboardPage() {
  return <DashboardView />;
}
