import { Pool } from "pg";
import { syncAllWorldBankIndicators } from "../lib/sync/world-bank";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required and must point to this project's PostgreSQL database.");
const fromYear = Number(process.env.SYNC_FROM_YEAR ?? "1960");
const toYear = Number(process.env.SYNC_TO_YEAR ?? new Date().getUTCFullYear());
const pool = new Pool({ connectionString, max: 3, application_name: "global-economy-world-bank-sync" });
try {
  const result = await syncAllWorldBankIndicators(pool, fromYear, toYear);
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "success") process.exitCode = 1;
} finally {
  await pool.end();
}
