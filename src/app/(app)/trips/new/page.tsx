import type { Metadata } from "next";

import { NewTripView } from "./_components/new-trip-view";

export const metadata: Metadata = { title: "New bill" };

// App pages render only once AccountGate has loaded the user on the client, so the server
// never renders this segment and instant-navigation validation can't check it.
export const instant = false;

export default function NewTripPage() {
  return <NewTripView />;
}
