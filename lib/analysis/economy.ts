import { countries, type CountryCode } from "../catalog/countries";
import type { IndicatorId } from "../catalog/indicators";
import { rankAtYear } from "../rankings/data";
import type { AnnualObservation, CountryIndicatorSeries } from "../series/types";

export type ChangeKind = "percent" | "percentage-points";

export interface SeriesChange {
  years: number;
  start: { year: number; value: number };
  end: { year: number; value: number };
  absolute: number;
  relativePercent: number | null;
  annualizedPercent: number | null;
  kind: ChangeKind;
}

export interface ChangeRankingRow {
  countryCode: CountryCode;
  startValue: number;
  endValue: number;
  change: number;
  rank: number;
}

export interface ChangeRankingResult {
  startYear: number;
  endYear: number;
  kind: ChangeKind;
  rows: ChangeRankingRow[];
  missing: CountryCode[];
}

const rateIndicators = new Set<IndicatorId>(["inflation", "unemployment", "lending-rate"]);

export function changeKind(indicatorId: IndicatorId): ChangeKind {
  return rateIndicators.has(indicatorId) ? "percentage-points" : "percent";
}

function numeric(row: AnnualObservation | undefined): number | null {
  if (!row || row.value === null) return null;
  const value = Number(row.value);
  return Number.isFinite(value) ? value : null;
}

export function latestObservation(series: CountryIndicatorSeries): { year: number; value: number } | null {
  for (let index = series.observations.length - 1; index >= 0; index -= 1) {
    const value = numeric(series.observations[index]);
    if (value !== null) return { year: series.observations[index].year, value };
  }
  return null;
}

export function calculateSeriesChange(series: CountryIndicatorSeries, years: number): SeriesChange | null {
  if (!Number.isInteger(years) || years <= 0) throw new Error("Change window must be a positive integer.");
  const end = latestObservation(series);
  if (!end) return null;
  const startRow = series.observations.find((row) => row.year === end.year - years);
  const startValue = numeric(startRow);
  if (!startRow || startValue === null) return null;
  const absolute = end.value - startValue;
  const relativePercent = startValue === 0 ? null : absolute / Math.abs(startValue) * 100;
  const annualizedPercent = startValue > 0 && end.value >= 0
    ? (Math.pow(end.value / startValue, 1 / years) - 1) * 100
    : null;
  return {
    years,
    start: { year: startRow.year, value: startValue },
    end,
    absolute,
    relativePercent,
    annualizedPercent,
    kind: changeKind(series.indicatorId),
  };
}

export function seriesExtrema(series: CountryIndicatorSeries) {
  const available = series.observations
    .map((row) => ({ year: row.year, value: numeric(row) }))
    .filter((row): row is { year: number; value: number } => row.value !== null);
  if (!available.length) return null;
  return {
    minimum: available.reduce((best, row) => row.value < best.value ? row : best),
    maximum: available.reduce((best, row) => row.value > best.value ? row : best),
    count: available.length,
  };
}

export function commonChangeRanking(
  series: CountryIndicatorSeries[],
  countryCodes: readonly CountryCode[],
  indicatorId: IndicatorId,
  years: number,
  preferredEndYear?: number,
): ChangeRankingResult | null {
  const relevant = countryCodes.map((countryCode) => series.find((item) => item.countryCode === countryCode && item.indicatorId === indicatorId));
  const allYears = [...new Set(relevant.flatMap((item) => item?.observations.map((row) => row.year) ?? []))]
    .filter((year) => preferredEndYear === undefined || year <= preferredEndYear)
    .sort((a, b) => b - a);
  const endYear = allYears.find((year) => relevant.every((item) => {
    const end = numeric(item?.observations.find((row) => row.year === year));
    const start = numeric(item?.observations.find((row) => row.year === year - years));
    return end !== null && start !== null;
  }));
  if (endYear === undefined) return null;
  const kind = changeKind(indicatorId);
  const values = countryCodes.map((countryCode, index) => {
    const item = relevant[index]!;
    const startValue = numeric(item.observations.find((row) => row.year === endYear - years))!;
    const endValue = numeric(item.observations.find((row) => row.year === endYear))!;
    const change = kind === "percentage-points"
      ? endValue - startValue
      : startValue === 0 ? Number.NaN : (endValue - startValue) / Math.abs(startValue) * 100;
    return { countryCode, startValue, endValue, change };
  });
  const available = values.filter((row) => Number.isFinite(row.change)).sort((a, b) => b.change - a.change || a.countryCode.localeCompare(b.countryCode));
  const rows = available.map((row, index) => ({
    ...row,
    rank: index > 0 && row.change === available[index - 1].change ? available.findIndex((item) => item.change === row.change) + 1 : index + 1,
  }));
  return {
    startYear: endYear - years,
    endYear,
    kind,
    rows,
    missing: countryCodes.filter((code) => !rows.some((row) => row.countryCode === code)),
  };
}

export function changeRankingAtYear(
  series: CountryIndicatorSeries[],
  countryCodes: readonly CountryCode[],
  indicatorId: IndicatorId,
  endYear: number,
  years: number,
): ChangeRankingResult {
  const kind = changeKind(indicatorId);
  const values = countryCodes.map((countryCode) => {
    const item = series.find((candidate) => candidate.countryCode === countryCode && candidate.indicatorId === indicatorId);
    const startValue = numeric(item?.observations.find((row) => row.year === endYear - years));
    const endValue = numeric(item?.observations.find((row) => row.year === endYear));
    if (startValue === null || endValue === null) return null;
    const change = kind === "percentage-points"
      ? endValue - startValue
      : startValue === 0 ? Number.NaN : (endValue - startValue) / Math.abs(startValue) * 100;
    return Number.isFinite(change) ? { countryCode, startValue, endValue, change } : null;
  });
  const available = values.filter((row): row is NonNullable<typeof row> => row !== null).sort((a, b) => b.change - a.change || a.countryCode.localeCompare(b.countryCode));
  const rows = available.map((row, index) => ({
    ...row,
    rank: index > 0 && row.change === available[index - 1].change ? available.findIndex((item) => item.change === row.change) + 1 : index + 1,
  }));
  return {
    startYear: endYear - years,
    endYear,
    kind,
    rows,
    missing: countryCodes.filter((code) => !rows.some((row) => row.countryCode === code)),
  };
}

export function rankForCountry(series: CountryIndicatorSeries[], countryCode: CountryCode, indicatorId: IndicatorId) {
  const relevant = series.filter((item) => item.indicatorId === indicatorId);
  const years = [...new Set(relevant.flatMap((item) => item.observations.map((row) => row.year)))].sort((a, b) => b - a);
  const year = years.find((candidate) => relevant.every((item) => numeric(item.observations.find((row) => row.year === candidate)) !== null));
  if (year === undefined) return null;
  const result = rankAtYear(series, countries, indicatorId, year);
  const row = result.rows.find((item) => item.country.iso2 === countryCode);
  return row ? { year, rank: row.rank, value: row.value, coverage: result.rows.length } : null;
}

export function formatChange(change: SeriesChange | { change: number; kind: ChangeKind }, digits = 1): string {
  const value = "relativePercent" in change
    ? (change.kind === "percentage-points" ? change.absolute : change.relativePercent)
    : change.change;
  if (value === null || !Number.isFinite(value)) return "无法计算";
  const sign = value > 0 ? "+" : "";
  return change.kind === "percentage-points"
    ? `${sign}${value.toFixed(digits)} 个百分点`
    : `${sign}${value.toFixed(digits)}%`;
}

export function trendWord(value: number, tolerance = 0.05) {
  if (Math.abs(value) <= tolerance) return "基本持平";
  return value > 0 ? "上升" : "下降";
}
