"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { indicators, type IndicatorId } from "@/lib/catalog/indicators";
import { rankingUrl } from "@/lib/rankings/params";

export function RankingControls({ indicator, year, minYear, maxYear, defaultYears }: { indicator: IndicatorId; year: number; minYear: number; maxYear: number; defaultYears: Record<IndicatorId, number> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, index) => maxYear - index);
  function navigate(nextIndicator: IndicatorId, nextYear: number) {
    startTransition(() => router.replace(rankingUrl(nextIndicator, nextYear), { scroll: false }));
  }
  return (
    <section aria-labelledby="ranking-controls-title" className="rounded-3xl border border-sky-100 bg-white p-5 shadow-[0_20px_70px_-55px_rgba(2,132,199,0.65)] sm:p-7">
      <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Ranking settings</p><h2 id="ranking-controls-title" className="mt-2 text-xl font-semibold">选择指标和年份</h2></div><span className="text-xs text-slate-400" aria-live="polite">{pending ? "正在更新…" : "8 个经济体"}</span></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">指标
          <select value={indicator} onChange={(event) => { const next = event.target.value as IndicatorId; navigate(next, defaultYears[next]); }} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100">
            {indicators.map((item) => <option key={item.id} value={item.id}>{item.name_zh}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">年份
          <select value={year} onChange={(event) => navigate(indicator, Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100">
            {years.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
    </section>
  );
}
