import { countries } from "@/lib/catalog/countries";
import { formatGdpRankingValue } from "@/lib/homepage/format";
import type { GdpRankingEntry } from "@/lib/homepage/types";

export function GdpRanking({ rows }: { rows: GdpRankingEntry[] }) {
  const maximum = Math.max(...rows.map((row) => Number(row.value)));
  return (
    <ol className="divide-y divide-slate-100">
      {rows.map((row, index) => {
        const country = countries.find((item) => item.iso2 === row.countryCode);
        const width = Math.max(5, Number(row.value) / maximum * 100);
        return (
          <li key={row.countryCode} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-4 sm:grid-cols-[2.5rem_10rem_1fr_9rem] sm:gap-5">
            <span className={`text-center font-mono text-sm ${index < 3 ? "font-semibold text-emerald-800" : "text-slate-400"}`}>{index + 1}</span>
            <span className="flex items-center gap-2.5 font-medium text-slate-800">
              <span aria-hidden="true" className="text-lg">{country?.flag}</span>
              <span>{country?.name_zh}</span>
            </span>
            <span className="hidden h-2 overflow-hidden rounded-full bg-slate-100 sm:block">
              <span className="block h-full rounded-full bg-gradient-to-r from-emerald-700 to-teal-400" style={{ width: `${width}%` }} />
            </span>
            <span className="text-right text-sm font-semibold tabular-nums text-slate-900">{formatGdpRankingValue(row.value)}</span>
          </li>
        );
      })}
    </ol>
  );
}
