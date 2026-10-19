import { Suspense } from "react";
import type { Metadata } from "next";

import { PriceHistoryView } from "./_components/price-history-view";

export const metadata: Metadata = { title: "Prices" };

// App pages render only once AccountGate has loaded the user on the client, so the server
// never renders this segment and instant-navigation validation can't check it.
export const instant = false;

export default function PriceHistoryPage() {
  return (
    // The view reads the search and product from the URL (`useSearchParams`), which needs a boundary.
    <Suspense>
      <PriceHistoryView />
    </Suspense>
  );
}
