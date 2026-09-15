# 页面与应用结构

## 路由

| 路由 | 内容 | 实施阶段 |
|---|---|---|
| `/` | 概览、GDP 排名摘要、中美趋势区 | 3；图表在 5 接入 |
| `/countries` | 8 国列表与详情入口 | 4 |
| `/country/[slug]` | 6 指标卡、6 组年度数据、来源 | 4；图表在 5 接入 |
| `/indicator/[indicator]` | 指标定义、国家趋势、年度表格 | 5 |
| `/compare` | 2–5 国选择、指标、区间、图表与表格 | 6 |
| `/rankings` | 6 指标和年份选择、8 国排名 | 7 |
| `/about-data` | 定义、来源、时效、缺失与口径说明 | 3 基础版；后续完善 |

使用 `/rankings?indicator=gdp&year=2023` 作为规范排名 URL，不同时维护另一套 `/rankings/gdp` 实现。
比较示例：`/compare?countries=CN,US&indicator=gdp&from=2000&to=2023`。这些年份是 URL 示例，不表示最新可用数据。

## 阶段 1 计划目录

```text
app/
  layout.tsx
  page.tsx
components/ui/
lib/
  catalog/
  server/
types/
supabase/migrations/
scripts/
tests/
docs/
```

阶段 1 只创建基础壳、目录、类型、8 国/6 指标目录与数据库迁移；后续按上表新增实际路由，避免大量无功能占位页。

## 组件边界

- CountryCard、IndicatorCard：格式化数值、单位、年份、来源与缺失状态。
- EconomyChart：ECharts 客户端封装；统一年度轴、颜色、触摸与 tooltip；卸载释放实例、容器变化 resize。
- CountrySelector：限制 2–5 国，URL 参数可验证与恢复。
- RankingTable：同年排序、覆盖数、缺失名单和并列排名。
- 服务端模块集中访问数据库；客户端不得包含数据库写入凭据。

## 页面行为

非法国家/指标详情返回 404。查询参数无效时显示明确错误与恢复默认操作；不静默扩大范围。国家页每张卡自己的数据年份独立显示。图表有对应数据表供键盘与辅助技术读取。导航、控件有中文标签、可见焦点、合理触摸目标。
