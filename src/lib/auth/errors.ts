import { ConvexError } from "convex/values";

import {
  GENERIC_ERROR_MESSAGE,
  isAppErrorData,
  type AppErrorData,
  type FieldErrors,
} from "@/domain/errors";

export type AuthFlow = "signIn" | "signUp";

export type AuthError = { message?: string; fieldErrors?: FieldErrors };

const FORM_FIELDS: Record<AuthFlow, readonly string[]> = {
  signIn: ["email", "password"],
  signUp: ["name", "email", "password"],
};

/**
 * Maps a failed sign-in/sign-up to what the form shows: field errors inline, or one
 * message above the button. The backend codes come from convex/auth.ts.
 */
export function toAuthError(error: unknown, flow: AuthFlow): AuthError {
  const data = authErrorData(error);
  switch (data?.code) {
    case "AUTH_INVALID_CREDENTIALS":
    case "AUTH_RATE_LIMITED":
      return { message: data.message };
    case "AUTH_EMAIL_TAKEN":
    case "VALIDATION": {
      const fieldErrors = pickFields(data.fieldErrors ?? {}, FORM_FIELDS[flow]);
      return Object.keys(fieldErrors).length > 0 ? { fieldErrors } : { message: data.message };
    }
    default:
      return { message: GENERIC_ERROR_MESSAGE };
  }
}

/**
 * Convex Auth's Next.js proxy forwards only the error *message* to the browser, so the
 * `ConvexError` payload arrives as text: "… Uncaught ConvexError: {"code":…}".
 */
function authErrorData(error: unknown): AppErrorData | null {
  if (error instanceof ConvexError && isAppErrorData(error.data)) return error.data;
  if (!(error instanceof Error)) return null;
  const json = /ConvexError: (\{[\s\S]*\})/.exec(error.message)?.[1];
  if (!json) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    return isAppErrorData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function pickFields(fieldErrors: FieldErrors, fields: readonly string[]): FieldErrors {
  return Object.fromEntries(Object.entries(fieldErrors).filter(([field]) => fields.includes(field)));
}
