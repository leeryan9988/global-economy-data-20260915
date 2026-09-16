# 部署与数据更新

## 生产发布

- Vercel 项目：`global-economy-data-20260915`
- 生产地址：<https://global-economy-data-20260915.vercel.app>
- GitHub 仓库：<https://github.com/leeryan9988/global-economy-data-20260915>
- 发布分支：`main`

Vercel 与 GitHub 仓库连接后，`main` 的每次有效提交都会触发生产构建。

## 月度数据更新

工作流 `.github/workflows/refresh-world-bank-snapshots.yml` 在每月 1 日 02:17 UTC（北京时间 10:17）运行，也支持手动运行。

工作流按以下顺序执行：

1. 从 World Bank API 下载 8 国 × 6 指标数据。
2. 更新 `data/world-bank-series.json` 和 `data/homepage-snapshot.json`。
3. 执行全部测试。
4. 执行 Next.js 生产构建。
5. 只有验证通过且快照发生变化时，才把两份快照提交到 `main`。
6. Vercel 自动发布新快照。

该流程不需要数据库密码、Supabase 密钥或自签名证书。

## Supabase/PostgreSQL

数据库 schema、迁移和一次性生产引导文件继续保留。它们可用于数据审计、复杂查询或后续服务端功能，但当前公开页面和月度更新不依赖数据库连接。

## 发布前检查

```text
pnpm lint
pnpm test
pnpm typecheck
pnpm build
pnpm readiness
```

健康检查：`GET /api/health`。接口返回快照来源、更新时间、数据范围和更新模式，不公开任何密钥。
