import { isValidEmail, normalizeEmail } from "./normalization";
import type { Result } from "./types";

export type SignUpInput = { name: string; email: string; password: string; confirmPassword: string };
export type SignInInput = { email: string; password: string };
type FieldErrors<T> = Partial<Record<keyof T, string>>;

export const MAX_NAME_LENGTH = 60;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

/** Trimmed, 1–60 characters. */
export function validateName(input: string): Result<string> {
  const name = input.trim();
  if (name.length === 0) return { ok: false, error: "Enter your name" };
  if (name.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `Name must be ${MAX_NAME_LENGTH} characters or fewer` };
  }
  return { ok: true, value: name };
}

export function validateEmail(input: string): Result<string> {
  const email = normalizeEmail(input);
  if (email.length === 0) return { ok: false, error: "Enter your email" };
  if (!isValidEmail(email)) return { ok: false, error: "Enter a valid email address" };
  return { ok: true, value: email };
}

/** 8–128 characters. Passwords are never trimmed. */
export function validatePassword(input: string): Result<string> {
  if (input.length === 0) return { ok: false, error: "Enter a password" };
  if (input.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  if (input.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, error: `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer` };
  }
  return { ok: true, value: input };
}

export function isValidPassword(input: string): boolean {
  return validatePassword(input).ok;
}

/** The returned value has a normalized email and no `confirmPassword`. */
export function validateSignUp(
  input: SignUpInput,
):
  | { ok: true; value: { name: string; email: string; password: string } }
  | { ok: false; fieldErrors: FieldErrors<SignUpInput> } {
  const fieldErrors: FieldErrors<SignUpInput> = {};

  const name = validateName(input.name);
  if (!name.ok) fieldErrors.name = name.error;

  const email = validateEmail(input.email);
  if (!email.ok) fieldErrors.email = email.error;

  const password = validatePassword(input.password);
  if (!password.ok) fieldErrors.password = password.error;

  if (input.confirmPassword.length === 0) {
    fieldErrors.confirmPassword = "Confirm your password";
  } else if (input.confirmPassword !== input.password) {
    fieldErrors.confirmPassword = "Passwords don't match";
  }

  if (!name.ok || !email.ok || !password.ok || fieldErrors.confirmPassword !== undefined) {
    return { ok: false, fieldErrors };
  }
  return { ok: true, value: { name: name.value, email: email.value, password: password.value } };
}

/** Presence checks only: sign-in never reveals the password rules. */
export function validateSignIn(
  input: SignInInput,
):
  | { ok: true; value: { email: string; password: string } }
  | { ok: false; fieldErrors: FieldErrors<SignInInput> } {
  const fieldErrors: FieldErrors<SignInInput> = {};
  const email = normalizeEmail(input.email);
  if (email.length === 0) fieldErrors.email = "Enter your email";
  if (input.password.length === 0) fieldErrors.password = "Enter your password";

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };
  return { ok: true, value: { email, password: input.password } };
}
