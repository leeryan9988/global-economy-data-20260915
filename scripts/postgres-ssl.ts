import { readFileSync } from "node:fs";
import type { PoolConfig } from "pg";

const supabaseRootCertificate = readFileSync(
  new URL("../certs/supabase-prod-ca-2021.crt", import.meta.url),
  "utf8",
);

export function createSupabasePoolConfig(connectionString: string): PoolConfig {
  const databaseUrl = new URL(connectionString);
  if (databaseUrl.protocol !== "postgres:" && databaseUrl.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must use the postgres or postgresql protocol.");
  }

  return {
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    host: databaseUrl.hostname,
    port: databaseUrl.port ? Number(databaseUrl.port) : 5432,
    database: decodeURIComponent(databaseUrl.pathname.slice(1)) || "postgres",
    ssl: {
      ca: supabaseRootCertificate,
      rejectUnauthorized: true,
    },
  };
}
