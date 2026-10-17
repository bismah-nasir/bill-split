"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useValidatedForm } from "@/components/forms/use-validated-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { validateSignIn, type SignInInput } from "@/domain/auth-validation";
import { useSignIn } from "@/lib/auth/hooks";

const EMPTY: SignInInput = { email: "", password: "" };

export function SignInForm() {
  const router = useRouter();
  const { signIn, isPending } = useSignIn();
  const form = useValidatedForm(EMPTY, validateSignIn);
  const [formMessage, setFormMessage] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);
    const valid = form.validateAll();
    if (!valid) return;

    const failure = await signIn(valid);
    if (!failure) {
      // AccountGate sends a user without a username on to onboarding.
      router.replace("/dashboard");
      return;
    }
    if (failure.fieldErrors) form.showErrors(failure.fieldErrors);
    setFormMessage(failure.message ?? null);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-24">
      <div className="flex flex-col gap-16">
        <TextField label="Email" type="email" autoComplete="email" {...form.field("email")} />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          {...form.field("password")}
        />
      </div>

      <div className="flex flex-col gap-12">
        {formMessage && <Alert>{formMessage}</Alert>}
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </div>

      <p className="text-center type-body-sm text-ink-secondary">
        New here?{" "}
        <Link href="/sign-up" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
