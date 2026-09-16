import assert from "node:assert/strict";
import { test } from "node:test";
import { countries } from "../lib/catalog/countries";
import { defaultRankingYear, rankAtYear } from "../lib/rankings/data";
import { parseRankingQuery, rankingUrl } from "../lib/rankings/params";
import { worldBankSeriesSnapshot } from "../lib/series/snapshot";
import type { CountryIndicatorSeries } from "../lib/series/types";

const codes = countries.map((country) => country.iso2);

test("GDP defaults to the latest year with all eight economies", () => {
  const result = defaultRankingYear(worldBankSeriesSnapshot.series, codes, "gdp");
  assert.deepEqual(result, { year: 2025, fullCoverage: true });
  assert.equal(rankAtYear(worldBankSeriesSnapshot.series, countries, "gdp", result.year).rows.length, 8);
});

test("lending rate falls back to the latest partial year and lists missing economies", () => {
  const result = defaultRankingYear(worldBankSeriesSnapshot.series, codes, "lending-rate");
  assert.equal(result.year, 2025);
  assert.equal(result.fullCoverage, false);
  const ranking = rankAtYear(worldBankSeriesSnapshot.series, countries, "lending-rate", result.year);
  assert.ok(ranking.rows.length < 8);
  assert.ok(ranking.missing.some((country) => country.iso2 === "DE"));
});

test("ranking uses the exact selected year without borrowing values", () => {
  const result = rankAtYear(worldBankSeriesSnapshot.series, countries, "lending-rate", 2024);
  assert.ok(result.missing.some((country) => country.iso2 === "DE"));
  assert.ok(result.rows.some((row) => row.country.iso2 === "CN"));
  assert.equal(result.rows.length + result.missing.length, 8);
});

test("ties share a rank and leave the next competition rank", () => {
  const sample: CountryIndicatorSeries[] = countries.slice(0, 4).map((country, index) => ({ countryCode: country.iso2, indicatorId: "inflation", observations: [{ year: 2000, value: String([5, 3, 3, 1][index]) }] }));
  assert.deepEqual(rankAtYear(sample, countries.slice(0, 4), "inflation", 2000).rows.map((row) => row.rank), [1, 2, 2, 4]);
});

test("ranking query validates indicator and year and produces a canonical URL", () => {
  const defaults = () => 2025;
  const valid = parseRankingQuery({ indicator: "population", year: "2020" }, 1960, 2025, defaults);
  assert.deepEqual(valid.value, { indicator: "population", year: 2020 });
  assert.deepEqual(valid.errors, []);
  const invalid = parseRankingQuery({ indicator: "bad", year: "2030" }, 1960, 2025, defaults);
  assert.deepEqual(invalid.value, { indicator: "gdp", year: 2025 });
  assert.equal(invalid.errors.length, 2);
  assert.equal(rankingUrl(valid.value.indicator, valid.value.year), "/rankings?indicator=population&year=2020");
});
