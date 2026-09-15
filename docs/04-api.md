# API 映射与同步

## World Bank 指标目录

| 内部 id | 中文 | World Bank code | 单位 / 口径 |
|---|---|---|---|
| gdp | GDP | NY.GDP.MKTP.CD | 现价美元 |
| gdp-per-capita | 人均 GDP | NY.GDP.PCAP.CD | 现价美元/人 |
| population | 人口 | SP.POP.TOTL | 人，总人口 |
| inflation | 通胀率 | FP.CPI.TOTL.ZG | 消费者价格年度变化，% |
| unemployment | 失业率 | SL.UEM.TOTL.ZS | 占劳动力总量，ILO 模型估计，% |
| lending-rate | 贷款利率 | FR.INR.LEND | 贷款利率，%，非央行政策利率 |

指标来源链接统一为 `https://data.worldbank.org/indicator/{api_code}`。单位由内部目录确定，不能依赖观测记录中可能为空的 unit 字段。

## 请求契约

API v2，JSON，WDI source=2，按指标拉取 8 国并遍历分页。请求样式：

```text
https://api.worldbank.org/v2/country/CN;US;JP;DE;IN;GB;FR;KR/indicator/NY.GDP.MKTP.CD?source=2&format=json&date=1960:2026&per_page=1000&page=1
```

2026 是本次文档示例，运行时用当前年份生成上界。不要用 gapfill 自动回填缺失年份。

依据：[基本请求结构](https://datahelpdesk.worldbank.org/knowledgebase/articles/898581-api-basic-call-structures)、[指标查询](https://datahelpdesk.worldbank.org/knowledgebase/articles/898599-indicator-api-queries)。

## 返回映射

World Bank 常规 JSON 返回 `[metadata, observations]`；先识别错误对象与空响应，再解析记录。

| 来源字段 | 内部字段 / 处理 |
|---|---|
| metadata.pages / page / total | 分页完整性校验 |
| metadata.lastupdated | source_updated_at，数据集日期 |
| observation.countryiso3code | 按目录映射 country_id；必要时用已知 country.id ISO2 核验 |
| observation.indicator.id | 核验目标 api_code，再映射 indicator_id |
| observation.date | 严格整数年度 |
| observation.value | 有限数字或 null；不通过 truthy 判定过滤 0 |
| 当前成功抓取时间 | fetched_at |

未知国家、指标、非法年度、非数值字符串、重复键冲突都应记录并拒绝该批；不能悄悄丢弃后标成功。上游未返回的年份不推断为已删除；UI 可在年份轴补 null。来源显式 null 作为缺失记录保留。

## 同步流程（阶段 2 实现）

1. 首次运行覆盖 1960–当前年份、8 国、6 指标。
2. 使用受保护的任务入口，互斥执行。默认每天检查一次；规模小，可重新检查完整历史以发现修订。
3. 请求超时 20 秒，最多 3 次总尝试；对 429、5xx、暂时网络故障指数退避并遵守 Retry-After。其他错误直接记录。具体时限需结合部署运行时验证。
4. 读取全部分页、校验 metadata 与数据，完成后才开始该指标事务。
5. 新键插入；相同值不重复创建；变更值按数据库文档生成修订提案，等待明确批准。
6. 每项日志标记真实结果；失败时保持之前可读数据。页面同步时间来自最近成功日志，不来自最近一次失败尝试。
7. 输出 8×6 覆盖矩阵：记录数、非空数、起止年、最新有效年、缺失数。贷款利率缺失不使用其他利率替换。

## 应用只读接口（拟定）

| 接口 | 参数 / 结果 |
|---|---|
| GET /api/countries | 8 国目录 |
| GET /api/indicators | 6 指标目录与定义 |
| GET /api/countries/[iso2]/latest | 每项最新非空值、实际年份、来源 |
| GET /api/series | countries、indicator、from、to；单国历史与多国趋势 |
| GET /api/compare | countries 2–5 个，indicator、from、to；统一年份序列与元数据 |
| GET /api/rankings | indicator、year 可选；同年数据、覆盖数与缺失列表 |
| /api/sync | 受保护服务端任务入口；具体 HTTP 方法按调度器兼容性在阶段 8 固定 |

只读请求返回 `{data, meta}`；meta 包含单位、年份区间、source、lastSuccessfulSync、missingCountries 等适用字段。numeric 序列化采用十进制字符串或 null，ECharts 适配层再转换为有限 Number，仅供绘图。

非法参数 400，未知资源 404，无可用数据库服务 503；空数据返回成功响应与空/缺失状态。服务端使用短期缓存；上游故障不能触发浏览器直连 World Bank。同步密钥不出现在公开 URL、日志或客户端包中。

## 数据来源说明

[贷款利率](https://data.worldbank.org/indicator/FR.INR.LEND) 与 [失业率](https://data.worldbank.org/indicator/SL.UEM.TOTL.ZS) 官方页面已查阅；六项代码与原方案一致。本阶段未执行完整 48 组实时数据抓取，因此不宣称覆盖率或最新年份已验证。
