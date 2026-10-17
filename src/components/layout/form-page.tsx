import * as React from "react";
import Link from "next/link";

import { Card } from "@/components/ui/card";

type FormPageProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

/** Centred single-card page with the app name above it: sign-in, sign-up, onboarding. */
export function FormPage({ title, description, children }: FormPageProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center py-48">
      <div className="flex w-full max-w-form flex-col gap-24 px-16">
        <Link href="/" className="self-center type-h2 text-primary">
          BillSplit
        </Link>
        <Card className="flex flex-col gap-24">
          <header className="flex flex-col gap-4">
            <h1 className="type-h2">{title}</h1>
            {description && <p className="type-body-sm text-ink-secondary">{description}</p>}
          </header>
          {children}
        </Card>
      </div>
    </main>
  );
}
