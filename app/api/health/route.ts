import { countries } from "@/lib/catalog/countries";
import { indicators } from "@/lib/catalog/indicators";
import { worldBankSeriesSnapshot } from "@/lib/series/snapshot";

export const dynamic = "force-static";

export function GET() {
  return Response.json({
    status: "ok",
    service: "global-economy-data",
    source: worldBankSeriesSnapshot.source,
    sourceUpdatedAt: worldBankSeriesSnapshot.sourceUpdatedAt,
    snapshotGeneratedAt: worldBankSeriesSnapshot.generatedAt,
    countries: countries.length,
    indicators: indicators.length,
    series: worldBankSeriesSnapshot.series.length,
    databaseConfigured: Boolean(process.env.DATABASE_URL),
  });
}
