import { Password } from "@convex-dev/auth/providers/Password";
import {
  convexAuth,
  retrieveAccount,
  type ConvexCredentialsConfig,
} from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

import { validateName, validatePassword } from "../src/domain/auth-validation";
import { isValidEmail, normalizeEmail } from "../src/domain/normalization";
import type { DataModel } from "./_generated/dataModel";
import { appError } from "./lib/errors";

const PROVIDER_ID = "password";
const EMAIL_TAKEN = "An account with this email already exists. Sign in instead.";

const password = Password<DataModel>({
  id: PROVIDER_ID,
  // Called for every flow. The email is the account ID, so normalizing it here
  // also makes "one account per email" case-insensitive.
  profile(params) {
    const email = normalizeEmail(typeof params.email === "string" ? params.email : "");
    if (!isValidEmail(email)) {
      throw appError("VALIDATION", "Enter a valid email address", {
        email: "Enter a valid email address",
      });
    }
    if (params.flow !== "signUp") return { email };

    const name = validateName(typeof params.name === "string" ? params.name : "");
    if (!name.ok) throw appError("VALIDATION", name.error, { name: name.error });
    return { email, name: name.value };
  },

  validatePasswordRequirements(value) {
    const result = validatePassword(value);
    if (!result.ok) throw appError("VALIDATION", result.error, { password: result.error });
  },
});

type Authorize = ConvexCredentialsConfig["authorize"];

/**
 * Wraps the Password provider's `authorize` to fix two things:
 *
 * 1. Signing up with an email that already has an account must fail. Convex Auth instead
 *    signs the caller in when the password matches and only fails when it doesn't, which
 *    would also let the sign-up form test passwords without the failed-attempt limit.
 * 2. Convex Auth reports failures as plain `Error`s ("InvalidSecret", "Account … already
 *    exists", …), which production deployments redact. The ones the UI must tell apart are
 *    re-thrown as `ConvexError`s with stable codes.
 *
 * Convex Auth merges `provider.options` over the provider when it materializes it,
 * and the Password provider keeps its real `authorize` there.
 */
function withAppRules(provider: ConvexCredentialsConfig): ConvexCredentialsConfig {
  const { options } = provider as ConvexCredentialsConfig & { options: { authorize: Authorize } };
  const authorize: Authorize = async (credentials, ctx) => {
    try {
      if (credentials.flow === "signUp" && typeof credentials.email === "string") {
        if (await accountExists(ctx, normalizeEmail(credentials.email))) {
          throw appError("AUTH_EMAIL_TAKEN", EMAIL_TAKEN, { email: EMAIL_TAKEN });
        }
      }
      return await options.authorize(credentials, ctx);
    } catch (error) {
      throw toAppAuthError(error);
    }
  };
  return { ...provider, options: { ...options, authorize } } as ConvexCredentialsConfig;
}

/** Looks the account up by email only: no password check, so no failed attempt is recorded. */
async function accountExists(ctx: Parameters<Authorize>[1], email: string): Promise<boolean> {
  try {
    await retrieveAccount(ctx, { provider: PROVIDER_ID, account: { id: email } });
    return true;
  } catch (error) {
    if (error instanceof Error && /\bInvalidAccountId\b/.test(error.message)) return false;
    throw error;
  }
}

function toAppAuthError(error: unknown): unknown {
  if (error instanceof ConvexError || !(error instanceof Error)) return error;
  const message = error.message;
  if (/\b(InvalidAccountId|InvalidSecret|Invalid credentials)\b/.test(message)) {
    return appError("AUTH_INVALID_CREDENTIALS", "Email or password is incorrect.");
  }
  if (/\bTooManyFailedAttempts\b/.test(message)) {
    return appError("AUTH_RATE_LIMITED", "Too many attempts. Wait a few minutes and try again.");
  }
  // Two sign-ups for one email racing each other.
  if (/\bAccount .+ already exists\b/.test(message)) {
    return appError("AUTH_EMAIL_TAKEN", EMAIL_TAKEN, { email: EMAIL_TAKEN });
  }
  return error;
}

// Convex Auth's default limit on failed sign-in attempts stays enabled.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [withAppRules(password)],
});
