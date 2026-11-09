# 双端共存升级状态

更新时间：2026-11-09（Asia/Shanghai）

## 权威进度入口

| 阶段 | 状态 | Issue |
|---|---|---|
| 基线和隔离数据库 | 只读盘点完成，等待数据库级权限 | [#3](https://github.com/Hyper0317/wenwen-shop/issues/3) |
| APP UI、交互与功能 | 持续核验中 | [#4](https://github.com/Hyper0317/wenwen-shop/issues/4) |
| 数据可靠性与自动刷新 | 等待隔离库部署 RPC | [#5](https://github.com/Hyper0317/wenwen-shop/issues/5) |
| 网页适配新数据库 | 未开始 | [#6](https://github.com/Hyper0317/wenwen-shop/issues/6) |
| 正式迁移与一致性验收 | 未开始 | [#7](https://github.com/Hyper0317/wenwen-shop/issues/7) |
| 切换与回退 | 未开始 | [#8](https://github.com/Hyper0317/wenwen-shop/issues/8) |
| 稳定后的安全升级 | 暂缓 | [#9](https://github.com/Hyper0317/wenwen-shop/issues/9) |

## 当前 APP 验证

- 版本候选：`versionCode 38` / `versionName 2.0.22`。
- `testDebugUnitTest`：通过。
- `assembleDebug`：通过。
- `assembleDebugAndroidTest`：通过。
- 完整设备交互回归：13/13 通过。
- 已验证售出人弹窗修复后，雯雯、雯爸、雯妈三个选项真实可见。
- 已验证购物车 2/3 高度弹性抽屉：全展开、慢速下拉到半展开、内容区操作、重新上拉、滚动和快速下滑关闭。
- 本轮只修正了测试手势距离，使其落在 2/3 高度抽屉的真实半展开锚点；生产交互逻辑未因此降级。

## 尚未完成

- 数据库级备份、隔离 Supabase 项目、dump/restore、全表哈希与序列校验。
- 新库上的原子销售、批量销售和退货 RPC。
- 网页候选版本连接新库的回归。
- 正式切换、回退演练和用户验收。
- 登录、RLS 和 anon 权限收紧属于稳定后的最后阶段。

在任何迁移校验项不一致时，保持旧数据库和网页正常运行，不执行切换。
