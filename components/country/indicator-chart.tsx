"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LineChart } from "echarts/charts";
import { AriaComponent, GridComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import type { Indicator } from "@/lib/catalog/indicators";
import { formatIndicatorValue } from "@/lib/homepage/format";
import { chartRanges, formatChartAxisValue, selectChartRange, type ChartRange } from "@/lib/charts/range";
import type { CountryIndicatorSeries } from "@/lib/series/types";

echarts.use([LineChart, GridComponent, TooltipComponent, AriaComponent, CanvasRenderer]);

export function IndicatorChart({ indicator, series }: { indicator: Indicator; series: CountryIndicatorSeries }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState<ChartRange>("20y");
  const observations = useMemo(() => selectChartRange(series.observations, range), [range, series.observations]);
  const hasData = observations.some((item) => item.value !== null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasData) return;
    const chart = echarts.init(container, undefined, { renderer: "canvas" });
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    chart.setOption({
      animation: !reducedMotion,
      aria: { enabled: true, decal: { show: false }, description: `${indicator.name_zh}年度趋势图` },
      grid: { top: 24, right: 18, bottom: 42, left: 64, containLabel: false },
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255,255,255,0.97)",
        borderColor: "#bae6fd",
        textStyle: { color: "#0f172a" },
        valueFormatter: (value: string | number | null | undefined) => value === null || value === undefined
          ? "暂无数据"
          : formatIndicatorValue({ indicatorId: indicator.id, value: String(value), year: 0, unit: indicator.unit }),
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: observations.map((item) => String(item.year)),
        axisLine: { lineStyle: { color: "#cbd5e1" } },
        axisTick: { show: false },
        axisLabel: { color: "#64748b", hideOverlap: true },
      },
      yAxis: {
        type: "value",
        scale: true,
        splitNumber: 4,
        axisLabel: { color: "#64748b", formatter: (value: number) => formatChartAxisValue(indicator.id, value) },
        splitLine: { lineStyle: { color: "#e2e8f0", type: "dashed" } },
      },
      series: [{
        name: indicator.name_zh,
        type: "line",
        data: observations.map((item) => item.value === null ? null : Number(item.value)),
        connectNulls: false,
        showSymbol: observations.length <= 10,
        symbolSize: 7,
        lineStyle: { color: "#0284c7", width: 3 },
        itemStyle: { color: "#0284c7", borderColor: "#ffffff", borderWidth: 2 },
        areaStyle: { color: "rgba(56, 189, 248, 0.12)" },
      }],
    });
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(container);
    return () => {
      observer.disconnect();
      chart.dispose();
    };
  }, [hasData, indicator, observations]);

  return (
    <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-slate-500">年度趋势</p>
        <div className="flex flex-wrap gap-2" aria-label={`${indicator.name_zh}图表时间范围`}>
          {chartRanges.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={range === item.id}
              onClick={() => setRange(item.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${range === item.id ? "bg-sky-600 text-white" : "bg-sky-50 text-sky-700 hover:bg-sky-100"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {hasData ? (
        <div ref={containerRef} className="mt-4 h-72 w-full" role="img" aria-label={`${indicator.name_zh}年度趋势图，当前显示${chartRanges.find((item) => item.id === range)?.label}`} />
      ) : (
        <div className="mt-4 flex h-40 items-center justify-center rounded-xl bg-sky-50 text-sm text-slate-500">World Bank 暂无可绘制数据</div>
      )}
    </div>
  );
}
