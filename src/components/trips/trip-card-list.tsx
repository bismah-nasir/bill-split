import { Skeleton } from "@/components/ui/loading-state";
import type { TripCard as TripCardData } from "@/domain/types";
import { cn } from "@/lib/utils";

import { TripCard } from "./trip-card";

type TripCardListProps = {
  trips: TripCardData[];
  /** Newer results are loading; the list stays visible but is marked busy. */
  isUpdating?: boolean;
};

/** Bills as a list of cards (dashboard, Bill History). */
export function TripCardList({ trips, isUpdating = false }: TripCardListProps) {
  return (
    <ul
      aria-busy={isUpdating || undefined}
      className={cn(
        "flex flex-col gap-12 transition-opacity duration-fast ease-standard",
        isUpdating && "opacity-60",
      )}
    >
      {trips.map((trip) => (
        <li key={trip.id}>
          <TripCard trip={trip} />
        </li>
      ))}
    </ul>
  );
}

/** Skeleton stand-in for `TripCardList` while bills load. */
export function TripCardListSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div role="status" className="flex flex-col gap-12">
      <span className="sr-only">Loading bills…</span>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-bubble w-full rounded-lg" />
      ))}
    </div>
  );
}
