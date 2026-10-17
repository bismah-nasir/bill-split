import type { Metadata } from "next";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { FormPage } from "@/components/layout/form-page";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <FormPage title="Create your account">
      <SignUpForm />
    </FormPage>
  );
}
