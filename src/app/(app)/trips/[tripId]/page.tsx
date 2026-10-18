import type { Metadata } from "next";

import { TripDetailView } from "./_components/trip-detail-view";

export const metadata: Metadata = { title: "Bill" };

// App pages render only once AccountGate has loaded the user on the client, so the server
// never renders this segment and instant-navigation validation can't check it.
export const instant = false;

export default async function TripPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  return <TripDetailView tripId={tripId} />;
}
