import { describe, expect, it } from "vitest";

import {
  isValidPassword,
  validateName,
  validateSignIn,
  validateSignUp,
  type SignUpInput,
} from "../../src/domain/auth-validation";

const valid: SignUpInput = {
  name: "Alice",
  email: "alice@example.com",
  password: "testpass123",
  confirmPassword: "testpass123",
};

function signUpErrors(overrides: Partial<SignUpInput>) {
  const result = validateSignUp({ ...valid, ...overrides });
  return result.ok ? {} : result.fieldErrors;
}

describe("validateName", () => {
  it("trims the name", () => {
    expect(validateName("  Alice  ")).toEqual({ ok: true, value: "Alice" });
  });

  it("requires a name", () => {
    expect(validateName("   ")).toEqual({ ok: false, error: "Enter your name" });
  });

  it("accepts 60 characters and rejects 61", () => {
    expect(validateName("a".repeat(60)).ok).toBe(true);
    expect(validateName("a".repeat(61))).toEqual({
      ok: false,
      error: "Name must be 60 characters or fewer",
    });
  });
});

describe("isValidPassword", () => {
  it("accepts 8 to 128 characters", () => {
    expect(isValidPassword("a".repeat(7))).toBe(false);
    expect(isValidPassword("a".repeat(8))).toBe(true);
    expect(isValidPassword("a".repeat(128))).toBe(true);
    expect(isValidPassword("a".repeat(129))).toBe(false);
  });

  it("doesn't trim, so spaces count", () => {
    expect(isValidPassword("   pass   ")).toBe(true);
  });
});

describe("validateSignUp", () => {
  it("returns trimmed name, normalized email and the password, without confirmPassword", () => {
    const result = validateSignUp({ ...valid, name: "  Alice ", email: " Alice@Example.COM " });
    expect(result).toEqual({
      ok: true,
      value: { name: "Alice", email: "alice@example.com", password: "testpass123" },
    });
  });

  it("reports every empty field", () => {
    expect(signUpErrors({ name: "", email: "", password: "", confirmPassword: "" })).toEqual({
      name: "Enter your name",
      email: "Enter your email",
      password: "Enter a password",
      confirmPassword: "Confirm your password",
    });
  });

  it("rejects a 61-character name", () => {
    expect(signUpErrors({ name: "a".repeat(61) })).toEqual({
      name: "Name must be 60 characters or fewer",
    });
  });

  it("rejects an invalid email", () => {
    expect(signUpErrors({ email: "alice@" })).toEqual({ email: "Enter a valid email address" });
  });

  it("rejects a 7-character password and accepts an 8-character one", () => {
    expect(signUpErrors({ password: "1234567", confirmPassword: "1234567" })).toEqual({
      password: "Password must be at least 8 characters",
    });
    expect(signUpErrors({ password: "12345678", confirmPassword: "12345678" })).toEqual({});
  });

  it("rejects a 129-character password", () => {
    const long = "a".repeat(129);
    expect(signUpErrors({ password: long, confirmPassword: long })).toEqual({
      password: "Password must be 128 characters or fewer",
    });
  });

  it("rejects a confirmation that doesn't match", () => {
    expect(signUpErrors({ confirmPassword: "testpass124" })).toEqual({
      confirmPassword: "Passwords don't match",
    });
  });
});

describe("validateSignIn", () => {
  it("normalizes the email and keeps the password as typed", () => {
    expect(validateSignIn({ email: " Alice@Example.com ", password: " secret " })).toEqual({
      ok: true,
      value: { email: "alice@example.com", password: " secret " },
    });
  });

  it("only checks that both fields are filled in", () => {
    expect(validateSignIn({ email: "", password: "" })).toEqual({
      ok: false,
      fieldErrors: { email: "Enter your email", password: "Enter your password" },
    });
    // No format or length rules on sign-in.
    expect(validateSignIn({ email: "not-an-email", password: "x" }).ok).toBe(true);
  });
});
