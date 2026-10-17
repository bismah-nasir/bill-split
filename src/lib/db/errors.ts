import { ConvexError } from "convex/values";

import {
  GENERIC_ERROR_MESSAGE,
  isAppErrorData,
  type ErrorCode,
  type FieldErrors,
} from "@/domain/errors";

export type AppError = {
  code: ErrorCode | "UNKNOWN";
  message: string;
  fieldErrors: FieldErrors;
};

/** Turns anything a Convex query or mutation throws into a friendly, UI-safe error. */
export function toAppError(error: unknown): AppError {
  if (error instanceof ConvexError && isAppErrorData(error.data)) {
    const { code, message, fieldErrors } = error.data;
    return { code, message, fieldErrors: fieldErrors ?? {} };
  }
  return { code: "UNKNOWN", message: GENERIC_ERROR_MESSAGE, fieldErrors: {} };
}
