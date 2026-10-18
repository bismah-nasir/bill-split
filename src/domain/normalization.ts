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

// Unit synonyms, matched after normalizeText. Anything not listed is kept as typed.
const UNIT_SYNONYMS: Record<string, string> = {
  ...synonyms("l", ["l", "ltr", "litre", "liter", "litres", "liters"]),
  ...synonyms("ml", ["ml", "millilitre", "milliliter"]),
  ...synonyms("kg", ["kg", "kgs", "kilo", "kilogram", "kilograms"]),
  ...synonyms("g", ["g", "gm", "gms", "gram", "grams"]),
  ...synonyms("item", ["pc", "pcs", "piece", "pieces", "item", "items"]),
  ...synonyms("pack", ["pack", "packs", "pk", "packet"]),
  ...synonyms("dozen", ["dozen", "dz"]),
};

function synonyms(unit: string, words: string[]): Record<string, string> {
  return Object.fromEntries(words.map((word) => [word, unit]));
}

/** "Litres" -> "l", "gms" -> "g". Unknown units are only normalized as text. */
export function normalizeUnit(input: string): string {
  const unit = normalizeText(input);
  return UNIT_SYNONYMS[unit] ?? unit;
}

const AMOUNT_WITH_UNIT = /(\d+(?:\.\d+)?)\s*([a-z]+)\b/g;

/** "1 Litre" -> "1l", "500 gm" -> "500g". Words that aren't units are left alone. */
export function normalizePackSize(input: string): string {
  return normalizeText(input).replace(AMOUNT_WITH_UNIT, (token, amount: string, word: string) => {
    const unit = UNIT_SYNONYMS[word];
    return unit === undefined ? token : `${amount}${unit}`;
  });
}

export type ProductFields = {
  name: string;
  brand?: string;
  variant?: string;
  packSize?: string;
  unit?: string;
};

/**
 * Identifies "the same product" for price history. Every field is its own segment, so a
 * missing pack size or unit gives a different key: ambiguous records are never merged.
 */
export function buildProductMatchKey(product: ProductFields): string {
  return [
    normalizeText(product.name),
    normalizeText(product.brand ?? ""),
    normalizeText(product.variant ?? ""),
    normalizePackSize(product.packSize ?? ""),
    normalizeUnit(product.unit ?? ""),
  ].join("|");
}

/** The text Bill History searches: title, store and item names, normalized. */
export function buildTripSearchText(
  title: string,
  storeName: string | undefined,
  itemNames: string[],
): string {
  return normalizeText([title, storeName ?? "", ...itemNames].join(" "));
}
