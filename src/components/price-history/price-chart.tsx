import { Card } from "@/components/ui/card";
import { formatPaisa, formatTripDate } from "@/domain/format";
import { buildPriceChart, PRICE_CHART_SIZE, priceChartSummary } from "@/domain/price-chart";
import type { PriceObservation } from "@/domain/types";
import { cn } from "@/lib/utils";

/**
 * A product's unit price over time, oldest on the left. Drawn only with 2 or more records; the
 * records list below stays the full, accessible view, and the chart's label summarises it.
 */
export function PriceChart({ observations }: { observations: PriceObservation[] }) {
  const chart = buildPriceChart(observations);
  if (chart === null) return null;

  const isFlat = chart.minPricePaisa === chart.maxPricePaisa;
  const isSingleDate = chart.firstDate === chart.lastDate;
  return (
    <Card className="p-16 md:p-24">
      <figure className="flex flex-col gap-12">
        <figcaption className="type-body-medium">Price over time</figcaption>
        <div className="flex gap-12">
          {/* The y-axis labels sit on the top and bottom grid lines. */}
          <div
            aria-hidden
            className={cn(
              "flex h-chart shrink-0 flex-col text-right type-caption font-numeric tabular-nums text-ink-muted",
              isFlat ? "justify-center" : "justify-between",
            )}
          >
            {isFlat ? (
              <span>{formatPaisa(chart.maxPricePaisa)}</span>
            ) : (
              <>
                <span className="-translate-y-1/2">{formatPaisa(chart.maxPricePaisa)}</span>
                <span className="translate-y-1/2">{formatPaisa(chart.minPricePaisa)}</span>
              </>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-8">
            <svg
              role="img"
              aria-label={priceChartSummary(chart)}
              viewBox={`0 0 ${PRICE_CHART_SIZE} ${PRICE_CHART_SIZE}`}
              preserveAspectRatio="none"
              className="h-chart w-full overflow-visible"
            >
              {!isFlat &&
                [0, PRICE_CHART_SIZE].map((y) => (
                  <line
                    key={y}
                    x1={0}
                    x2={PRICE_CHART_SIZE}
                    y1={y}
                    y2={y}
                    vectorEffect="non-scaling-stroke"
                    className="stroke-line-strong chart-stroke-grid"
                  />
                ))}
              <path d={chart.areaPath} className="fill-primary-soft" />
              <path
                d={chart.linePath}
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
                className="fill-none stroke-primary chart-stroke-line"
              />
              {chart.points.map((point) => (
                <line
                  key={point.itemId}
                  x1={point.x}
                  x2={point.x}
                  y1={point.y}
                  y2={point.y}
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  className="stroke-primary chart-stroke-point"
                >
                  <title>{`${formatPaisa(point.unitPricePaisa)} on ${formatTripDate(point.tripDate)}`}</title>
                </line>
              ))}
            </svg>
            <div
              aria-hidden
              className={cn("flex type-caption text-ink-muted", isSingleDate ? "justify-center" : "justify-between")}
            >
              <span>{formatTripDate(chart.firstDate)}</span>
              {!isSingleDate && <span>{formatTripDate(chart.lastDate)}</span>}
            </div>
          </div>
        </div>
      </figure>
    </Card>
  );
}
