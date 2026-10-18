import { Suspense } from "react";
import type { Metadata } from "next";

import { BillHistoryView } from "./_components/bill-history-view";

export const metadata: Metadata = { title: "Bills" };

// App pages render only once AccountGate has loaded the user on the client, so the server
// never renders this segment and instant-navigation validation can't check it.
export const instant = false;

export default function BillHistoryPage() {
  return (
    // The view reads the filters from the URL (`useSearchParams`), which needs a boundary.
    <Suspense>
      <BillHistoryView />
    </Suspense>
  );
}
