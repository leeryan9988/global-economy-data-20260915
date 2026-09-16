# 生产部署与数据同步

## 当前发布路径

- 网站托管：Vercel。
- 稳定网址：`https://global-economy-data-20260915.vercel.app`。
- 源代码：`https://github.com/leeryan9988/global-economy-data-20260915`。
- 发布触发：GitHub `main` 更新后由 Vercel 自动构建。

## Supabase/PostgreSQL 首次连接

1. 新建一个空的 Supabase 项目，不复用已有应用数据库。
2. 按文件名顺序执行 `supabase/migrations/001_initial_schema.sql` 和 `002_seed_catalog.sql`。
3. 使用 PostgreSQL 连接串配置 GitHub Actions 仓库密钥 `DATABASE_URL`。该值只能放在服务端密钥中，不能使用 `NEXT_PUBLIC_` 前缀。
4. 手动运行一次 GitHub Actions 的 `Sync World Bank data`，确认 6 个指标全部成功。
5. 检查 `data_sync_logs`、48 组覆盖矩阵和 `indicator_value_revision_proposals`。历史值变化只进入修订提案，不自动覆盖。

## 定时同步

工作流 `.github/workflows/sync-world-bank.yml` 每月 1 日 02:17 UTC（北京时间 10:17）检查一次，也支持手动运行。未配置 `DATABASE_URL` 时安全跳过并给出警告。

同步只向空缺自然键插入新记录；已有值相同则记为 unchanged；已有值变化则新增修订提案。批准修订需要单独的证据与流程，本项目不会自动执行覆盖。

## 公开页面数据

生产数据库连接完成前，公开页面继续使用仓库内经过验证的 World Bank 版本化快照。这样数据库或上游短时故障不会让网站失去现有数据。

数据库同步与公开快照发布是两个独立步骤。同步发现历史修订时，先审核修订提案，再生成和发布新的版本化快照，避免绕过覆盖确认规则。

## 发布检查

```text
pnpm lint
pnpm test
pnpm typecheck
pnpm build
pnpm readiness
```

连接生产数据库后增加：

```text
pnpm readiness:production
pnpm sync:world-bank
```

健康检查：`GET /api/health`。接口只公开数据范围和快照状态，不返回数据库地址或密钥。
