import { ConvexError } from "convex/values";

import type { ErrorCode, FieldErrors } from "../../src/domain/errors";

/** The one way backend code reports an expected failure to the client. */
export function appError(code: ErrorCode, message: string, fieldErrors?: FieldErrors) {
  // Convex values can't hold `undefined`, so the key is left out when there are no field errors.
  return new ConvexError(fieldErrors ? { code, message, fieldErrors } : { code, message });
}
