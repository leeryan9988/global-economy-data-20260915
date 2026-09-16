import assert from "node:assert/strict";
import { test } from "node:test";
import { countries } from "../lib/catalog/countries";
import { indicators } from "../lib/catalog/indicators";
import { alignComparisonSeries } from "../lib/compare/data";
import { defaultRankingYear, rankAtYear } from "../lib/rankings/data";
import { getIndicatorSeries, latestNonNull, worldBankSeriesSnapshot } from "../lib/series/snapshot";

test("every indicator page has one series for all eight countries", () => {
  for (const indicator of indicators) {
    const series = countries.map((country) => getIndicatorSeries(country.iso2, indicator.id));
    assert.equal(series.length, 8);
    assert.ok(series.every((item) => item.indicatorId === indicator.id));
  }
});

test("indicator trend aligns all eight countries without filling missing values", () => {
  const codes = countries.map((country) => country.iso2);
  const trend = alignComparisonSeries(worldBankSeriesSnapshot.series, [...codes], "lending-rate", 2000, 2025);
  assert.equal(trend.lines.length, 8);
  assert.equal(trend.years.length, 26);
  const germany = trend.lines.find((line) => line.countryCode === "DE");
  assert.ok(germany);
  assert.ok(germany.values.every((value) => value === null));
  assert.equal(latestNonNull(getIndicatorSeries("DE", "lending-rate")), null);
});

test("each indicator page can show a same-year ranking", () => {
  const codes = countries.map((country) => country.iso2);
  for (const indicator of indicators) {
    const rankingYear = defaultRankingYear(worldBankSeriesSnapshot.series, codes, indicator.id);
    const ranking = rankAtYear(worldBankSeriesSnapshot.series, countries, indicator.id, rankingYear.year);
    assert.equal(ranking.rows.length + ranking.missing.length, 8);
    assert.ok(ranking.rows.length > 0);
  }
});
