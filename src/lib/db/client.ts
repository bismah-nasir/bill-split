import { ConvexReactClient } from "convex/react";

// Read with a literal `process.env.NEXT_PUBLIC_…` so Next.js inlines it into the browser bundle.
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set. Run npx convex dev.");
}

/**
 * The single Convex client shared by data hooks and Convex Auth.
 *
 * `initialAuthTokenReuse`: by default the client swaps the session token from the cookies for
 * a fresh one on every page load, which rotates the refresh token each time. A reload or
 * navigation during that request could leave the browser holding a used refresh token, and
 * the next load more than 10 s later signed the user out. Reusing the token (and refreshing
 * it shortly before it expires) avoids that, and an extra re-run of every query per load.
 */
export const convexClient = new ConvexReactClient(convexUrl, { initialAuthTokenReuse: true });
