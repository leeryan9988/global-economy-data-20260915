import type { CountryCode } from "../catalog/countries";
import type { IndicatorId, IndicatorUnit } from "../catalog/indicators";

export interface LatestIndicatorValue {
  indicatorId: IndicatorId;
  value: string | null;
  year: number | null;
  unit: IndicatorUnit;
}

export interface CountryOverview {
  countryCode: CountryCode;
  indicators: LatestIndicatorValue[];
}

export interface GdpRankingEntry {
  countryCode: CountryCode;
  value: string;
  year: number;
}

export interface HomepageSnapshot {
  generatedAt: string;
  source: "World Bank";
  sourceUpdatedAt: string | null;
  countryOverviews: CountryOverview[];
  gdpRanking: GdpRankingEntry[];
}
