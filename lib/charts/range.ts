import type { IndicatorId } from "../catalog/indicators";
import type { AnnualObservation } from "../series/types";

export const chartRanges = [
  { id: "5y", label: "5 年", years: 5 },
  { id: "10y", label: "10 年", years: 10 },
  { id: "20y", label: "20 年", years: 20 },
  { id: "all", label: "全部", years: null },
] as const;

export type ChartRange = (typeof chartRanges)[number]["id"];

export function selectChartRange(observations: AnnualObservation[], range: ChartRange): AnnualObservation[] {
  const years = chartRanges.find((item) => item.id === range)?.years ?? null;
  if (years === null) return observations;
  const latestYear = [...observations].reverse().find((item) => item.value !== null)?.year;
  if (latestYear === undefined) return observations.slice(-years);
  return observations.filter((item) => item.year > latestYear - years && item.year <= latestYear);
}

const compactNumber = new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 1 });

export function formatChartAxisValue(indicatorId: IndicatorId, value: number): string {
  if (indicatorId === "gdp") return `${(value / 1_000_000_000_000).toFixed(1)}万亿`;
  if (indicatorId === "population") return `${(value / 100_000_000).toFixed(1)}亿`;
  if (indicatorId === "gdp-per-capita") return `$${compactNumber.format(value)}`;
  return `${value.toFixed(1)}%`;
}
