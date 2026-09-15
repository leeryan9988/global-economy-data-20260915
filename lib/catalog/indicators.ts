export const indicators = [
  { id: "gdp", name_zh: "GDP", name_en: "GDP (current US$)", api_code: "NY.GDP.MKTP.CD", unit: "USD", decimal_places: 0, description: "国内生产总值，现价美元；不等于不变价或购买力平价 GDP。" },
  { id: "gdp-per-capita", name_zh: "人均 GDP", name_en: "GDP per capita (current US$)", api_code: "NY.GDP.PCAP.CD", unit: "USD/person", decimal_places: 0, description: "按人口平均的国内生产总值，现价美元/人。" },
  { id: "population", name_zh: "人口", name_en: "Population, total", api_code: "SP.POP.TOTL", unit: "people", decimal_places: 0, description: "总人口，单位为人。" },
  { id: "inflation", name_zh: "通胀率", name_en: "Inflation, consumer prices (annual %)", api_code: "FP.CPI.TOTL.ZG", unit: "percent", decimal_places: 2, description: "消费者价格的年度百分比变化，允许负数。" },
  { id: "unemployment", name_zh: "失业率", name_en: "Unemployment, total (modeled ILO estimate)", api_code: "SL.UEM.TOTL.ZS", unit: "percent", decimal_places: 2, description: "失业人口占劳动力总量的百分比，采用 ILO 模型估计口径。" },
  { id: "lending-rate", name_zh: "贷款利率", name_en: "Lending interest rate (%)", api_code: "FR.INR.LEND", unit: "percent", decimal_places: 2, description: "贷款利率，不是央行政策利率；各国贷款条件与覆盖范围可能不同。" },
] as const;

export const worldBankSource = {
  source: "World Bank",
  source_id: 2,
  indicatorBaseUrl: "https://data.worldbank.org/indicator/",
} as const;

export type Indicator = (typeof indicators)[number];
export type IndicatorId = Indicator["id"];
export type IndicatorUnit = Indicator["unit"];

export function isIndicatorId(value: string): value is IndicatorId {
  return indicators.some((indicator) => indicator.id === value);
}
