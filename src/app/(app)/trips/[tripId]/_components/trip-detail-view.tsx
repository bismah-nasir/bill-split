"use client";

import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { billViewFromDetail } from "@/components/trips/bill-view";
import { CategoryBadge, OwnershipBadge, tripMetaLine } from "@/components/trips/trip-meta";
import { TripSummary } from "@/components/trips/trip-summary";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/loading-state";
import { useTrip } from "@/lib/db/trips";

export function TripDetailView({ tripId }: { tripId: string }) {
  const trip = useTrip(tripId);

  if (trip === undefined) return <TripDetailSkeleton />;
  if (trip === null) {
    return (
      <ErrorState
        title="This bill doesn't exist or you don't have access."
        description="Check the link, or ask the person who shared it."
        action={
          <Button asChild variant="secondary">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-24">
      <div className="flex flex-col gap-12">
        <PageHeader title={trip.title} description={tripMetaLine(trip.storeName, trip.tripDate)} />
        <div className="flex flex-wrap items-center gap-8">
          <CategoryBadge category={trip.category} />
          <OwnershipBadge isOwner={trip.viewerRole === "owner"} />
        </div>
      </div>
      <TripSummary bill={billViewFromDetail(trip)} />
    </div>
  );
}

function TripDetailSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-24">
      <span className="sr-only">Loading bill…</span>
      <div className="flex flex-col gap-8">
        <Skeleton className="h-control-md w-2/3" />
        <Skeleton className="h-control-sm w-1/3" />
      </div>
      <Card className="flex flex-col gap-16 p-16">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex justify-between gap-16">
            <Skeleton className="h-control-sm w-1/2" />
            <Skeleton className="h-control-sm w-1/4" />
          </div>
        ))}
      </Card>
      <Skeleton className="h-control-lg w-full" />
    </div>
  );
}
