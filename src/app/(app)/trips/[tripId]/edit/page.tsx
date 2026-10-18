import type { Metadata } from "next";

import { EditTripView } from "./_components/edit-trip-view";

export const metadata: Metadata = { title: "Edit bill" };

// App pages render only once AccountGate has loaded the user on the client, so the server
// never renders this segment and instant-navigation validation can't check it.
export const instant = false;

export default async function EditTripPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  return <EditTripView tripId={tripId} />;
}
