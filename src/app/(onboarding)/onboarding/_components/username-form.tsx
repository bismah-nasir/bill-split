"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { UsernameField } from "@/components/account/username-field";
import { useAccountStatus } from "@/components/layout/account-gate";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { isValidUsername, USERNAME_RULES } from "@/domain/normalization";
import { useSetUsername, useUsernameAvailability } from "@/lib/db/users";

export function UsernameForm() {
  const router = useRouter();
  const status = useAccountStatus();
  const [username, setUsername] = React.useState("");
  const [fieldError, setFieldError] = React.useState<string | undefined>();
  const [formMessage, setFormMessage] = React.useState<string | null>(null);
  const availability = useUsernameAvailability(username);
  const { setUsername: saveUsername, isPending } = useSetUsername();

  // Signed out → sign in; already onboarded (including right after saving) → dashboard.
  React.useEffect(() => {
    if (status.kind === "signed-out") router.replace("/sign-in");
    else if (status.kind === "ready") router.replace("/dashboard");
  }, [status.kind, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);
    if (!isValidUsername(username)) {
      setFieldError(username.trim() ? `Usernames are ${USERNAME_RULES}.` : "Choose a username");
      return;
    }
    if (availability === "taken") return;

    const failure = await saveUsername(username);
    if (!failure) {
      router.replace("/dashboard");
      return;
    }
    if (failure.code === "USERNAME_TAKEN" || failure.code === "USERNAME_INVALID") {
      setFieldError(failure.message);
    } else {
      setFormMessage(failure.message);
    }
  }

  if (status.kind !== "needs-username") return <LoadingState />;

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-24">
      <UsernameField
        value={username}
        availability={availability}
        error={fieldError}
        onChange={(event) => {
          setUsername(event.target.value);
          setFieldError(undefined);
        }}
      />
      <div className="flex flex-col gap-12">
        {formMessage && <Alert>{formMessage}</Alert>}
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Saving…" : "Continue"}
        </Button>
      </div>
    </form>
  );
}
