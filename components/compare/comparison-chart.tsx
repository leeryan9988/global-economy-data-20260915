"use client";

import { useEffect, useRef } from "react";
import { LineChart } from "echarts/charts";
import { AriaComponent, GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import type { Country } from "@/lib/catalog/countries";
import type { Indicator } from "@/lib/catalog/indicators";
import { countryChartStyles } from "@/lib/charts/country-styles";
import { formatChartAxisValue } from "@/lib/charts/range";
import { formatIndicatorValue } from "@/lib/homepage/format";
import type { AlignedComparison } from "@/lib/compare/data";

echarts.use([LineChart, GridComponent, LegendComponent, TooltipComponent, AriaComponent, CanvasRenderer]);

export function ComparisonChart({ data, selectedCountries, indicator, mode = "absolute" }: { data: AlignedComparison; selectedCountries: Country[]; indicator: Indicator; mode?: "absolute" | "index" }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const chart = echarts.init(container, undefined, { renderer: "canvas" });
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    chart.setOption({
      animation: !reducedMotion,
      aria: { enabled: true, description: `${selectedCountries.map((country) => country.name_zh).join("、")}的${indicator.name_zh}${mode === "index" ? "基准指数" : "年度"}比较图` },
      color: selectedCountries.map((country) => countryChartStyles[country.iso2].color),
      grid: { top: 70, right: 20, bottom: 45, left: 68 },
      legend: { top: 12, textStyle: { color: "#475569" } },
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255,255,255,0.98)",
        borderColor: "#bae6fd",
        textStyle: { color: "#0f172a" },
        valueFormatter: (value: string | number | null | undefined) => value === null || value === undefined
          ? "暂无数据"
          : mode === "index" ? `${Number(value).toFixed(1)}` : formatIndicatorValue({ indicatorId: indicator.id, value: String(value), year: 0, unit: indicator.unit }),
      },
      xAxis: { type: "category", boundaryGap: false, data: data.years.map(String), axisTick: { show: false }, axisLine: { lineStyle: { color: "#cbd5e1" } }, axisLabel: { color: "#64748b", hideOverlap: true } },
      yAxis: { type: "value", scale: true, splitNumber: 5, axisLabel: { color: "#64748b", formatter: (value: number) => mode === "index" ? value.toFixed(0) : formatChartAxisValue(indicator.id, value) }, splitLine: { lineStyle: { color: "#e2e8f0", type: "dashed" } } },
      series: data.lines.map((line) => {
        const country = selectedCountries.find((item) => item.iso2 === line.countryCode)!;
        const style = countryChartStyles[line.countryCode];
        return { name: country.name_zh, type: "line", data: line.values, connectNulls: false, showSymbol: data.years.length <= 10, symbolSize: 6, lineStyle: { color: style.color, width: 3, type: style.dash }, itemStyle: { color: style.color } };
      }),
    });
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(container);
    return () => { observer.disconnect(); chart.dispose(); };
  }, [data, indicator, mode, selectedCountries]);

  return <div ref={containerRef} className="h-[28rem] w-full" role="img" aria-label={`${indicator.name_zh}${mode === "index" ? "基准指数" : "国家"}比较趋势图`} />;
}
