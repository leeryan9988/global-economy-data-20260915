import { countries } from "@/lib/catalog/countries";
import type { Indicator } from "@/lib/catalog/indicators";
import { formatChange, type ChangeRankingResult } from "@/lib/analysis/economy";
import { formatIndicatorValue } from "@/lib/homepage/format";

export function ChangeRanking({ result, indicator }: { result: ChangeRankingResult; indicator: Indicator }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
        <h2 className="text-xl font-semibold">过去 {result.endYear - result.startYear} 年变化排名</h2>
        <p className="mt-1 text-xs text-slate-500">{result.startYear}–{result.endYear} · {result.kind === "percentage-points" ? "按百分点变化" : "按百分比变化"}</p>
      </div>
      {result.rows.length ? <ol className="divide-y divide-slate-100">
        {result.rows.map((row) => {
          const country = countries.find((item) => item.iso2 === row.countryCode)!;
          return <li key={row.countryCode} className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 sm:px-7">
            <span className="font-mono text-sm font-semibold text-sky-700">{row.rank}</span>
            <div><p className="font-semibold text-slate-900">{country.flag} {country.name_zh}</p><p className="mt-1 text-[11px] text-slate-400">{formatIndicatorValue({ indicatorId: indicator.id, value: String(row.startValue), year: result.startYear, unit: indicator.unit })} → {formatIndicatorValue({ indicatorId: indicator.id, value: String(row.endValue), year: result.endYear, unit: indicator.unit })}</p></div>
            <span className={`text-right text-sm font-semibold tabular-nums ${row.change > 0 ? "text-sky-700" : row.change < 0 ? "text-amber-700" : "text-slate-600"}`}>{formatChange({ change: row.change, kind: result.kind })}</span>
          </li>;
        })}
      </ol> : <p className="px-5 py-12 text-center text-sm text-slate-500">这两个年份没有可比较的数据。</p>}
      <div className="border-t border-slate-100 bg-sky-50/60 px-5 py-4 text-xs leading-5 text-slate-600 sm:px-7">
        {result.missing.length ? `缺失：${result.missing.map((code) => countries.find((country) => country.iso2 === code)?.name_zh).join("、")}。没有借用其他年份。` : "8 个经济体在两个年份均有数据。"}
      </div>
    </section>
  );
}
