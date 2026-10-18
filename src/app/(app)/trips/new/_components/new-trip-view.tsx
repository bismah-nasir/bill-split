"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { useResetAfterLeave } from "@/components/layout/use-reset-after-leave";
import { TripForm } from "@/components/trips/trip-form";
import { newTripValue, type TripFormValue } from "@/components/trips/trip-form-state";
import { useCreateTrip } from "@/lib/db/trips";

export function NewTripView() {
  // Once saved, the next "New bill" starts empty instead of showing this bill still saving.
  const { key, resetAfterLeave } = useResetAfterLeave();

  return (
    <div className="flex flex-col gap-24">
      <PageHeader title="New bill" />
      <NewTripForm key={key} onSaved={resetAfterLeave} />
    </div>
  );
}

function NewTripForm({ onSaved }: { onSaved: () => void }) {
  const router = useRouter();
  const { create } = useCreateTrip();
  // Dated today in the browser's timezone; fixed for the life of the form.
  const [initialValue] = React.useState(newTripValue);

  async function handleSubmit(value: TripFormValue) {
    const result = await create(value);
    if (!result.ok) return result.error;
    onSaved();
    router.push(`/trips/${result.tripId}`);
    return null;
  }

  return <TripForm mode="create" initialValue={initialValue} onSubmit={handleSubmit} />;
}
