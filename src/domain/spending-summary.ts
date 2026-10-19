/**
 * The dashboard's monthly spending summary. A month is a "YYYY-MM" string; bill dates are
 * "YYYY-MM-DD", so a bill is in a month when its date starts with it. No timezone conversion.
 */

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** "2026-10" -> true; "2026-13", "2026-1", "2026-10-01" -> false. */
export function isMonth(value: string): boolean {
  return MONTH_PATTERN.test(value);
}

/** The current month in the browser's local timezone, e.g. "2026-10". */
export function currentMonth(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
}

/** ("2026-01", -1) -> "2025-12"; ("2026-12", 1) -> "2027-01". */
export function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const index = year * 12 + (monthNumber - 1) + delta;
  return `${Math.floor(index / 12)}-${pad2((index % 12) + 1)}`;
}

/** The first and last possible bill dates of a month, for an inclusive range on `tripDate`. */
export function monthDateRange(month: string): { from: string; to: string } {
  return { from: `${month}-01`, to: `${month}-31` };
}

/** "2026-10-16" is in "2026-10". */
export function isDateInMonth(isoDate: string, month: string): boolean {
  return isoDate.startsWith(`${month}-`);
}

/** "2026-10" -> "October". */
export function monthName(month: string): string {
  return MONTH_NAMES[Number(month.slice(5, 7)) - 1];
}

/** "2026-10" -> "Oct 2026", for the month switcher. */
export function formatMonthShort(month: string): string {
  return `${monthName(month).slice(0, 3)} ${month.slice(0, 4)}`;
}

/** "2026-10" -> "October 2026", for screen readers. */
export function formatMonthLong(month: string): string {
  return `${monthName(month)} ${month.slice(0, 4)}`;
}

function bills(count: number): string {
  return count === 1 ? "1 bill" : `${count} bills`;
}

/** "Your portion of 3 bills dated in October". */
export function yourShareCaption(billCount: number, month: string): string {
  return `Your portion of ${bills(billCount)} dated in ${monthName(month)}`;
}

/** "Total of 2 bills you created in October". */
export function createdTotalCaption(billCount: number, month: string): string {
  return `Total of ${bills(billCount)} you created in ${monthName(month)}`;
}
