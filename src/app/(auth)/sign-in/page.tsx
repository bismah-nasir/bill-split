import type { Metadata } from "next";

import { SignInForm } from "@/components/auth/sign-in-form";
import { FormPage } from "@/components/layout/form-page";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <FormPage title="Sign in">
      <SignInForm />
    </FormPage>
  );
}
