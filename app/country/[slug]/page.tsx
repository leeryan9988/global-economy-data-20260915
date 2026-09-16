import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Database } from "lucide-react";
import { IndicatorHistory } from "@/components/country/indicator-history";
import { SiteHeader } from "@/components/homepage/site-header";
import { countries } from "@/lib/catalog/countries";
import { indicators } from "@/lib/catalog/indicators";
import { formatIndicatorValue } from "@/lib/homepage/format";
import { getCountrySeries, latestNonNull, worldBankSeriesSnapshot } from "@/lib/series/snapshot";

export const dynamicParams = false;

export function generateStaticParams() {
  return countries.map((country) => ({ slug: country.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const country = countries.find((item) => item.slug === slug);
  if (!country) return {};
  return {
    title: `${country.name_zh}经济数据｜全球经济数据`,
    description: `查看${country.name_zh}的 GDP、人均 GDP、人口、通胀率、失业率和贷款利率历史数据。`,
  };
}

export default async function CountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = countries.find((item) => item.slug === slug);
  if (!country) notFound();
  const countrySeries = getCountrySeries(country.iso2);
  return (
    <main className="min-h-screen bg-[#f4f9ff]">
      <section className="bg-gradient-to-br from-[#dff2ff] via-[#eef8ff] to-white text-slate-950">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-5 pb-14 pt-8 sm:px-8 sm:pb-20 lg:px-10">
          <Link href="/countries" className="inline-flex items-center gap-2 text-sm text-sky-700 hover:text-sky-500"><ArrowLeft className="size-4" aria-hidden="true" />返回国家列表</Link>
          <div className="mt-10 flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
            <div className="flex items-center gap-5"><span className="text-6xl" aria-hidden="true">{country.flag}</span><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">{country.iso3} · {country.region}</p><h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-6xl">{country.name_zh}</h1><p className="mt-2 text-sm text-slate-500">{country.name_en}</p></div></div>
            <div className="space-y-2 text-xs text-slate-500"><p className="flex items-center gap-2"><Database className="size-4 text-sky-600" aria-hidden="true" />来源：{worldBankSeriesSnapshot.source}</p><p className="flex items-center gap-2"><CalendarDays className="size-4 text-sky-600" aria-hidden="true" />来源更新：{worldBankSeriesSnapshot.sourceUpdatedAt ?? "未提供"}</p></div>
          </div>
        </div>
      </section>

      <section aria-labelledby="latest-title" className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Latest available</p><h2 id="latest-title" className="mt-3 text-3xl font-semibold tracking-tight">最新有效数据</h2><p className="mt-3 text-sm leading-7 text-slate-500">六项指标分别使用最近的非空年份，不把旧年份伪装成同一年度。</p></div>
        <dl className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {indicators.map((indicator) => {
            const series = countrySeries.find((item) => item.indicatorId === indicator.id);
            if (!series) return null;
            const latest = latestNonNull(series);
            return (
              <div key={indicator.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <dt className="flex items-center justify-between gap-3 text-xs text-slate-500"><span>{indicator.name_zh}</span><span>{latest?.year ?? "—"} 年</span></dt>
                <dd className={`mt-3 text-2xl font-semibold tracking-tight ${latest ? "text-slate-950" : "text-amber-700"}`}>{latest ? formatIndicatorValue({ indicatorId: indicator.id, value: latest.value, year: latest.year, unit: indicator.unit }) : "暂无数据"}</dd>
              </div>
            );
          })}
        </dl>
      </section>

      <section aria-labelledby="history-title" className="border-t border-slate-200 bg-white/60">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Historical data</p><h2 id="history-title" className="mt-3 text-3xl font-semibold tracking-tight">历史数据</h2><p className="mt-3 text-sm leading-7 text-slate-500">展开任一指标查看年度表。横向空间不足时，表格区域可以单独滚动。</p></div>
          <div className="mt-9 space-y-4">
            {indicators.map((indicator, index) => {
              const series = countrySeries.find((item) => item.indicatorId === indicator.id);
              return series ? <IndicatorHistory key={indicator.id} indicator={indicator} series={series} initiallyOpen={index === 0} /> : null;
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
