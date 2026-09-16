import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Database, ExternalLink } from "lucide-react";
import { ComparisonChart } from "@/components/compare/comparison-chart";
import { SiteHeader } from "@/components/homepage/site-header";
import { countries } from "@/lib/catalog/countries";
import { indicators, isIndicatorId, worldBankSource } from "@/lib/catalog/indicators";
import { alignComparisonSeries } from "@/lib/compare/data";
import { compareUrl } from "@/lib/compare/params";
import { formatIndicatorValue } from "@/lib/homepage/format";
import { defaultRankingYear, rankAtYear } from "@/lib/rankings/data";
import { rankingUrl } from "@/lib/rankings/params";
import { getIndicatorSeries, latestNonNull, worldBankSeriesSnapshot } from "@/lib/series/snapshot";

export const dynamicParams = false;

export function generateStaticParams() {
  return indicators.map((indicator) => ({ id: indicator.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const indicator = indicators.find((item) => item.id === id);
  if (!indicator) return {};
  return {
    title: `${indicator.name_zh}数据与八国趋势｜全球经济数据`,
    description: `比较中国、美国、日本、德国、印度、英国、法国和韩国的${indicator.name_zh}最新数据、历史趋势和同年排名。`,
  };
}

export default async function IndicatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isIndicatorId(id)) notFound();
  const indicator = indicators.find((item) => item.id === id)!;
  const actualYears = worldBankSeriesSnapshot.series
    .filter((item) => item.indicatorId === id)
    .flatMap((item) => item.observations.filter((row) => row.value !== null).map((row) => row.year));
  const latestYear = Math.max(...actualYears);
  const fromYear = Math.max(2000, worldBankSeriesSnapshot.requestedFromYear);
  const countryCodes = countries.map((country) => country.iso2);
  const trend = alignComparisonSeries(worldBankSeriesSnapshot.series, [...countryCodes], id, fromYear, latestYear);
  const rankingDefault = defaultRankingYear(worldBankSeriesSnapshot.series, countryCodes, id);
  const ranking = rankAtYear(worldBankSeriesSnapshot.series, countries, id, rankingDefault.year);
  const compareHref = compareUrl({ countries: ["CN", "US"], indicator: id, from: fromYear, to: latestYear });
  const sourceHref = `${worldBankSource.indicatorBaseUrl}${indicator.api_code}`;

  return (
    <main className="min-h-screen bg-[#f4f9ff] text-slate-950">
      <section className="bg-gradient-to-br from-[#dff2ff] via-[#eef8ff] to-white">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-5 pb-14 pt-8 sm:px-8 sm:pb-20 lg:px-10">
          <Link href="/rankings" className="inline-flex items-center gap-2 text-sm text-sky-700 hover:text-sky-500">
            <ArrowLeft className="size-4" aria-hidden="true" />返回排行榜
          </Link>
          <div className="mt-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Economic indicator</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">{indicator.name_zh}</h1>
              <p className="mt-3 text-base text-slate-500">{indicator.name_en}</p>
              <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{indicator.description}</p>
            </div>
            <div className="space-y-2 text-xs text-slate-500">
              <p className="flex items-center gap-2"><Database className="size-4 text-sky-600" aria-hidden="true" />World Bank · {indicator.api_code}</p>
              <p className="flex items-center gap-2"><CalendarDays className="size-4 text-sky-600" aria-hidden="true" />来源更新：{worldBankSeriesSnapshot.sourceUpdatedAt ?? "未提供"}</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="latest-title" className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Latest available</p>
            <h2 id="latest-title" className="mt-3 text-3xl font-semibold tracking-tight">八国最新有效数据</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">每个国家显示自己的最近非空年份，避免把不同年份误当成同年比较。</p>
          </div>
          <Link href={compareHref} className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-500">打开自定义对比<ArrowRight className="size-4" aria-hidden="true" /></Link>
        </div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {countries.map((country) => {
            const latest = latestNonNull(getIndicatorSeries(country.iso2, id));
            return (
              <Link key={country.iso2} href={`/country/${country.slug}`} className="group rounded-2xl border border-sky-100 bg-white p-5 transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-100">
                <div className="flex items-center justify-between gap-3"><span className="text-2xl" aria-hidden="true">{country.flag}</span><span className="text-xs text-slate-400">{latest ? `${latest.year} 年` : "无有效年份"}</span></div>
                <h3 className="mt-4 font-semibold text-slate-900 group-hover:text-sky-700">{country.name_zh}</h3>
                <p className={`mt-2 text-xl font-semibold tracking-tight ${latest ? "text-slate-950" : "text-amber-700"}`}>{latest ? formatIndicatorValue({ indicatorId: id, value: latest.value, year: latest.year, unit: indicator.unit }) : "暂无数据"}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="trend-title" className="border-y border-sky-100 bg-white/70">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Historical trend</p><h2 id="trend-title" className="mt-3 text-3xl font-semibold tracking-tight">{fromYear}–{latestYear} 年趋势</h2><p className="mt-3 text-sm leading-7 text-slate-500">空缺年份保持空白，不补零、不插值。</p></div>
            <a href={sourceHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-500">查看 World Bank 原始指标<ExternalLink className="size-4" aria-hidden="true" /></a>
          </div>
          <div className="mt-8 overflow-hidden rounded-3xl border border-sky-100 bg-white px-2 py-4 shadow-[0_20px_70px_-55px_rgba(2,132,199,0.65)] sm:px-5">
            <ComparisonChart data={trend} selectedCountries={[...countries]} indicator={indicator} />
          </div>
        </div>
      </section>

      <section aria-labelledby="ranking-title" className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Same-year ranking</p><h2 id="ranking-title" className="mt-3 text-3xl font-semibold tracking-tight">{rankingDefault.year} 年八国排名</h2><p className="mt-3 text-sm leading-7 text-slate-500">按同一年份从高到低排列；缺失国家不借用其他年份。</p></div>
          <Link href={rankingUrl(id, rankingDefault.year)} className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-500">查看完整排行榜<ArrowRight className="size-4" aria-hidden="true" /></Link>
        </div>
        <ol className="mt-8 overflow-hidden rounded-3xl border border-sky-100 bg-white divide-y divide-slate-100">
          {ranking.rows.map((row) => (
            <li key={row.country.iso2} className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:px-7">
              <span className="font-mono text-lg font-semibold text-sky-700">{row.rank}</span>
              <div><p className="font-semibold text-slate-900">{row.country.flag} {row.country.name_zh}</p><p className="mt-1 text-xs text-slate-400">{row.country.iso3} · {row.country.name_en}</p></div>
              <span className="text-right font-semibold tabular-nums text-slate-800">{formatIndicatorValue({ indicatorId: id, value: String(row.value), year: rankingDefault.year, unit: indicator.unit })}</span>
            </li>
          ))}
        </ol>
        {ranking.missing.length ? <p className="mt-4 rounded-2xl bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">该年份缺少：{ranking.missing.map((country) => country.name_zh).join("、")}。</p> : null}
      </section>
    </main>
  );
}
