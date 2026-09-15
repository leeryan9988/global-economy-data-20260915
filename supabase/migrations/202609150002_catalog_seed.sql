-- Generated from the TypeScript catalog. Immutable seed migration; do not overwrite.
BEGIN;

INSERT INTO public.countries (id, iso2, iso3, slug, name_en, name_zh, flag, region) VALUES
  ('10000000-0000-4000-8000-000000000001', 'CN', 'CHN', 'china', 'China', '中国', '🇨🇳', 'Asia'),
  ('10000000-0000-4000-8000-000000000002', 'US', 'USA', 'united-states', 'United States', '美国', '🇺🇸', 'North America'),
  ('10000000-0000-4000-8000-000000000003', 'JP', 'JPN', 'japan', 'Japan', '日本', '🇯🇵', 'Asia'),
  ('10000000-0000-4000-8000-000000000004', 'DE', 'DEU', 'germany', 'Germany', '德国', '🇩🇪', 'Europe'),
  ('10000000-0000-4000-8000-000000000005', 'IN', 'IND', 'india', 'India', '印度', '🇮🇳', 'Asia'),
  ('10000000-0000-4000-8000-000000000006', 'GB', 'GBR', 'united-kingdom', 'United Kingdom', '英国', '🇬🇧', 'Europe'),
  ('10000000-0000-4000-8000-000000000007', 'FR', 'FRA', 'france', 'France', '法国', '🇫🇷', 'Europe'),
  ('10000000-0000-4000-8000-000000000008', 'KR', 'KOR', 'south-korea', 'Korea, Rep.', '韩国', '🇰🇷', 'Asia');

INSERT INTO public.indicators (id, name_zh, name_en, api_code, unit, source, source_id, source_url, description, decimal_places) VALUES
  ('gdp', 'GDP', 'GDP (current US$)', 'NY.GDP.MKTP.CD', 'USD', 'World Bank', 2, 'https://data.worldbank.org/indicator/NY.GDP.MKTP.CD', '国内生产总值，现价美元；不等于不变价或购买力平价 GDP。', 0),
  ('gdp-per-capita', '人均 GDP', 'GDP per capita (current US$)', 'NY.GDP.PCAP.CD', 'USD/person', 'World Bank', 2, 'https://data.worldbank.org/indicator/NY.GDP.PCAP.CD', '按人口平均的国内生产总值，现价美元/人。', 0),
  ('population', '人口', 'Population, total', 'SP.POP.TOTL', 'people', 'World Bank', 2, 'https://data.worldbank.org/indicator/SP.POP.TOTL', '总人口，单位为人。', 0),
  ('inflation', '通胀率', 'Inflation, consumer prices (annual %)', 'FP.CPI.TOTL.ZG', 'percent', 'World Bank', 2, 'https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG', '消费者价格的年度百分比变化，允许负数。', 2),
  ('unemployment', '失业率', 'Unemployment, total (modeled ILO estimate)', 'SL.UEM.TOTL.ZS', 'percent', 'World Bank', 2, 'https://data.worldbank.org/indicator/SL.UEM.TOTL.ZS', '失业人口占劳动力总量的百分比，采用 ILO 模型估计口径。', 2),
  ('lending-rate', '贷款利率', 'Lending interest rate (%)', 'FR.INR.LEND', 'percent', 'World Bank', 2, 'https://data.worldbank.org/indicator/FR.INR.LEND', '贷款利率，不是央行政策利率；各国贷款条件与覆盖范围可能不同。', 2);

COMMIT;
