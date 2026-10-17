"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { LoadingState } from "@/components/ui/loading-state";
import type { CurrentUser } from "@/domain/types";
import { useAuthStatus, useSignOut } from "@/lib/auth/hooks";
import { useCurrentUser } from "@/lib/db/users";

export type OnboardedAccount = CurrentUser & { username: string };

type AccountStatus =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "needs-username"; user: CurrentUser }
  | { kind: "ready"; user: OnboardedAccount };

/**
 * Where the visitor stands, decided from Convex's confirmed auth state rather than from
 * the user query alone, which can briefly read `null` while a new session is being set up.
 */
export function useAccountStatus(): AccountStatus {
  const { isLoading, isAuthenticated } = useAuthStatus();
  const user = useCurrentUser();
  if (isLoading) return { kind: "loading" };
  if (!isAuthenticated) return { kind: "signed-out" };
  if (!user) return { kind: "loading" };
  if (!isOnboarded(user)) return { kind: "needs-username", user };
  return { kind: "ready", user };
}

function isOnboarded(user: CurrentUser): user is OnboardedAccount {
  return user.username !== null;
}

type AccountContextValue = {
  user: OnboardedAccount;
  signOut: () => Promise<void>;
};

const AccountContext = React.createContext<AccountContextValue | null>(null);

/** The signed-in, onboarded user. Only available inside `AccountGate`. */
export function useAccount(): AccountContextValue {
  const value = React.use(AccountContext);
  if (!value) throw new Error("useAccount must be used inside AccountGate");
  return value;
}

/**
 * Renders app pages only for a signed-in user who has chosen a username: shows a loading
 * state while that's being checked, and redirects to sign-in or onboarding otherwise.
 * It also owns sign-out, so the "signed out" redirect can't race the move to `/`.
 */
export function AccountGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const status = useAccountStatus();
  const signOutOfConvex = useSignOut();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  React.useEffect(() => {
    if (isSigningOut) return;
    if (status.kind === "signed-out") router.replace("/sign-in");
    else if (status.kind === "needs-username") router.replace("/onboarding");
  }, [status.kind, isSigningOut, router]);

  const signOut = React.useCallback(async () => {
    setIsSigningOut(true);
    await signOutOfConvex();
    router.replace("/");
  }, [signOutOfConvex, router]);

  const user = status.kind === "ready" ? status.user : null;
  const value = React.useMemo(() => (user ? { user, signOut } : null), [user, signOut]);

  if (isSigningOut || !value) return <LoadingState fullPage />;
  return <AccountContext value={value}>{children}</AccountContext>;
}
