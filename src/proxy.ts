import { createAuthMiddleware } from "@/lib/auth/middleware";

export default createAuthMiddleware();

export const config = {
  // Run on every route except static assets and Next.js internals (Convex Auth's recommended matcher).
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
