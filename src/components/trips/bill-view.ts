/**
 * One shape for showing a bill's breakdown, built either from the form (review before
 * saving) or from a saved bill, so both screens render through the same components.
 */
import { formatQuantity } from "@/domain/format";
import { computeBill } from "@/domain/money";
import { personLabel } from "@/domain/people";
import { OWNER_KEY, type ValidatedTrip } from "@/domain/trip-validation";
import type { TripDetail } from "@/domain/types";

export type BillViewItem = {
  key: string;
  name: string;
  /** Brand · variant · pack size, or `null` when none was entered. */
  details: string | null;
  quantityLabel: string;
  unitPricePaisa: number;
  lineTotalPaisa: number;
  /** Bill order. */
  assignees: { key: string; label: string; amountPaisa: number }[];
};

export type BillViewShare = {
  key: string;
  label: string;
  totalPaisa: number;
  items: { key: string; name: string; amountPaisa: number; splitCount: number }[];
};

export type BillView = {
  /** Labels of everyone on the bill, in bill order. */
  people: string[];
  items: BillViewItem[];
  totalPaisa: number;
  shares: BillViewShare[];
  reconciled: boolean;
};

/** The breakdown of a bill that hasn't been saved yet, computed exactly as the server will. */
export function billViewFromForm(trip: ValidatedTrip): BillView {
  const labels = new Map([
    [OWNER_KEY, "You"],
    ...trip.people.map((person): [string, string] => [person.key, person.name]),
  ]);
  const order = [...labels.keys()];
  const bill = computeBill(trip.items, order);
  const labelOf = (key: string) => labels.get(key) ?? "";

  return {
    people: [...labels.values()],
    items: trip.items.map((item, index) => ({
      key: String(index),
      name: item.name,
      details: detailsLine(item.brand, item.variant, item.packSize),
      quantityLabel: formatQuantity(item.quantityMilli, item.unit),
      unitPricePaisa: item.unitPricePaisa,
      lineTotalPaisa: bill.items[index].lineTotalPaisa,
      assignees: bill.items[index].allocations.map((allocation) => ({
        key: allocation.personKey,
        label: labelOf(allocation.personKey),
        amountPaisa: allocation.amountPaisa,
      })),
    })),
    totalPaisa: bill.totalPaisa,
    shares: bill.shares.map((share) => ({
      key: share.personKey,
      label: labelOf(share.personKey),
      totalPaisa: share.totalPaisa,
      items: share.contributions.map((contribution) => ({
        key: String(contribution.itemIndex),
        name: trip.items[contribution.itemIndex].name,
        amountPaisa: contribution.amountPaisa,
        splitCount: contribution.splitCount,
      })),
    })),
    reconciled: bill.reconciled,
  };
}

export function billViewFromDetail(trip: TripDetail): BillView {
  const labels = new Map(
    trip.people.map((person) => [person.personId, personLabel(person, trip.viewerPersonId)]),
  );
  const labelOf = (personId: string) => labels.get(personId) ?? "";

  return {
    people: [...labels.values()],
    items: trip.items.map((item) => ({
      key: item.id,
      name: item.name,
      details: detailsLine(item.brand, item.variant, item.packSize),
      quantityLabel: formatQuantity(item.quantityMilli, item.unit),
      unitPricePaisa: item.unitPricePaisa,
      lineTotalPaisa: item.lineTotalPaisa,
      assignees: item.assignees.map((assignee) => ({
        key: assignee.personId,
        label: labelOf(assignee.personId),
        amountPaisa: assignee.amountPaisa,
      })),
    })),
    totalPaisa: trip.totalPaisa,
    shares: trip.shares.map((share) => ({
      key: share.personId,
      label: labelOf(share.personId),
      totalPaisa: share.totalPaisa,
      items: share.items.map((item) => ({
        key: item.itemId,
        name: item.name,
        amountPaisa: item.amountPaisa,
        splitCount: item.splitCount,
      })),
    })),
    reconciled: trip.reconciled,
  };
}

function detailsLine(...parts: (string | null | undefined)[]): string | null {
  const present = parts.filter((part) => part);
  return present.length > 0 ? present.join(" · ") : null;
}
