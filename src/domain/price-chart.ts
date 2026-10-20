/**
 * The Price History chart: a product's records as points on a 0–100 square, oldest on the
 * left, by bill date. Built only from records the viewer can already see.
 */
import { formatPaisa, formatTripDate } from "./format";
import type { PriceObservation } from "./types";

/** The chart's drawing area, in SVG user units, on both axes. */
export const PRICE_CHART_SIZE = 100;
/** Fewer records than this draw no chart. */
export const MIN_CHART_OBSERVATIONS = 2;

const DAY_MS = 24 * 60 * 60 * 1000;

export type PriceChartPoint = {
  itemId: string;
  /** 0 (oldest bill date) to 100 (newest). */
  x: number;
  /** 0 (highest price) to 100 (lowest); 50 for all when every price is the same. */
  y: number;
  tripDate: string;
  unitPricePaisa: number;
};

export type PriceChart = {
  /** Oldest first. */
  points: PriceChartPoint[];
  minPricePaisa: number;
  maxPricePaisa: number;
  firstDate: string;
  lastDate: string;
  /** The line through the points, as SVG path data. */
  linePath: string;
  /** The area between the line and the bottom edge, as SVG path data. */
  areaPath: string;
};

/** Two decimals are plenty on a 100-unit square and keep the path data short. */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function dayNumber(isoDate: string): number {
  return Date.parse(isoDate) / DAY_MS;
}

/**
 * The chart for a product's records, given newest first (as `PriceHistory` lists them).
 * x follows the bill date; when every record has the same date they're spread evenly instead.
 * `null` with fewer than `MIN_CHART_OBSERVATIONS` records.
 */
export function buildPriceChart(observations: PriceObservation[]): PriceChart | null {
  if (observations.length < MIN_CHART_OBSERVATIONS) return null;
  const oldestFirst = [...observations].reverse();

  const prices = oldestFirst.map((observation) => observation.unitPricePaisa);
  const minPricePaisa = Math.min(...prices);
  const maxPricePaisa = Math.max(...prices);
  const firstDate = oldestFirst[0].tripDate;
  const lastDate = oldestFirst[oldestFirst.length - 1].tripDate;
  const firstDay = dayNumber(firstDate);
  const daySpan = dayNumber(lastDate) - firstDay;
  const priceSpan = maxPricePaisa - minPricePaisa;
  const lastIndex = oldestFirst.length - 1;

  const points = oldestFirst.map((observation, index) => ({
    itemId: observation.itemId,
    x: round(
      daySpan > 0
        ? ((dayNumber(observation.tripDate) - firstDay) / daySpan) * PRICE_CHART_SIZE
        : (index / lastIndex) * PRICE_CHART_SIZE,
    ),
    y: round(
      priceSpan > 0
        ? ((maxPricePaisa - observation.unitPricePaisa) / priceSpan) * PRICE_CHART_SIZE
        : PRICE_CHART_SIZE / 2,
    ),
    tripDate: observation.tripDate,
    unitPricePaisa: observation.unitPricePaisa,
  }));

  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
  const first = points[0];
  const last = points[lastIndex];
  const areaPath = `${linePath} L${last.x} ${PRICE_CHART_SIZE} L${first.x} ${PRICE_CHART_SIZE} Z`;

  return { points, minPricePaisa, maxPricePaisa, firstDate, lastDate, linePath, areaPath };
}

/** The chart's text alternative: the range of dates and prices it shows. */
export function priceChartSummary(chart: PriceChart): string {
  const first = chart.points[0];
  const last = chart.points[chart.points.length - 1];
  const dates =
    chart.firstDate === chart.lastDate
      ? `all on ${formatTripDate(chart.firstDate)}`
      : `${formatTripDate(chart.firstDate)} to ${formatTripDate(chart.lastDate)}`;
  return (
    `Unit price over ${chart.points.length} records, ${dates}: ` +
    `first ${formatPaisa(first.unitPricePaisa)}, latest ${formatPaisa(last.unitPricePaisa)}, ` +
    `lowest ${formatPaisa(chart.minPricePaisa)}, highest ${formatPaisa(chart.maxPricePaisa)}.`
  );
}
