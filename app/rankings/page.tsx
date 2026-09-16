import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, Database } from "lucide-react";
import { RankingControls } from "@/components/rankings/ranking-controls";
import { SiteHeader } from "@/components/homepage/site-header";
import { countries } from "@/lib/catalog/countries";
import { indicators, type IndicatorId } from "@/lib/catalog/indicators";
import { formatIndicatorValue } from "@/lib/homepage/format";
import { defaultRankingYear, rankAtYear } from "@/lib/rankings/data";
import { parseRankingQuery, rankingUrl } from "@/lib/rankings/params";
import { worldBankSeriesSnapshot } from "@/lib/series/snapshot";

export const metadata: Metadata = {
  title: "八国经济指标排行榜｜全球经济数据",
  description: "按同一指标和同一年份比较中国、美国、日本、德国、印度、英国、法国和韩国。",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function RankingsPage({ searchParams }: { searchParams: SearchParams }) {
  const actualYears = worldBankSeriesSnapshot.series.flatMap((item) => item.observations.filter((row) => row.value !== null).map((row) => row.year));
  const minYear = worldBankSeriesSnapshot.requestedFromYear;
  const maxYear = Math.max(...actualYears);
  const defaultYears = Object.fromEntries(indicators.map((indicator) => [indicator.id, defaultRankingYear(worldBankSeriesSnapshot.series, countries.map((country) => country.iso2), indicator.id).year])) as Record<IndicatorId, number>;
  const parsed = parseRankingQuery(await searchParams, minYear, maxYear, (indicator) => defaultYears[indicator]);
  const { indicator: indicatorId, year } = parsed.value;
  const indicator = indicators.find((item) => item.id === indicatorId)!;
  const result = rankAtYear(worldBankSeriesSnapshot.series, countries, indicatorId, year);
  const maxValue = result.rows[0]?.value ?? 0;

  return (
    <main className="min-h-screen bg-[#f4f9ff] text-slate-950">
      <section className="bg-gradient-to-br from-[#dff2ff] via-[#eef8ff] to-white">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Eight economy ranking</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">八个经济体，同一年份比较</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">排行榜只覆盖本项目选择的 8 个国家，并非全球排名。所有数值来自同一指标、同一年份。</p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-8 px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
        {parsed.errors.length ? <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-2"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><div>{parsed.errors.map((error) => <p key={error}>{error}</p>)}</div></div><Link href={rankingUrl("gdp", defaultYears.gdp)} className="shrink-0 font-semibold underline underline-offset-4">恢复默认排名</Link></div> : null}

        <RankingControls indicator={indicatorId} year={year} minYear={minYear} maxYear={maxYear} defaultYears={defaultYears} />

        <section aria-labelledby="ranking-title" className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-[0_20px_70px_-55px_rgba(2,132,199,0.65)]">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div><h2 id="ranking-title" className="text-xl font-semibold">{year} 年{indicator.name_zh}排名</h2><p className="mt-1 text-xs text-slate-500">覆盖 {result.rows.length}/8 个经济体 · 按数值从高到低排列</p></div>
            <p className="flex items-center gap-2 text-xs text-slate-500"><Database className="size-4 text-sky-600" aria-hidden="true" />World Bank · {indicator.api_code}</p>
          </div>

          {result.rows.length ? <ol className="divide-y divide-slate-100">
            {result.rows.map((row) => <li key={row.country.iso2} className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 sm:grid-cols-[3rem_minmax(0,1fr)_minmax(10rem,0.8fr)_auto] sm:px-7">
              <span className="font-mono text-lg font-semibold text-sky-700">{row.rank}</span>
              <div className="min-w-0"><p className="font-semibold text-slate-900">{row.country.name_zh}</p><p className="mt-1 text-xs text-slate-400">{row.country.iso3} · {row.country.name_en}</p></div>
              <div className="hidden h-2 overflow-hidden rounded-full bg-sky-50 sm:block"><div className="h-full rounded-full bg-sky-500" style={{ width: `${maxValue === 0 ? 0 : Math.max(2, row.value / maxValue * 100)}%` }} /></div>
              <span className="text-right font-semibold tabular-nums text-slate-800">{formatIndicatorValue({ indicatorId, value: String(row.value), year, unit: indicator.unit })}</span>
            </li>)}
          </ol> : <div className="px-5 py-14 text-center text-sm text-slate-500">该年份没有可用于排名的数据。</div>}

          <div className="border-t border-slate-100 bg-sky-50/60 px-5 py-4 text-xs leading-5 text-slate-600 sm:px-7">
            {result.missing.length ? <p><strong className="text-slate-800">缺失国家：</strong>{result.missing.map((country) => country.name_zh).join("、")}。这些国家不会借用其他年份的数据参与排名。</p> : <p>本年份 8 个经济体均有有效数据。</p>}
            <p className="mt-1">数值排名只表示该指标的高低，不代表综合经济质量或生活水平。</p>
          </div>
        </section>
      </div>
    </main>
  );
}
