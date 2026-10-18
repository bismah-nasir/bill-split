import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

/** A bill that doesn't exist, was deleted, or isn't the viewer's to see (or edit). */
export function TripUnavailable() {
  return (
    <ErrorState
      title="This bill doesn't exist or you don't have access."
      description="Check the link, or ask the person who shared it."
      action={
        <Button asChild variant="secondary">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      }
    />
  );
}
