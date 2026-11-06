# 雯雯的小店 Android 原生版：跨 Session 交接

更新时间：2026-11-06 15:35（Asia/Shanghai）

## GitHub 跟踪入口

- 进度 Issue：https://github.com/Hyper0317/wenwen-shop/issues/1
- 交接文档 PR：https://github.com/Hyper0317/wenwen-shop/pull/2

当前 `v2.0.0` 已完成本轮开发与验证。后续继续开发时，先阅读本文件，再从未完成待办继续。

## 项目定位

- 网页源：`Hyper0317/wenwen-shop`，线上 `https://hyper0317.github.io/wenwen-shop/`
- 安卓端：Kotlin 2.0 + Jetpack Compose + Supabase PostgREST
- 数据库与表结构不变，网页和安卓共用现有 Supabase 数据
- 不使用 WebView，不修改网页版
- 当前工作区：`C:\Users\小黄爱超跑\Documents\Codex\2026-11-04\b-ai-app-kotlin-spa-baas`

## 已完成并验证

### 构建与分发

- 包名：`com.wenwen.shop`
- 已交付 APK：`v2.0.0`，versionCode `16`
- APK：`outputs/雯雯的小店-Android-v2.0.0.apk`
- SHA-256：`16B6F0CA8C02AE908E0201E5308F35DA4D28E8D8BEBC8E64237E94326D2DF050`
- APK 使用 v2 debug 签名，可直接内部安装

### 视觉与页面

- 登录页、概览、商品、销售记录、赊账、库存预警、工具、维修、分类页面已原生实现
- 商品详情、商品编辑、分类筛选、加入购物车、购物车、销售详情、退货、赊账详情、还款、日期筛选、日期滚轮、工具新增/借出/工具选择/借出详情、维修新增/详情、分类编辑均已实现
- 新 APP 图标已完成：使用用户提供的金色“雯”，裁掉右下角水印，2048×2048 母版
- 自适应图标和 mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi 启动图已生成
- 支付方式、售出人、赊账未还红色时钟、已还绿色对号、维修状态、复制、加号、关闭等 SVG 已集中映射
- 未还赊账使用红色时钟；当天到期的工具显示「已逾期」
- 商品按编号倒序排列
- 微信支付文案、销售额整数取整与网页版对齐

### 响应式适配

- 统一响应式布局：内容最大宽度、页面边距、概览列数、弹窗宽度会根据窗口尺寸调整
- 登录页、概览、表单和弹窗支持矮屏滚动
- 底部导航会随当前页面自动滚动居中
- 已验证逻辑尺寸：
  - `360×640`
  - `360×800`
  - `390×844`
  - `430×932`
  - `844×390` 横屏
- 多尺寸响应式截图共 99 张

### 自动化验证

- Android 11 模拟器实际执行 33 个页面/弹窗/交互场景通过
- 网页与 Compose 自动对照：33 个场景，0 个失败
- 对照截图基准：`390×844 @3x = 1170×2532`
- 9 个单元测试通过，包括购物车长按加速时间序列
- Android Lint：0 error
- APK v2 签名校验通过

## 购物车模块：已完成并复验

购物车唯一规范见：

- [`CART_MODULE_IMPLEMENTATION_SPEC.md`](./CART_MODULE_IMPLEMENTATION_SPEC.md)

当前源码已完成：

- 以商品 ID 保存购物车快照：商品、数量、成交价、加入时库存上限
- 重复加入自动加 1；达到库存上限提示并中止
- 数量/价格字段只读，禁止弹出键盘
- 点击数量/价格字段后才显示 `−/+` 控制组
- 同一时刻只允许选中一个字段
- 数量最小为 1，最大为加入时的库存快照
- 价格每次增减 `0.5`，最低 `0.5`
- `−/+` 长按 500ms 后连发，间隔从 200ms 逐步降到 40ms
- 长按松手不额外触发普通点击
- 商品卡片支持横向左滑，最多露出 50px 删除按钮
- 底栏固定，类数、件数、总金额实时更新
- 空购物车隐藏底栏并显示「购物车是空的」
- 选择记账时显示记账信息卡和「修改记账详情」入口
- 批量结算前重新拉取云端商品和偏好设置
- 结算前先校验所有商品仍存在且数量不超过最新库存
- 只有全部校验通过后才写入销售记录和扣库存
- 批量销售成功后通过回调清空购物车；失败保留购物车

本轮完成的交互截图：

- `cart.png`：默认状态
- `cart_field_edit.png`：数量 2、价格 25.50、小计 51.00
- `cart_long_press.png`：长按后数量连续增加
- `cart_swipe_delete.png`：左滑露出删除
- `cart_empty.png`：空购物车，底栏隐藏

已验证：

- 点击卡片空白会取消字段选中
- 数量 2 后长按 `+` 会触发连续增加，松手不额外加一次
- 左滑 50dp 后露出删除按钮，并带 300ms 回弹动画
- 卡片隐藏控制组仍保留布局宽度，选中时不发生横向跳动
- 网页的标题栏与商品列表同处一块毛玻璃容器，Compose 已同步该层级
- 售出人为空、支付方式为空、记账人姓名为空时分别给出网页同款提示

## 待办

- [x] 最终编译并修复可能问题
- [x] 运行 `testDebugUnitTest`
- [x] 运行 `lintDebug`
- [x] 在 Android 11 模拟器重跑 33 场景
- [x] 验证购物车长按加速、字段切换、左滑方向锁定
- [x] 对比购物车普通态、字段编辑态、左滑态、空态与网页截图
- [ ] 用真实 Supabase 测试购物车结算：最新库存、成功清空、失败保留
- [ ] 商品照片上传与网页版 `AsapWorkspaceAssets` / Supabase Storage 对齐
- [ ] 审查严格控件清单剩余误报和真实缺项
- [ ] 评估 Supabase RPC 原子事务，避免销售与库存部分写入
- [x] 升级版本号并重新生成 APK 和 SHA-256
- [ ] 创建 `v2.0.0` GitHub Release 下载入口

## 本机构建环境

- JDK：`D:\AI\ChatGPT\WenwenShopAndroid\work\jdk-17.0.13+11`
- Gradle：`D:\AI\ChatGPT\WenwenShopAndroid\work\gradle-8.9\bin\gradle.bat`
- Gradle User Home：`D:\AI\ChatGPT\WenwenShopAndroid\gradle-home`
- Android SDK：`D:\AI\ChatGPT\WenwenShopAndroid\work\android-sdk`
- APP 构建输出：`D:\AI\ChatGPT\WenwenShopAndroid\app-build`
- AVD：`D:\AndroidAvds\wenwen_window.avd`
- 模拟器端口：`5640`
- 目标分辨率：`1170×2532`
- 目标密度：`480`
- 模拟器时区必须设置：`Asia/Shanghai`

## 恢复命令

```powershell
$env:JAVA_HOME='D:\AI\ChatGPT\WenwenShopAndroid\work\jdk-17.0.13+11'
$env:ANDROID_HOME='D:\AI\ChatGPT\WenwenShopAndroid\work\android-sdk'
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:GRADLE_USER_HOME='D:\AI\ChatGPT\WenwenShopAndroid\gradle-home'
$env:PATH="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"

$html=Get-Content -Raw 'work\index.html'
$url=[regex]::Match($html,"var\s+SUPABASE_URL\s*=\s*'([^']+)'").Groups[1].Value
$key=[regex]::Match($html,"var\s+SUPABASE_KEY\s*=\s*'([^']+)'").Groups[1].Value

& 'D:\AI\ChatGPT\WenwenShopAndroid\work\gradle-8.9\bin\gradle.bat' `
  assembleDebug assembleDebugAndroidTest testDebugUnitTest lintDebug `
  "-PSUPABASE_URL=$url" "-PSUPABASE_ANON_KEY=$key"
```

启动模拟器：

```powershell
$env:ANDROID_AVD_HOME='D:\AndroidAvds'
& "$env:ANDROID_HOME\emulator\emulator.exe" `
  -avd wenwen_window -port 5640 -no-audio -no-boot-anim `
  -gpu swiftshader_indirect -no-snapshot -accel on
```

运行完整截图与交互测试：

```powershell
adb -s emulator-5640 shell am instrument -w -r `
  -e class 'com.wenwen.shop.ci.VisualParityTest#captureRequiredPagesAndInteractions' `
  com.wenwen.shop.test/androidx.test.runner.AndroidJUnitRunner
```

## 关键文件

- `AGENTS.md`
- `SELF_AUDIT.md`
- `docs/WEB_TO_COMPOSE_CONVERSION_PLAYBOOK.md`
- `docs/CART_MODULE_IMPLEMENTATION_SPEC.md`
- `docs/compose-conversion-ledger.md`
- `app/src/main/java/com/wenwen/shop/ui/screens/InventoryScreen.kt`
- `app/src/main/java/com/wenwen/shop/ui/ShopViewModel.kt`
- `app/src/main/java/com/wenwen/shop/ui/ShopApp.kt`
- `app/src/androidTest/java/com/wenwen/shop/ci/VisualParityTest.kt`
- `ci/parity/compare.mjs`
- `ci/parity/inventory.mjs`
- `ci-artifacts/parity-report.md`

## 交接原则

- 不修改网页版
- 不使用 WebView 兜底
- 不把“编译通过”当成视觉完成
- 不把 Material 默认控件当成网页控件
- 任何新增图标都要进入 `ShopIcons.kt` 或统一映射
- 完成前必须重新生成原生截图并对照网页
- 每次交付都记录版本号、APK 路径、截图、测试结果和未完成项
