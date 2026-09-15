import assert from "node:assert/strict";
import { test } from "node:test";
import { indicators } from "../lib/catalog/indicators";
import { sameNumeric } from "../lib/sync/world-bank";
import { fetchWorldBankIndicator, parseWorldBankPage } from "../lib/world-bank/client";

const gdp = indicators[0];
const metadata = (page = 1, pages = 1, total = 1) => ({ page, pages, per_page: 1, total, sourceid: "2", lastupdated: "2026-07-13" });
const row = (iso3 = "CHN", year = "2023", value: number | null = 0): {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
  unit: string;
  obs_status: string;
  decimal: number;
} => ({ indicator: { id: gdp.api_code, value: gdp.name_en }, country: { id: "CN", value: "China" }, countryiso3code: iso3, date: year, value, unit: "", obs_status: "", decimal: 0 });

test("parser preserves null, zero, negative values and source date", () => {
  const parsed = parseWorldBankPage([metadata(1, 1, 3), [row("CHN", "2021", null), row("CHN", "2022", 0), row("CHN", "2023", -1.25)]], gdp, ["CN"], 2021, 2023);
  assert.equal(parsed.metadata.lastupdated, "2026-07-13");
  assert.deepEqual(parsed.observations.map((item) => item.value), [null, "0", "-1.25"]);
});

test("parser rejects unexpected countries, indicators, years and duplicate keys", () => {
  assert.throws(() => parseWorldBankPage([metadata(), [row("USA")]], gdp, ["CN"], 2020, 2025), /unexpected country/);
  const wrong = row(); wrong.indicator.id = "SP.POP.TOTL";
  assert.throws(() => parseWorldBankPage([metadata(), [wrong]], gdp, ["CN"], 2020, 2025), /unexpected indicator/);
  assert.throws(() => parseWorldBankPage([metadata(), [row("CHN", "2026")]], gdp, ["CN"], 2020, 2025), /out-of-range/);
  assert.throws(() => parseWorldBankPage([metadata(1, 1, 2), [row(), row()]], gdp, ["CN"], 2020, 2025), /duplicate/);
});

test("client follows pagination and validates the declared total", async () => {
  const calls: string[] = [];
  const fetchImpl = async (input: string | URL) => {
    const url = new URL(input);
    calls.push(url.href);
    const page = Number(url.searchParams.get("page"));
    return Response.json(page === 1 ? [metadata(1, 2, 2), [row("CHN", "2023", 1)]] : [metadata(2, 2, 2), [row("CHN", "2022", 2)]]);
  };
  const result = await fetchWorldBankIndicator(gdp, ["CN"], 2022, 2023, { fetchImpl, perPage: 1 });
  assert.equal(result.pageCount, 2);
  assert.equal(result.observations.length, 2);
  assert.equal(calls.length, 2);
  assert.match(calls[0], /source=2/);
  assert.match(calls[0], /date=2022%3A2023/);
});

test("client retries 429 and respects Retry-After without waiting in the test", async () => {
  let calls = 0;
  const delays: number[] = [];
  const fetchImpl = async () => {
    calls++;
    if (calls === 1) return new Response("busy", { status: 429, headers: { "retry-after": "2" } });
    return Response.json([metadata(), [row()]]);
  };
  const result = await fetchWorldBankIndicator(gdp, ["CN"], 2023, 2023, { fetchImpl, sleep: async (delay) => { delays.push(delay); } });
  assert.equal(result.total, 1);
  assert.deepEqual(delays, [2000]);
});

test("client does not retry a permanent HTTP error", async () => {
  let calls = 0;
  await assert.rejects(fetchWorldBankIndicator(gdp, ["CN"], 2023, 2023, { fetchImpl: async () => { calls++; return new Response("bad", { status: 400 }); }, sleep: async () => {} }), /HTTP 400/);
  assert.equal(calls, 1);
});

test("numeric comparison preserves integer trailing zeros and normalizes equivalent decimals", () => {
  assert.equal(sameNumeric("100", "1"), false);
  assert.equal(sameNumeric("100", "100.00"), true);
  assert.equal(sameNumeric("1000", "1e3"), true);
  assert.equal(sameNumeric("0", "-0.000"), true);
  assert.equal(sameNumeric(null, "0"), false);
});
