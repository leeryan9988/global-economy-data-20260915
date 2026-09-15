import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { Client } from "pg";
import { countries } from "../lib/catalog/countries";
import { indicators, worldBankSource } from "../lib/catalog/indicators";

// Intentionally cannot target a hosted or pre-existing application database.
const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString || process.env.TEST_DATABASE_IS_DISPOSABLE !== "1") {
  throw new Error("Set TEST_DATABASE_URL and TEST_DATABASE_IS_DISPOSABLE=1 for a new local test database.");
}
const target = new URL(connectionString);
if (!["127.0.0.1", "localhost", "[::1]"].includes(target.hostname) ||
    !/^\/global_economy_stage1_[a-z0-9_]+$/.test(target.pathname)) {
  throw new Error("Only loopback databases named global_economy_stage1_* are allowed.");
}

const client = new Client({ connectionString });
const other = new Client({ connectionString });
let passed = 0;
const cn = countries[0].id;
const logId = "20000000-0000-4000-8000-000000000001";
const runId = "30000000-0000-4000-8000-000000000001";

async function check(name: string, run: () => Promise<void>) {
  await client.query("BEGIN");
  try {
    await run();
    passed++;
    console.log(`PASS ${name}`);
  } finally {
    await client.query("ROLLBACK");
  }
}

async function fixture(indicator = "inflation", value: string | null = "0", year = 2023) {
  await client.query("INSERT INTO public.data_sync_logs (id, run_id, indicator_id) VALUES ($1, $2, $3)", [logId, runId, indicator]);
  await client.query("INSERT INTO public.indicator_values (country_id, indicator_id, year, value, sync_log_id) VALUES ($1, $2, $3, $4, $5)", [cn, indicator, year, value, logId]);
}

const codeIs = (code: string) => (error: unknown) => {
  assert.equal((error as { code?: string }).code, code);
  return true;
};

try {
  await client.connect();
  const existing = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
  assert.equal(existing.rowCount, 0, "Refusing to run: public schema must be empty");
  await client.query(`DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
  END $$;`);
  const directory = new URL("../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort()) {
    await client.query(await readFile(new URL(file, directory), "utf8"));
    console.log(`APPLIED ${file}`);
  }
  console.log((await client.query("SELECT version() AS version")).rows[0].version);

  await check("database seed matches all catalog fields (8 countries / 6 indicators)", async () => {
    assert.deepEqual((await client.query("SELECT * FROM countries ORDER BY id")).rows, countries);
    const seeded = (await client.query("SELECT * FROM indicators ORDER BY id")).rows;
    const expected = indicators.map((row) => ({ ...row, source: worldBankSource.source, source_id: 2, source_url: worldBankSource.indicatorBaseUrl + row.api_code })).sort((a, b) => a.id.localeCompare(b.id));
    assert.deepEqual(seeded, expected);
  });

  await check("all five tables enable RLS", async () => {
    const result = await client.query("SELECT relname, relrowsecurity FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='r'");
    assert.equal(result.rowCount, 5);
    assert.ok(result.rows.every((row) => row.relrowsecurity));
  });

  await check("null, zero, negative rates and full numeric precision survive round-trip", async () => {
    await fixture("inflation", null, 2021);
    await client.query("INSERT INTO indicator_values (country_id, indicator_id, year, value, sync_log_id) VALUES ($1,'inflation',2022,0,$2),($1,'inflation',2023,-1.234567890123456789,$2)", [cn, logId]);
    const result = await client.query("SELECT value::text AS value FROM indicator_values ORDER BY year");
    assert.deepEqual(result.rows.map((row) => row.value), [null, "0", "-1.234567890123456789"]);
  });

  await check("latest non-null query preserves zero", async () => {
    await fixture("gdp", "0", 2023);
    await client.query("INSERT INTO indicator_values (country_id, indicator_id, year, value, sync_log_id) VALUES ($1,'gdp',2024,NULL,$2)", [cn, logId]);
    const result = await client.query("SELECT year, value::text AS value FROM indicator_values WHERE value IS NOT NULL ORDER BY year DESC LIMIT 1");
    assert.deepEqual(result.rows, [{ year: 2023, value: "0" }]);
  });

  await check("country-indicator-year duplicate is rejected", async () => {
    await fixture();
    await assert.rejects(client.query("INSERT INTO indicator_values SELECT * FROM indicator_values"), codeIs("23505"));
  });

  await check("unknown country foreign key is rejected", async () => {
    await fixture();
    await assert.rejects(client.query("INSERT INTO indicator_values (country_id, indicator_id, year, value, sync_log_id) VALUES ('99999999-0000-4000-8000-000000000001','inflation',2023,1,$1)", [logId]), codeIs("23503"));
  });

  await check("observation cannot reference a different indicator's sync log", async () => {
    await fixture();
    await assert.rejects(client.query("INSERT INTO indicator_values (country_id, indicator_id, year, value, sync_log_id) VALUES ($1,'gdp',2023,1,$2)", [cn, logId]), codeIs("23503"));
  });

  await check("out-of-range year is rejected", async () => {
    await fixture();
    await assert.rejects(client.query("INSERT INTO indicator_values (country_id, indicator_id, year, value, sync_log_id) VALUES ($1,'inflation',1959,1,$2)", [cn, logId]), codeIs("23514"));
  });

  for (const value of ["NaN", "Infinity", "-Infinity"]) {
    await check(`non-finite value ${value} is rejected`, async () => {
      await fixture();
      await assert.rejects(client.query("INSERT INTO indicator_values (country_id, indicator_id, year, value, sync_log_id) VALUES ($1,'inflation',2022,$2,$3)", [cn, value, logId]), codeIs("23514"));
    });
  }

  for (const role of ["anon", "authenticated"]) {
    await check(`${role} can read public data`, async () => {
      await fixture();
      await client.query(`SET LOCAL ROLE ${role}`);
      assert.equal((await client.query("SELECT * FROM countries")).rowCount, 8);
      assert.equal((await client.query("SELECT * FROM indicators")).rowCount, 6);
      assert.equal((await client.query("SELECT * FROM indicator_values")).rowCount, 1);
    });
    for (const table of ["data_sync_logs", "indicator_value_revision_proposals"]) {
      await check(`${role} cannot read ${table}`, async () => {
        await client.query(`SET LOCAL ROLE ${role}`);
        await assert.rejects(client.query(`SELECT * FROM ${table}`), codeIs("42501"));
      });
    }
    for (const sql of [
      "INSERT INTO countries (iso2,iso3,slug,name_en,name_zh) VALUES ('ZZ','ZZZ','test','Test','测试')",
      "UPDATE indicator_values SET value=99",
      "DELETE FROM indicator_values",
    ]) {
      await check(`${role} cannot ${sql.split(" ")[0]} public data`, async () => {
        await fixture();
        await client.query(`SET LOCAL ROLE ${role}`);
        await assert.rejects(client.query(sql), codeIs("42501"));
      });
    }
  }

  await check("service role can insert observations and logs", async () => {
    await client.query("SET LOCAL ROLE service_role");
    await fixture();
    assert.equal((await client.query("SELECT * FROM indicator_values")).rowCount, 1);
  });
  for (const command of ["UPDATE indicator_values SET value=99", "DELETE FROM indicator_values"]) {
    await check(`service role cannot overwrite observations (${command.split(" ")[0]})`, async () => {
      await fixture();
      await client.query("SET LOCAL ROLE service_role");
      await assert.rejects(client.query(command), codeIs("42501"));
    });
  }

  const proposal = "INSERT INTO indicator_value_revision_proposals (country_id,indicator_id,year,old_value,proposed_value,payload_hash,sync_log_id,status) VALUES ($1,'inflation',2023,0,1,$2,$3,$4)";
  await check("identical revision proposals are deduplicated", async () => {
    await fixture();
    const params = [cn, "a".repeat(64), logId, "pending"];
    await client.query(proposal, params);
    await assert.rejects(client.query(proposal, params), codeIs("23505"));
  });
  await check("approval requires timestamp and evidence", async () => {
    await fixture();
    await assert.rejects(client.query(proposal, [cn, "b".repeat(64), logId, "approved"]), codeIs("23514"));
  });

  await check("finished status requires finished_at", async () => {
    await assert.rejects(client.query("INSERT INTO data_sync_logs (run_id,indicator_id,status) VALUES ($1,'gdp','success')", [runId]), codeIs("23514"));
  });
  await check("transaction rollback leaves no test observations", async () => {
    assert.equal((await client.query("SELECT * FROM indicator_values")).rowCount, 0);
    assert.equal((await client.query("SELECT * FROM data_sync_logs")).rowCount, 0);
    assert.equal((await client.query("SELECT * FROM indicator_value_revision_proposals")).rowCount, 0);
  });

  await other.connect();
  await check("advisory transaction lock excludes a second connection and releases on rollback", async () => {
    await client.query("SELECT pg_advisory_xact_lock(806015)");
    await other.query("BEGIN");
    try {
      assert.equal((await other.query("SELECT pg_try_advisory_xact_lock(806015) AS acquired")).rows[0].acquired, false);
    } finally { await other.query("ROLLBACK"); }
  });
  await other.query("BEGIN");
  assert.equal((await other.query("SELECT pg_try_advisory_xact_lock(806015) AS acquired")).rows[0].acquired, true);
  await other.query("ROLLBACK");

  console.log(`DATABASE VERIFICATION PASSED: ${passed} checks. Test database retained; no real economic data imported.`);
} finally {
  await Promise.allSettled([client.end(), other.end()]);
}
