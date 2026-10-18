import { describe, expect, it } from "vitest";

import {
  countPanelFilters,
  DEFAULT_HISTORY_FILTERS,
  formatBillCount,
  historyFiltersToQuery,
  isDefaultHistoryFilters,
  matchesHistoryQuery,
  orderDateRange,
  parseHistoryParams,
  sortHistory,
  type HistoryCandidate,
  type HistoryFilters,
} from "@/domain/bill-history";

const params = (query: string) => new URLSearchParams(query);

describe("parseHistoryParams", () => {
  it("reads every filter from the URL", () => {
    expect(
      parseHistoryParams(params("q=oil&cat=restaurant&from=2026-01-01&to=2026-02-01&own=shared&sort=total_asc")),
    ).toEqual({
      search: "oil",
      category: "restaurant",
      from: "2026-01-01",
      to: "2026-02-01",
      ownership: "shared",
      sort: "total_asc",
    });
  });

  it("uses the defaults for an empty URL", () => {
    expect(parseHistoryParams(params(""))).toEqual(DEFAULT_HISTORY_FILTERS);
  });

  it("drops unknown or malformed values", () => {
    expect(
      parseHistoryParams(params("cat=food&from=2026-02-30&to=yesterday&own=mine&sort=random")),
    ).toEqual(DEFAULT_HISTORY_FILTERS);
  });

  it("cuts a search to 80 characters", () => {
    expect(parseHistoryParams(params(`q=${"a".repeat(100)}`)).search).toHaveLength(80);
  });
});

describe("historyFiltersToQuery", () => {
  it("leaves defaults out", () => {
    expect(historyFiltersToQuery(DEFAULT_HISTORY_FILTERS)).toBe("");
    expect(historyFiltersToQuery({ ...DEFAULT_HISTORY_FILTERS, search: "   " })).toBe("");
  });

  it("writes the non-default filters in a fixed order", () => {
    const filters: HistoryFilters = {
      search: "cooking oil",
      category: "grocery",
      from: "2026-01-01",
      to: "2026-02-01",
      ownership: "owned",
      sort: "date_asc",
    };
    expect(historyFiltersToQuery(filters)).toBe(
      "q=cooking+oil&cat=grocery&from=2026-01-01&to=2026-02-01&own=owned&sort=date_asc",
    );
  });

  it("round-trips through parseHistoryParams", () => {
    const filters: HistoryFilters = {
      search: "Dalda & co ",
      category: "other",
      from: "",
      to: "2026-03-01",
      ownership: "shared",
      sort: "total_desc",
    };
    expect(parseHistoryParams(params(historyFiltersToQuery(filters)))).toEqual(filters);
  });
});

describe("countPanelFilters and isDefaultHistoryFilters", () => {
  it("counts category, date range and ownership, not search or sort", () => {
    expect(countPanelFilters(DEFAULT_HISTORY_FILTERS)).toBe(0);
    expect(countPanelFilters({ ...DEFAULT_HISTORY_FILTERS, search: "oil", sort: "total_asc" })).toBe(0);
    expect(countPanelFilters({ ...DEFAULT_HISTORY_FILTERS, from: "2026-01-01", to: "2026-02-01" })).toBe(1);
    expect(
      countPanelFilters({ ...DEFAULT_HISTORY_FILTERS, category: "grocery", to: "2026-02-01", ownership: "owned" }),
    ).toBe(3);
  });

  it("treats any change, including the sort, as non-default", () => {
    expect(isDefaultHistoryFilters(DEFAULT_HISTORY_FILTERS)).toBe(true);
    expect(isDefaultHistoryFilters({ ...DEFAULT_HISTORY_FILTERS, sort: "date_asc" })).toBe(false);
    expect(isDefaultHistoryFilters({ ...DEFAULT_HISTORY_FILTERS, search: "oil" })).toBe(false);
  });
});

describe("orderDateRange", () => {
  it("swaps a backwards range and keeps others", () => {
    expect(orderDateRange("2026-03-01", "2026-01-01")).toEqual({ from: "2026-01-01", to: "2026-03-01" });
    expect(orderDateRange("2026-01-01", "2026-03-01")).toEqual({ from: "2026-01-01", to: "2026-03-01" });
    expect(orderDateRange("2026-03-01", "")).toEqual({ from: "2026-03-01", to: "" });
    expect(orderDateRange("", "2026-01-01")).toEqual({ from: "", to: "2026-01-01" });
  });
});

const candidate = (overrides: Partial<HistoryCandidate> = {}): HistoryCandidate => ({
  searchText: "monthly shop imtiaz cooking oil",
  category: "grocery",
  tripDate: "2026-02-15",
  totalPaisa: 100_00,
  isOwner: true,
  ...overrides,
});

const query = { ...DEFAULT_HISTORY_FILTERS };

describe("matchesHistoryQuery", () => {
  it("searches case-insensitively with normalized spaces", () => {
    expect(matchesHistoryQuery(candidate(), { ...query, search: "  COOKING   Oil " })).toBe(true);
    expect(matchesHistoryQuery(candidate(), { ...query, search: "rice" })).toBe(false);
  });

  it("filters by category, inclusive dates and ownership", () => {
    expect(matchesHistoryQuery(candidate(), { ...query, category: "restaurant" })).toBe(false);
    expect(matchesHistoryQuery(candidate(), { ...query, from: "2026-02-15", to: "2026-02-15" })).toBe(true);
    expect(matchesHistoryQuery(candidate(), { ...query, from: "2026-02-16" })).toBe(false);
    expect(matchesHistoryQuery(candidate(), { ...query, to: "2026-02-14" })).toBe(false);
    expect(matchesHistoryQuery(candidate(), { ...query, ownership: "owned" })).toBe(true);
    expect(matchesHistoryQuery(candidate(), { ...query, ownership: "shared" })).toBe(false);
    expect(matchesHistoryQuery(candidate({ isOwner: false }), { ...query, ownership: "shared" })).toBe(true);
  });
});

describe("sortHistory", () => {
  const newestFirst = [
    candidate({ tripDate: "2026-03-01", totalPaisa: 200 }),
    candidate({ tripDate: "2026-02-01", totalPaisa: 500 }),
    candidate({ tripDate: "2026-01-01", totalPaisa: 200 }),
  ];
  const dates = (list: HistoryCandidate[]) => list.map((item) => item.tripDate);

  it("keeps, reverses or orders by total with ties newest first", () => {
    expect(dates(sortHistory(newestFirst, "date_desc"))).toEqual(["2026-03-01", "2026-02-01", "2026-01-01"]);
    expect(dates(sortHistory(newestFirst, "date_asc"))).toEqual(["2026-01-01", "2026-02-01", "2026-03-01"]);
    expect(dates(sortHistory(newestFirst, "total_desc"))).toEqual(["2026-02-01", "2026-03-01", "2026-01-01"]);
    expect(dates(sortHistory(newestFirst, "total_asc"))).toEqual(["2026-03-01", "2026-01-01", "2026-02-01"]);
  });

  it("doesn't change the input", () => {
    sortHistory(newestFirst, "date_asc");
    expect(dates(newestFirst)).toEqual(["2026-03-01", "2026-02-01", "2026-01-01"]);
  });
});

describe("formatBillCount", () => {
  it("pluralizes", () => {
    expect(formatBillCount(0)).toBe("0 bills");
    expect(formatBillCount(1)).toBe("1 bill");
    expect(formatBillCount(12)).toBe("12 bills");
  });
});
