import assert from "node:assert/strict";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import { countries } from "../lib/catalog/countries";
import { indicators, type Indicator } from "../lib/catalog/indicators";
import { syncAllWorldBankIndicators, syncWorldBankIndicator } from "../lib/sync/world-bank";
import { fetchWorldBankIndicator } from "../lib/world-bank/client";
import type { WorldBankDataset } from "../lib/world-bank/types";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString || process.env.TEST_DATABASE_IS_DISPOSABLE !== "1") {
  throw new Error("Set TEST_DATABASE_URL and TEST_DATABASE_IS_DISPOSABLE=1 for a new local test database.");
}
const target = new URL(connectionString);
if (!['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname) ||
    !/^\/global_economy_stage2_[a-z0-9_]+$/.test(target.pathname)) {
  throw new Error("Only loopback databases named global_economy_stage2_* are allowed.");
}

const pool = new Pool({ connectionString, max: 8 });
let passed = 0;
function pass(name: string) {
  passed++;
  console.log(`PASS ${name}`);
}

async function applyMigrations() {
  const existing = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
  assert.equal(existing.rowCount, 0, "Refusing to run: public schema must be empty");
  await pool.query(`DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
  END $$;`);
  const directory = new URL("../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort()) {
    await pool.query(await readFile(new URL(file, directory), "utf8"));
    console.log(`APPLIED ${file}`);
  }
}

async function writeCoverageReport(result: Awaited<ReturnType<typeof syncAllWorldBankIndicators>>, totalRows: number) {
  const outputDirectory = process.env.STAGE2_REPORT_OUTPUT_DIR;
  if (!outputDirectory) return;
  await mkdir(outputDirectory, { recursive: true });
  const generatedAt = new Date().toISOString();
  const sourceDates = Object.fromEntries(result.indicators.map((item) => [item.indicatorId, item.dataset?.sourceUpdatedAt ?? null]));
  const report = {
    generatedAt,
    source: "World Bank API v2 (source 2)",
    yearRange: { from: 1960, to: new Date().getUTCFullYear() },
    countries: countries.length,
    indicators: indicators.length,
    combinations: result.coverage.length,
    importedRows: totalRows,
    sourceUpdatedAtByIndicator: sourceDates,
    coverage: result.coverage,
  };
  const jsonPath = path.join(outputDirectory, "world-bank-coverage-2026-09-16.json");
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });

  const labels = new Map(indicators.map((item) => [item.id, item.name_zh]));
  const lines = [
    "# World Bank 数据覆盖验证（第 2 阶段）",
    "",
    `- 验证时间：${generatedAt}`,
    "- 数据源：World Bank API v2（source 2）",
    `- 年份请求范围：1960—${new Date().getUTCFullYear()}`,
    `- 覆盖组合：${result.coverage.length}/48`,
    `- 临时数据库导入记录：${totalRows}`,
    "- 说明：非空年份少于请求年份表示上游该国家/指标存在历史缺口；空值会保留，不会改写成 0。",
    "",
    "| 国家 | 指标 | API 返回年份 | 非空年份 | 首个非空年份 | 最新非空年份 |",
    "|---|---|---:|---:|---:|---:|",
    ...result.coverage.map((row) => {
      const country = countries.find((item) => item.iso2 === row.countryCode);
      return `| ${country?.name_zh} | ${labels.get(row.indicatorId)} | ${row.returnedYears} | ${row.nonNullYears} | ${row.firstNonNullYear ?? "—"} | ${row.latestNonNullYear ?? "—"} |`;
    }),
    "",
  ];
  await writeFile(path.join(outputDirectory, "world-bank-coverage-2026-09-16.md"), lines.join("\n"), { flag: "wx" });
}

try {
  await applyMigrations();

  const failed = await syncWorldBankIndicator(
    pool,
    "40000000-0000-4000-8000-000000000001",
    indicators[0],
    1960,
    new Date().getUTCFullYear(),
    async () => { throw new Error("deliberate fetch failure"); },
  );
  assert.equal(failed.status, "failed");
  assert.equal((await pool.query("SELECT count(*)::int AS count FROM indicator_values")).rows[0].count, 0);
  assert.equal((await pool.query("SELECT status, error FROM data_sync_logs WHERE run_id=$1", ["40000000-0000-4000-8000-000000000001"])).rows[0].status, "failed");
  pass("fetch failure is logged and imports no observations");

  const rollbackDataset: WorldBankDataset = {
    indicatorId: "population",
    indicatorCode: "SP.POP.TOTL",
    sourceUpdatedAt: "2026-01-01",
    pageCount: 1,
    total: 2,
    observations: [
      { countryCode: "CN", countryIso3: "CHN", indicatorId: "population", indicatorCode: "SP.POP.TOTL", year: 2020, value: "1" },
      { countryCode: "ZZ" as "CN", countryIso3: "ZZZ", indicatorId: "population", indicatorCode: "SP.POP.TOTL", year: 2020, value: "2" },
    ],
  };
  const rolledBack = await syncWorldBankIndicator(
    pool,
    "40000000-0000-4000-8000-000000000006",
    indicators[2],
    1960,
    new Date().getUTCFullYear(),
    async () => rollbackDataset,
  );
  assert.equal(rolledBack.status, "failed");
  assert.equal((await pool.query("SELECT count(*)::int AS count FROM indicator_values")).rows[0].count, 0);
  pass("a mid-write validation error rolls the indicator transaction back");

  const currentYear = new Date().getUTCFullYear();
  const first = await syncAllWorldBankIndicators(pool, 1960, currentYear);
  assert.equal(first.status, "success", JSON.stringify(first.indicators.filter((item) => item.status === "failed")));
  assert.equal(first.indicators.length, 6);
  assert.equal(first.coverage.length, 48);
  assert.ok(first.coverage.every((row) => row.returnedYears > 0));
  const firstRows = (await pool.query<{ count: number }>("SELECT count(*)::int AS count FROM indicator_values")).rows[0].count;
  assert.equal(firstRows, first.indicators.reduce((sum, item) => sum + item.rowsReceived, 0));
  assert.deepEqual((await pool.query("SELECT count(DISTINCT country_id)::int AS count FROM indicator_values")).rows[0].count, 8);
  assert.deepEqual((await pool.query("SELECT count(DISTINCT indicator_id)::int AS count FROM indicator_values")).rows[0].count, 6);
  pass("real World Bank sync covers all 48 country-indicator combinations");

  const chinaGdp = first.indicators[0].dataset?.observations.find(
    (row) => row.countryCode === "CN" && row.value !== null,
  );
  assert.ok(chinaGdp?.value);
  const storedChinaGdp = (await pool.query<{ value: string; source_updated_at: string }>(
    `SELECT value::text AS value, source_updated_at::text AS source_updated_at
     FROM indicator_values WHERE country_id=$1 AND indicator_id='gdp' AND year=$2`,
    [countries[0].id, chinaGdp.year],
  )).rows[0];
  assert.equal(storedChinaGdp.value, chinaGdp.value);
  assert.equal(storedChinaGdp.source_updated_at, first.indicators[0].dataset?.sourceUpdatedAt);
  pass("a China GDP sample and its source date match the fetched dataset exactly");

  const second = await syncAllWorldBankIndicators(pool, 1960, currentYear);
  assert.equal(second.status, "success");
  assert.ok(second.indicators.every((item) => item.rowsInserted === 0 && item.revisionsPending === 0));
  assert.equal((await pool.query<{ count: number }>("SELECT count(*)::int AS count FROM indicator_values")).rows[0].count, firstRows);
  pass("a repeated full sync is idempotent");

  const concurrencyIndicator = indicators[4];
  const realFetcher = (indicator: Indicator, from: number, to: number) =>
    fetchWorldBankIndicator(indicator, countries.map((country) => country.iso2), from, to);
  const concurrent = await Promise.all([
    syncWorldBankIndicator(pool, "40000000-0000-4000-8000-000000000002", concurrencyIndicator, 1960, currentYear, realFetcher),
    syncWorldBankIndicator(pool, "40000000-0000-4000-8000-000000000003", concurrencyIndicator, 1960, currentYear, realFetcher),
  ]);
  assert.ok(concurrent.every((item) => item.status === "success"));
  assert.equal((await pool.query("SELECT count(*)::int AS count FROM indicator_values")).rows[0].count, firstRows);
  pass("concurrent syncs serialize without duplicate observations");

  const original = (await pool.query<{ country_id: string; year: number; value: string }>(
    "SELECT country_id, year, value::text AS value FROM indicator_values WHERE indicator_id='gdp' AND value IS NOT NULL ORDER BY country_id, year LIMIT 1",
  )).rows[0];
  assert.ok(original);
  await pool.query(
    "UPDATE indicator_values SET value=value+1 WHERE country_id=$1 AND indicator_id='gdp' AND year=$2",
    [original.country_id, original.year],
  );
  const altered = (await pool.query<{ value: string }>(
    "SELECT value::text AS value FROM indicator_values WHERE country_id=$1 AND indicator_id='gdp' AND year=$2",
    [original.country_id, original.year],
  )).rows[0].value;
  const revisionRun = await syncWorldBankIndicator(
    pool,
    "40000000-0000-4000-8000-000000000004",
    indicators[0],
    1960,
    currentYear,
    realFetcher,
  );
  assert.equal(revisionRun.status, "success");
  assert.equal(revisionRun.revisionsPending, 1);
  const proposal = (await pool.query<{ old_value: string; proposed_value: string }>(
    "SELECT old_value::text, proposed_value::text FROM indicator_value_revision_proposals WHERE country_id=$1 AND indicator_id='gdp' AND year=$2",
    [original.country_id, original.year],
  )).rows[0];
  assert.deepEqual(proposal, { old_value: altered, proposed_value: original.value });
  assert.equal((await pool.query<{ value: string }>(
    "SELECT value::text AS value FROM indicator_values WHERE country_id=$1 AND indicator_id='gdp' AND year=$2",
    [original.country_id, original.year],
  )).rows[0].value, altered);
  const repeatedRevision = await syncWorldBankIndicator(
    pool,
    "40000000-0000-4000-8000-000000000005",
    indicators[0],
    1960,
    currentYear,
    realFetcher,
  );
  assert.equal(repeatedRevision.revisionsPending, 0);
  assert.equal((await pool.query("SELECT count(*)::int AS count FROM indicator_value_revision_proposals")).rows[0].count, 1);
  pass("changed upstream values become deduplicated review proposals without overwriting stored data");

  await writeCoverageReport(first, firstRows);
  console.log(`STAGE 2 VERIFICATION PASSED: ${passed} integration checks, ${firstRows} observations, ${first.coverage.length}/48 coverage rows.`);
} finally {
  await pool.end();
}
