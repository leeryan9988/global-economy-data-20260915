import { countries, type CountryCode } from "@/lib/catalog/countries";
import { indicators, type IndicatorId } from "@/lib/catalog/indicators";
import type { CoverageRow, WorldBankDataset } from "./types";

export function buildCoverageMatrix(datasets: readonly WorldBankDataset[]): CoverageRow[] {
  const byIndicator = new Map<IndicatorId, WorldBankDataset>(datasets.map((dataset) => [dataset.indicatorId, dataset]));
  return indicators.flatMap((indicator) => {
    const dataset = byIndicator.get(indicator.id);
    if (!dataset) throw new Error(`Missing dataset for ${indicator.id}.`);
    return countries.map((country) => {
      const rows = dataset.observations.filter((row) => row.countryCode === country.iso2);
      const validYears = rows.filter((row) => row.value !== null).map((row) => row.year).sort((a, b) => a - b);
      return {
        countryCode: country.iso2 as CountryCode,
        indicatorId: indicator.id,
        returnedYears: rows.length,
        nonNullYears: validYears.length,
        firstNonNullYear: validYears[0] ?? null,
        latestNonNullYear: validYears.at(-1) ?? null,
      };
    });
  });
}
