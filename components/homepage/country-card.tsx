import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Country } from "@/lib/catalog/countries";
import { indicators } from "@/lib/catalog/indicators";
import { formatIndicatorValue } from "@/lib/homepage/format";
import type { CountryOverview } from "@/lib/homepage/types";

export function CountryCard({ country, overview }: { country: Country; overview: CountryOverview }) {
  const gdp = overview.indicators.find((item) => item.indicatorId === "gdp");
  const details = overview.indicators.filter((item) => item.indicatorId !== "gdp");
  return (
    <Card className="group gap-0 overflow-hidden border-slate-200 py-0 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.45)] transition duration-300 hover:-translate-y-1 hover:border-emerald-700/25 hover:shadow-[0_24px_60px_-34px_rgba(15,118,110,0.35)]">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="text-2xl">{country.flag}</span>
          <div>
            <CardTitle className="text-base">{country.name_zh}</CardTitle>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.13em] text-slate-400">{country.iso3}</p>
          </div>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-mono text-[11px] text-slate-500">{country.iso2}</span>
      </CardHeader>
      <CardContent className="p-5">
        <div className="border-b border-slate-100 pb-5">
          <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
            <span>GDP</span><span>{gdp?.year ?? "—"} 年</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{gdp ? formatIndicatorValue(gdp) : "暂无数据"}</p>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5">
          {details.map((item) => {
            const indicator = indicators.find((entry) => entry.id === item.indicatorId);
            return (
              <div key={item.indicatorId} className={item.indicatorId === "lending-rate" ? "col-span-2" : undefined}>
                <dt className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span>{indicator?.name_zh}</span>
                  <span className="text-slate-300">·</span>
                  <span>{item.year ?? "—"}</span>
                </dt>
                <dd className={`mt-1.5 text-sm font-semibold ${item.value === null ? "text-amber-700" : "text-slate-800"}`}>
                  {formatIndicatorValue(item)}
                </dd>
              </div>
            );
          })}
        </dl>
      </CardContent>
    </Card>
  );
}
