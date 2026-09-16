import { ArrowDown, Database, Globe2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { CountryCard } from "@/components/homepage/country-card";
import { GdpRanking } from "@/components/homepage/gdp-ranking";
import { SiteHeader } from "@/components/homepage/site-header";
import { countries } from "@/lib/catalog/countries";
import { formatBeijingDate } from "@/lib/homepage/format";
import { homepageSnapshot } from "@/lib/homepage/snapshot";

export default function Home() {
  const rankingYear = homepageSnapshot.gdpRanking[0]?.year;
  return (
    <main id="top" className="min-h-screen bg-[#f4f9ff] text-slate-950">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#dff2ff] via-[#eef8ff] to-white">
        <div aria-hidden="true" className="absolute inset-0 opacity-80 [background-image:radial-gradient(circle_at_18%_20%,rgba(125,211,252,0.32),transparent_30%),radial-gradient(circle_at_82%_0%,rgba(191,219,254,0.5),transparent_32%)]" />
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.32] [background-image:linear-gradient(rgba(125,211,252,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,0.45)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="relative">
          <SiteHeader />
          <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-14 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:pb-28">
            <div>
              <p className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700"><Globe2 className="size-4" aria-hidden="true" /> Global Economy Data</p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-[1.12] tracking-[-0.035em] text-slate-950 sm:text-6xl lg:text-7xl">用清楚的数据，<br />理解世界经济。</h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">查看中国、美国、日本、德国、印度、英国、法国和韩国的核心经济指标。每个数字都标明实际年份，缺失数据不会被其他年份替代。</p>
              <a href="#overview" className="mt-9 inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-500">浏览经济概览 <ArrowDown className="size-4" aria-hidden="true" /></a>
            </div>
            <aside className="self-end rounded-3xl border border-sky-100 bg-white/80 p-6 text-slate-900 shadow-[0_24px_70px_-38px_rgba(37,99,235,0.35)] backdrop-blur-sm sm:p-7">
              <p className="text-xs uppercase tracking-[0.18em] text-sky-700">当前数据范围</p>
              <div className="mt-5 grid grid-cols-3 gap-4">
                <div><strong className="block text-3xl font-semibold">8</strong><span className="mt-1 block text-xs text-slate-500">个经济体</span></div>
                <div><strong className="block text-3xl font-semibold">6</strong><span className="mt-1 block text-xs text-slate-500">项指标</span></div>
                <div><strong className="block text-3xl font-semibold">66</strong><span className="mt-1 block text-xs text-slate-500">个年度位置</span></div>
              </div>
              <div className="mt-7 border-t border-sky-100 pt-5 text-xs leading-6 text-slate-500">
                <p className="flex items-center gap-2"><Database className="size-4 text-sky-600" aria-hidden="true" />来源：World Bank</p>
                <p className="mt-2">来源数据更新：{homepageSnapshot.sourceUpdatedAt ?? "未提供"}</p>
                <p>页面快照：{formatBeijingDate(homepageSnapshot.generatedAt)}</p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="overview" aria-labelledby="overview-title" className="mx-auto max-w-7xl scroll-mt-8 px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Economic overview</p><h2 id="overview-title" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">八个经济体，一眼看清</h2></div>
          <p className="max-w-xl text-sm leading-7 text-slate-500">每项指标采用该国家最近一个非空年份，因此同一卡片内的年份可能不同。贷款利率不是央行政策利率。</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {countries.map((country) => {
            const overview = homepageSnapshot.countryOverviews.find((item) => item.countryCode === country.iso2);
            return overview ? <CountryCard key={country.iso2} country={country} overview={overview} /> : null;
          })}
        </div>
      </section>

      <section id="ranking" aria-labelledby="ranking-title" className="scroll-mt-8 border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.72fr_1.28fr] lg:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">GDP ranking</p>
            <h2 id="ranking-title" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{rankingYear} 年 GDP 排名</h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-500">使用同一年、现价美元口径进行比较。八个国家在该年份均有有效数据，空值不参与排名。</p>
            <div className="mt-8 rounded-2xl bg-sky-50 p-5 text-sm leading-7 text-sky-950">排名反映经济总量，不直接代表居民收入或生活质量。人均 GDP 已在上方国家卡片中单独展示。</div>
          </div>
          <div className="rounded-3xl border border-slate-200 px-5 py-2 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.35)] sm:px-7"><GdpRanking rows={homepageSnapshot.gdpRanking} /></div>
        </div>
      </section>

      <section id="about-data" aria-labelledby="data-title" className="mx-auto max-w-7xl scroll-mt-8 px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="rounded-[2rem] border border-sky-100 bg-gradient-to-br from-[#dff2ff] to-white px-6 py-10 text-slate-900 shadow-[0_24px_70px_-45px_rgba(37,99,235,0.3)] sm:px-10 sm:py-12">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div><ShieldCheck className="size-8 text-sky-600" aria-hidden="true" /><h2 id="data-title" className="mt-5 text-3xl font-semibold tracking-tight">数字之外，也说明口径</h2><Link href="/about-data" className="mt-5 inline-flex text-sm font-semibold text-sky-700 hover:text-sky-500">查看完整数据说明 →</Link></div>
            <div className="grid gap-7 text-sm leading-7 text-slate-600 sm:grid-cols-2">
              <div><h3 className="font-semibold text-slate-950">年份独立</h3><p className="mt-2">每个数字旁显示自己的年份。某项 2025 年缺失时，只展示它最近的有效年份。</p></div>
              <div><h3 className="font-semibold text-slate-950">缺失就是缺失</h3><p className="mt-2">World Bank 没有提供的数据明确标为“暂无数据”，不会填成 0，也不会借用其他指标。</p></div>
              <div><h3 className="font-semibold text-slate-950">统一来源</h3><p className="mt-2">第一版六项指标均优先采用 World Bank WDI 数据，保留来源更新时间。</p></div>
              <div><h3 className="font-semibold text-slate-950">原始精度</h3><p className="mt-2">页面会为阅读进行格式化；同步层保留原始十进制数值，不提前舍入。</p></div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs leading-6 text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"><p>全球经济数据对比网站 · 数据来源 World Bank</p><p>GDP：现价美元 · 贷款利率：非央行政策利率</p></div>
      </footer>
    </main>
  );
}
