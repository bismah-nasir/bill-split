/** NFKC, lowercase, trimmed, with internal whitespace collapsed to one space. */
export function normalizeText(input: string): string {
  return input.normalize("NFKC").toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * The form of a username used for uniqueness and lookup: NFKC, lowercase, trimmed.
 * Internal spaces are kept (not collapsed or removed), so "has space" stays invalid
 * instead of silently becoming "hasspace".
 */
export function normalizeUsername(input: string): string {
  return input.normalize("NFKC").toLowerCase().trim();
}

const USERNAME_PATTERN = /^[a-z][a-z0-9_]{2,19}$/;

export const USERNAME_RULES = "3–20 characters: letters, numbers, underscore; start with a letter";

/** 3–20 characters of letters, digits or underscore, starting with a letter (case-insensitive). */
export function isValidUsername(input: string): boolean {
  return USERNAME_PATTERN.test(normalizeUsername(input));
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

/** Deliberately simple format check; emails are never verified. */
export function isValidEmail(input: string): boolean {
  const email = normalizeEmail(input);
  return email.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(email);
}
