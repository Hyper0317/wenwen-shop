# 旧数据库只读基线与迁移状态

记录时间：2026-11-09（Asia/Shanghai）

## 已完成的只读盘点

使用现有匿名 PostgREST 配置执行 `select=*&limit=1` 和 `Prefer: count=exact`。请求只读取精确行数，不读取或保存业务明细，不执行写入，不修改表结构、权限、RPC、触发器或序列。

| 表 | 精确行数 |
|---|---:|
| `products` | 935 |
| `sales` | 1537 |
| `categories` | 14 |
| `repair_records` | 18 |
| `tools` | 19 |
| `tool_loans` | 42 |
| `preferences` | 1 |

## 当前无法通过匿名 API 完成的项目

Supabase `anon` key 无权读取 PostgREST 的完整 OpenAPI 定义，因此无法仅靠匿名 API 证明数据库中不存在未列出的表，也无法盘点索引、约束、函数、触发器或序列。该项不能标记完成，必须等待数据库级只读连接后再核对。

## 阶段 1 剩余门槛

- 获取旧库数据库连接串或 Supabase 数据库密码。
- 创建独立 Supabase 测试项目并取得新库连接串。
- 使用数据库级备份工具导出旧库完整 schema 与 data。
- 用 `pg_dump` / `pg_restore` 或等效数据库级工具恢复新库。
- 从实际目录完整列出全部表，不能只依赖当前已知的七张表。
- 校验全部字段、类型、索引、约束、序列、函数、行数、JSONB、数值精度、主键、计数器、外键和整表哈希。
- 校验通过前，APP 继续连接旧库进行 UI 开发，网页继续连接旧库；不得执行正式切换。

## 相关跟踪

- 基线 Issue：https://github.com/Hyper0317/wenwen-shop/issues/3
- 迁移验收 Issue：https://github.com/Hyper0317/wenwen-shop/issues/7
- 切换与回退 Issue：https://github.com/Hyper0317/wenwen-shop/issues/8
