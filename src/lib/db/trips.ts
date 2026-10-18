"use client";

import { useQuery } from "convex/react";
import { useCallback } from "react";

import type { ItemInput, PersonInput, TripDetailsInput } from "@/domain/trip-validation";
import type { TripCard, TripDetail } from "@/domain/types";

import { api } from "../../../convex/_generated/api";
import type { AppError } from "./errors";
import { useAppMutation } from "./use-app-mutation";

export type TripInput = { details: TripDetailsInput; people: PersonInput[]; items: ItemInput[] };

/** The 5 most recent bills the user owns or shares; `undefined` while loading. */
export function useRecentTrips(): TripCard[] | undefined {
  return useQuery(api.trips.listRecent);
}

/** `undefined` while loading, `null` when the bill doesn't exist or the user can't see it. */
export function useTrip(tripId: string): TripDetail | null | undefined {
  return useQuery(api.trips.get, { tripId });
}

export function useCreateTrip() {
  const { run, isPending, error } = useAppMutation(api.trips.create);
  const create = useCallback(
    async (input: TripInput): Promise<{ ok: true; tripId: string } | { ok: false; error: AppError }> => {
      const result = await run(toTripArgs(input));
      return result.ok ? { ok: true, tripId: result.value.tripId } : result;
    },
    [run],
  );
  return { create, isSaving: isPending, error };
}

/** Exactly the fields the backend accepts: Convex rejects unknown keys such as UI row keys. */
function toTripArgs({ details, people, items }: TripInput) {
  return {
    details: {
      title: details.title,
      storeName: details.storeName,
      tripDate: details.tripDate,
      category: details.category,
    },
    people: people.map((person) => ({
      key: person.key,
      name: person.name,
      ...(person.personId === undefined ? {} : { personId: person.personId }),
    })),
    items: items.map((item) => ({
      name: item.name,
      brand: item.brand,
      variant: item.variant,
      packSize: item.packSize,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      assigneeKeys: item.assigneeKeys,
      ...(item.itemId === undefined ? {} : { itemId: item.itemId }),
    })),
  };
}
