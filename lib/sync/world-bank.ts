import { createHash, randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { countries } from "@/lib/catalog/countries";
import { indicators, type Indicator } from "@/lib/catalog/indicators";
import { fetchWorldBankIndicator } from "@/lib/world-bank/client";
import { buildCoverageMatrix } from "@/lib/world-bank/coverage";
import type { CoverageRow, WorldBankDataset } from "@/lib/world-bank/types";

const COUNTRY_IDS = new Map(countries.map((country) => [country.iso2, country.id]));
const ADVISORY_LOCK_ID = 806_015;

export type DatasetFetcher = (indicator: Indicator, fromYear: number, toYear: number) => Promise<WorldBankDataset>;

export interface IndicatorSyncResult {
  indicatorId: Indicator["id"];
  status: "success" | "failed";
  rowsReceived: number;
  rowsInserted: number;
  rowsUnchanged: number;
  revisionsPending: number;
  missingCount: number;
  dataset?: WorldBankDataset;
  error?: string;
}

export interface FullSyncResult {
  runId: string;
  status: "success" | "partial" | "failed";
  startedAt: string;
  finishedAt: string;
  indicators: IndicatorSyncResult[];
  coverage: CoverageRow[];
}

function cleanError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[database-url-redacted]").slice(0, 1000);
}

export function sameNumeric(left: string | null, right: string | null): boolean {
  if (left === null || right === null) return left === right;
  const normalized = (value: string): string => {
    const match = /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(value);
    if (!match) throw new Error("Database contains an invalid numeric value.");
    const sign = match[1] === "-" ? "-" : "";
    const fraction = match[3] ?? "";
    let digits = `${match[2]}${fraction}`.replace(/^0+/, "") || "0";
    let scale = fraction.length - Number(match[4] ?? 0);
    if (digits === "0") return "0";
    while (scale > 0 && digits.endsWith("0")) {
      digits = digits.slice(0, -1);
      scale--;
    }
    if (scale < 0) {
      digits += "0".repeat(-scale);
      scale = 0;
    }
    return `${sign}${digits}:${scale}`;
  };
  return normalized(left) === normalized(right);
}

async function createLog(pool: Pool, runId: string, indicator: Indicator): Promise<string> {
  const result = await pool.query<{ id: string }>(
    "INSERT INTO public.data_sync_logs (run_id, indicator_id) VALUES ($1, $2) RETURNING id",
    [runId, indicator.id],
  );
  return result.rows[0].id;
}

async function markFailed(pool: Pool, logId: string, error: unknown): Promise<string> {
  const message = cleanError(error);
  await pool.query(
    "UPDATE public.data_sync_logs SET status='failed', finished_at=now(), error=$2 WHERE id=$1 AND status='running'",
    [logId, message],
  );
  return message;
}

async function writeDataset(client: PoolClient, logId: string, dataset: WorldBankDataset) {
  await client.query("SELECT pg_advisory_xact_lock($1)", [ADVISORY_LOCK_ID]);
  const existing = await client.query<{ country_id: string; year: number; value: string | null }>(
    "SELECT country_id, year, value::text AS value FROM public.indicator_values WHERE indicator_id=$1",
    [dataset.indicatorId],
  );
  const known = new Map(existing.rows.map((row) => [`${row.country_id}:${row.year}`, row.value]));
  let inserted = 0;
  let unchanged = 0;
  let revisions = 0;
  const fetchedAt = new Date().toISOString();
  for (const observation of dataset.observations) {
    const countryId = COUNTRY_IDS.get(observation.countryCode);
    if (!countryId) throw new Error(`No database country for ${observation.countryCode}.`);
    const key = `${countryId}:${observation.year}`;
    if (!known.has(key)) {
      await client.query(
        `INSERT INTO public.indicator_values
          (country_id, indicator_id, year, value, source_updated_at, fetched_at, sync_log_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [countryId, dataset.indicatorId, observation.year, observation.value, dataset.sourceUpdatedAt, fetchedAt, logId],
      );
      inserted++;
      continue;
    }
    const oldValue = known.get(key) ?? null;
    if (sameNumeric(oldValue, observation.value)) {
      unchanged++;
      continue;
    }
    const payloadHash = createHash("sha256")
      .update(JSON.stringify([countryId, dataset.indicatorId, observation.year, oldValue, observation.value, dataset.sourceUpdatedAt]))
      .digest("hex");
    const proposal = await client.query(
      `INSERT INTO public.indicator_value_revision_proposals
        (country_id, indicator_id, year, old_value, proposed_value, payload_hash, source_updated_at, fetched_at, sync_log_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (country_id, indicator_id, year, payload_hash) DO NOTHING`,
      [countryId, dataset.indicatorId, observation.year, oldValue, observation.value, payloadHash, dataset.sourceUpdatedAt, fetchedAt, logId],
    );
    revisions += proposal.rowCount ?? 0;
  }
  return { inserted, unchanged, revisions, missing: dataset.observations.filter((row) => row.value === null).length };
}

export async function syncWorldBankIndicator(
  pool: Pool,
  runId: string,
  indicator: Indicator,
  fromYear: number,
  toYear: number,
  fetchDataset: DatasetFetcher,
): Promise<IndicatorSyncResult> {
  const logId = await createLog(pool, runId, indicator);
  let client: PoolClient | undefined;
  try {
    const dataset = await fetchDataset(indicator, fromYear, toYear);
    if (dataset.indicatorId !== indicator.id) throw new Error("Fetcher returned the wrong indicator dataset.");
    client = await pool.connect();
    await client.query("BEGIN");
    const counts = await writeDataset(client, logId, dataset);
    await client.query(
      `UPDATE public.data_sync_logs SET status='success', finished_at=now(), rows_received=$2,
       rows_inserted=$3, rows_unchanged=$4, revisions_pending=$5, missing_count=$6 WHERE id=$1`,
      [logId, dataset.observations.length, counts.inserted, counts.unchanged, counts.revisions, counts.missing],
    );
    await client.query("COMMIT");
    return { indicatorId: indicator.id, status: "success", rowsReceived: dataset.observations.length, rowsInserted: counts.inserted, rowsUnchanged: counts.unchanged, revisionsPending: counts.revisions, missingCount: counts.missing, dataset };
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    const message = await markFailed(pool, logId, error);
    return { indicatorId: indicator.id, status: "failed", rowsReceived: 0, rowsInserted: 0, rowsUnchanged: 0, revisionsPending: 0, missingCount: 0, error: message };
  } finally {
    client?.release();
  }
}

export async function syncAllWorldBankIndicators(
  pool: Pool,
  fromYear = 1960,
  toYear = new Date().getUTCFullYear(),
  fetchDataset: DatasetFetcher = (indicator, from, to) => fetchWorldBankIndicator(indicator, countries.map((country) => country.iso2), from, to),
): Promise<FullSyncResult> {
  const runId = randomUUID();
  const startedAt = new Date().toISOString();
  const results: IndicatorSyncResult[] = [];
  for (const indicator of indicators) {
    results.push(await syncWorldBankIndicator(pool, runId, indicator, fromYear, toYear, fetchDataset));
  }
  const successfulDatasets = results.flatMap((result) => result.dataset ? [result.dataset] : []);
  const failed = results.filter((result) => result.status === "failed").length;
  return {
    runId,
    status: failed === 0 ? "success" : failed === results.length ? "failed" : "partial",
    startedAt,
    finishedAt: new Date().toISOString(),
    indicators: results,
    coverage: failed === 0 ? buildCoverageMatrix(successfulDatasets) : [],
  };
}
