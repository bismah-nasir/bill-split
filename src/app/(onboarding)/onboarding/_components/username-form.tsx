"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { UsernameField } from "@/components/account/username-field";
import { useUsernameForm } from "@/components/account/use-username-form";
import { useAccountStatus } from "@/components/layout/account-gate";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";

export function UsernameForm() {
  const router = useRouter();
  const status = useAccountStatus();
  const form = useUsernameForm();

  // Signed out → sign in; already onboarded (including right after saving) → dashboard.
  React.useEffect(() => {
    if (status.kind === "signed-out") router.replace("/sign-in");
    else if (status.kind === "ready") router.replace("/dashboard");
  }, [status.kind, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await form.submit()) router.replace("/dashboard");
  }

  if (status.kind !== "needs-username") return <LoadingState />;

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-24">
      <UsernameField
        value={form.username}
        availability={form.availability}
        error={form.fieldError}
        onChange={(event) => form.changeUsername(event.target.value)}
      />
      <div className="flex flex-col gap-12">
        {form.formMessage && <Alert>{form.formMessage}</Alert>}
        <Button type="submit" size="lg" disabled={form.isPending}>
          {form.isPending ? "Saving…" : "Continue"}
        </Button>
      </div>
    </form>
  );
}
