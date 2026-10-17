import type { Metadata } from "next";

import { SettingsView } from "./_components/settings-view";

export const metadata: Metadata = { title: "Settings" };

// App pages render only once AccountGate has loaded the user on the client, so the server
// never renders this segment and instant-navigation validation can't check it.
export const instant = false;

export default function SettingsPage() {
  return <SettingsView />;
}
