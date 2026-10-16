import { afterEach, describe, expect, it } from "vitest";
import { formatPaisa, formatTripDate, todayIsoDate } from "../../src/domain/format";

describe("formatPaisa", () => {
  it.each([
    [0, "Rs. 0.00"],
    [5, "Rs. 0.05"],
    [123456, "Rs. 1,234.56"],
    [100000000, "Rs. 1,000,000.00"],
    [-12345, "−Rs. 123.45"],
  ])("formats %i paisa as %s", (paisa, expected) => {
    expect(formatPaisa(paisa)).toBe(expected);
  });

  it("rejects non-integer amounts", () => {
    expect(() => formatPaisa(1.5)).toThrow();
  });
});

describe("todayIsoDate", () => {
  it("uses the local calendar date, zero-padded", () => {
    expect(todayIsoDate(new Date(2026, 0, 1, 23, 30))).toBe("2026-01-01");
    expect(todayIsoDate(new Date(2026, 9, 16, 0, 5))).toBe("2026-10-16");
  });
});

describe("formatTripDate", () => {
  const originalTz = process.env.TZ;
  afterEach(() => {
    process.env.TZ = originalTz;
  });

  it.each(["UTC", "Asia/Karachi", "America/Los_Angeles", "Pacific/Kiritimati"])(
    "formats 2026-01-01 as 1 Jan 2026 in %s",
    (tz) => {
      process.env.TZ = tz;
      expect(formatTripDate("2026-01-01")).toBe("1 Jan 2026");
    },
  );

  it("formats other dates", () => {
    expect(formatTripDate("2026-10-16")).toBe("16 Oct 2026");
    expect(formatTripDate("2024-02-29")).toBe("29 Feb 2024");
  });

  it("returns invalid input unchanged", () => {
    expect(formatTripDate("2026-02-30")).toBe("2026-02-30");
    expect(formatTripDate("not a date")).toBe("not a date");
  });
});
