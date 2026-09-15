# 公网发布已验证

北京时间：2026-09-16 01:08

## 公网网站

https://global-economy-data-20260915.vercel.app

- Vercel 生产部署状态：Ready。
- 匿名 HTTPS 请求返回 `200 OK`，内容类型为 `text/html; charset=utf-8`。
- 响应来自 Vercel，缓存命中；没有跳转到登录页。
- 网站托管在 Vercel，访问不依赖本机开机或本地预览服务。

当前公开的是阶段 1 基础预览：页面展示项目定位、8 个经济体、6 项核心指标，并明确提示经济数据尚未接入。后续阶段完成后继续更新同一生产网址。

## 代码仓库

https://github.com/leeryan9988/global-economy-data-20260915

- 全新公开仓库，默认分支 `main`。
- Vercel 项目已连接该 GitHub 仓库。
- 没有修改任何旧 GitHub 或 Vercel 项目。

## 发布信息

- Vercel 项目：`global-economy-data-20260915`
- 首次生产部署 ID：`dpl_F3p47Zz1wcMAD2UvcZv7YViYgaKC`
- 首次生产部署生成地址：`https://global-economy-data-20260915-oqzede5fb.vercel.app`
- 稳定生产别名：`https://global-economy-data-20260915.vercel.app`

本次没有配置 Supabase 密钥或导入真实经济数据。阶段 2 仍按规范进行 World Bank 数据接入与同步验证。

## 本地发布文件说明

Vercel 连接在本地创建了被 Git 忽略的 `.vercel/` 与 `.env.local`，用于标识项目和短期本地环境。它还在 `.gitignore` 末尾追加了重复的 `.vercel` 与 `.env*` 规则。为遵守不覆盖已有内容的要求，本次保留这些追加行，不进行清理；该变化不影响发布，也不包含在本次记录提交中。
