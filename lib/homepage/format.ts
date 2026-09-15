import type { LatestIndicatorValue } from "./types";

const wholeNumber = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 0 });

export function formatIndicatorValue(item: LatestIndicatorValue): string {
  if (item.value === null) return "暂无数据";
  const value = Number(item.value);
  if (!Number.isFinite(value)) return "暂无数据";
  if (item.indicatorId === "gdp") return `${(value / 1_000_000_000_000).toFixed(2)} 万亿美元`;
  if (item.indicatorId === "gdp-per-capita") return `$${wholeNumber.format(value)}`;
  if (item.indicatorId === "population") {
    if (Math.abs(value) >= 100_000_000) return `${(value / 100_000_000).toFixed(2)} 亿`;
    return `${(value / 10_000).toFixed(1)} 万`;
  }
  return `${value.toFixed(2)}%`;
}

export function formatGdpRankingValue(value: string): string {
  const trillions = Number(value) / 1_000_000_000_000;
  return `${trillions.toFixed(2)} 万亿美元`;
}

export function formatBeijingDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}
