import assert from "node:assert/strict";
import { test } from "node:test";
import { countries } from "../lib/catalog/countries";
import { indicators } from "../lib/catalog/indicators";
import { formatIndicatorValue } from "../lib/homepage/format";
import { homepageSnapshot } from "../lib/homepage/snapshot";

test("homepage snapshot contains the full 8-country and 6-indicator scope", () => {
  assert.equal(homepageSnapshot.source, "World Bank");
  assert.equal(homepageSnapshot.countryOverviews.length, countries.length);
  for (const country of countries) {
    const overview = homepageSnapshot.countryOverviews.find((item) => item.countryCode === country.iso2);
    assert.ok(overview, `missing homepage data for ${country.iso2}`);
    assert.deepEqual(overview.indicators.map((item) => item.indicatorId), indicators.map((item) => item.id));
  }
});

test("GDP ranking uses one common year and descending non-null values", () => {
  assert.equal(homepageSnapshot.gdpRanking.length, 8);
  assert.equal(new Set(homepageSnapshot.gdpRanking.map((item) => item.year)).size, 1);
  assert.ok(homepageSnapshot.gdpRanking.every((item) => Number.isFinite(Number(item.value))));
  for (let index = 1; index < homepageSnapshot.gdpRanking.length; index++) {
    assert.ok(Number(homepageSnapshot.gdpRanking[index - 1].value) >= Number(homepageSnapshot.gdpRanking[index].value));
  }
});

test("homepage formatting distinguishes missing data from zero", () => {
  assert.equal(formatIndicatorValue({ indicatorId: "inflation", value: null, year: null, unit: "percent" }), "暂无数据");
  assert.equal(formatIndicatorValue({ indicatorId: "inflation", value: "0", year: 2025, unit: "percent" }), "0.00%");
});
