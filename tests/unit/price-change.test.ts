import { describe, expect, it } from "vitest";

import { computePriceChanges } from "../../src/domain/price-change";

describe("computePriceChanges", () => {
  it("returns nothing for no prices", () => {
    expect(computePriceChanges([])).toEqual([]);
  });

  it("marks the oldest price as the first record", () => {
    expect(computePriceChanges([50000])).toEqual([{ kind: "first" }]);
  });

  it("compares each price with the one before it", () => {
    expect(computePriceChanges([50000, 54000, 54000, 52000])).toEqual([
      { kind: "first" },
      { kind: "up", diffPaisa: 4000, percent: 8 },
      { kind: "unchanged" },
      { kind: "down", diffPaisa: -2000, percent: -3.7 },
    ]);
  });

  it("gives no percentage when the previous price was 0", () => {
    expect(computePriceChanges([0, 1500])).toEqual([
      { kind: "first" },
      { kind: "up", diffPaisa: 1500, percent: null },
    ]);
  });

  it("drops to 0 as −100%", () => {
    expect(computePriceChanges([1500, 0])[1]).toEqual({ kind: "down", diffPaisa: -1500, percent: -100 });
  });

  it("rounds the percentage to one decimal", () => {
    // 40 / 520 = 7.692…% -> 7.7%; 20 / 590 = 3.389…% -> 3.4%.
    expect(computePriceChanges([52000, 56000])[1]).toEqual({ kind: "up", diffPaisa: 4000, percent: 7.7 });
    expect(computePriceChanges([59000, 57000])[1]).toEqual({ kind: "down", diffPaisa: -2000, percent: -3.4 });
  });

  it("rounds halves away from zero in both directions", () => {
    // 69 / 2000 = 3.45% exactly.
    expect(computePriceChanges([2000, 2069])[1]).toMatchObject({ percent: 3.5 });
    expect(computePriceChanges([2000, 1931])[1]).toMatchObject({ percent: -3.5 });
  });
});
