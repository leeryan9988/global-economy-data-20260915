import type { Country, CountryCode } from "../catalog/countries";
import type { IndicatorId } from "../catalog/indicators";
import type { CountryIndicatorSeries } from "../series/types";

export interface RankingRow {
  country: Country;
  value: number;
  rank: number;
}

export interface RankingResult {
  rows: RankingRow[];
  missing: Country[];
}

export function rankAtYear(series: CountryIndicatorSeries[], countries: readonly Country[], indicator: IndicatorId, year: number): RankingResult {
  const values = countries.map((country) => {
    const source = series.find((item) => item.countryCode === country.iso2 && item.indicatorId === indicator);
    const observation = source?.observations.find((item) => item.year === year);
    return { country, value: observation?.value === null || observation?.value === undefined ? null : Number(observation.value) };
  });
  const available = values.filter((item): item is { country: Country; value: number } => item.value !== null).sort((a, b) => b.value - a.value);
  const rows = available.map((item, index) => ({
    ...item,
    rank: index > 0 && item.value === available[index - 1].value ? (index > 1 ? available.slice(0, index).findLastIndex((row) => row.value !== item.value) + 2 : 1) : index + 1,
  }));
  return { rows, missing: values.filter((item) => item.value === null).map((item) => item.country) };
}

export function defaultRankingYear(series: CountryIndicatorSeries[], countryCodes: readonly CountryCode[], indicator: IndicatorId): { year: number; fullCoverage: boolean } {
  const relevant = series.filter((item) => item.indicatorId === indicator && countryCodes.includes(item.countryCode));
  const years = [...new Set(relevant.flatMap((item) => item.observations.map((row) => row.year)))].sort((a, b) => b - a);
  const full = years.find((year) => relevant.every((item) => item.observations.some((row) => row.year === year && row.value !== null)));
  if (full !== undefined) return { year: full, fullCoverage: true };
  const partial = years.find((year) => relevant.some((item) => item.observations.some((row) => row.year === year && row.value !== null)));
  if (partial === undefined) throw new Error(`No ranking data for ${indicator}.`);
  return { year: partial, fullCoverage: false };
}
