import { describe, expect, it } from "vitest";

import { toAuthError } from "../../src/lib/auth/errors";

/** What the browser receives from Convex Auth's Next.js proxy (captured from a dev deployment). */
function proxyError(data: object): Error {
  return new Error(
    `[Request ID: 61ffaf80fd3f7237] Server Error\nUncaught ConvexError: ${JSON.stringify(data)}\n`,
  );
}

describe("toAuthError", () => {
  it("shows one generic message for a wrong email or password", () => {
    const error = proxyError({ code: "AUTH_INVALID_CREDENTIALS", message: "Email or password is incorrect." });
    expect(toAuthError(error, "signIn")).toEqual({ message: "Email or password is incorrect." });
  });

  it("puts an existing email on the email field during sign-up", () => {
    const message = "An account with this email already exists. Sign in instead.";
    const error = proxyError({ code: "AUTH_EMAIL_TAKEN", message, fieldErrors: { email: message } });
    expect(toAuthError(error, "signUp")).toEqual({ fieldErrors: { email: message } });
  });

  it("reports too many attempts", () => {
    const message = "Too many attempts. Wait a few minutes and try again.";
    expect(toAuthError(proxyError({ code: "AUTH_RATE_LIMITED", message }), "signIn")).toEqual({ message });
  });

  it("maps validation errors to the form's fields", () => {
    const error = proxyError({
      code: "VALIDATION",
      message: "Enter your name",
      fieldErrors: { name: "Enter your name" },
    });
    expect(toAuthError(error, "signUp")).toEqual({ fieldErrors: { name: "Enter your name" } });
  });

  it("falls back to the message when no field belongs to the form", () => {
    const error = proxyError({
      code: "VALIDATION",
      message: "Enter your name",
      fieldErrors: { name: "Enter your name" },
    });
    expect(toAuthError(error, "signIn")).toEqual({ message: "Enter your name" });
  });

  it.each([
    new Error("[Request ID: 1] Server Error"),
    new Error("Failed to fetch"),
    proxyError({ code: "NOT_A_CODE", message: "Internal detail" }),
    "a string",
    null,
  ])("hides anything else behind a friendly message (%#)", (error) => {
    expect(toAuthError(error, "signIn")).toEqual({ message: "Something went wrong. Please try again." });
  });
});
