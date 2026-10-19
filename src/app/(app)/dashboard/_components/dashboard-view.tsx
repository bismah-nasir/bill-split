"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, ReceiptText, TrendingUp } from "lucide-react";

import { SpendingSummary } from "@/components/dashboard/spending-summary";
import { useAccount } from "@/components/layout/account-gate";
import { PageHeader } from "@/components/layout/page-header";
import { TripCardList, TripCardListSkeleton } from "@/components/trips/trip-card-list";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useRecentTrips } from "@/lib/db/trips";

export function DashboardView() {
  const { user } = useAccount();

  return (
    <div className="flex flex-col gap-24">
      <PageHeader
        title={`Hi, ${user.name}`}
        actions={
          <>
            <Button asChild variant="ghost" size="lg">
              <Link href="/price-history">
                <TrendingUp aria-hidden className="size-icon-md" />
                Compare prices
              </Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/trips/new">
                <Plus aria-hidden className="size-icon-md" />
                New bill
              </Link>
            </Button>
          </>
        }
      />
      <SpendingSummary />
      <RecentBills />
    </div>
  );
}

function RecentBills() {
  const trips = useRecentTrips();
  const headingId = React.useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-12">
      <div className="flex items-center justify-between gap-12">
        <h2 id={headingId} className="type-h3">
          Recent bills
        </h2>
        {trips !== undefined && trips.length > 0 && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/trips">View all bills</Link>
          </Button>
        )}
      </div>
      {trips === undefined ? (
        <TripCardListSkeleton />
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
        <TripCardList trips={trips} />
      )}
    </section>
  );
}
