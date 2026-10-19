/**
 * The change between consecutive price records of one product. Money is integer paisa.
 */

export type PriceChange =
  | { kind: "first" }
  | { kind: "unchanged" }
  /**
   * `diffPaisa` is this price minus the previous one (negative for "down"). `percent` is that
   * difference as a percentage of the previous price, to one decimal, or `null` when the
   * previous price was 0.
   */
  | { kind: "up" | "down"; diffPaisa: number; percent: number | null };

/**
 * Prices sorted oldest → newest; returns each one's change from the record before it.
 * The percentage is rounded half away from zero, so +3.45% and −3.45% round alike.
 */
export function computePriceChanges(pricesPaisa: number[]): PriceChange[] {
  return pricesPaisa.map((price, index) => {
    if (index === 0) return { kind: "first" };
    const previous = pricesPaisa[index - 1];
    const diffPaisa = price - previous;
    if (diffPaisa === 0) return { kind: "unchanged" };
    const percent =
      previous === 0
        ? null
        : (Math.sign(diffPaisa) * Math.round((Math.abs(diffPaisa) * 1000) / previous)) / 10;
    return { kind: diffPaisa > 0 ? "up" : "down", diffPaisa, percent };
  });
}
