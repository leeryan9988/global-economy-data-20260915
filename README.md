# 全球经济数据对比网站

状态：项目规范 v1 已建立；GitHub 选型待用户确认，尚未初始化应用或连接数据库。

本目录是当前任务中的本地项目目录。已找到同名 ChatGPT 项目，但该项目没有关联本地代码路径；这些文件尚未上传到 ChatGPT 项目或 GitHub。

## 规范索引

1. [PRD](docs/01-prd.md)
2. [页面结构](docs/02-pages.md)
3. [数据库结构](docs/03-database.md)
4. [World Bank API 映射与同步规范](docs/04-api.md)
5. [MVP 边界](docs/05-mvp-scope.md)
6. [验收标准与阶段计划](docs/06-acceptance.md)
7. [GitHub 选型记录](docs/07-reuse-review.md)
8. [进度与验证记录](docs/08-progress.md)

## 已确定的要求

- 8 个国家 × 6 个年度指标；贷款利率不替换成央行政策利率。
- Next.js + TypeScript + Tailwind CSS + shadcn/ui + ECharts + Supabase/PostgreSQL + Vercel。
- World Bank → 服务端同步 → PostgreSQL → Next.js → 页面。
- 文档先行，按 8 个实施阶段推进；每阶段验证并记录，禁止一次性堆完功能。
- 开发前先搜索 GitHub 并由用户确认复用方案。
- 删除或覆盖任何已有文件、记录、配置前，说明具体对象并取得明确同意。优先新增版本化文件和迁移。

## 依据与优先级

本次用户明确要求 > 本次提供的 AGENTS.md 通用规则 > 原对话中已确认的方案 > 本文档补充的实施设计。

原对话：百科全书，ID `6a6f3f7d-5b6c-83e8-8f10-e4152e2b255c`，已读取完整方案文本。原对话中的示例数值和 2025 年仅是示例，禁止作为真实数据导入。

部署采用本次明确指定的 Vercel；仍须使用独立新仓库和独立部署项目。此为本次具体技术栈对通用 GitHub Pages 规则的覆盖，不更改其他项目的发布方式。
