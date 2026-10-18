import Link from "next/link";

import { MoneyText } from "@/components/ui/money-text";
import type { TripCard as TripCardData } from "@/domain/types";

import { CategoryBadge, OwnershipBadge, tripMetaLine } from "./trip-meta";

/** A bill in a list, linking to its page. */
export function TripCard({ trip }: { trip: TripCardData }) {
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="flex flex-col gap-8 rounded-lg bg-surface p-16 shadow-card transition-colors duration-fast ease-standard hover:bg-surface-subtle md:p-20"
    >
      <div className="flex items-start justify-between gap-12">
        <div className="flex min-w-0 flex-col gap-2">
          <h3 className="truncate type-h3">{trip.title}</h3>
          <p className="truncate type-body-sm text-ink-secondary">
            {tripMetaLine(trip.storeName, trip.tripDate)}
          </p>
        </div>
        <MoneyText paisa={trip.totalPaisa} size="h3" className="shrink-0" />
      </div>
      <div className="flex flex-wrap items-center gap-8">
        <CategoryBadge category={trip.category} />
        <OwnershipBadge isOwner={trip.isOwner} />
        <span className="min-w-0 truncate type-caption text-ink-muted">
          {trip.peopleLabels.join(", ")}
        </span>
      </div>
    </Link>
  );
}
