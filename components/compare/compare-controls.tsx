"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { countries, type CountryCode } from "@/lib/catalog/countries";
import { indicators, type IndicatorId } from "@/lib/catalog/indicators";
import { compareUrl, type CompareSelection } from "@/lib/compare/params";

export function CompareControls({ selection, minYear, maxYear }: { selection: CompareSelection; minYear: number; maxYear: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, index) => maxYear - index);

  function update(next: CompareSelection) {
    startTransition(() => router.replace(compareUrl(next), { scroll: false }));
  }

  function toggleCountry(code: CountryCode) {
    const selected = selection.countries.includes(code);
    const nextCountries = selected ? selection.countries.filter((item) => item !== code) : [...selection.countries, code];
    if (nextCountries.length < 2 || nextCountries.length > 5) return;
    update({ ...selection, countries: nextCountries });
  }

  return (
    <section aria-labelledby="compare-controls-title" className="rounded-3xl border border-sky-100 bg-white p-5 shadow-[0_20px_70px_-55px_rgba(2,132,199,0.65)] sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Comparison settings</p><h2 id="compare-controls-title" className="mt-2 text-xl font-semibold">选择比较范围</h2></div>
        <span className="text-xs text-slate-400" aria-live="polite">{pending ? "正在更新…" : `${selection.countries.length} 个国家`}</span>
      </div>

      <fieldset className="mt-6">
        <legend className="text-sm font-medium text-slate-700">国家（选择 2–5 个）</legend>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {countries.map((country) => {
            const checked = selection.countries.includes(country.iso2);
            const disabled = checked ? selection.countries.length <= 2 : selection.countries.length >= 5;
            return (
              <label key={country.iso2} className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${checked ? "border-sky-400 bg-sky-50 text-sky-800" : "border-slate-200 bg-white text-slate-600"} ${disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer hover:border-sky-300"}`}>
                <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleCountry(country.iso2)} className="accent-sky-600" />
                <span>{country.name_zh}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <label className="text-sm font-medium text-slate-700">指标
          <select value={selection.indicator} onChange={(event) => update({ ...selection, indicator: event.target.value as IndicatorId })} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100">
            {indicators.map((indicator) => <option key={indicator.id} value={indicator.id}>{indicator.name_zh}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">开始年份
          <select value={selection.from} onChange={(event) => { const from = Number(event.target.value); update({ ...selection, from, to: Math.max(selection.to, from) }); }} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100">
            {years.map((year) => <option key={year} value={year} disabled={year > selection.to}>{year}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">结束年份
          <select value={selection.to} onChange={(event) => { const to = Number(event.target.value); update({ ...selection, from: Math.min(selection.from, to), to }); }} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100">
            {years.map((year) => <option key={year} value={year} disabled={year < selection.from}>{year}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">选择会自动写入当前网址，复制浏览器地址即可分享并恢复同一组比较。</p>
    </section>
  );
}
