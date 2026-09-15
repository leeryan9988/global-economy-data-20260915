import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { countries } from "@/lib/catalog/countries";
import { indicators } from "@/lib/catalog/indicators";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-10 sm:px-10 sm:py-16">
      <header className="mb-12 border-b pb-8">
        <p className="mb-5 text-xs font-semibold tracking-[0.2em] text-primary">GLOBAL ECONOMY DATA</p>
        <h1 className="max-w-2xl text-3xl font-semibold leading-snug tracking-tight sm:text-5xl">全球经济数据<br className="hidden sm:block" />对比网站</h1>
        <p className="mt-5 max-w-xl leading-7 text-muted-foreground">从数据出发，了解世界。查看主要经济体的年度数据、长期趋势与指标来源。</p>
      </header>
      <section aria-labelledby="stage-heading" className="mb-8 rounded-xl border border-primary/20 bg-primary/5 p-5">
        <h2 id="stage-heading" className="font-semibold text-primary">网站筹备中</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">当前为基础结构预览。经济数据尚未接入，数据查询与比较功能将分阶段开放。</p>
      </section>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>8 个经济体</CardTitle><CardDescription>第一版覆盖范围</CardDescription></CardHeader>
          <CardContent><ul className="grid grid-cols-2 gap-x-4 gap-y-5">{countries.map((country) => <li key={country.iso2} className="flex items-center gap-3"><span className="rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">{country.iso2}</span><span>{country.name_zh}</span></li>)}</ul></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>6 项核心指标</CardTitle><CardDescription>年度数据 · 优先采用 World Bank</CardDescription></CardHeader>
          <CardContent><ul className="grid grid-cols-2 gap-x-4 gap-y-5">{indicators.map((indicator) => <li key={indicator.id}>{indicator.name_zh}</li>)}</ul><p className="mt-6 text-xs leading-5 text-muted-foreground">GDP 使用现价美元。贷款利率与央行政策利率不同，数据接入后将提供完整口径说明。</p></CardContent>
        </Card>
      </div>
      <footer className="mt-auto pt-12 text-xs leading-6 text-muted-foreground">全球经济数据对比网站 · 基础预览<br />此页面未展示任何经济观测数值。</footer>
    </main>
  );
}
