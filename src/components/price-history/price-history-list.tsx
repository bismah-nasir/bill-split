import Link from "next/link";

import { MoneyText } from "@/components/ui/money-text";
import { formatQuantity, formatTripDate, joinDetails } from "@/domain/format";
import type { PriceObservation } from "@/domain/types";

import { PriceChange } from "./price-change";

const billLinkClassName = "text-primary underline-offset-4 hover:underline";

/**
 * A product's price records, newest first: a card per record on phones, a table from `md`.
 * Each links to its bill.
 */
export function PriceHistoryList({ observations }: { observations: PriceObservation[] }) {
  return (
    <>
      <ul aria-label="Price records" className="flex flex-col gap-12 md:hidden">
        {observations.map((observation) => (
          <li key={observation.itemId}>
            <ObservationCard observation={observation} />
          </li>
        ))}
      </ul>
      <div className="hidden overflow-hidden rounded-lg bg-surface shadow-card md:block">
        <table className="w-full type-body-sm">
          <caption className="sr-only">Price records, newest first</caption>
          <thead className="border-b border-line text-left type-caption text-ink-secondary">
            <tr>
              <th scope="col" className="px-16 py-12">Date</th>
              <th scope="col" className="px-16 py-12 text-right">Unit price</th>
              <th scope="col" className="px-16 py-12">Change</th>
              <th scope="col" className="px-16 py-12">Qty/Unit</th>
              <th scope="col" className="px-16 py-12">Store</th>
              <th scope="col" className="px-16 py-12">Bill</th>
            </tr>
          </thead>
          <tbody>
            {observations.map((observation) => (
              <tr key={observation.itemId} className="border-b border-line last:border-b-0">
                <td className="px-16 py-12 whitespace-nowrap">{formatTripDate(observation.tripDate)}</td>
                <td className="px-16 py-12 text-right">
                  <MoneyText paisa={observation.unitPricePaisa} size="sm" className="font-semibold" />
                </td>
                <td className="px-16 py-12">
                  <PriceChange change={observation.change} />
                </td>
                <td className="px-16 py-12 whitespace-nowrap">
                  {formatQuantity(observation.quantityMilli, observation.unit)}
                </td>
                <td className="px-16 py-12 break-words">{observation.storeName ?? "—"}</td>
                <td className="px-16 py-12 break-words">
                  <Link href={`/trips/${observation.tripId}`} className={billLinkClassName}>
                    {observation.tripTitle}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ObservationCard({ observation }: { observation: PriceObservation }) {
  const details = joinDetails(
    `Qty ${formatQuantity(observation.quantityMilli, observation.unit)}`,
    observation.storeName,
  );
  return (
    <div className="flex flex-col gap-8 rounded-lg bg-surface p-16 shadow-card">
      <div className="flex items-start justify-between gap-12">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="type-caption text-ink-muted">{formatTripDate(observation.tripDate)}</p>
          <MoneyText paisa={observation.unitPricePaisa} size="h3" />
        </div>
        <PriceChange change={observation.change} className="pt-2" />
      </div>
      <p className="type-body-sm break-words text-ink-secondary">
        {details} ·{" "}
        <Link href={`/trips/${observation.tripId}`} className={billLinkClassName}>
          {observation.tripTitle}
        </Link>
      </p>
    </div>
  );
}
