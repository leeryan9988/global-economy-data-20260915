# 当前项目状态

更新时间：2026-09-16（北京时间）

## 已完成

- 阶段 0：PRD、页面结构、数据库结构、API 映射、MVP 边界与验收标准。
- 阶段 1：Next.js 项目结构和 PostgreSQL/Supabase schema。
- 阶段 2：World Bank 客户端、分页、重试、数据校验和同步逻辑。
- 阶段 3：首页。
- 阶段 4：8 个国家详情页。
- 阶段 5：ECharts 历史趋势图。
- 阶段 6：国家对比页。
- 阶段 7：排行榜。
- 阶段 8：Vercel 公网发布、6 个指标详情页、生产数据引导和自动更新链路重整。

## 当前生产状态

- 公网地址：<https://global-economy-data-20260915.vercel.app>
- 8 个国家、6 个指标、48 组时间序列均已发布。
- 公开页面使用版本化 World Bank 快照，不依赖数据库实时在线。
- GitHub Actions 每月刷新快照，通过测试和构建后才提交和发布。
- Supabase 已保留为可选的数据归档和后续扩展层。

## 仍需验证

1. 将重整后的自动更新工作流推送到 GitHub。
2. 手动运行一次 `Refresh World Bank snapshots` 并确认成功提交。
3. 确认 Vercel 收到 GitHub 提交后自动部署。
4. 补充桌面和手机尺寸的视觉截图验收。
