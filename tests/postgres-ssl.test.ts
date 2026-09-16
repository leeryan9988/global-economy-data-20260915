import assert from "node:assert/strict";
import test from "node:test";
import { createSupabasePoolConfig } from "../scripts/postgres-ssl";

test("Supabase PostgreSQL connections use the bundled CA with strict verification", () => {
  const config = createSupabasePoolConfig(
    "postgresql://example:p%40ss@db.example.com/postgres?sslmode=require&application_name=test",
  );

  const configuredUrl = new URL(String(config.connectionString));
  assert.equal(configuredUrl.username, "example");
  assert.equal(configuredUrl.password, "p%40ss");
  assert.equal(configuredUrl.hostname, "db.example.com");
  assert.equal(configuredUrl.searchParams.get("sslmode"), "verify-full");
  assert.match(configuredUrl.searchParams.get("sslrootcert") ?? "", /supabase-prod-ca-2021\.crt$/);
  assert.equal(configuredUrl.searchParams.get("uselibpqcompat"), "true");
});

test("Supabase PostgreSQL config rejects non-database protocols", () => {
  assert.throws(
    () => createSupabasePoolConfig("https://example.com/database"),
    /postgres or postgresql protocol/,
  );
});
