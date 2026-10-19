/**
 * Display formatting for money and dates. Pure TypeScript: money is integer
 * paisa (Rs. 1 = 100 paisa) and is never converted to a float; trip dates are
 * date-only "YYYY-MM-DD" strings and are never timezone-converted.
 */

const rupeeGrouping = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** 123456 -> "Rs. 1,234.56". Negative amounts get a leading minus sign (−). */
export function formatPaisa(paisa: number): string {
  if (!Number.isSafeInteger(paisa)) {
    throw new Error(`formatPaisa expects an integer number of paisa, got ${paisa}`);
  }
  const sign = paisa < 0 ? "−" : "";
  const abs = Math.abs(paisa);
  const rupees = Math.trunc(abs / 100);
  const fraction = String(abs % 100).padStart(2, "0");
  return `${sign}Rs. ${rupeeGrouping.format(rupees)}.${fraction}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Today's date in the browser's local timezone as "YYYY-MM-DD".
 * Built from local getters — `toISOString()` would shift the date to UTC.
 */
export function todayIsoDate(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "2026-10-16" -> "16 Oct 2026". The string is split into parts and checked
 * against a UTC date, so the result never depends on the local timezone.
 * Returns the input unchanged if it isn't a real calendar date.
 */
export function formatTripDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return isoDate;
  }
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** 1500 -> "1.5", 2000 -> "2". For edit forms and quantity labels; no trailing zeros. */
export function milliToInput(quantityMilli: number): string {
  const whole = Math.trunc(quantityMilli / 1000);
  const fraction = String(quantityMilli % 1000).padStart(3, "0").replace(/0+$/, "");
  return fraction.length > 0 ? `${whole}.${fraction}` : String(whole);
}

/** (1500, "kg") -> "1.5 kg"; (2000) -> "2". */
export function formatQuantity(quantityMilli: number, unit?: string | null): string {
  const quantity = milliToInput(quantityMilli);
  return unit ? `${quantity} ${unit}` : quantity;
}

/** 12.5 -> "+12.5%", -3 -> "−3.0%", 0 -> "0%". One decimal; the minus sign is "−". */
export function formatPercent(percent: number): string {
  if (percent === 0) return "0%";
  const sign = percent > 0 ? "+" : "−";
  return `${sign}${Math.abs(percent).toFixed(1)}%`;
}

/** ("Dalda", null, "1 litre") -> "Dalda · 1 litre"; `null` when every part is empty. */
export function joinDetails(...parts: (string | null | undefined)[]): string | null {
  const present = parts.filter((part) => part);
  return present.length > 0 ? present.join(" · ") : null;
}

/** 123456 -> "1234.56", 12550 -> "125.50", 50000 -> "500". For edit forms: no grouping commas. */
export function paisaToInput(paisa: number): string {
  if (!Number.isSafeInteger(paisa) || paisa < 0) {
    throw new Error(`paisaToInput expects a non-negative integer number of paisa, got ${paisa}`);
  }
  const rupees = Math.trunc(paisa / 100);
  const fraction = paisa % 100;
  return fraction === 0 ? String(rupees) : `${rupees}.${String(fraction).padStart(2, "0")}`;
}
