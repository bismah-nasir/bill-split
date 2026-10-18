"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { useResetAfterLeave } from "@/components/layout/use-reset-after-leave";
import { TripForm, type TripFormHandle } from "@/components/trips/trip-form";
import { tripToFormValue, type TripFormValue } from "@/components/trips/trip-form-state";
import { TripUnavailable } from "@/components/trips/trip-unavailable";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingState } from "@/components/ui/loading-state";
import type { TripDetail } from "@/domain/types";
import { useTrip, useUpdateTrip } from "@/lib/db/trips";

export function EditTripView({ tripId }: { tripId: string }) {
  // Once saved or cancelled, the next visit starts from the saved bill, not this draft.
  const { key, resetAfterLeave } = useResetAfterLeave();
  return <EditTrip key={key} tripId={tripId} onLeave={resetAfterLeave} />;
}

function EditTrip({ tripId, onLeave }: { tripId: string; onLeave: () => void }) {
  const trip = useTrip(tripId);

  if (trip === undefined) return <LoadingState label="Loading bill…" />;
  // Only the owner can edit; to anyone else the bill is simply not available here.
  if (trip === null || trip.viewerRole !== "owner") return <TripUnavailable />;
  return <EditTripForm trip={trip} onLeave={onLeave} />;
}

function EditTripForm({ trip, onLeave }: { trip: TripDetail; onLeave: () => void }) {
  const router = useRouter();
  const { update } = useUpdateTrip();
  const formRef = React.useRef<TripFormHandle>(null);
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);
  // Prefilled once: live updates to the bill don't overwrite what's being edited.
  const [initialValue] = React.useState(() => tripToFormValue(trip));
  // Live, so the removal warning is right even if someone accepts while the owner edits.
  const linkedUsernames = linkedUsernamesOf(trip);

  function leave() {
    onLeave();
    router.push(`/trips/${trip.id}`);
  }

  async function handleSubmit(value: TripFormValue) {
    const result = await update(trip.id, value);
    if (!result.ok) return result.error;
    leave();
    return null;
  }

  function cancel() {
    if (formRef.current?.isDirty()) setConfirmDiscard(true);
    else leave();
  }

  return (
    <div className="flex flex-col gap-24">
      <PageHeader
        title="Edit bill"
        actions={
          <Button variant="secondary" onClick={cancel}>
            Cancel
          </Button>
        }
      />
      <TripForm
        ref={formRef}
        mode="edit"
        initialValue={initialValue}
        onSubmit={handleSubmit}
        linkedUsernames={linkedUsernames}
      />
      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard changes?"
        description="Your changes to this bill won't be saved."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        variant="danger"
        onConfirm={() => {
          setConfirmDiscard(false);
          leave();
        }}
      />
    </div>
  );
}

/** Saved people connected to an account, keyed like the form's people (by person ID). */
function linkedUsernamesOf(trip: TripDetail): Record<string, string> {
  return Object.fromEntries(
    trip.people.flatMap((person) => (!person.isOwner && person.username ? [[person.personId, person.username]] : [])),
  );
}
