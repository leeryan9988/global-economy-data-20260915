import type { IndicatorId } from "@/lib/catalog/indicators";

export type { Indicator, IndicatorId, IndicatorUnit } from "@/lib/catalog/indicators";

/** Public API values stay decimal strings; null means missing, never zero. */
export interface Observation {
  country_id: string;
  indicator_id: IndicatorId;
  year: number;
  value: string | null;
  source: "World Bank";
  source_updated_at: string | null;
  fetched_at: string;
  sync_log_id: string;
}

export type SyncStatus = "running" | "success" | "partial" | "failed" | "skipped";
export type RevisionStatus = "pending" | "approved" | "rejected" | "applied";
