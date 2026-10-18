/**
 * Bill History rules: the filters, how they're written in the URL, and how bills are matched
 * and ordered. Shared by the history page and the `trips.listHistory` query.
 */
import { isCategory, type Category } from "./categories";
import { normalizeText } from "./normalization";
import { isIsoDate } from "./trip-validation";

export const HISTORY_PAGE_SIZE = 20;
export const MAX_HISTORY_LIMIT = 200;
export const MAX_HISTORY_SEARCH_LENGTH = 80;

export const HISTORY_SORTS = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "total_desc", label: "Highest total" },
  { value: "total_asc", label: "Lowest total" },
] as const;

export type HistorySort = (typeof HISTORY_SORTS)[number]["value"];

export const HISTORY_OWNERSHIPS = [
  { value: "all", label: "All" },
  { value: "owned", label: "Created by me" },
  { value: "shared", label: "Shared with me" },
] as const;

export type HistoryOwnership = (typeof HISTORY_OWNERSHIPS)[number]["value"];

/** What the history page shows. Empty strings and `null` mean "no filter". */
export type HistoryFilters = {
  search: string;
  category: Category | null;
  from: string;
  to: string;
  ownership: HistoryOwnership;
  sort: HistorySort;
};

export const DEFAULT_HISTORY_FILTERS: HistoryFilters = {
  search: "",
  category: null,
  from: "",
  to: "",
  ownership: "all",
  sort: "date_desc",
};

function isHistorySort(value: string): value is HistorySort {
  return HISTORY_SORTS.some((sort) => sort.value === value);
}

function isHistoryOwnership(value: string): value is HistoryOwnership {
  return HISTORY_OWNERSHIPS.some((ownership) => ownership.value === value);
}

/**
 * Reads filters from the URL (`?q=&cat=&from=&to=&own=&sort=`). Anything unknown or malformed
 * (a hand-edited link) falls back to "no filter" rather than failing.
 */
export function parseHistoryParams(params: { get(name: string): string | null }): HistoryFilters {
  const category = params.get("cat") ?? "";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const ownership = params.get("own") ?? "";
  const sort = params.get("sort") ?? "";
  return {
    search: (params.get("q") ?? "").slice(0, MAX_HISTORY_SEARCH_LENGTH),
    category: isCategory(category) ? category : null,
    from: isIsoDate(from) ? from : "",
    to: isIsoDate(to) ? to : "",
    ownership: isHistoryOwnership(ownership) ? ownership : DEFAULT_HISTORY_FILTERS.ownership,
    sort: isHistorySort(sort) ? sort : DEFAULT_HISTORY_FILTERS.sort,
  };
}

/** The URL query for the filters, without a leading "?"; defaults are left out. */
export function historyFiltersToQuery(filters: HistoryFilters): string {
  const params = new URLSearchParams();
  // Kept as typed (not trimmed), so a pause after "oil " doesn't eat the space being typed.
  if (filters.search.trim()) params.set("q", filters.search);
  if (filters.category) params.set("cat", filters.category);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.ownership !== DEFAULT_HISTORY_FILTERS.ownership) params.set("own", filters.ownership);
  if (filters.sort !== DEFAULT_HISTORY_FILTERS.sort) params.set("sort", filters.sort);
  return params.toString();
}

/**
 * How many panel filters narrow the list: category, date range (one, however many ends are
 * set) and ownership. The search box and the sort order aren't counted.
 */
export function countPanelFilters(filters: HistoryFilters): number {
  return (
    Number(filters.category !== null) +
    Number(filters.from !== "" || filters.to !== "") +
    Number(filters.ownership !== DEFAULT_HISTORY_FILTERS.ownership)
  );
}

/** Whether nothing differs from the defaults, i.e. **Clear filters** would change nothing. */
export function isDefaultHistoryFilters(filters: HistoryFilters): boolean {
  return historyFiltersToQuery(filters) === "";
}

/** A range entered backwards ("from" after "to") is read the right way round. */
export function orderDateRange(from: string, to: string): { from: string; to: string } {
  return from && to && from > to ? { from: to, to: from } : { from, to };
}

/** The fields of a bill that the history filters and sorts look at. */
export type HistoryCandidate = {
  /** `buildTripSearchText()` of the bill: normalized title, store and item names. */
  searchText: string;
  category: Category;
  tripDate: string;
  totalPaisa: number;
  isOwner: boolean;
};

/** A validated, normalized history query (see `trips.listHistory`). */
export type HistoryQuery = {
  search: string;
  category: Category | null;
  from: string;
  to: string;
  ownership: HistoryOwnership;
  sort: HistorySort;
};

/** Case-insensitive substring search, category, inclusive date range and ownership. */
export function matchesHistoryQuery(bill: HistoryCandidate, query: HistoryQuery): boolean {
  const search = normalizeText(query.search);
  if (search && !bill.searchText.includes(search)) return false;
  if (query.category && bill.category !== query.category) return false;
  if (query.from && bill.tripDate < query.from) return false;
  if (query.to && bill.tripDate > query.to) return false;
  if (query.ownership === "owned" && !bill.isOwner) return false;
  if (query.ownership === "shared" && bill.isOwner) return false;
  return true;
}

/**
 * Orders bills that arrive newest first (by date, then newest created). Oldest first is the
 * exact reverse; equal totals keep the newest-first order.
 */
export function sortHistory<T extends HistoryCandidate>(newestFirst: T[], sort: HistorySort): T[] {
  switch (sort) {
    case "date_desc":
      return [...newestFirst];
    case "date_asc":
      return [...newestFirst].reverse();
    case "total_desc":
      return [...newestFirst].sort((a, b) => b.totalPaisa - a.totalPaisa);
    case "total_asc":
      return [...newestFirst].sort((a, b) => a.totalPaisa - b.totalPaisa);
  }
}

/** "1 bill", "12 bills". */
export function formatBillCount(count: number): string {
  return `${count} ${count === 1 ? "bill" : "bills"}`;
}
