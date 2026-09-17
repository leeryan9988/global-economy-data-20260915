import { Activity, ArrowDownRight, Gauge, TrendingUp } from "lucide-react";
import { ChangeCard } from "@/components/analysis/change-card";
import { commonChangeRanking, formatChange } from "@/lib/analysis/economy";
import { countries } from "@/lib/catalog/countries";
import { defaultRankingYear, rankAtYear } from "@/lib/rankings/data";
import { worldBankSeriesSnapshot } from "@/lib/series/snapshot";

function countryName(code: string) {
  return countries.find((country) => country.iso2 === code)?.name_zh ?? code;
}

export function EconomicSignals() {
  const codes = countries.map((country) => country.iso2);
  const gdp = commonChangeRanking(worldBankSeriesSnapshot.series, codes, "gdp", 5);
  const perCapita = commonChangeRanking(worldBankSeriesSnapshot.series, codes, "gdp-per-capita", 5);
  const inflation = commonChangeRanking(worldBankSeriesSnapshot.series, codes, "inflation", 5);
  const population = commonChangeRanking(worldBankSeriesSnapshot.series, codes, "population", 5);
  const unemploymentYear = defaultRankingYear(worldBankSeriesSnapshot.series, codes, "unemployment").year;
  const unemployment = rankAtYear(worldBankSeriesSnapshot.series, countries, "unemployment", unemploymentYear);
  const lowestUnemployment = unemployment.rows.at(-1);
  const inflationDrop = inflation ? [...inflation.rows].sort((a, b) => a.change - b.change)[0] : null;
  const shrinking = population?.rows.filter((row) => row.change < 0) ?? [];

  if (!gdp || !perCapita || !inflation || !population) return null;
  return (
    <section aria-labelledby="signals-title" className="border-y border-sky-100 bg-white">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Five-year signals</p>
            <h2 id="signals-title" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">数字发生了什么变化</h2>
          </div>
          <p className="text-sm leading-7 text-slate-500">所有五年比较都使用同一组起止年份。GDP为现价美元变化，不代表实际经济增速；通胀和失业率按百分点计算。</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ChangeCard eyebrow={`${gdp.startYear}–${gdp.endYear}`} title="GDP增幅最高" value={countryName(gdp.rows[0].countryCode)} detail={`现价美元口径 ${formatChange({ change: gdp.rows[0].change, kind: gdp.kind })}`} icon={<TrendingUp className="size-5" aria-hidden="true" />} />
          <ChangeCard eyebrow={`${perCapita.startYear}–${perCapita.endYear}`} title="人均GDP增幅最高" value={countryName(perCapita.rows[0].countryCode)} detail={`${formatChange({ change: perCapita.rows[0].change, kind: perCapita.kind })}，反映现价美元人均产出变化`} icon={<Gauge className="size-5" aria-hidden="true" />} />
          <ChangeCard eyebrow={`${inflation.startYear}–${inflation.endYear}`} title="通胀变化最低" value={inflationDrop ? countryName(inflationDrop.countryCode) : "暂无数据"} detail={inflationDrop ? `${formatChange({ change: inflationDrop.change, kind: inflation.kind })}，只描述变化方向` : "共同年份不足"} icon={<ArrowDownRight className="size-5" aria-hidden="true" />} />
          <ChangeCard eyebrow={`${unemploymentYear} 年`} title="失业率最低" value={lowestUnemployment?.country.name_zh ?? "暂无数据"} detail={shrinking.length ? `${countryName(shrinking[0].countryCode)}等 ${shrinking.length} 个经济体五年人口下降` : "八国五年人口均未下降"} icon={<Activity className="size-5" aria-hidden="true" />} />
        </div>
      </div>
    </section>
  );
}
