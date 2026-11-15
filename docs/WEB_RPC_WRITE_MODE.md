# 网页写入模式运行说明

## 模式

- `RPC_WRITE`：默认模式。单商品销售、批量销售、退货使用隔离 Supabase 已验证的固定 ID 事务 RPC。
- `LEGACY_WRITE`：保留原有写入路径，用于上线后的即时回滚。
- 两种模式都不改变页面视觉、布局或用户操作步骤。

## 切换与回滚

临时切换（刷新后也生效）：

```text
https://当前站点/index.html?write_mode=LEGACY_WRITE
```

恢复 RPC 写入：

```text
https://当前站点/index.html?write_mode=RPC_WRITE
```

在浏览器控制台切换：

```js
setWenwenWriteMode('LEGACY_WRITE')
setWenwenWriteMode('RPC_WRITE')
```

控制台切换会同时更新 URL 参数和本地保存值，避免页面重载后又被旧 URL 参数覆盖。

优先级：页面显式变量 `window.WENWEN_WRITE_MODE` > URL 参数 > 本地保存值 > 默认 `RPC_WRITE`。旧缓存 HTML 仍执行旧代码，不会主动调用新 RPC。

## 写入矩阵

| 操作 | RPC_WRITE | LEGACY_WRITE | 权威结果 |
|---|---|---|---|
| 单商品销售 | `wenwen_app_sale_v1` | INSERT + product PATCH + preferences PATCH | 固定销售 ID、服务端订单号、库存与计数器 |
| 购物车批量销售 | `wenwen_app_batch_sale_v1` | 批量 INSERT + 逐条库存/计数器 PATCH | 固定批量 ID、全部销售、库存映射与计数器 |
| 退货 | `wenwen_app_refund_v1` | INSERT 退货 + 原销售/库存 PATCH | 固定退款 ID、原销售、退货记录与库存 |
| 赊账还款 | 严格单行 PATCH | 同一路径 | 恰好一条 `sales.credit_info` 权威记录 |
| 手工编辑商品/库存 | 严格单行 PATCH | 同一路径 | 恰好一条 `products` 权威记录 |

销售和退货 RPC 均使用固定 ID；网络超时或网关 5xx 时，客户端会对同一载荷和同一 ID 重试，服务端必须返回原结果，不能重复扣减或回补库存。

## 上线门槛

1. 测试 Supabase 已部署 P1-01、P1-03、P1-04 migration。
2. 网页与 APP 读写相同表，且 `credit_info`、`refund_info` 以 JSONB 对象传输。
3. 新旧模式分别完成单商品、批量、退货、还款和库存编辑验证。
4. 正式库部署前保留上一版网页与 `LEGACY_WRITE` 回滚路径。
5. 未完成 P1-08、P1-09 前不得把正式库写入切换当作已发布。

## 本地验证

```powershell
node --test tests/p1-07-write-mode.test.js
$env:PUPPETEER_CORE_PATH='D:\path\to\puppeteer-core'
$env:BROWSER_PATH='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
node tests/p1-07-browser-runtime.cjs
```

浏览器测试通过本地 HTTP 加载真实页面，拦截 Supabase 请求，不访问正式库。它验证默认 RPC 模式、URL 与本地持久化切换、控制台回滚入口、固定 ID 的网络失败重试，以及页面脚本无运行时错误。
