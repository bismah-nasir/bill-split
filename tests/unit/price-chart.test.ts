import { describe, expect, it } from "vitest";

import { buildPriceChart, priceChartSummary } from "../../src/domain/price-chart";
import type { PriceObservation } from "../../src/domain/types";

function observation(itemId: string, tripDate: string, unitPricePaisa: number): PriceObservation {
  return {
    itemId,
    tripId: `trip-${itemId}`,
    tripTitle: "Groceries",
    storeName: "Imtiaz",
    tripDate,
    quantityMilli: 1000,
    unit: "item",
    unitPricePaisa,
    change: { kind: "first" },
  };
}

describe("buildPriceChart", () => {
  it("draws nothing with fewer than 2 records", () => {
    expect(buildPriceChart([])).toBeNull();
    expect(buildPriceChart([observation("a", "2026-10-01", 50000)])).toBeNull();
  });

  it("puts records oldest first, x by bill date and y from highest (0) to lowest (100)", () => {
    // Newest first, as Price History lists them.
    const chart = buildPriceChart([
      observation("c", "2026-10-11", 52000),
      observation("b", "2026-10-03", 54000),
      observation("a", "2026-10-01", 50000),
    ]);
    expect(chart).not.toBeNull();
    expect(chart!.points).toEqual([
      { itemId: "a", x: 0, y: 100, tripDate: "2026-10-01", unitPricePaisa: 50000 },
      { itemId: "b", x: 20, y: 0, tripDate: "2026-10-03", unitPricePaisa: 54000 },
      { itemId: "c", x: 100, y: 50, tripDate: "2026-10-11", unitPricePaisa: 52000 },
    ]);
    expect(chart).toMatchObject({
      minPricePaisa: 50000,
      maxPricePaisa: 54000,
      firstDate: "2026-10-01",
      lastDate: "2026-10-11",
      linePath: "M0 100 L20 0 L100 50",
      areaPath: "M0 100 L20 0 L100 50 L100 100 L0 100 Z",
    });
  });

  it("spaces dates across month boundaries by days", () => {
    const chart = buildPriceChart([
      observation("c", "2026-03-01", 100),
      observation("b", "2026-02-28", 100),
      observation("a", "2026-02-27", 100),
    ]);
    expect(chart!.points.map((point) => point.x)).toEqual([0, 50, 100]);
  });

  it("keeps records of the same date at the same x", () => {
    const chart = buildPriceChart([
      observation("c", "2026-10-04", 300),
      observation("b", "2026-10-01", 200),
      observation("a", "2026-10-01", 100),
    ]);
    expect(chart!.points.map((point) => [point.x, point.y])).toEqual([
      [0, 100],
      [0, 50],
      [100, 0],
    ]);
  });

  it("spreads records evenly when they all have the same date", () => {
    const chart = buildPriceChart([
      observation("c", "2026-10-01", 300),
      observation("b", "2026-10-01", 200),
      observation("a", "2026-10-01", 100),
    ]);
    expect(chart!.points.map((point) => point.x)).toEqual([0, 50, 100]);
  });

  it("draws an unchanged price as a flat line through the middle", () => {
    const chart = buildPriceChart([observation("b", "2026-10-05", 54000), observation("a", "2026-10-01", 54000)]);
    expect(chart!.points.map((point) => point.y)).toEqual([50, 50]);
    expect(chart!.linePath).toBe("M0 50 L100 50");
  });

  it("rounds coordinates to two decimals", () => {
    const chart = buildPriceChart([
      observation("c", "2026-10-04", 300),
      observation("b", "2026-10-02", 100),
      observation("a", "2026-10-01", 0),
    ]);
    // Day 1 of 3 = 33.333…; price 100 of 0–300 = 66.666… from the top.
    expect(chart!.points[1]).toMatchObject({ x: 33.33, y: 66.67 });
  });
});

describe("priceChartSummary", () => {
  it("describes the dates and prices the chart shows", () => {
    const chart = buildPriceChart([
      observation("c", "2026-10-12", 54000),
      observation("b", "2026-10-05", 50000),
      observation("a", "2026-10-01", 52000),
    ]);
    expect(priceChartSummary(chart!)).toBe(
      "Unit price over 3 records, 1 Oct 2026 to 12 Oct 2026: first Rs. 520.00, latest Rs. 540.00, " +
        "lowest Rs. 500.00, highest Rs. 540.00.",
    );
  });

  it("names the single date when every record shares it", () => {
    const chart = buildPriceChart([observation("b", "2026-10-01", 100), observation("a", "2026-10-01", 100)]);
    expect(priceChartSummary(chart!)).toBe(
      "Unit price over 2 records, all on 1 Oct 2026: first Rs. 1.00, latest Rs. 1.00, lowest Rs. 1.00, highest Rs. 1.00.",
    );
  });
});
