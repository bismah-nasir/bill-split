"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";

import { convexClient } from "@/lib/db/client";

/** Gives client components both Convex data and auth, through the one shared client. */
export function AuthClientProvider({ children }: { children: React.ReactNode }) {
  return <ConvexAuthNextjsProvider client={convexClient}>{children}</ConvexAuthNextjsProvider>;
}
