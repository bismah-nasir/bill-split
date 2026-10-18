"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { TripForm } from "@/components/trips/trip-form";
import { newTripValue, type TripFormValue } from "@/components/trips/trip-form-state";
import { useCreateTrip } from "@/lib/db/trips";

export function NewTripView() {
  const router = useRouter();
  const { create } = useCreateTrip();
  // Dated today in the browser's timezone; fixed for the life of the form.
  const [initialValue] = React.useState(newTripValue);

  async function handleSubmit(value: TripFormValue) {
    const result = await create(value);
    if (!result.ok) return result.error;
    router.push(`/trips/${result.tripId}`);
    return null;
  }

  return (
    <div className="flex flex-col gap-24">
      <PageHeader title="New bill" />
      <TripForm mode="create" initialValue={initialValue} onSubmit={handleSubmit} />
    </div>
  );
}
