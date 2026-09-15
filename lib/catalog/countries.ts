export const countries = [
  { id: "10000000-0000-4000-8000-000000000001", iso2: "CN", iso3: "CHN", slug: "china", name_en: "China", name_zh: "中国", flag: "🇨🇳", region: "Asia" },
  { id: "10000000-0000-4000-8000-000000000002", iso2: "US", iso3: "USA", slug: "united-states", name_en: "United States", name_zh: "美国", flag: "🇺🇸", region: "North America" },
  { id: "10000000-0000-4000-8000-000000000003", iso2: "JP", iso3: "JPN", slug: "japan", name_en: "Japan", name_zh: "日本", flag: "🇯🇵", region: "Asia" },
  { id: "10000000-0000-4000-8000-000000000004", iso2: "DE", iso3: "DEU", slug: "germany", name_en: "Germany", name_zh: "德国", flag: "🇩🇪", region: "Europe" },
  { id: "10000000-0000-4000-8000-000000000005", iso2: "IN", iso3: "IND", slug: "india", name_en: "India", name_zh: "印度", flag: "🇮🇳", region: "Asia" },
  { id: "10000000-0000-4000-8000-000000000006", iso2: "GB", iso3: "GBR", slug: "united-kingdom", name_en: "United Kingdom", name_zh: "英国", flag: "🇬🇧", region: "Europe" },
  { id: "10000000-0000-4000-8000-000000000007", iso2: "FR", iso3: "FRA", slug: "france", name_en: "France", name_zh: "法国", flag: "🇫🇷", region: "Europe" },
  { id: "10000000-0000-4000-8000-000000000008", iso2: "KR", iso3: "KOR", slug: "south-korea", name_en: "Korea, Rep.", name_zh: "韩国", flag: "🇰🇷", region: "Asia" },
] as const;

export type Country = (typeof countries)[number];
export type CountryCode = Country["iso2"];

export function isCountryCode(value: string): value is CountryCode {
  return countries.some((country) => country.iso2 === value);
}
