"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import { useAccount } from "@/components/layout/account-gate";
import { useResetAfterLeave } from "@/components/layout/use-reset-after-leave";
import { billViewFromDetail } from "@/components/trips/bill-view";
import { SplitSummary } from "@/components/trips/split-summary";
import { CategoryBadge, OwnershipBadge, tripMetaLine } from "@/components/trips/trip-meta";
import { TripSummary } from "@/components/trips/trip-summary";
import { TripUnavailable } from "@/components/trips/trip-unavailable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/loading-state";
import { useToast } from "@/components/ui/toast";
import { summaryLabel } from "@/domain/people";
import { useDeleteTrip, useTrip } from "@/lib/db/trips";

export function TripDetailView({ tripId }: { tripId: string }) {
  // After a delete, start fresh on the next visit (e.g. browser back shows "no access").
  const { key, resetAfterLeave } = useResetAfterLeave();
  return <TripDetail key={key} tripId={tripId} onDeleted={resetAfterLeave} />;
}

function TripDetail({ tripId, onDeleted }: { tripId: string; onDeleted: () => void }) {
  const trip = useTrip(tripId);
  const { user } = useAccount();
  const router = useRouter();
  const showToast = useToast();
  const { remove, isDeleting } = useDeleteTrip();
  const [isDeleted, setIsDeleted] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // A dialog left open shouldn't greet the user on their next visit.
  React.useLayoutEffect(() => () => setConfirmOpen(false), []);

  async function deleteTrip() {
    setDeleteError(null);
    const result = await remove(tripId);
    if (!result.ok) {
      setDeleteError(result.error.message);
      return;
    }
    setIsDeleted(true);
    onDeleted();
    showToast("Bill deleted");
    router.push("/dashboard");
  }

  // The bill disappears from the live query as soon as it's deleted; don't flash "no access"
  // on the way to the dashboard.
  if (trip === undefined || (trip === null && (isDeleting || isDeleted))) return <TripDetailSkeleton />;
  if (trip === null) return <TripUnavailable />;

  const isOwner = trip.viewerRole === "owner";
  // Only the owner's own client knows their account name; it's never sent to anyone else.
  const ownerName = isOwner ? user.name : null;

  return (
    <div className="flex flex-col gap-24">
      <div className="flex flex-col gap-12">
        {isOwner && (
          <div className="flex justify-end gap-8">
            <Button asChild variant="secondary">
              <Link href={`/trips/${trip.id}/edit`}>
                <Pencil aria-hidden className="size-icon-md" />
                Edit
              </Link>
            </Button>
            <Button
              variant="danger-soft"
              onClick={() => {
                setDeleteError(null);
                setConfirmOpen(true);
              }}
            >
              <Trash2 aria-hidden className="size-icon-md" />
              Delete
            </Button>
          </div>
        )}
        <SplitSummary
          title={trip.title}
          meta={tripMetaLine(trip.storeName, trip.tripDate)}
          badges={
            <>
              <CategoryBadge category={trip.category} />
              <OwnershipBadge isOwner={isOwner} />
            </>
          }
          totalPaisa={trip.totalPaisa}
          lines={trip.shares.map((share) => {
            const person = trip.people.find((candidate) => candidate.personId === share.personId);
            return {
              key: share.personId,
              label: person ? summaryLabel(person, ownerName) : "",
              totalPaisa: share.totalPaisa,
            };
          })}
          reconciled={trip.reconciled}
        />
      </div>
      <TripSummary bill={billViewFromDetail(trip)} />

      {isOwner && (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Delete this bill?"
          description="This permanently removes it and its price records for everyone it's shared with."
          confirmLabel="Delete bill"
          pendingLabel="Deleting…"
          variant="danger"
          isPending={isDeleting}
          error={deleteError}
          onConfirm={() => void deleteTrip()}
        />
      )}
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
