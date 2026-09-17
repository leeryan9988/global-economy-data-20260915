import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateSeriesChange, changeRankingAtYear, commonChangeRanking, formatChange, seriesExtrema } from "../lib/analysis/economy";
import { countries } from "../lib/catalog/countries";
import { latestSharedComparison, normalizeComparisonSeries } from "../lib/compare/data";
import { worldBankSeriesSnapshot } from "../lib/series/snapshot";
import type { CountryIndicatorSeries } from "../lib/series/types";

const sample: CountryIndicatorSeries = {
  countryCode: "CN",
  indicatorId: "gdp",
  observations: [
    { year: 2020, value: "100" },
    { year: 2021, value: null },
    { year: 2025, value: "150" },
  ],
};

test("series change uses an exact start year and never fills a gap", () => {
  const result = calculateSeriesChange(sample, 5);
  assert.equal(result?.relativePercent, 50);
  assert.equal(calculateSeriesChange(sample, 4), null);
});

test("rate changes are expressed in percentage points", () => {
  const rate: CountryIndicatorSeries = { countryCode: "CN", indicatorId: "inflation", observations: [{ year: 2020, value: "5" }, { year: 2025, value: "3" }] };
  const result = calculateSeriesChange(rate, 5)!;
  assert.equal(result.kind, "percentage-points");
  assert.equal(result.absolute, -2);
  assert.equal(formatChange(result), "-2.0 个百分点");
});

test("extrema ignore missing observations and preserve their years", () => {
  assert.deepEqual(seriesExtrema(sample), { minimum: { year: 2020, value: 100 }, maximum: { year: 2025, value: 150 }, count: 2 });
});

test("common five-year GDP ranking compares all economies over one shared period", () => {
  const result = commonChangeRanking(worldBankSeriesSnapshot.series, countries.map((country) => country.iso2), "gdp", 5);
  assert.ok(result);
  assert.equal(result.rows.length, 8);
  assert.equal(result.startYear, result.endYear - 5);
  assert.ok(result.rows.every((row) => Number.isFinite(row.change)));
});

test("change ranking at a selected year reports missing countries without borrowing years", () => {
  const result = changeRankingAtYear(worldBankSeriesSnapshot.series, countries.map((country) => country.iso2), "lending-rate", 2024, 5);
  assert.ok(result.rows.some((row) => row.countryCode === "CN"));
  assert.ok(result.missing.includes("DE"));
  assert.equal(result.startYear, 2019);
  assert.equal(result.endYear, 2024);
});

test("comparison index requires the exact selected baseline and keeps gaps", () => {
  const data = { years: [2020, 2021, 2022], lines: [{ countryCode: "CN" as const, values: [10, null, 15] }, { countryCode: "US" as const, values: [20, 22, 24] }] };
  assert.deepEqual(normalizeComparisonSeries(data).lines.map((line) => line.values), [[100, null, 150], [100, 110, 120]]);
  assert.deepEqual(latestSharedComparison(data), { year: 2022, values: [15, 24] });
});
