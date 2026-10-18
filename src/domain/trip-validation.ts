/**
 * Validation for a bill's details, people and items. Used by the bill form (inline errors)
 * and by Convex (the authoritative check). Field errors are keyed like `title`,
 * `people.2.name`, `items.3.unitPrice` or `items.3.assignees`.
 */
import { isCategory, type Category } from "./categories";
import { todayIsoDate } from "./format";
import { parseQuantityToMilli, parseRupeesToPaisa } from "./money";
import { normalizeText } from "./normalization";
import type { Result } from "./types";

export const MAX_ITEMS_PER_TRIP = 200;
/** The owner plus everyone named on the bill. */
export const MAX_PEOPLE_PER_TRIP = 20;

const MAX_TITLE_LENGTH = 80;
const MAX_STORE_LENGTH = 60;
const MAX_ITEM_NAME_LENGTH = 80;
const MAX_ITEM_DETAIL_LENGTH = 40;
const MAX_PERSON_NAME_LENGTH = 40;

/** The assignee key of the bill's owner, on every bill. */
export const OWNER_KEY = "owner";

export type TripDetailsInput = { title: string; storeName: string; tripDate: string; category: Category };

/**
 * Everyone on the bill except the owner, in bill order. `key` is the existing person's ID,
 * or a temporary client key such as "new:1" for a person added in this form.
 */
export type PersonInput = { key: string; personId?: string; name: string };

export type ItemInput = {
  itemId?: string;
  name: string;
  brand: string;
  variant: string;
  packSize: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  /** `OWNER_KEY` or `PersonInput` keys. */
  assigneeKeys: string[];
};

export type ValidatedItem = {
  itemId?: string;
  name: string;
  brand?: string;
  variant?: string;
  packSize?: string;
  unit?: string;
  quantityMilli: number;
  unitPricePaisa: number;
  /** Deduplicated; each is `OWNER_KEY` or a key in `people`. */
  assigneeKeys: string[];
};

export type ValidatedTrip = {
  details: { title: string; storeName?: string; tripDate: string; category: Category };
  people: { key: string; personId?: string; name: string; nameNormalized: string }[];
  items: ValidatedItem[];
};

export type TripValidationResult =
  | { ok: true; value: ValidatedTrip }
  | { ok: false; fieldErrors: Record<string, string> };

/** Trimmed, 1–40 characters. */
export function validatePersonName(input: string): Result<string> {
  const name = input.trim();
  if (name.length === 0) return { ok: false, error: "Enter a name" };
  if (name.length > MAX_PERSON_NAME_LENGTH) {
    return { ok: false, error: `Name must be ${MAX_PERSON_NAME_LENGTH} characters or fewer` };
  }
  return { ok: true, value: name };
}

type Options = {
  /** "YYYY-MM-DD" the 1-year future limit counts from. Defaults to today (local time). */
  today?: string;
};

export function validateTripInput(
  details: TripDetailsInput,
  people: PersonInput[],
  items: ItemInput[],
  options: Options = {},
): TripValidationResult {
  const fieldErrors: Record<string, string> = {};
  const fail = (key: string, message: string) => {
    fieldErrors[key] ??= message;
  };

  // Details
  const title = details.title.trim();
  if (title.length === 0) fail("title", "Enter a title");
  else if (title.length > MAX_TITLE_LENGTH) {
    fail("title", `Title must be ${MAX_TITLE_LENGTH} characters or fewer`);
  }
  const storeName = optionalText(details.storeName);
  if (storeName !== undefined && storeName.length > MAX_STORE_LENGTH) {
    fail("storeName", `Store must be ${MAX_STORE_LENGTH} characters or fewer`);
  }
  const dateError = tripDateError(details.tripDate, options.today ?? todayIsoDate());
  if (dateError) fail("tripDate", dateError);
  if (!isCategory(details.category)) fail("category", "Choose a category");

  // People
  if (people.length > MAX_PEOPLE_PER_TRIP - 1) {
    fail("people", `A bill can have at most ${MAX_PEOPLE_PER_TRIP} people, including you`);
  }
  const personKeys = new Set<string>();
  const personNames = new Set<string>();
  const validPeople: ValidatedTrip["people"] = [];
  people.forEach((person, index) => {
    if (person.key === OWNER_KEY || personKeys.has(person.key)) {
      fail("people", "Something's wrong with the people on this bill. Reload and try again.");
    }
    personKeys.add(person.key);
    const name = validatePersonName(person.name);
    if (!name.ok) {
      fail(`people.${index}.name`, name.error);
      return;
    }
    const nameNormalized = normalizeText(name.value);
    if (personNames.has(nameNormalized)) {
      fail(`people.${index}.name`, "Someone on this bill already has that name");
    }
    personNames.add(nameNormalized);
    validPeople.push({ key: person.key, personId: person.personId, name: name.value, nameNormalized });
  });

  // Items
  if (items.length === 0) fail("items", "Add at least one item");
  else if (items.length > MAX_ITEMS_PER_TRIP) {
    fail("items", `A bill can have at most ${MAX_ITEMS_PER_TRIP} items`);
  }
  const validItems: ValidatedItem[] = [];
  items.forEach((item, index) => {
    const field = (name: string) => `items.${index}.${name}`;

    const name = item.name.trim();
    if (name.length === 0) fail(field("name"), "Enter an item name");
    else if (name.length > MAX_ITEM_NAME_LENGTH) {
      fail(field("name"), `Item name must be ${MAX_ITEM_NAME_LENGTH} characters or fewer`);
    }
    const extras = {
      brand: optionalText(item.brand),
      variant: optionalText(item.variant),
      packSize: optionalText(item.packSize),
      unit: optionalText(item.unit),
    };
    for (const [key, value] of Object.entries(extras)) {
      if (value !== undefined && value.length > MAX_ITEM_DETAIL_LENGTH) {
        fail(field(key), `${EXTRA_LABELS[key]} must be ${MAX_ITEM_DETAIL_LENGTH} characters or fewer`);
      }
    }
    const quantity = parseQuantityToMilli(item.quantity);
    if (!quantity.ok) fail(field("quantity"), quantity.error);
    const unitPrice = parseRupeesToPaisa(item.unitPrice);
    if (!unitPrice.ok) fail(field("unitPrice"), unitPrice.error);

    const assigneeKeys = [...new Set(item.assigneeKeys)];
    if (assigneeKeys.length === 0) fail(field("assignees"), "Choose who pays for this item");
    else if (assigneeKeys.some((key) => key !== OWNER_KEY && !personKeys.has(key))) {
      fail(field("assignees"), "Choose people from this bill");
    }

    if (quantity.ok && unitPrice.ok) {
      validItems.push({
        itemId: item.itemId,
        name,
        ...extras,
        quantityMilli: quantity.value,
        unitPricePaisa: unitPrice.value,
        assigneeKeys,
      });
    }
  });

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };
  return {
    ok: true,
    value: {
      details: { title, storeName, tripDate: details.tripDate, category: details.category },
      people: validPeople,
      items: validItems,
    },
  };
}

const EXTRA_LABELS: Record<string, string> = {
  brand: "Brand",
  variant: "Variant",
  packSize: "Pack size",
  unit: "Unit",
};

/** Trimmed; an empty string becomes `undefined`. */
function optionalText(input: string): string | undefined {
  const text = input.trim();
  return text.length > 0 ? text : undefined;
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function tripDateError(tripDate: string, today: string): string | null {
  if (tripDate.length === 0) return "Enter a date";
  const match = DATE_PATTERN.exec(tripDate);
  if (!match) return "Enter a valid date";
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return "Enter a valid date";
  }
  if (tripDate > oneYearAfter(today)) return "The date can't be more than a year from now";
  return null;
}

/** "2026-10-17" -> "2027-10-17". ISO dates compare correctly as strings. */
function oneYearAfter(isoDate: string): string {
  const match = DATE_PATTERN.exec(isoDate);
  if (!match) return isoDate;
  return `${Number(match[1]) + 1}-${match[2]}-${match[3]}`;
}
