"use client";

import { ErrorState } from "@/components/ui/error-state";

/** Catches unexpected errors in app pages. The details are never shown. */
export default function AppError({ retry }: { error: unknown; retry: () => void }) {
  return <ErrorState onRetry={retry} />;
}
