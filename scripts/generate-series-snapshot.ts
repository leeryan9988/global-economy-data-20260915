import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { countries } from "../lib/catalog/countries";
import { indicators } from "../lib/catalog/indicators";
import type { WorldBankSeriesSnapshot } from "../lib/series/types";
import { fetchWorldBankIndicator } from "../lib/world-bank/client";
import type { WorldBankDataset } from "../lib/world-bank/types";

const requestedFromYear = 1960;
const requestedToYear = new Date().getUTCFullYear();
const countryCodes = countries.map((country) => country.iso2);
const datasets: WorldBankDataset[] = [];
for (const indicator of indicators) {
  datasets.push(await fetchWorldBankIndicator(indicator, countryCodes, requestedFromYear, requestedToYear));
}

const series = indicators.flatMap((indicator) => {
  const dataset = datasets.find((item) => item.indicatorId === indicator.id);
  if (!dataset) throw new Error(`Dataset is missing for ${indicator.id}.`);
  return countries.map((country) => ({
    countryCode: country.iso2,
    indicatorId: indicator.id,
    observations: dataset.observations
      .filter((row) => row.countryCode === country.iso2)
      .map((row) => ({ year: row.year, value: row.value }))
      .sort((left, right) => left.year - right.year),
  }));
});

const sourceDates = [...new Set(datasets.map((dataset) => dataset.sourceUpdatedAt).filter(Boolean))];
const snapshot: WorldBankSeriesSnapshot = {
  generatedAt: new Date().toISOString(),
  source: "World Bank",
  sourceUpdatedAt: sourceDates.length === 1 ? sourceDates[0] : null,
  requestedFromYear,
  requestedToYear,
  series,
};

const outputDirectory = path.resolve(process.cwd(), "data");
await mkdir(outputDirectory, { recursive: true });
await writeFile(
  path.join(outputDirectory, "world-bank-series.json"),
  `${JSON.stringify(snapshot, null, 2)}\n`,
  { flag: "wx" },
);
console.log(`Series snapshot written: ${series.length} country-indicator combinations.`);
