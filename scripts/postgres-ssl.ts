import { fileURLToPath } from "node:url";
import type { PoolConfig } from "pg";

const supabaseRootCertificatePath = fileURLToPath(
  new URL("../certs/supabase-prod-ca-2021.crt", import.meta.url),
);

export function createSupabasePoolConfig(connectionString: string): PoolConfig {
  const databaseUrl = new URL(connectionString);
  if (databaseUrl.protocol !== "postgres:" && databaseUrl.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must use the postgres or postgresql protocol.");
  }

  for (const parameter of ["sslmode", "sslrootcert", "sslcert", "sslkey", "uselibpqcompat"]) {
    databaseUrl.searchParams.delete(parameter);
  }
  databaseUrl.searchParams.set("sslmode", "verify-full");
  databaseUrl.searchParams.set("sslrootcert", supabaseRootCertificatePath);
  databaseUrl.searchParams.set("uselibpqcompat", "true");

  return {
    connectionString: databaseUrl.toString(),
  };
}
