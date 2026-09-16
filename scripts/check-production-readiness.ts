import { countries } from "../lib/catalog/countries";
import { indicators } from "../lib/catalog/indicators";
import { homepageSnapshot } from "../lib/homepage/snapshot";
import { worldBankSeriesSnapshot } from "../lib/series/snapshot";

const failures: string[] = [];
const warnings: string[] = [];
const expectedSeries = countries.length * indicators.length;

if (homepageSnapshot.countryOverviews.length !== countries.length) failures.push("Homepage snapshot does not contain all countries.");
if (homepageSnapshot.gdpRanking.length !== countries.length) failures.push("Homepage GDP ranking does not contain all countries.");
if (worldBankSeriesSnapshot.series.length !== expectedSeries) failures.push(`Series snapshot must contain ${expectedSeries} combinations.`);
for (const item of worldBankSeriesSnapshot.series) {
  if (item.observations.some((row) => row.value !== null && !Number.isFinite(Number(row.value)))) failures.push(`Non-finite value in ${item.countryCode}/${item.indicatorId}.`);
  if (item.observations.some((row, index, rows) => index > 0 && rows[index - 1].year >= row.year)) failures.push(`Years are not strictly ascending in ${item.countryCode}/${item.indicatorId}.`);
}
if (Object.keys(process.env).some((key) => key.startsWith("NEXT_PUBLIC_") && /SECRET|DATABASE_URL|SERVICE_ROLE/.test(key))) failures.push("A server credential uses a NEXT_PUBLIC_ environment variable name.");

const report = {
  ready: failures.length === 0,
  updateMode: "repository-snapshot",
  scope: { countries: countries.length, indicators: indicators.length, series: worldBankSeriesSnapshot.series.length },
  snapshot: { sourceUpdatedAt: worldBankSeriesSnapshot.sourceUpdatedAt, generatedAt: worldBankSeriesSnapshot.generatedAt },
  warnings,
  failures,
};
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
