/**
 * Price History rules: which item records count as one product, how products are listed and
 * how a product's records become a dated price list. Shared by the Price History page and the
 * `priceHistory` queries. Every record passed in must come from a bill the viewer can see.
 */
import { formatPaisa, joinDetails } from "./format";
import { normalizeText } from "./normalization";
import { computePriceChanges } from "./price-change";
import type { ItemSuggestion, PriceHistory, PriceObservation, ProductResult } from "./types";

export const MIN_PRODUCT_SEARCH_LENGTH = 2;
export const MAX_PRODUCT_SEARCH_LENGTH = 80;
/** Products returned for one search. */
export const PRODUCT_RESULTS_LIMIT = 20;
/** Records shown for one product, newest first. */
export const MAX_OBSERVATIONS = 200;
/** Suggestions offered while typing an item name. */
export const ITEM_SUGGESTIONS_LIMIT = 8;

/** One saved item, with the bill details Price History shows next to it. */
export type PriceRecord = {
  itemId: string;
  tripId: string;
  tripTitle: string;
  storeName: string | null;
  tripDate: string;
  /** The item's creation time; orders records of the same date. */
  createdAt: number;
  productMatchKey: string;
  normalizedName: string;
  name: string;
  brand: string | null;
  variant: string | null;
  packSize: string | null;
  unit: string | null;
  quantityMilli: number;
  unitPricePaisa: number;
};

/** The normalized search, or `null` when it's too short to search with. */
export function productSearchTerm(term: string): string | null {
  const normalized = normalizeText(term);
  return normalized.length >= MIN_PRODUCT_SEARCH_LENGTH ? normalized : null;
}

/**
 * A prefix shared by every product key with the same item name as `productMatchKey`: its
 * first segment and the "|" after it. (A name containing "|" makes the prefix shorter than the
 * name, which only widens the range; `buildPriceHistory` compares names exactly.) `null` for
 * a string that isn't a product key.
 */
export function productKeyPrefix(productMatchKey: string): string | null {
  const end = productMatchKey.indexOf("|");
  return end === -1 ? null : productMatchKey.slice(0, end + 1);
}

/** "Dalda · 1 litre · item": the details that tell one product from another. */
export function productDetailsLine(
  product: Pick<ProductResult, "brand" | "variant" | "packSize" | "unit">,
): string | null {
  return joinDetails(product.brand, product.variant, product.packSize, product.unit);
}

/** Oldest first: by bill date, then by when the item was saved. */
function oldestFirst(a: PriceRecord, b: PriceRecord): number {
  if (a.tripDate !== b.tripDate) return a.tripDate < b.tripDate ? -1 : 1;
  if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
  return a.itemId < b.itemId ? -1 : a.itemId > b.itemId ? 1 : 0;
}

/** Records of one product, oldest first, as a `ProductResult`. */
function toProduct(sorted: PriceRecord[]): ProductResult {
  const latest = sorted[sorted.length - 1];
  return {
    productMatchKey: latest.productMatchKey,
    name: latest.name,
    brand: latest.brand,
    variant: latest.variant,
    packSize: latest.packSize,
    unit: latest.unit,
    observationCount: sorted.length,
    latestPricePaisa: latest.unitPricePaisa,
    latestTripDate: latest.tripDate,
  };
}

/** Records grouped by product key, each group oldest first. */
function groupByProduct(records: PriceRecord[]): PriceRecord[][] {
  const groups = new Map<string, PriceRecord[]>();
  for (const record of records) {
    const group = groups.get(record.productMatchKey) ?? [];
    group.push(record);
    groups.set(record.productMatchKey, group);
  }
  return [...groups.values()].map((group) => group.sort(oldestFirst));
}

/**
 * One result per product, most recently bought first (ties: by name, then key). Products that
 * differ in brand, variant, pack size or unit stay separate.
 */
export function listProducts(records: PriceRecord[]): ProductResult[] {
  return groupByProduct(records).map(toProduct).sort(mostRecentFirst);
}

/** Most recently bought first (ties: by name, then key). */
function mostRecentFirst(a: ProductResult, b: ProductResult): number {
  if (a.latestTripDate !== b.latestTripDate) return a.latestTripDate < b.latestTripDate ? 1 : -1;
  const byName = normalizeText(a.name).localeCompare(normalizeText(b.name));
  if (byName !== 0) return byName;
  return a.productMatchKey < b.productMatchKey ? -1 : a.productMatchKey > b.productMatchKey ? 1 : 0;
}

/** Products whose item name contains `term` (already normalized), at most `limit`. */
export function searchProducts(records: PriceRecord[], term: string, limit: number): ProductResult[] {
  return listProducts(records.filter((record) => record.normalizedName.includes(term))).slice(0, limit);
}

/**
 * Like `searchProducts`, with the store of each product's latest record, for the item name
 * suggestions in the bill form.
 */
export function suggestProducts(records: PriceRecord[], term: string, limit: number): ItemSuggestion[] {
  return groupByProduct(records.filter((record) => record.normalizedName.includes(term)))
    .map((group) => ({ ...toProduct(group), lastStoreName: group[group.length - 1].storeName }))
    .sort(mostRecentFirst)
    .slice(0, limit);
}

/** "last Rs. 560.00 at Imtiaz", or "last Rs. 560.00" when the bill had no store. */
export function suggestionPriceLine(suggestion: ItemSuggestion): string {
  const lastPrice = `last ${formatPaisa(suggestion.latestPricePaisa)}`;
  return suggestion.lastStoreName ? `${lastPrice} at ${suggestion.lastStoreName}` : lastPrice;
}

/**
 * The price list of one product. `records` holds every accessible record with the product's
 * item name, including other variants. Returns `null` when the product has no records.
 */
export function buildPriceHistory(productMatchKey: string, records: PriceRecord[]): PriceHistory | null {
  const own = records.filter((record) => record.productMatchKey === productMatchKey).sort(oldestFirst);
  if (own.length === 0) return null;

  const changes = computePriceChanges(own.map((record) => record.unitPricePaisa));
  const observations: PriceObservation[] = own.map((record, index) => ({
    itemId: record.itemId,
    tripId: record.tripId,
    tripTitle: record.tripTitle,
    storeName: record.storeName,
    tripDate: record.tripDate,
    quantityMilli: record.quantityMilli,
    unit: record.unit,
    unitPricePaisa: record.unitPricePaisa,
    change: changes[index],
  }));

  const name = own[0].normalizedName;
  const others = records.filter(
    (record) => record.normalizedName === name && record.productMatchKey !== productMatchKey,
  );
  return {
    product: toProduct(own),
    observations: observations.reverse().slice(0, MAX_OBSERVATIONS),
    otherVariants: listProducts(others),
  };
}

export type PriceHistoryParams = { search: string; product: string | null };

/** Reads `?q=&product=` from the URL. */
export function parsePriceHistoryParams(params: URLSearchParams): PriceHistoryParams {
  return { search: params.get("q") ?? "", product: params.get("product") || null };
}

/** The query string for `params`, without the "?"; empty values are left out. */
export function priceHistoryParamsToQuery({ search, product }: PriceHistoryParams): string {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (product) params.set("product", product);
  return params.toString();
}
