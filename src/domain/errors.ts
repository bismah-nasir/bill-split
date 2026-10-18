/**
 * Error codes shared by the backend (thrown as `ConvexError({ code, message, fieldErrors? })`)
 * and the UI (which decides how to show each one).
 */
export const ERROR_CODES = [
  "UNAUTHENTICATED",
  "ONBOARDING_REQUIRED",
  "NOT_FOUND",
  "FORBIDDEN",
  "VALIDATION",
  "USERNAME_TAKEN",
  "USERNAME_INVALID",
  "INVITE_NO_MATCH",
  "INVITE_ALREADY_PENDING",
  "INVITE_ALREADY_PARTICIPANT",
  "INVITE_PERSON_LINKED",
  "INVITE_SELF",
  "TRIP_PEOPLE_LIMIT",
  "INVITATION_NOT_PENDING",
  // Sign-up / sign-in. Convex Auth throws plain errors, which production deployments
  // redact, so convex/auth.ts re-throws them with these codes.
  "AUTH_INVALID_CREDENTIALS",
  "AUTH_EMAIL_TAKEN",
  "AUTH_RATE_LIMITED",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export type FieldErrors = Record<string, string>;

/** The payload of every error our backend throws on purpose. */
export type AppErrorData = {
  code: ErrorCode;
  message: string;
  fieldErrors?: FieldErrors;
};

export const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && (ERROR_CODES as readonly string[]).includes(value);
}

/** Narrows an unknown value (e.g. `ConvexError.data`) to `AppErrorData`. */
export function isAppErrorData(value: unknown): value is AppErrorData {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Record<string, unknown>;
  if (!isErrorCode(data.code) || typeof data.message !== "string") return false;
  if (data.fieldErrors === undefined) return true;
  return (
    typeof data.fieldErrors === "object" &&
    data.fieldErrors !== null &&
    Object.values(data.fieldErrors).every((message) => typeof message === "string")
  );
}
