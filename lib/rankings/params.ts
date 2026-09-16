import { isIndicatorId, type IndicatorId } from "../catalog/indicators";

type QueryValue = string | string[] | undefined;

function first(value: QueryValue) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseRankingQuery(
  query: Record<string, QueryValue>,
  minYear: number,
  maxYear: number,
  getDefaultYear: (indicator: IndicatorId) => number,
) {
  const errors: string[] = [];
  const requestedIndicator = first(query.indicator) ?? "gdp";
  const indicator = isIndicatorId(requestedIndicator) ? requestedIndicator : "gdp";
  if (!isIndicatorId(requestedIndicator)) errors.push("指标参数无效，已显示 GDP 排名。");
  const defaultYear = getDefaultYear(indicator);
  const requestedYear = first(query.year);
  const parsedYear = requestedYear === undefined ? defaultYear : Number(requestedYear);
  const yearValid = Number.isInteger(parsedYear) && parsedYear >= minYear && parsedYear <= maxYear;
  if (!yearValid) errors.push(`年份必须在 ${minYear}–${maxYear} 之间。`);
  return { value: { indicator, year: yearValid ? parsedYear : defaultYear }, errors };
}

export function rankingUrl(indicator: IndicatorId, year: number) {
  return `/rankings?indicator=${encodeURIComponent(indicator)}&year=${year}`;
}
