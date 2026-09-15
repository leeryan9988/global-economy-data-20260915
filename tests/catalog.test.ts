import assert from "node:assert/strict";
import { test } from "node:test";
import { countries, isCountryCode } from "../lib/catalog/countries";
import { indicators, isIndicatorId } from "../lib/catalog/indicators";

test("MVP country scope excludes aggregates and preserves ISO codes", () => {
  assert.deepEqual(countries.map((row) => row.iso2), ["CN", "US", "JP", "DE", "IN", "GB", "FR", "KR"]);
  for (const field of ["id", "iso2", "iso3", "slug"] as const) {
    assert.equal(new Set(countries.map((row) => row[field])).size, 8);
  }
  assert.equal(isCountryCode("WLD"), false);
  assert.equal(isCountryCode("UK"), false);
  assert.equal(isCountryCode("GB"), true);
});

test("six agreed World Bank codes retain the correct economic definitions", () => {
  assert.deepEqual(indicators.map((row) => row.api_code), ["NY.GDP.MKTP.CD", "NY.GDP.PCAP.CD", "SP.POP.TOTL", "FP.CPI.TOTL.ZG", "SL.UEM.TOTL.ZS", "FR.INR.LEND"]);
  assert.equal(isIndicatorId("policy-rate"), false);
  assert.equal(isIndicatorId("lending-rate"), true);
  assert.equal(indicators.find((row) => row.id === "gdp")?.unit, "USD");
  assert.match(indicators.find((row) => row.id === "unemployment")!.description, /ILO/);
});
