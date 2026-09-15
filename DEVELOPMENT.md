# 本地开发与验证

## 运行

已在 Node.js 24.19.0、pnpm 11.19.0 上验证。使用 package.json 与 pnpm-lock.yaml，避免自行升级整套依赖。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

开发默认地址：http://127.0.0.1:3000。当前演示使用生产预览端口 3100：

```sh
pnpm build
pnpm start --port 3100
```

基础页面不依赖云端配置。后续需要数据库时，在新建 .env.local 中填写 .env.example 所列变量；已有环境文件必须先确认再修改。真实密钥不得写入文档、提交或客户端变量。

## 常规检查

```sh
pnpm lint
pnpm test
pnpm typecheck
pnpm build
```

typecheck 和 build 都会生成 .next 类型，请顺序运行。当前 Windows 环境中 pnpm exec 对 tsx 的解析出现过问题，包脚本可正常运行；独立执行脚本也可使用 `node --import tsx 路径`。

## 数据库迁移

依次执行：

1. `supabase/migrations/202609150001_initial_schema.sql`
2. `supabase/migrations/202609150002_catalog_seed.sql`

目标必须是本项目新建的空数据库。Supabase 已提供 anon、authenticated、service_role 角色；纯 PostgreSQL 需要事先建立等效角色。迁移不会自动删除已有同名表；种子也不会覆盖已有记录。正式连接和部署留待后续阶段。

生成种子的辅助脚本仅用于首次建表时创建已检查入库的 SQL；当前种子文件已存在，不要再次运行生成器。后续目录变化应通过新增迁移处理。

## 隔离 PostgreSQL 测试

`scripts/verify-database.ts` 会拒绝云端地址、普通数据库名称和已有 public 表的数据库。准备全新本机实例及空数据库，名称必须为 `global_economy_stage1_` 开头。

PowerShell 示例（端口与库名替换成自己的新测试实例）：

```powershell
$env:TEST_DATABASE_URL = 'postgresql://postgres@127.0.0.1:55432/global_economy_stage1_example'
$env:TEST_DATABASE_IS_DISPOSABLE = '1'
pnpm test:db
```

脚本仅在该隔离实例中创建缺失的 Supabase 等效角色、应用迁移和种子，再运行 31 项断言。测试观测通过事务回滚撤销，不删除已有数据库或文件。再次测试需要另一个空数据库，避免重放迁移覆盖旧数据。

本次使用 PostgreSQL 17.10 的 Windows 二进制包创建临时测试实例，监听 127.0.0.1，验证后停止。测试工具和实例目录保留在当前任务的 work 中，未纳入项目 Git；脚本本身可针对其他操作系统的新建本机 PostgreSQL 实例运行。此验证不等同于 Supabase 云端网络、Data API 或调度器集成验证。

## 结构

```text
app/                         基础布局与筹备页面
components/ui/               组件基础
lib/catalog/                 8 国 / 6 指标定义
lib/server/                  仅服务端数据库入口
types/                       领域类型
supabase/migrations/         不覆盖旧版本的数据库迁移
scripts/                     种子生成与数据库验证
tests/                       国家和指标范围测试
docs/                        规范、选型、阶段记录
```

## 依赖兼容性说明

Next.js 16.3.5 配套插件尚未全部接受 ESLint 10，TypeScript 7 也超出 lint 工具的兼容范围。因此阶段 1 使用 ESLint 9.39.5 与 TypeScript 5.9.3；依赖兼容检查已通过。ESLint 9 上游已标记停止支持，后续应在 Next.js 配套插件兼容时单独升级并验证，不混入业务阶段。只为 esbuild 与 unrs-resolver 放行必要安装脚本，没有修改全局工具配置。
