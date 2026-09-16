import assert from "node:assert/strict";
import { test } from "node:test";
import { alignComparisonSeries } from "../lib/compare/data";
import { compareUrl, parseCompareQuery } from "../lib/compare/params";
import type { CountryIndicatorSeries } from "../lib/series/types";

test("compare query accepts two and five supported countries and restores every setting", () => {
  const two = parseCompareQuery({ countries: "CN,US", indicator: "inflation", from: "2001", to: "2020" }, 1960, 2025);
  assert.deepEqual(two.errors, []);
  assert.deepEqual(two.value, { countries: ["CN", "US"], indicator: "inflation", from: 2001, to: 2020 });
  const five = parseCompareQuery({ countries: "CN,US,JP,DE,IN" }, 1960, 2025);
  assert.equal(five.value.countries.length, 5);
});

test("compare query rejects one, six, duplicate or unknown countries", () => {
  for (const value of ["CN", "CN,US,JP,DE,IN,GB", "CN,CN", "CN,ZZ"]) {
    const result = parseCompareQuery({ countries: value }, 1960, 2025);
    assert.ok(result.errors.length > 0);
    assert.deepEqual(result.value.countries, ["CN", "US"]);
  }
});

test("compare query rejects invalid indicators and year ranges with an explicit fallback", () => {
  const result = parseCompareQuery({ indicator: "policy-rate", from: "2030", to: "1990" }, 1960, 2025);
  assert.equal(result.value.indicator, "gdp");
  assert.equal(result.value.from, 2000);
  assert.equal(result.value.to, 2025);
  assert.equal(result.errors.length, 2);
  assert.equal(compareUrl(result.value), "/compare?countries=CN%2CUS&indicator=gdp&from=2000&to=2025");
});

test("aligned comparisons preserve a null gap on one shared year axis", () => {
  const series: CountryIndicatorSeries[] = [
    { countryCode: "CN", indicatorId: "gdp", observations: [{ year: 2000, value: "1" }, { year: 2001, value: null }, { year: 2002, value: "3" }] },
    { countryCode: "US", indicatorId: "gdp", observations: [{ year: 2000, value: "4" }, { year: 2002, value: "6" }] },
  ];
  const result = alignComparisonSeries(series, ["CN", "US"], "gdp", 2000, 2002);
  assert.deepEqual(result.years, [2000, 2001, 2002]);
  assert.deepEqual(result.lines[0].values, [1, null, 3]);
  assert.deepEqual(result.lines[1].values, [4, null, 6]);
});
