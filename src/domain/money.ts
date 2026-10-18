/**
 * Money and quantity rules. All money is integer paisa (Rs. 1 = 100 paisa) and all
 * quantities are integer thousandths (`quantityMilli`, so 1.5 is 1500). Nothing here
 * uses floating-point arithmetic on money.
 */
import type { Result } from "./types";

export const MAX_PRICE_PAISA = 1_000_000_000; // Rs. 10,000,000.00
export const MAX_QUANTITY_MILLI = 100_000_000; // 100,000

const PRICE_PATTERN = /^(\d+)(?:\.(\d{1,2}))?$/;
const MAX_PRICE_RUPEE_DIGITS = 8;

/** "1,250.5" -> 125050. Accepts digits with optional commas and up to 2 decimals. */
export function parseRupeesToPaisa(input: string): Result<number> {
  const text = input.trim().replace(/,/g, "");
  if (text.length === 0) return { ok: false, error: "Enter a price" };
  const match = PRICE_PATTERN.exec(text);
  if (!match) return { ok: false, error: "Enter a valid amount, e.g. 250 or 250.50" };

  const [, rupees, fraction = ""] = match;
  // Checked on the digits, so a huge value can't lose precision before the comparison.
  if (rupees.replace(/^0+/, "").length > MAX_PRICE_RUPEE_DIGITS) {
    return { ok: false, error: "Price is too large" };
  }
  const paisa = Number(rupees) * 100 + Number(fraction.padEnd(2, "0"));
  if (paisa > MAX_PRICE_PAISA) return { ok: false, error: "Price is too large" };
  return { ok: true, value: paisa };
}

const QUANTITY_PATTERN = /^(\d+)(?:\.(\d+))?$/;
const MAX_QUANTITY_DIGITS = 6;

/** "1.5" -> 1500. Up to 3 decimals, > 0, <= 100,000. */
export function parseQuantityToMilli(input: string): Result<number> {
  const text = input.trim();
  if (text.length === 0) return { ok: false, error: "Enter a quantity" };
  if (/^-\d+(?:\.\d+)?$/.test(text)) {
    return { ok: false, error: "Quantity must be greater than 0" };
  }
  const match = QUANTITY_PATTERN.exec(text);
  if (!match) return { ok: false, error: "Enter a valid quantity, e.g. 1 or 1.5" };

  const [, whole, fraction = ""] = match;
  if (fraction.length > 3) return { ok: false, error: "Use up to 3 decimal places" };
  if (whole.replace(/^0+/, "").length > MAX_QUANTITY_DIGITS) {
    return { ok: false, error: "Quantity is too large" };
  }
  const milli = Number(whole) * 1000 + Number(fraction.padEnd(3, "0"));
  if (milli === 0) return { ok: false, error: "Quantity must be greater than 0" };
  if (milli > MAX_QUANTITY_MILLI) return { ok: false, error: "Quantity is too large" };
  return { ok: true, value: milli };
}

/** Quantity × unit price in paisa, rounded to the nearest paisa (half-up). */
export function lineTotalPaisa(quantityMilli: number, unitPricePaisa: number): number {
  // BigInt keeps the product exact; constructed with BigInt() rather than `n` literals.
  const product = BigInt(quantityMilli) * BigInt(unitPricePaisa);
  return Number((product + BigInt(500)) / BigInt(1000));
}

export type Allocation = { personKey: string; amountPaisa: number };

/**
 * Splits `totalPaisa` equally between `personKeys`, which must already be in bill order
 * (by position) and are not re-sorted. Everyone gets floor(total / n); the first
 * (total % n) people in that order get one paisa more, so the amounts always sum to the
 * total and the same bill always splits the same way. Throws on an empty or duplicate list.
 */
export function allocateEqually(totalPaisa: number, personKeys: string[]): Allocation[] {
  if (personKeys.length === 0) throw new Error("allocateEqually needs at least one person");
  if (new Set(personKeys).size !== personKeys.length) {
    throw new Error("allocateEqually got duplicate person keys");
  }
  const count = personKeys.length;
  const base = Math.floor(totalPaisa / count);
  const remainder = totalPaisa - base * count;
  return personKeys.map((personKey, index) => ({
    personKey,
    amountPaisa: index < remainder ? base + 1 : base,
  }));
}

export type BillItemInput = { quantityMilli: number; unitPricePaisa: number; assigneeKeys: string[] };

export type ShareContribution = { itemIndex: number; amountPaisa: number; splitCount: number };

export type ComputedBill = {
  items: { lineTotalPaisa: number; allocations: Allocation[] }[];
  totalPaisa: number;
  shares: { personKey: string; totalPaisa: number; contributions: ShareContribution[] }[];
  /** Σ shares === totalPaisa. */
  reconciled: boolean;
};

/**
 * Line totals, per-item allocations and per-person shares for a bill. `peopleOrder` lists
 * every person key in bill order; each item's assignees are sorted by it before allocating.
 * `shares` has one entry per person in `peopleOrder`, including people with Rs. 0.
 * Throws if an item names a person who isn't in `peopleOrder`.
 */
export function computeBill(items: BillItemInput[], peopleOrder: string[]): ComputedBill {
  const position = new Map(peopleOrder.map((key, index) => [key, index]));
  const shares = peopleOrder.map((personKey) => ({
    personKey,
    totalPaisa: 0,
    contributions: [] as ShareContribution[],
  }));

  let totalPaisa = 0;
  const computedItems = items.map((item, itemIndex) => {
    const lineTotal = lineTotalPaisa(item.quantityMilli, item.unitPricePaisa);
    totalPaisa += lineTotal;
    const ordered = [...item.assigneeKeys].sort((a, b) => positionOf(a) - positionOf(b));
    const allocations = allocateEqually(lineTotal, ordered);
    for (const allocation of allocations) {
      const share = shares[positionOf(allocation.personKey)];
      share.totalPaisa += allocation.amountPaisa;
      share.contributions.push({
        itemIndex,
        amountPaisa: allocation.amountPaisa,
        splitCount: allocations.length,
      });
    }
    return { lineTotalPaisa: lineTotal, allocations };
  });

  const sharesTotal = shares.reduce((sum, share) => sum + share.totalPaisa, 0);
  return { items: computedItems, totalPaisa, shares, reconciled: sharesTotal === totalPaisa };

  function positionOf(key: string): number {
    const index = position.get(key);
    if (index === undefined) throw new Error(`computeBill: unknown person key "${key}"`);
    return index;
  }
}
