import { describe, expect, it } from "vitest";

import {
  createdTotalCaption,
  currentMonth,
  formatMonthLong,
  formatMonthShort,
  isDateInMonth,
  isMonth,
  monthDateRange,
  monthName,
  shiftMonth,
  yourShareCaption,
} from "@/domain/spending-summary";

describe("isMonth", () => {
  it.each(["2026-01", "2026-10", "2026-12", "1999-09"])("accepts %s", (month) => {
    expect(isMonth(month)).toBe(true);
  });

  it.each(["2026-00", "2026-13", "2026-1", "26-10", "2026-10-01", " 2026-10", ""])("rejects %j", (month) => {
    expect(isMonth(month)).toBe(false);
  });
});

describe("currentMonth", () => {
  it("uses the local date", () => {
    expect(currentMonth(new Date(2026, 0, 31, 23, 59))).toBe("2026-01");
    expect(currentMonth(new Date(2026, 9, 1, 0, 0))).toBe("2026-10");
  });
});

describe("shiftMonth", () => {
  it("moves across year boundaries", () => {
    expect(shiftMonth("2026-10", -1)).toBe("2026-09");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-10", -22)).toBe("2024-12");
    expect(shiftMonth("2026-10", 0)).toBe("2026-10");
  });
});

describe("month ranges", () => {
  it("covers every day of the month", () => {
    expect(monthDateRange("2026-02")).toEqual({ from: "2026-02-01", to: "2026-02-31" });
    expect(isDateInMonth("2026-10-01", "2026-10")).toBe(true);
    expect(isDateInMonth("2026-10-31", "2026-10")).toBe(true);
    expect(isDateInMonth("2026-11-01", "2026-10")).toBe(false);
    expect(isDateInMonth("2025-10-15", "2026-10")).toBe(false);
  });
});

describe("labels", () => {
  it("names months", () => {
    expect(monthName("2026-10")).toBe("October");
    expect(formatMonthShort("2026-10")).toBe("Oct 2026");
    expect(formatMonthLong("2026-01")).toBe("January 2026");
  });

  it("keeps the two meanings in separate captions", () => {
    expect(yourShareCaption(3, "2026-10")).toBe("Your portion of 3 bills dated in October");
    expect(yourShareCaption(1, "2026-10")).toBe("Your portion of 1 bill dated in October");
    expect(yourShareCaption(0, "2026-09")).toBe("Your portion of 0 bills dated in September");
    expect(createdTotalCaption(2, "2026-10")).toBe("Total of 2 bills you created in October");
    expect(createdTotalCaption(1, "2026-10")).toBe("Total of 1 bill you created in October");
  });
});
