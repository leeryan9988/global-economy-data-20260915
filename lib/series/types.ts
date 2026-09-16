import type { CountryCode } from "../catalog/countries";
import type { IndicatorId } from "../catalog/indicators";

export interface AnnualObservation {
  year: number;
  value: string | null;
}

export interface CountryIndicatorSeries {
  countryCode: CountryCode;
  indicatorId: IndicatorId;
  observations: AnnualObservation[];
}

export interface WorldBankSeriesSnapshot {
  generatedAt: string;
  source: "World Bank";
  sourceUpdatedAt: string | null;
  requestedFromYear: number;
  requestedToYear: number;
  series: CountryIndicatorSeries[];
}
