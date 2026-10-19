"use client";

import { useQuery } from "convex/react";
import { useCallback, useState } from "react";

import type { HistoryFilters } from "@/domain/bill-history";
import type { ItemInput, PersonInput, TripDetailsInput } from "@/domain/trip-validation";
import type { BillHistoryPage, SpendingSummary, TripCard, TripDetail } from "@/domain/types";

import { api } from "../../../convex/_generated/api";
import type { AppError } from "./errors";
import { useAppMutation } from "./use-app-mutation";

export type TripInput = { details: TripDetailsInput; people: PersonInput[]; items: ItemInput[] };

/** The 5 most recent bills the user owns or shares; `undefined` while loading. */
export function useRecentTrips(): TripCard[] | undefined {
  return useQuery(api.trips.listRecent);
}

/**
 * One page of Bill History: the first `limit` bills matching `filters`.
 *
 * While new filters or a bigger `limit` load, the previous page stays on screen (`isUpdating`
 * is true) instead of flashing back to a skeleton; `page` is `undefined` only on first load.
 */
export function useBillHistory(
  filters: HistoryFilters,
  limit: number,
): { page: BillHistoryPage | undefined; isUpdating: boolean } {
  const current = useQuery(api.trips.listHistory, {
    ownership: filters.ownership,
    sort: filters.sort,
    limit,
    ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.from ? { from: filters.from } : {}),
    ...(filters.to ? { to: filters.to } : {}),
  });
  const [previous, setPrevious] = useState<BillHistoryPage | undefined>(current);
  if (current !== undefined && current !== previous) setPrevious(current);
  return { page: current ?? previous, isUpdating: current === undefined && previous !== undefined };
}

/**
 * The dashboard's spending figures for `month` ("YYYY-MM"). While another month loads, the
 * previous figures stay on screen (`isUpdating` is true); `summary` is `undefined` only on
 * first load.
 */
export function useSpendingSummary(
  month: string,
): { summary: SpendingSummary | undefined; isUpdating: boolean } {
  const current = useQuery(api.trips.spendingSummary, { month });
  const [previous, setPrevious] = useState<SpendingSummary | undefined>(current);
  if (current !== undefined && current !== previous) setPrevious(current);
  return { summary: current ?? previous, isUpdating: current === undefined && previous !== undefined };
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

/** Saves an edited bill (owner only). */
export function useUpdateTrip() {
  const { run, isPending, error } = useAppMutation(api.trips.update);
  const update = useCallback(
    async (tripId: string, input: TripInput): Promise<{ ok: true } | { ok: false; error: AppError }> => {
      const result = await run({ tripId, ...toTripArgs(input) });
      return result.ok ? { ok: true } : result;
    },
    [run],
  );
  return { update, isSaving: isPending, error };
}

/** Permanently deletes a bill (owner only). */
export function useDeleteTrip() {
  const { run, isPending, error } = useAppMutation(api.trips.remove);
  const remove = useCallback(
    async (tripId: string): Promise<{ ok: true } | { ok: false; error: AppError }> => {
      const result = await run({ tripId });
      return result.ok ? { ok: true } : result;
    },
    [run],
  );
  return { remove, isDeleting: isPending, error };
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
