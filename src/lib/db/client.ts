import { ConvexReactClient } from "convex/react";

// Read with a literal `process.env.NEXT_PUBLIC_…` so Next.js inlines it into the browser bundle.
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set. Run npx convex dev.");
}

/** The single Convex client shared by data hooks and Convex Auth. */
export const convexClient = new ConvexReactClient(convexUrl);
