# GitHub 复用评估

检索日期：2026-09-15。检索词包括 world bank economic dashboard nextjs echarts、world bank indicators dashboard nextjs supabase。以下是公开仓库页面与 README 初筛，尚未克隆、安装、运行或审核完整源代码及许可证文件。

| 候选 | 已观察到的匹配 | 差异与待核验 | 初步建议 |
|---|---|---|---|
| [rickypcyt/macroview](https://github.com/rickypcyt/macroview) | Next.js、TypeScript、Tailwind；宏观数据与国家对比；World Bank 历史序列 | README 使用 D3、混合 IMF/新闻/人口源和本地缓存；需适配 ECharts、数据库同步和 6 指标。README 声称 MIT，但需核验实际 LICENSE | 业务最接近，可作为复用候选 |
| [CynthiaNwume/Analytics-Dashboard](https://github.com/CynthiaNwume/Analytics-Dashboard) | Next.js、TypeScript、Tailwind、shadcn/ui、Supabase、Vercel | 通用数据导入/自动图表，使用 Recharts；需重建经济指标模型与同步。许可需进一步核验 | 技术相近，业务改造量较大 |

## 推荐待确认路线

建议在独立仓库按已指定技术栈新建精简项目。依据是本次候选初筛中，没有发现能直接满足“8×6、ECharts、数据库缓存、严格来源/缺失规则”的成品；不能据此声称 GitHub 上不存在更合适项目。

如果用户选择复用 MacroView：先在独立目录只读审核实际依赖、许可与数据层，给出具体适配清单；任何需要删除或覆盖的继承文件先列出并获得明确批准。没有适当许可或审核发现不合适时，报告结果，不自动改换路线。

## 待用户决定

1. 独立新建，按本规范开始阶段 1（推荐）。
2. 先审核并复用 MacroView。
3. 先审核 Analytics-Dashboard，或用户指定另一 GitHub 仓库。

要求来源：用户在本任务提供的 AGENTS.md：“做项目之前，先搜索 GitHub 是否已有合适项目，发给我确认；合适就使用现有项目，不合适再自己开发。”因此当前只完成文档与评估，应用实现必须等待选型确认。
