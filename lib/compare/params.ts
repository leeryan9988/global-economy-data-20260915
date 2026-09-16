import { isCountryCode, type CountryCode } from "../catalog/countries";
import { isIndicatorId, type IndicatorId } from "../catalog/indicators";

export interface CompareSelection {
  countries: CountryCode[];
  indicator: IndicatorId;
  from: number;
  to: number;
}

export interface CompareQueryResult {
  value: CompareSelection;
  errors: string[];
}

type QueryValue = string | string[] | undefined;

function first(value: QueryValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseCompareQuery(query: Record<string, QueryValue>, minYear: number, maxYear: number): CompareQueryResult {
  const errors: string[] = [];
  const rawCountries = first(query.countries);
  const requestedCountries = rawCountries?.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean) ?? ["CN", "US"];
  const countriesValid = requestedCountries.length >= 2
    && requestedCountries.length <= 5
    && new Set(requestedCountries).size === requestedCountries.length
    && requestedCountries.every(isCountryCode);
  if (!countriesValid) errors.push("国家参数必须包含 2–5 个不重复的支持国家。");
  const selectedCountries = countriesValid ? requestedCountries as CountryCode[] : ["CN", "US"] as CountryCode[];

  const rawIndicator = first(query.indicator) ?? "gdp";
  const indicator = isIndicatorId(rawIndicator) ? rawIndicator : "gdp";
  if (!isIndicatorId(rawIndicator)) errors.push("指标参数无效，已显示 GDP 默认比较。");

  const rawFrom = first(query.from);
  const rawTo = first(query.to);
  const from = rawFrom === undefined ? Math.max(2000, minYear) : Number(rawFrom);
  const to = rawTo === undefined ? maxYear : Number(rawTo);
  const yearsValid = Number.isInteger(from) && Number.isInteger(to) && from >= minYear && to <= maxYear && from <= to;
  if (!yearsValid) errors.push(`年份必须在 ${minYear}–${maxYear} 之间，且开始年份不能晚于结束年份。`);

  return {
    value: {
      countries: selectedCountries,
      indicator,
      from: yearsValid ? from : Math.max(2000, minYear),
      to: yearsValid ? to : maxYear,
    },
    errors,
  };
}

export function compareUrl(selection: CompareSelection): string {
  const params = new URLSearchParams({
    countries: selection.countries.join(","),
    indicator: selection.indicator,
    from: String(selection.from),
    to: String(selection.to),
  });
  return `/compare?${params.toString()}`;
}
