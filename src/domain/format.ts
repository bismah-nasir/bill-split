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
