import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Globe2 } from "lucide-react";
import { SiteHeader } from "@/components/homepage/site-header";
import { countries } from "@/lib/catalog/countries";
import { formatIndicatorValue } from "@/lib/homepage/format";
import { homepageSnapshot } from "@/lib/homepage/snapshot";

export const metadata: Metadata = {
  title: "国家列表｜全球经济数据",
  description: "查看中国、美国、日本、德国、印度、英国、法国和韩国的核心经济数据与历史记录。",
};

export default function CountriesPage() {
  return (
    <main className="min-h-screen bg-[#f4f9ff]">
      <section className="bg-gradient-to-br from-[#dff2ff] via-[#eef8ff] to-white text-slate-950">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700"><Globe2 className="size-4" aria-hidden="true" /> Countries</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">选择一个经济体</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">进入国家详情，查看六项核心指标的最新值、实际年份和 1960 年以来的历史记录。</p>
        </div>
      </section>
      <section aria-label="国家列表" className="mx-auto grid max-w-7xl gap-5 px-5 py-14 sm:grid-cols-2 sm:px-8 sm:py-20 lg:grid-cols-4 lg:px-10">
        {countries.map((country) => {
          const overview = homepageSnapshot.countryOverviews.find((item) => item.countryCode === country.iso2);
          const gdp = overview?.indicators.find((item) => item.indicatorId === "gdp");
          const population = overview?.indicators.find((item) => item.indicatorId === "population");
          return (
            <Link key={country.iso2} href={`/country/${country.slug}`} className="group rounded-3xl border border-sky-100 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(30,64,175,0.3)] transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-[0_25px_60px_-38px_rgba(56,189,248,0.45)]">
              <div className="flex items-start justify-between"><span className="text-4xl" aria-hidden="true">{country.flag}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[11px] text-slate-500">{country.iso3}</span></div>
              <h2 className="mt-6 text-2xl font-semibold tracking-tight">{country.name_zh}</h2>
              <p className="mt-1 text-sm text-slate-400">{country.name_en}</p>
              <dl className="mt-7 space-y-4 border-t border-slate-100 pt-5 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-slate-500">GDP · {gdp?.year ?? "—"}</dt><dd className="font-semibold">{gdp ? formatIndicatorValue(gdp) : "—"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-500">人口 · {population?.year ?? "—"}</dt><dd className="font-semibold">{population ? formatIndicatorValue(population) : "—"}</dd></div>
              </dl>
              <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-sky-700">查看详情 <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden="true" /></span>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
