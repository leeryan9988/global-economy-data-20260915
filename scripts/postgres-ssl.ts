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

  // node-postgres lets SSL query parameters replace the explicit SSL object.
  // Remove those parameters so the trusted Supabase CA remains authoritative.
  for (const parameter of ["sslmode", "sslrootcert", "sslcert", "sslkey"]) {
    databaseUrl.searchParams.delete(parameter);
  }

  return {
    connectionString: databaseUrl.toString(),
    ssl: {
      ca: supabaseRootCertificate,
      rejectUnauthorized: true,
    },
  };
}
