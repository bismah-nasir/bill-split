import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { connection } from "next/server";

export { AuthClientProvider } from "./client-provider";

/**
 * Hands the session from the request's httpOnly cookies to the client. It reads cookies,
 * so with Cache Components it must render inside a `<Suspense>` boundary.
 */
export async function AuthServerProvider({ children }: { children: React.ReactNode }) {
  // Convex Auth stamps its server state with `Date.now()`. Cookies alone are available to
  // partial (runtime) prefetches, where the current time isn't, so opt out of those.
  await connection();
  return <ConvexAuthNextjsServerProvider>{children}</ConvexAuthNextjsServerProvider>;
}
