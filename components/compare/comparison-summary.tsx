import { ArrowLeftRight, CalendarRange, Medal, TrendingUp } from "lucide-react";
import { ChangeCard } from "@/components/analysis/change-card";
import type { Country } from "@/lib/catalog/countries";
import type { Indicator } from "@/lib/catalog/indicators";
import { latestSharedComparison, normalizeComparisonSeries, type AlignedComparison } from "@/lib/compare/data";
import { formatIndicatorValue } from "@/lib/homepage/format";

function formatGap(indicator: Indicator, value: number, year: number) {
  return ["inflation", "unemployment", "lending-rate"].includes(indicator.id)
    ? `${value.toFixed(2)} 个百分点`
    : formatIndicatorValue({ indicatorId: indicator.id, value: String(value), year, unit: indicator.unit });
}

export function ComparisonSummary({ data, selectedCountries, indicator }: { data: AlignedComparison; selectedCountries: Country[]; indicator: Indicator }) {
  const latest = latestSharedComparison(data);
  const normalized = normalizeComparisonSeries(data);
  const latestIndex = latestSharedComparison(normalized);
  if (!latest) return <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">所选范围没有所有国家都具备数据的共同年份。</p>;
  const leaderIndex = latest.values.reduce((best, value, index, values) => value > values[best] ? index : best, 0);
  const growthIndex = latestIndex?.values.reduce((best, value, index, values) => value > values[best] ? index : best, 0) ?? null;
  const gap = latest.values.length === 2 ? Math.abs(latest.values[0] - latest.values[1]) : null;
  const ratio = latest.values.length === 2 && Math.min(...latest.values.map(Math.abs)) > 0 ? Math.max(...latest.values.map(Math.abs)) / Math.min(...latest.values.map(Math.abs)) : null;
  return (
    <section aria-labelledby="comparison-reading-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Comparison reading</p><h2 id="comparison-reading-title" className="mt-2 text-2xl font-semibold">同年比较结论</h2></div>
        <p className="text-xs text-slate-500">只使用所有已选国家同时有值的年份</p>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ChangeCard eyebrow="共同数据" title="最近共同年份" value={`${latest.year} 年`} detail={`${selectedCountries.length} 个国家均有${indicator.name_zh}数据`} icon={<CalendarRange className="size-5" aria-hidden="true" />} />
        <ChangeCard eyebrow={`${latest.year} 年`} title="当前数值最高" value={selectedCountries[leaderIndex].name_zh} detail={formatIndicatorValue({ indicatorId: indicator.id, value: String(latest.values[leaderIndex]), year: latest.year, unit: indicator.unit })} icon={<Medal className="size-5" aria-hidden="true" />} />
        <ChangeCard eyebrow={`${data.years[0]} 年=100`} title="区间指数最高" value={growthIndex === null ? "无法计算" : selectedCountries[growthIndex].name_zh} detail={growthIndex === null || !latestIndex ? "起始年份存在缺失或零值" : `最新共同指数 ${latestIndex.values[growthIndex].toFixed(1)}`} icon={<TrendingUp className="size-5" aria-hidden="true" />} />
        <ChangeCard eyebrow={selectedCountries.length === 2 ? `${latest.year} 年` : "仅两国比较显示"} title="两国数值差距" value={gap === null ? "选择两个国家" : formatGap(indicator, gap, latest.year)} detail={ratio === null ? "当前选择不计算倍数" : `较高值约为较低值的 ${ratio.toFixed(2)} 倍`} icon={<ArrowLeftRight className="size-5" aria-hidden="true" />} />
      </div>
    </section>
  );
}
