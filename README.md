# 全球经济数据对比网站

一个面向普通用户的全球经济数据网站，用统一口径比较 8 个主要经济体的 6 项年度指标。

- 公网地址：<https://global-economy-data-20260915.vercel.app>
- 源代码：<https://github.com/leeryan9988/global-economy-data-20260915>
- 数据来源：World Bank API
- 技术栈：Next.js、TypeScript、Tailwind CSS、ECharts、Supabase/PostgreSQL、Vercel

## 数据范围

- 国家：中国、美国、日本、德国、印度、英国、法国、韩国。
- 指标：GDP、人均 GDP、人口、通胀率、失业率、贷款利率。
- 贷款利率使用 World Bank `FR.INR.LEND`，不等同于央行政策利率。

## 页面

- 首页经济概览
- 8 个国家详情页
- 6 个指标详情页
- 国家对比页
- 指标排行榜
- 数据说明页

## 稳定的数据更新路径

公开页面读取仓库中的已验证 World Bank 快照。GitHub Actions 每月重新下载两份快照，执行测试和生产构建，通过后提交到 `main`；Vercel随即自动发布。

```text
World Bank API
  → GitHub Actions 每月刷新
  → 测试与生产构建
  → 提交版本化快照
  → Vercel 自动发布
```

Supabase/PostgreSQL schema 和一次性生产数据已保留，作为后续查询、审计或扩展能力，不再阻塞公开网站更新。

## 本地运行

```text
pnpm install
pnpm dev
```

完整验证：

```text
pnpm lint
pnpm test
pnpm typecheck
pnpm build
pnpm readiness
```

手动刷新 World Bank 快照：

```text
pnpm snapshot:refresh
```

## 项目文档

- [PRD](docs/01-prd.md)
- [页面结构](docs/02-pages.md)
- [数据库结构](docs/03-database.md)
- [API 映射](docs/04-api.md)
- [MVP 边界](docs/05-mvp-scope.md)
- [验收标准](docs/06-acceptance.md)
- [当前状态](STATUS.md)
- [部署与数据更新](DEPLOYMENT.md)
