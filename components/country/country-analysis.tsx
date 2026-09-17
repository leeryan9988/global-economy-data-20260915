import { BarChart3, CircleDollarSign, Landmark, Users } from "lucide-react";
import { ChangeCard } from "@/components/analysis/change-card";
import { calculateSeriesChange, formatChange, rankForCountry, seriesExtrema, trendWord } from "@/lib/analysis/economy";
import type { Country } from "@/lib/catalog/countries";
import { indicators, type IndicatorId } from "@/lib/catalog/indicators";
import type { CountryIndicatorSeries } from "@/lib/series/types";

const signalIds: IndicatorId[] = ["gdp", "gdp-per-capita", "population", "inflation", "unemployment", "lending-rate"];

export function CountryAnalysis({ country, countrySeries, allSeries }: { country: Country; countrySeries: CountryIndicatorSeries[]; allSeries: CountryIndicatorSeries[] }) {
  const changes = signalIds.map((indicatorId) => {
    const series = countrySeries.find((item) => item.indicatorId === indicatorId)!;
    return { indicator: indicators.find((item) => item.id === indicatorId)!, series, change: calculateSeriesChange(series, 5), extrema: seriesExtrema(series) };
  });
  const gdpRank = rankForCountry(allSeries, country.iso2, "gdp");
  const gdpChange = changes.find((item) => item.indicator.id === "gdp")?.change;
  const populationChange = changes.find((item) => item.indicator.id === "population")?.change;
  const inflationChange = changes.find((item) => item.indicator.id === "inflation")?.change;
  const sentences = [
    gdpRank ? `${country.name_zh}在所选八国的 ${gdpRank.year} 年GDP总量排名第 ${gdpRank.rank}。` : null,
    gdpChange ? `${gdpChange.start.year}至${gdpChange.end.year}年，现价美元GDP${trendWord(gdpChange.relativePercent ?? 0)} ${formatChange(gdpChange)}。` : null,
    populationChange ? `同期人口${trendWord(populationChange.relativePercent ?? 0)} ${formatChange(populationChange)}。` : null,
    inflationChange ? `通胀率五年变化为 ${formatChange(inflationChange)}。` : null,
  ].filter(Boolean);

  return (
    <section aria-labelledby="analysis-title" className="border-b border-sky-100 bg-white">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Economic reading</p>
            <h2 id="analysis-title" className="mt-3 text-3xl font-semibold tracking-tight">{country.name_zh}经济概览</h2>
            <div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50 p-5 text-sm leading-7 text-slate-700">
              {sentences.length ? sentences.map((sentence) => <p key={sentence}>{sentence}</p>) : <p>现有数据不足以生成可靠概览。</p>}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">结论由公开规则根据数据生成，只描述规模、变化和位置，不构成投资建议。不同指标的最新年份可能不同。</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {changes.map(({ indicator, change, extrema }, index) => (
              <ChangeCard
                key={indicator.id}
                eyebrow={change ? `${change.start.year}–${change.end.year}` : "数据不足"}
                title={`${indicator.name_zh}五年变化`}
                value={change ? formatChange(change) : "无法计算"}
                detail={extrema ? `历史范围：${extrema.minimum.year} 年最低，${extrema.maximum.year} 年最高` : "该指标没有有效历史数据"}
                icon={index % 4 === 0 ? <CircleDollarSign className="size-5" aria-hidden="true" /> : index % 4 === 1 ? <BarChart3 className="size-5" aria-hidden="true" /> : index % 4 === 2 ? <Users className="size-5" aria-hidden="true" /> : <Landmark className="size-5" aria-hidden="true" />}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
