import { describe, expect, it } from "vitest";

import { buildProductMatchKey } from "../../src/domain/normalization";
import {
  buildPriceHistory,
  listProducts,
  parsePriceHistoryParams,
  priceHistoryParamsToQuery,
  productDetailsLine,
  productKeyPrefix,
  productSearchTerm,
  searchProducts,
  suggestionLabel,
  suggestProducts,
  type PriceRecord,
} from "../../src/domain/price-history";

let nextId = 0;

function record(overrides: Partial<PriceRecord> = {}): PriceRecord {
  const fields = { name: "Cooking Oil", brand: "Dalda", variant: null, packSize: "1 litre", unit: null, ...overrides };
  nextId += 1;
  return {
    itemId: `item${nextId}`,
    tripId: `trip${nextId}`,
    tripTitle: `Bill ${nextId}`,
    storeName: "Imtiaz",
    tripDate: "2026-10-01",
    createdAt: nextId,
    quantityMilli: 1000,
    unitPricePaisa: 50000,
    ...fields,
    normalizedName: fields.name.toLowerCase(),
    productMatchKey: buildProductMatchKey({
      name: fields.name,
      brand: fields.brand ?? undefined,
      variant: fields.variant ?? undefined,
      packSize: fields.packSize ?? undefined,
      unit: fields.unit ?? undefined,
    }),
    ...overrides,
  };
}

describe("productSearchTerm", () => {
  it("normalizes the term and needs at least 2 characters", () => {
    expect(productSearchTerm("  OIL ")).toBe("oil");
    expect(productSearchTerm(" o ")).toBeNull();
    expect(productSearchTerm("")).toBeNull();
  });
});

describe("productKeyPrefix", () => {
  it("is the name segment and its separator", () => {
    expect(productKeyPrefix("cooking oil|dalda||1l|")).toBe("cooking oil|");
    expect(productKeyPrefix("not a key")).toBeNull();
  });
});

describe("productDetailsLine", () => {
  it("joins brand, variant, pack size and unit", () => {
    expect(productDetailsLine({ brand: "Dalda", variant: null, packSize: "1l", unit: "item" })).toBe(
      "Dalda · 1l · item",
    );
    expect(productDetailsLine({ brand: null, variant: null, packSize: null, unit: null })).toBeNull();
  });
});

describe("listProducts / searchProducts", () => {
  it("keeps variants apart and summarizes each product from its latest record", () => {
    const records = [
      record({ tripDate: "2026-09-01", unitPricePaisa: 50000 }),
      record({ tripDate: "2026-10-12", unitPricePaisa: 56000, packSize: "1 Litre" }),
      record({ tripDate: "2026-10-05", unitPricePaisa: 240000, packSize: "5 ltr" }),
    ];
    expect(listProducts(records)).toEqual([
      expect.objectContaining({
        productMatchKey: "cooking oil|dalda||1l|",
        packSize: "1 Litre",
        observationCount: 2,
        latestPricePaisa: 56000,
        latestTripDate: "2026-10-12",
      }),
      expect.objectContaining({ productMatchKey: "cooking oil|dalda||5l|", observationCount: 1 }),
    ]);
  });

  it("matches a substring of the normalized name and respects the limit", () => {
    const records = [record(), record({ name: "Olive Oil" }), record({ name: "Rice" })];
    expect(searchProducts(records, "oil", 20).map((product) => product.name).sort()).toEqual([
      "Cooking Oil",
      "Olive Oil",
    ]);
    expect(searchProducts(records, "oil", 1)).toHaveLength(1);
    expect(searchProducts(records, "sugar", 20)).toEqual([]);
  });
});

describe("suggestProducts / suggestionLabel", () => {
  it("adds the store of each product's latest record, most recent first, up to the limit", () => {
    const records = [
      record({ tripDate: "2026-09-01", storeName: "Metro", unitPricePaisa: 50000 }),
      record({ tripDate: "2026-10-12", storeName: "Imtiaz", unitPricePaisa: 56000 }),
      record({ name: "Coconut oil", brand: null, packSize: null, tripDate: "2026-10-01", storeName: null }),
      record({ name: "Olive Oil", tripDate: "2026-10-20" }),
      record({ name: "Rice", tripDate: "2026-10-30" }),
    ];
    const suggestions = suggestProducts(records, "oil", 2);
    expect(suggestions.map(({ name, lastStoreName, latestPricePaisa, observationCount }) => ({
      name, lastStoreName, latestPricePaisa, observationCount,
    }))).toEqual([
      { name: "Olive Oil", lastStoreName: "Imtiaz", latestPricePaisa: 50000, observationCount: 1 },
      { name: "Cooking Oil", lastStoreName: "Imtiaz", latestPricePaisa: 56000, observationCount: 2 },
    ]);
    expect(suggestionLabel(suggestions[1])).toBe("Cooking Oil · Dalda · 1 litre · last Rs. 560.00 at Imtiaz");

    const [coconut] = suggestProducts(records, "coco", 8);
    expect(suggestionLabel(coconut)).toBe("Coconut oil · last Rs. 500.00");
  });
});

describe("buildPriceHistory", () => {
  it("lists the product newest first with changes, and other variants separately", () => {
    const oldest = record({ tripDate: "2026-08-01", unitPricePaisa: 50000 });
    const middle = record({ tripDate: "2026-09-01", unitPricePaisa: 54000 });
    const newest = record({ tripDate: "2026-10-01", unitPricePaisa: 54000 });
    const bigPack = record({ tripDate: "2026-10-02", packSize: "5 l", unitPricePaisa: 250000 });
    const otherItem = record({ name: "Rice", tripDate: "2026-10-03" });

    const history = buildPriceHistory(oldest.productMatchKey, [newest, bigPack, oldest, otherItem, middle]);
    expect(history?.observations.map((observation) => [observation.itemId, observation.change])).toEqual([
      [newest.itemId, { kind: "unchanged" }],
      [middle.itemId, { kind: "up", diffPaisa: 4000, percent: 8 }],
      [oldest.itemId, { kind: "first" }],
    ]);
    expect(history?.product).toMatchObject({ observationCount: 3, latestPricePaisa: 54000 });
    expect(history?.otherVariants.map((product) => product.productMatchKey)).toEqual([bigPack.productMatchKey]);
  });

  it("orders records of the same date by when they were saved", () => {
    const first = record({ createdAt: 1, unitPricePaisa: 100 });
    const second = record({ createdAt: 2, unitPricePaisa: 200 });
    const history = buildPriceHistory(first.productMatchKey, [second, first]);
    expect(history?.observations.map((observation) => observation.itemId)).toEqual([second.itemId, first.itemId]);
  });

  it("is null when no record has the product", () => {
    expect(buildPriceHistory("cooking oil|dalda||1l|", [record({ packSize: "5 l" })])).toBeNull();
  });
});

describe("price history URL params", () => {
  it("round-trips the search and product", () => {
    const params = { search: "cooking oil", product: "cooking oil|dalda||1l|" };
    expect(parsePriceHistoryParams(new URLSearchParams(priceHistoryParamsToQuery(params)))).toEqual(params);
  });

  it("leaves empty values out", () => {
    expect(priceHistoryParamsToQuery({ search: "", product: null })).toBe("");
    expect(parsePriceHistoryParams(new URLSearchParams("product="))).toEqual({ search: "", product: null });
  });
});
