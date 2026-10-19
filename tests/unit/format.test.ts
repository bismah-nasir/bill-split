import { afterEach, describe, expect, it } from "vitest";
import {
  formatPaisa,
  formatPercent,
  formatQuantity,
  formatTripDate,
  joinDetails,
  milliToInput,
  paisaToInput,
  todayIsoDate,
} from "../../src/domain/format";
import { parseRupeesToPaisa } from "../../src/domain/money";

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

describe("milliToInput / formatQuantity", () => {
  it.each([
    [1000, "1"],
    [1500, "1.5"],
    [1250, "1.25"],
    [1, "0.001"],
    [100_000_000, "100000"],
  ])("%i -> %j", (milli, text) => {
    expect(milliToInput(milli)).toBe(text);
  });

  it("adds the unit when there is one", () => {
    expect(formatQuantity(1500, "kg")).toBe("1.5 kg");
    expect(formatQuantity(2000)).toBe("2");
    expect(formatQuantity(2000, null)).toBe("2");
  });
});

describe("paisaToInput", () => {
  it.each([
    [123456, "1234.56"],
    [12550, "125.50"],
    [50000, "500"],
    [5, "0.05"],
    [0, "0"],
    [1_000_000_000, "10000000"],
  ])("%i -> %j", (paisa, text) => {
    expect(paisaToInput(paisa)).toBe(text);
  });

  it("round-trips through parseRupeesToPaisa", () => {
    for (const paisa of [0, 1, 99, 100, 33333, 125050, 1_000_000_000]) {
      expect(parseRupeesToPaisa(paisaToInput(paisa))).toEqual({ ok: true, value: paisa });
    }
  });

  it("rejects fractional or negative paisa", () => {
    expect(() => paisaToInput(1.5)).toThrow();
    expect(() => paisaToInput(-100)).toThrow();
  });
});

describe("formatPercent", () => {
  it.each([
    [12.5, "+12.5%"],
    [8, "+8.0%"],
    [-3, "−3.0%"],
    [-3.4, "−3.4%"],
    [0, "0%"],
    [150, "+150.0%"],
  ])("%d -> %j", (percent, text) => {
    expect(formatPercent(percent)).toBe(text);
  });
});

describe("joinDetails", () => {
  it("joins the present parts with a middle dot", () => {
    expect(joinDetails("Dalda", null, "1 litre", undefined, "")).toBe("Dalda · 1 litre");
  });

  it("returns null when every part is empty", () => {
    expect(joinDetails(null, "", undefined)).toBeNull();
  });
});
