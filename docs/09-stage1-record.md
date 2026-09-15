# 阶段 1：项目结构与数据库 schema

验证日期：2026-09-15（北京时间）；完成分钟时间见 STAGE1-VERIFIED.md。

## 范围与实现

用户确认独立新建后，建立 Next.js 基础应用、独立本地 Git 仓库和 main 分支。保留阶段 0 文档，新增 STATUS.md 作为当前状态入口。

应用采用 Next.js 16.3.5、React 19.3.0、TypeScript 5.9.3、Tailwind CSS 4.3.3；已配置 shadcn/ui 目录与 Card 基础组件，并安装 ECharts 6.1.0、Supabase JS 2.116.0。依赖锁定于 pnpm-lock.yaml。

基础页面仅显示项目定位、8 国/6 指标范围和筹备提示，不展示模拟经济数值，不提供未实现的导航入口。测试前禁用搜索索引，正式发布时在阶段 8 调整。

## 数据库

- countries：国家身份、ISO2/ISO3、slug、名称。
- indicators：指标代码、单位、来源、口径与展示小数位。
- indicator_values：国家 + 指标 + 年份联合主键，原始 numeric/null，来源日期与同步追溯。
- data_sync_logs：指标级同步结果、计数与错误摘要。
- indicator_value_revision_proposals：旧值/候选值、去重哈希、审批状态与证据。

所有表启用 RLS。anon/authenticated 只读前三张表，不可读取内部日志或修订记录。service_role 可新增经济数据及更新同步状态，但没有 observation UPDATE/DELETE 权限；后续批准修订的专用事务入口尚未实现。

## 实际验证证据

1. `pnpm lint`：通过，零告警。
2. `pnpm test`：2 项目录测试通过。
3. `pnpm typecheck`：Next.js 路由类型生成与 tsc 通过。
4. `pnpm build`：生产构建通过，基础页与 404 页静态生成。
5. `pnpm peers check`：No peer dependency issues found。
6. 两份迁移在真实 PostgreSQL 17.10 空实例执行成功；31 项检查全部通过，包括种子逐字段对照、5 表 RLS、null/0/负数及精度、最新非空值、联合唯一键、外键、非法年份、NaN/Infinity 拒绝、匿名和登录角色权限、服务角色禁止覆盖/删除、修订去重、审批证据、日志约束、回滚及双连接 advisory lock。
7. 本地生产服务 `http://127.0.0.1:3100`：浏览器读到完整中文标题、8 国和 6 指标及筹备提示。
8. 桌面 1440×900：文档宽 1425，小于视口宽 1440；手机 375×812：文档宽 360，小于视口宽 375。截图人工检查通过，无整体横向溢出。
9. 浏览器采集的 error/warn 日志为空。响应式检查结束后恢复默认视口。

## 排查记录

### 开发依赖兼容性

症状：自动安装的 TypeScript 7 超出 lint 解析器兼容范围，ESLint 10 超出部分 Next.js 配套插件兼容范围。解决：仅在本项目使用 TypeScript 5.9.3、ESLint 9.39.5；无依赖兼容告警，lint/typecheck/build 均通过。ESLint 9 停止支持的维护事项已记入开发说明。

### 本地数据库初始化

症状：Windows 沙箱限制了 PostgreSQL restricted token 创建，初始化失败。取得本次运行所需授权后，在沙箱外运行同一个隔离本地测试流程，初始化成功。

二进制包未带 createdb.exe，改用 PostgreSQL 客户端连接执行 CREATE DATABASE。以新测试目录运行；最终 31 项通过，服务正常停止。失败实例目录与成功实例文件都保留，未删除或覆盖用户既有文件或数据库。

## 限制

PostgreSQL 测试使用等效的 Supabase 角色，尚未验证 Supabase 云端服务、PostgREST、真实密钥或网络。并发检查验证数据库锁行为，不代表阶段 2 同步任务已实现。尚未抓取 World Bank 数据，未产生 48 组实时覆盖报告；未部署 GitHub/Vercel。

## 下一阶段

阶段 2：数据请求、分页与校验、幂等插入、修订提案、同步日志和覆盖报告。先完成真实数据与同步验证，再开发首页。

## 查证来源

- [Next.js 安装要求](https://nextjs.org/docs/app/getting-started/installation)
- [shadcn/ui 手动安装](https://ui.shadcn.com/docs/installation/manual)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [用于验证的 PostgreSQL 二进制项目](https://github.com/leinelissen/embedded-postgres)
