"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useCallback, useState } from "react";

import { toAuthError, type AuthError, type AuthFlow } from "./errors";

export type SignUpValues = { name: string; email: string; password: string };
export type SignInValues = { email: string; password: string };

function usePasswordFlow<Values extends Record<string, string>>(flow: AuthFlow) {
  const { signIn } = useAuthActions();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  /** Resolves to `null` on success, or to the error the form should show. */
  const run = useCallback(
    async (values: Values): Promise<AuthError | null> => {
      setIsPending(true);
      setError(null);
      try {
        await signIn("password", { ...values, flow });
        return null;
      } catch (caught) {
        const authError = toAuthError(caught, flow);
        setError(authError);
        return authError;
      } finally {
        setIsPending(false);
      }
    },
    [signIn, flow],
  );

  return { run, isPending, error };
}

/** Creates the account and signs in. `confirmPassword` is checked in the form and never sent. */
export function useSignUp() {
  const { run, isPending, error } = usePasswordFlow<SignUpValues>("signUp");
  return { signUp: run, isPending, error };
}

export function useSignIn() {
  const { run, isPending, error } = usePasswordFlow<SignInValues>("signIn");
  return { signIn: run, isPending, error };
}

export function useSignOut(): () => Promise<void> {
  return useAuthActions().signOut;
}

export function useAuthStatus(): { isLoading: boolean; isAuthenticated: boolean } {
  const { isLoading, isAuthenticated } = useConvexAuth();
  return { isLoading, isAuthenticated };
}
