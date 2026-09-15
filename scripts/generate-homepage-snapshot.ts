import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { countries } from "../lib/catalog/countries";
import { indicators } from "../lib/catalog/indicators";
import type { HomepageSnapshot } from "../lib/homepage/types";
import { fetchWorldBankIndicator } from "../lib/world-bank/client";
import type { WorldBankDataset } from "../lib/world-bank/types";

const currentYear = new Date().getUTCFullYear();
const countryCodes = countries.map((country) => country.iso2);
const datasets: WorldBankDataset[] = [];
for (const indicator of indicators) {
  datasets.push(await fetchWorldBankIndicator(indicator, countryCodes, 1960, currentYear));
}

const countryOverviews = countries.map((country) => ({
  countryCode: country.iso2,
  indicators: indicators.map((indicator) => {
    const dataset = datasets.find((item) => item.indicatorId === indicator.id);
    const latest = dataset?.observations
      .filter((row) => row.countryCode === country.iso2 && row.value !== null)
      .sort((left, right) => right.year - left.year)[0];
    return {
      indicatorId: indicator.id,
      value: latest?.value ?? null,
      year: latest?.year ?? null,
      unit: indicator.unit,
    };
  }),
}));

const gdp = datasets.find((dataset) => dataset.indicatorId === "gdp");
if (!gdp) throw new Error("GDP dataset is missing.");
const completeGdpYear = [...new Set(gdp.observations.map((row) => row.year))]
  .sort((left, right) => right - left)
  .find((year) => countries.every((country) => gdp.observations.some(
    (row) => row.countryCode === country.iso2 && row.year === year && row.value !== null,
  )));
if (!completeGdpYear) throw new Error("No GDP year covers all eight countries.");

const gdpRanking = countries.map((country) => {
  const observation = gdp.observations.find(
    (row) => row.countryCode === country.iso2 && row.year === completeGdpYear,
  );
  if (!observation?.value) throw new Error(`GDP is missing for ${country.iso2} in ${completeGdpYear}.`);
  return { countryCode: country.iso2, value: observation.value, year: completeGdpYear };
}).sort((left, right) => Number(right.value) - Number(left.value));

const sourceDates = [...new Set(datasets.map((dataset) => dataset.sourceUpdatedAt).filter(Boolean))];
const snapshot: HomepageSnapshot = {
  generatedAt: new Date().toISOString(),
  source: "World Bank",
  sourceUpdatedAt: sourceDates.length === 1 ? sourceDates[0] : null,
  countryOverviews,
  gdpRanking,
};

const outputDirectory = path.resolve(process.cwd(), "data");
await mkdir(outputDirectory, { recursive: true });
await writeFile(
  path.join(outputDirectory, "homepage-snapshot.json"),
  `${JSON.stringify(snapshot, null, 2)}\n`,
  { flag: "wx" },
);
console.log(`Homepage snapshot written: ${countryOverviews.length} countries, ${gdpRanking.length} GDP ranking rows.`);
