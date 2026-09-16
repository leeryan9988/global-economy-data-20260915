import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Database, ExternalLink, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/homepage/site-header";
import { indicators } from "@/lib/catalog/indicators";
import { worldBankSeriesSnapshot } from "@/lib/series/snapshot";

export const metadata: Metadata = {
  title: "数据来源与口径｜全球经济数据",
  description: "查看六项经济指标的 World Bank 代码、单位、更新时间、缺失值和同步规则。",
};

export default function AboutDataPage() {
  return (
    <main className="min-h-screen bg-[#f4f9ff] text-slate-950">
      <section className="bg-gradient-to-br from-[#dff2ff] via-[#eef8ff] to-white">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Data methodology</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">数据从哪里来，数字怎样解释</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">第一版六项指标统一采用 World Bank World Development Indicators。页面保留实际年份、来源更新时间和缺失值，不把不同年份拼成一次比较。</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
        <section aria-labelledby="data-status-title" className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-sky-100 bg-white p-5"><Database className="size-5 text-sky-600" aria-hidden="true" /><h2 id="data-status-title" className="mt-4 font-semibold">公开数据快照</h2><p className="mt-2 text-sm leading-6 text-slate-500">{worldBankSeriesSnapshot.series.length} 组国家指标序列，来源更新 {worldBankSeriesSnapshot.sourceUpdatedAt ?? "未提供"}。</p></div>
          <div className="rounded-2xl border border-sky-100 bg-white p-5"><CalendarClock className="size-5 text-sky-600" aria-hidden="true" /><h2 className="mt-4 font-semibold">年度范围</h2><p className="mt-2 text-sm leading-6 text-slate-500">请求范围 {worldBankSeriesSnapshot.requestedFromYear}–{worldBankSeriesSnapshot.requestedToYear}；各指标按来源实际可用年份显示。</p></div>
          <div className="rounded-2xl border border-sky-100 bg-white p-5"><ShieldCheck className="size-5 text-sky-600" aria-hidden="true" /><h2 className="mt-4 font-semibold">修订保护</h2><p className="mt-2 text-sm leading-6 text-slate-500">已有历史值发生变化时先进入修订提案，不自动覆盖已发布数据。</p></div>
        </section>

        <section aria-labelledby="indicator-source-title">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Indicator catalog</p><h2 id="indicator-source-title" className="mt-3 text-3xl font-semibold tracking-tight">六项指标与官方代码</h2></div>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {indicators.map((indicator) => <article key={indicator.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold text-slate-900">{indicator.name_zh}</h3><p className="mt-1 font-mono text-xs text-sky-700">{indicator.api_code}</p></div><span className="rounded-full bg-sky-50 px-3 py-1 text-xs text-sky-700">{indicator.unit}</span></div>
              <p className="mt-4 text-sm leading-6 text-slate-500">{indicator.description}</p>
              <a href={`https://data.worldbank.org/indicator/${indicator.api_code}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-500">World Bank 官方页面 <ExternalLink className="size-3.5" aria-hidden="true" /></a>
            </article>)}
          </div>
        </section>

        <section aria-labelledby="method-title" className="rounded-3xl border border-sky-100 bg-white p-6 sm:p-8">
          <h2 id="method-title" className="text-2xl font-semibold">读取与比较规则</h2>
          <ol className="mt-5 grid gap-4 text-sm leading-7 text-slate-600 sm:grid-cols-2">
            <li><strong className="text-slate-900">1. 最新值：</strong>每个国家、每项指标独立选择最近非空年份，并在数字旁显示该年份。</li>
            <li><strong className="text-slate-900">2. 指定年份：</strong>只读取用户选择的年份；没有值就显示缺失，不借用前一年。</li>
            <li><strong className="text-slate-900">3. 趋势缺口：</strong>null 保持为折线缺口，不补零、不插值，也不跨缺失点连线。</li>
            <li><strong className="text-slate-900">4. 同年排名：</strong>所有国家使用同一指标和同一年份，并显示覆盖数与缺失国家。</li>
            <li><strong className="text-slate-900">5. 数值精度：</strong>存储层保留原始十进制值，页面格式化只用于阅读。</li>
            <li><strong className="text-slate-900">6. 贷款利率：</strong>不是央行政策利率，各国贷款条件和统计覆盖可能不同。</li>
          </ol>
        </section>

        <div className="flex flex-wrap gap-3"><Link href="/compare" className="rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500">开始国家对比</Link><Link href="/rankings" className="rounded-full border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-700 hover:bg-sky-50">查看八国排名</Link></div>
      </div>
    </main>
  );
}
