import { ChevronDown, ExternalLink } from "lucide-react";
import type { Indicator } from "@/lib/catalog/indicators";
import { formatIndicatorValue } from "@/lib/homepage/format";
import type { CountryIndicatorSeries } from "@/lib/series/types";

export function IndicatorHistory({ indicator, series, initiallyOpen = false }: { indicator: Indicator; series: CountryIndicatorSeries; initiallyOpen?: boolean }) {
  const valid = series.observations.filter((item) => item.value !== null);
  const latest = valid.at(-1);
  return (
    <details open={initiallyOpen} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_45px_-38px_rgba(15,23,42,0.35)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 marker:hidden sm:px-6">
        <div>
          <h3 className="font-semibold text-slate-900">{indicator.name_zh}</h3>
          <p className="mt-1.5 text-xs text-slate-500">{valid.length} 个有效年份 · 最新 {latest?.year ?? "暂无"}</p>
        </div>
        <ChevronDown className="size-5 shrink-0 text-slate-400 transition group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t border-slate-100">
        <div className="max-h-[32rem] overflow-auto">
          <table className="w-full min-w-[28rem] border-collapse text-sm">
            <thead className="sticky top-0 bg-slate-50 text-left text-xs text-slate-500">
              <tr><th className="px-5 py-3 font-medium sm:px-6">年份</th><th className="px-5 py-3 text-right font-medium sm:px-6">数值</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...series.observations].reverse().map((observation) => (
                <tr key={observation.year} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3 font-mono text-xs text-slate-500 sm:px-6">{observation.year}</td>
                  <td className={`px-5 py-3 text-right font-medium tabular-nums sm:px-6 ${observation.value === null ? "text-slate-400" : "text-slate-800"}`}>
                    {observation.value === null ? "—" : formatIndicatorValue({ indicatorId: indicator.id, value: observation.value, year: observation.year, unit: indicator.unit })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>{indicator.description}</span>
          <a className="inline-flex shrink-0 items-center gap-1.5 font-medium text-sky-700 hover:text-sky-500" href={`https://data.worldbank.org/indicator/${indicator.api_code}`} target="_blank" rel="noreferrer">
            World Bank <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </details>
  );
}
