"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, ReceiptText } from "lucide-react";

import { useAccount } from "@/components/layout/account-gate";
import { PageHeader } from "@/components/layout/page-header";
import { TripCard } from "@/components/trips/trip-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/loading-state";
import { useRecentTrips } from "@/lib/db/trips";

export function DashboardView() {
  const { user } = useAccount();

  return (
    <div className="flex flex-col gap-24">
      <PageHeader
        title={`Hi, ${user.name}`}
        actions={
          <Button asChild size="lg">
            <Link href="/trips/new">
              <Plus aria-hidden className="size-icon-md" />
              New bill
            </Link>
          </Button>
        }
      />
      <RecentBills />
    </div>
  );
}

function RecentBills() {
  const trips = useRecentTrips();
  const headingId = React.useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-12">
      <h2 id={headingId} className="type-h3">
        Recent bills
      </h2>
      {trips === undefined ? (
        <div role="status" className="flex flex-col gap-12">
          <span className="sr-only">Loading bills…</span>
          <Skeleton className="h-bubble w-full rounded-lg" />
          <Skeleton className="h-bubble w-full rounded-lg" />
        </div>
      ) : trips.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No bills yet"
          description="Record a bill and it will show up here."
          action={
            <Button asChild>
              <Link href="/trips/new">Create your first bill</Link>
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-12">
          {trips.map((trip) => (
            <li key={trip.id}>
              <TripCard trip={trip} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
