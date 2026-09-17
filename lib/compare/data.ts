import type { CountryCode } from "../catalog/countries";
import type { IndicatorId } from "../catalog/indicators";
import type { CountryIndicatorSeries } from "../series/types";

export interface CompareLine {
  countryCode: CountryCode;
  values: Array<number | null>;
}

export interface AlignedComparison {
  years: number[];
  lines: CompareLine[];
}

export function alignComparisonSeries(
  series: CountryIndicatorSeries[],
  countries: CountryCode[],
  indicator: IndicatorId,
  from: number,
  to: number,
): AlignedComparison {
  const years = Array.from({ length: to - from + 1 }, (_, index) => from + index);
  const lines = countries.map((countryCode) => {
    const source = series.find((item) => item.countryCode === countryCode && item.indicatorId === indicator);
    const valuesByYear = new Map(source?.observations.map((item) => [item.year, item.value]) ?? []);
    return {
      countryCode,
      values: years.map((year) => {
        const value = valuesByYear.get(year);
        return value === null || value === undefined ? null : Number(value);
      }),
    };
  });
  return { years, lines };
}

export function normalizeComparisonSeries(data: AlignedComparison): AlignedComparison {
  return {
    years: data.years,
    lines: data.lines.map((line) => {
      const baseline = line.values[0];
      return {
        countryCode: line.countryCode,
        values: baseline === null || baseline === 0
          ? line.values.map(() => null)
          : line.values.map((value) => value === null ? null : Number((value / baseline * 100).toFixed(12))),
      };
    }),
  };
}

export function latestSharedComparison(data: AlignedComparison) {
  for (let index = data.years.length - 1; index >= 0; index -= 1) {
    const values = data.lines.map((line) => line.values[index]);
    if (values.every((value): value is number => value !== null)) {
      return { year: data.years[index], values };
    }
  }
  return null;
}
