import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isAppRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/trips(.*)",
  "/invitations(.*)",
  "/price-history(.*)",
  "/settings(.*)",
  "/onboarding(.*)",
]);

/** Pages a signed-in user is sent past, straight to the dashboard. */
const isSignedOutOnly = createRouteMatcher(["/", "/sign-in", "/sign-up"]);

/** Matches Convex Auth's default session length, so the cookie outlives a browser restart. */
const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/**
 * Proxies Convex Auth's sign-in/sign-out calls and keeps the session cookies fresh.
 * Its redirects are a convenience; Convex functions are the security boundary.
 */
export function createAuthMiddleware() {
  return convexAuthNextjsMiddleware(
    async (request, { convexAuth }) => {
      if (isSignedOutOnly(request) && (await convexAuth.isAuthenticated())) {
        return nextjsMiddlewareRedirect(request, "/dashboard");
      }
      if (isAppRoute(request) && !(await convexAuth.isAuthenticated())) {
        return nextjsMiddlewareRedirect(request, "/sign-in");
      }
    },
    { cookieConfig: { maxAge: SESSION_COOKIE_MAX_AGE_SECONDS } },
  );
}
