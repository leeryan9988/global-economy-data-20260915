# 数据库结构设计 v1

状态：设计文档，尚未创建 Supabase 表；可执行 SQL 在确认选型后由阶段 1 生成和验证。

## 核心表

### countries

| 字段 | 类型及约束 |
|---|---|
| id | uuid，主键，自动生成 |
| iso2 | varchar(2)，非空唯一 |
| iso3 | varchar(3)，非空唯一 |
| slug | text，非空唯一 |
| name_en / name_zh | text，非空 |
| flag / region | text，可空 |

种子数据严格包含 PRD 的 8 个国家。接口只接受目录中的国家；不导入地区或收入分组。

### indicators

| 字段 | 类型及约束 |
|---|---|
| id | text 主键：gdp、gdp-per-capita、population、inflation、unemployment、lending-rate |
| name_zh / name_en | text，非空 |
| api_code | text，非空唯一 |
| unit | text：USD、USD/person、people、percent |
| source | text，非空，World Bank |
| source_id | integer，非空，2（WDI） |
| source_url | text，非空 |
| description | text，非空，含口径说明 |
| decimal_places | smallint，非负，仅供展示 |

### indicator_values

| 字段 | 类型及约束 |
|---|---|
| country_id | uuid，非空，外键 countries，删除限制 RESTRICT |
| indicator_id | text，非空，外键 indicators，删除限制 RESTRICT |
| year | smallint，非空，1960–2100；同步层另检验不超过当前年 |
| value | numeric，可空，保留原数值，不存格式化字符串 |
| source | text，非空 |
| source_updated_at | date，可空，保存 API 数据集 lastupdated，不声称为单个观测更新时间 |
| fetched_at | timestamptz，非空，成功获取该批数据的时间 |
| sync_log_id | uuid，非空，关联同步日志 |

主键 `(country_id, indicator_id, year)`。索引 `(indicator_id, year, value DESC)` 服务同年排名；`(country_id, indicator_id, year DESC) WHERE value IS NOT NULL` 服务最新值。

value 为 null 与数值 0 必须区分。通胀与利率允许负数；不能给所有指标统一施加 value >= 0。不以展示小数位截断数据库原值。

### data_sync_logs

| 字段 | 类型及用途 |
|---|---|
| id | uuid 主键 |
| run_id | uuid，一次全量同步的批次标识 |
| source / indicator_id | text，来源与当前指标 |
| started_at / finished_at | timestamptz，结束时间可空 |
| status | text：running、success、partial、failed、skipped |
| rows_received / rows_inserted / rows_unchanged / revisions_pending | integer 非负计数 |
| missing_count | integer 非负，来源中 null 的数量 |
| error | text 可空，仅存脱敏摘要 |

同步日志不向匿名用户开放。公开健康信息通过受控 API 给出。

## 修订保护扩展表

为落实“覆盖必须先确认”，增加 `indicator_value_revision_proposals`，不属于额外产品功能：

- id uuid 主键；country_id、indicator_id、year 定位现有记录。
- old_value / proposed_value numeric 可空；payload_hash text；source_updated_at date；fetched_at timestamptz；sync_log_id uuid。
- status 为 pending/approved/rejected/applied；approved_at 与 approval_reference 记录明确批准证据。
- 同一自然键与 payload_hash 建唯一约束，避免重试重复提案。
- 后续批准覆盖时，事务内检查旧值仍一致，写入已批准新值；保留提案作为变更历史。

首次空库导入和新年份采用 insert；已有键且数值相同只记日志；已有键出现新值（包括 null 转数值、数值转 null）先创建修订提案，不直接覆盖。不要用无条件 upsert 绕过用户要求。

## 一致性与权限

- 单指标的所有分页校验通过后，在一个事务内写入；失败回滚该指标，其他指标可成功，总任务标 partial。
- 单一写入进程/事务级 advisory lock 防止并发同步；取得锁后再次检查自然键。
- 启用 RLS；公开数据表仅授权 SELECT；anon/authenticated 不得 INSERT/UPDATE/DELETE。
- 服务角色密钥仅用于服务端；同步日志、修订表和写入函数不公开授权。
- 普通浏览通过 Next.js 读取缓存数据；不向浏览器开放同步调用权限。
- 时间存储为 UTC，展示为北京时间（Asia/Shanghai）。

## 迁移验证

在空的隔离数据库运行迁移与种子；验证 8 国、6 指标、唯一键、外键、null/0 区别、负通胀、匿名只读、并发与回滚。未运行真实 PostgreSQL 时必须标为“未验证”，不能以文本检查替代。
