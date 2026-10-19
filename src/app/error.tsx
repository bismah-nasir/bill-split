"use client";

import { PageContainer } from "@/components/layout/page-container";
import { ErrorState } from "@/components/ui/error-state";

/** Catches unexpected errors outside the app pages (landing, sign-in, onboarding). */
export default function RootError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="flex min-h-dvh items-center py-48">
      <PageContainer>
        <ErrorState onRetry={retry} />
      </PageContainer>
    </main>
  );
}
