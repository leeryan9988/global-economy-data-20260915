import assert from "node:assert/strict";
import { test } from "node:test";
import { countries } from "../lib/catalog/countries";
import { indicators } from "../lib/catalog/indicators";
import { getCountrySeries, getIndicatorSeries, latestNonNull, worldBankSeriesSnapshot } from "../lib/series/snapshot";

test("country routes have eight unique stable slugs", () => {
  assert.equal(countries.length, 8);
  assert.equal(new Set(countries.map((country) => country.slug)).size, 8);
  assert.ok(countries.every((country) => /^[a-z]+(?:-[a-z]+)*$/.test(country.slug)));
});

test("series snapshot contains all 48 combinations in catalog order", () => {
  assert.equal(worldBankSeriesSnapshot.series.length, countries.length * indicators.length);
  for (const country of countries) {
    const series = getCountrySeries(country.iso2);
    assert.deepEqual(series.map((item) => item.indicatorId), indicators.map((indicator) => indicator.id));
    assert.ok(series.every((item) => item.observations.length === 66));
    assert.ok(series.every((item) => item.observations.every((row, index, rows) => index === 0 || rows[index - 1].year < row.year)));
  }
});

test("latest values remain independent and fully missing series stay missing", () => {
  assert.equal(latestNonNull(getIndicatorSeries("CN", "lending-rate"))?.year, 2024);
  assert.equal(latestNonNull(getIndicatorSeries("US", "lending-rate"))?.year, 2021);
  assert.equal(latestNonNull(getIndicatorSeries("DE", "lending-rate")), null);
  assert.equal(latestNonNull(getIndicatorSeries("FR", "lending-rate")), null);
});
