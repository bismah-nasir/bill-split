import type { Metadata } from "next";

import { FormPage } from "@/components/layout/form-page";

import { UsernameForm } from "./_components/username-form";

export const metadata: Metadata = { title: "Choose a username" };

export default function OnboardingPage() {
  return (
    <FormPage
      title="Choose a username"
      description="Friends invite you to bills by your username. It's the only thing other people see."
    >
      <UsernameForm />
    </FormPage>
  );
}
