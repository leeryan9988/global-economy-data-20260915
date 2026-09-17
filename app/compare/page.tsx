import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, Database } from "lucide-react";
import { CompareControls } from "@/components/compare/compare-controls";
import { ComparisonChart } from "@/components/compare/comparison-chart";
import { ComparisonSummary } from "@/components/compare/comparison-summary";
import { SiteHeader } from "@/components/homepage/site-header";
import { countries } from "@/lib/catalog/countries";
import { indicators } from "@/lib/catalog/indicators";
import { alignComparisonSeries, normalizeComparisonSeries } from "@/lib/compare/data";
import { compareUrl, parseCompareQuery } from "@/lib/compare/params";
import { formatIndicatorValue } from "@/lib/homepage/format";
import { worldBankSeriesSnapshot } from "@/lib/series/snapshot";

export const metadata: Metadata = {
  title: "国家经济数据对比｜全球经济数据",
  description: "选择 2–5 个经济体，对比 GDP、人均 GDP、人口、通胀率、失业率或贷款利率的年度趋势。",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ComparePage({ searchParams }: { searchParams: SearchParams }) {
  const latestAvailableYear = Math.max(...worldBankSeriesSnapshot.series.flatMap((item) => item.observations.filter((row) => row.value !== null).map((row) => row.year)));
  const parsed = parseCompareQuery(await searchParams, worldBankSeriesSnapshot.requestedFromYear, latestAvailableYear);
  const selection = parsed.value;
  const indicator = indicators.find((item) => item.id === selection.indicator)!;
  const selectedCountries = selection.countries.map((code) => countries.find((country) => country.iso2 === code)!);
  const data = alignComparisonSeries(worldBankSeriesSnapshot.series, selection.countries, selection.indicator, selection.from, selection.to);
  const indexedData = normalizeComparisonSeries(data);
  const defaultUrl = compareUrl({ countries: ["CN", "US"], indicator: "gdp", from: 2000, to: latestAvailableYear });

  return (
    <main className="min-h-screen bg-[#f4f9ff] text-slate-950">
      <section className="bg-gradient-to-br from-[#dff2ff] via-[#eef8ff] to-white">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Country comparison</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">在同一条时间轴上比较经济体</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">选择 2–5 个国家和一项指标。缺失年份保留空缺，不补零、不插值，也不跨缺失点连线。</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
        {parsed.errors.length > 0 ? (
          <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><div>{parsed.errors.map((error) => <p key={error}>{error}</p>)}</div></div>
            <Link href={defaultUrl} className="shrink-0 font-semibold underline underline-offset-4">恢复默认比较</Link>
          </div>
        ) : null}

        <CompareControls selection={selection} minYear={worldBankSeriesSnapshot.requestedFromYear} maxYear={latestAvailableYear} />

        <ComparisonSummary data={data} selectedCountries={[...selectedCountries]} indicator={indicator} />

        <section aria-labelledby="compare-chart-title" className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-[0_20px_70px_-55px_rgba(2,132,199,0.65)]">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div><h2 id="compare-chart-title" className="text-xl font-semibold">{indicator.name_zh}趋势比较</h2><p className="mt-1 text-xs text-slate-500">{selection.from}–{selection.to} · {indicator.name_en}</p></div>
            <p className="flex items-center gap-2 text-xs text-slate-500"><Database className="size-4 text-sky-600" aria-hidden="true" />World Bank · 更新 {worldBankSeriesSnapshot.sourceUpdatedAt ?? "未提供"}</p>
          </div>
          <div className="px-2 py-4 sm:px-5"><ComparisonChart data={data} selectedCountries={[...selectedCountries]} indicator={indicator} /></div>
        </section>

        <section aria-labelledby="compare-index-title" className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-[0_20px_70px_-55px_rgba(2,132,199,0.65)]">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
            <h2 id="compare-index-title" className="text-xl font-semibold">相同起点增长比较</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">将 {selection.from} 年设为100，比较之后的相对变化。起始年缺失或等于零的国家不生成指数线。</p>
          </div>
          <div className="px-2 py-4 sm:px-5"><ComparisonChart data={indexedData} selectedCountries={[...selectedCountries]} indicator={indicator} mode="index" /></div>
        </section>

        <section aria-labelledby="compare-table-title" className="overflow-hidden rounded-3xl border border-sky-100 bg-white">
          <div className="px-5 py-5 sm:px-7"><h2 id="compare-table-title" className="text-xl font-semibold">年度数据表</h2><p className="mt-1 text-xs text-slate-500">表格与图表使用同一年度轴；“—”表示来源缺失。</p></div>
          <div className="overflow-x-auto border-t border-slate-100">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead className="bg-sky-50 text-left text-xs text-slate-600"><tr><th className="px-5 py-3 font-medium sm:px-7">年份</th>{selectedCountries.map((country) => <th key={country.iso2} className="px-5 py-3 text-right font-medium">{country.name_zh}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {[...data.years].reverse().map((year, reverseIndex) => {
                  const index = data.years.length - 1 - reverseIndex;
                  return <tr key={year} className="hover:bg-sky-50/50"><td className="px-5 py-3 font-mono text-xs text-slate-500 sm:px-7">{year}</td>{data.lines.map((line) => { const value = line.values[index]; return <td key={line.countryCode} className={`px-5 py-3 text-right font-medium tabular-nums ${value === null ? "text-slate-400" : "text-slate-800"}`}>{value === null ? "—" : formatIndicatorValue({ indicatorId: indicator.id, value: String(value), year, unit: indicator.unit })}</td>; })}</tr>;
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
