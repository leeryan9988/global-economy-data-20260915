import type { CountryCode } from "@/lib/catalog/countries";
import type { IndicatorId } from "@/lib/catalog/indicators";

export interface WorldBankObservation {
  countryCode: CountryCode;
  countryIso3: string;
  indicatorId: IndicatorId;
  indicatorCode: string;
  year: number;
  value: string | null;
}

export interface WorldBankDataset {
  indicatorId: IndicatorId;
  indicatorCode: string;
  sourceUpdatedAt: string | null;
  pageCount: number;
  total: number;
  observations: WorldBankObservation[];
}

export interface CoverageRow {
  countryCode: CountryCode;
  indicatorId: IndicatorId;
  returnedYears: number;
  nonNullYears: number;
  firstNonNullYear: number | null;
  latestNonNullYear: number | null;
}
