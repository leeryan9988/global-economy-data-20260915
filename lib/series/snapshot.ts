import snapshotJson from "../../data/world-bank-series.json";
import type { CountryCode } from "../catalog/countries";
import type { IndicatorId } from "../catalog/indicators";
import type { CountryIndicatorSeries, WorldBankSeriesSnapshot } from "./types";

export const worldBankSeriesSnapshot = snapshotJson as WorldBankSeriesSnapshot;

export function getCountrySeries(countryCode: CountryCode): CountryIndicatorSeries[] {
  return worldBankSeriesSnapshot.series.filter((item) => item.countryCode === countryCode);
}

export function getIndicatorSeries(countryCode: CountryCode, indicatorId: IndicatorId): CountryIndicatorSeries {
  const series = worldBankSeriesSnapshot.series.find(
    (item) => item.countryCode === countryCode && item.indicatorId === indicatorId,
  );
  if (!series) throw new Error(`Missing series for ${countryCode}/${indicatorId}.`);
  return series;
}

export function latestNonNull(series: CountryIndicatorSeries) {
  return [...series.observations].reverse().find((item) => item.value !== null) ?? null;
}
