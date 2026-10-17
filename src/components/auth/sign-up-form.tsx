"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { validateSignUp, type SignUpInput } from "@/domain/auth-validation";
import { useSignUp } from "@/lib/auth/hooks";

import { useValidatedForm } from "./use-validated-form";

const EMPTY: SignUpInput = { name: "", email: "", password: "", confirmPassword: "" };

export function SignUpForm() {
  const router = useRouter();
  const { signUp, isPending } = useSignUp();
  const form = useValidatedForm(EMPTY, validateSignUp);
  const [formMessage, setFormMessage] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);
    // The value has a normalized email and no `confirmPassword`, which stays in the browser.
    const valid = form.validateAll();
    if (!valid) return;

    const failure = await signUp(valid);
    if (!failure) {
      router.replace("/onboarding");
      return;
    }
    // Field errors go inline, anything else above the button. What was typed is kept.
    if (failure.fieldErrors) form.showErrors(failure.fieldErrors);
    setFormMessage(failure.message ?? null);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-24">
      <div className="flex flex-col gap-16">
        <TextField label="Name" autoComplete="name" {...form.field("name")} />
        <TextField label="Email" type="email" autoComplete="email" {...form.field("email")} />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters"
          {...form.field("password")}
        />
        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          {...form.field("confirmPassword")}
        />
      </div>

      <div className="flex flex-col gap-12">
        {formMessage && <Alert>{formMessage}</Alert>}
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Creating account…" : "Create account"}
        </Button>
      </div>

      <p className="text-center type-body-sm text-ink-secondary">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
