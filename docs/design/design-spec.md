# HWPanel 设计规范与双端适配指南（Design Spec）

- **版本**：v1.0.0（MVP 基线）
- **Design Tokens 源**：[tokens.json](./tokens.json)
- **页面结构定义**：[screens/](./screens/)（`01`–`09` 共 9 个核心屏幕与状态定义）
- **交互预览**：OpenDesign 项目 `hwpanel-mvp` 及本地同步预览 [preview.html](./preview.html)

---

## 1. 视觉方向与核心基因（参考飞牛 fnOS 移动端）

1. **消费级清爽卡片质感**：告别传统运维工具高密度表格与暗沉线条，采用 `22px` 大圆角卡片（`radius.lg`）、柔和分层投影（浅色 `elevation.light.card`，深色改为微亮 1px 顶部高光内描边 + 深阴影）与充裕留白（页面左右 `16px`、卡片间距 `12px`）。
2. **冷蓝氛围顶栏渐变**：浅色模式页面顶部叠加 `#DDE4F5 → #EDF0F7 → #F2F3F6` 轻盈渐变；深色模式切换为 `#15213B → #101625 → #0D1017`，保证顶栏文字与切换胶囊始终具备清晰层次。
3. **科技蓝主色 + 克制语义状态色**：
   - 主品牌色：浅色 `#2F6BFF`、深色提亮为 `#4D82FF`（保障 WCAG AA 文本/图标对比度 ≥ 4.5:1）。
   - 资源阈值动态着色：正常（`<70%`）使用主品牌/图表色，预警（`70%–89%`）切换 `status.warning`，告警（`≥90%`）切换 `status.danger`。
   - 数值对齐：所有 CPU/内存百分比、网速、时间戳、PID 强制启用 `tabular-nums` 等宽数字，防止 5 秒轮询刷新时文本抖动。
4. **深浅色双模式（默认跟随系统）**：所有颜色必须严格引用 `tokens.json` 中 `color.semantic.{light|dark}` 语义键，严禁组件内硬编码 `#FFFFFF` / `#000000`；日志与 YAML 代码区在浅色与深色模式下均保持高对比深色底（`bg.codeBlock` + `text.code`），确保终端日志可读性一致。

---

## 2. 导航框架与页面映射清单

### 2.1 底部 5 Tab 主导航规范
- **固定结构**：5 等分网格，毛玻璃背景（`bg.tabBarGlass` + `backdrop-filter: blur(18px)`），顶部圆角 `20px`，取消生硬的顶部横线，选中项通过文字/图标切为主色 + 底部 `5px` 品牌圆点标识。
- **固定顺序（一期不可增删改序）**：
  1. `概览`（`03-dashboard` → `04-metric-drilldown`）
  2. `容器`（`05-containers-compose` → `06-container-compose-detail`）
  3. `应用`（`07-app-store` 含详情/安装/任务日志/已安装详情）
  4. `任务`（`08-cron-tasks` 含执行历史与日志）
  5. `更多`（`09-more-websites-settings` 含网站只读列表与详情、主题/轮询设置、跳转 `01-servers-overview`）

### 2.2 全部 OpenDesign 页面索引
| 文件 | 页面名称 | 归属层级 |
| --- | --- | --- |
| `01-servers-overview.opendesign.json` | 全部面板总览 | 独立根页（无底栏） |
| `02-server-connect.opendesign.json` | 添加/编辑面板与登录鉴权 | 二级表单页（无底栏） |
| `03-dashboard.opendesign.json` | 单机概览页 | Tab 1 根页（5 Tab） |
| `04-metric-drilldown.opendesign.json` | 监控指标下钻详情页 | Tab 1 二级页（无底栏） |
| `05-containers-compose.opendesign.json` | 容器与编排列表页 | Tab 2 根页（5 Tab） |
| `06-container-compose-detail.opendesign.json` | 容器详情 / Compose YAML 与日志 | Tab 2 二级页（无底栏） |
| `07-app-store.opendesign.json` | 应用商店、安装、任务日志与已安装 | Tab 3 根页及子流 |
| `08-cron-tasks.opendesign.json` | 计划任务列表与执行日志 | Tab 4 根页及详情页 |
| `09-more-websites-settings.opendesign.json` | 更多、网站只读与设置 | Tab 5 根页及子页 |

---

## 3. 核心组件规范

### 3.1 ServerSwitchPill（服务器切换胶囊）
- **尺寸**：高 `40px`、左右内边距 `14px`、全圆角 `radius.pill`、背景 `bg.pillGlass`。
- **结构**：`7px` 在线状态点（在线带 3px 柔光环）+ 服务器备注名（单行省略，最大宽度自适应不挤压右侧刷新按钮）+ 向下箭头图标。
- **交互**：点击弹出底部「切换服务器 Sheet」，提供单选列表、「查看全部面板」与「添加新面板」。

### 3.2 RingGauge（核心资源环形图）
- **尺寸**：直径 `88px`、圆环线宽 `6px`、圆头端点（`stroke-linecap: round`）、轨道色 `chart.track`。
- **内部排布**：主数值 `20px / 700`（`tabular-nums`）+ 百分比符号 `12px`，下方为维度名（CPU/内存/磁盘）与辅助说明（如 `8 核`、`12.4/32 GB`）。
- **交互**：三环所在卡片或单个环区均具备最小 `44×44` 点击热区，点击按压缩放 `0.97` 并进入对应下钻维度。

### 3.3 SegmentedControl（顶部分段控制器）
- 用于：`添加服务器（API-Key / 用户名密码）`、`容器页（容器 / 编排）`、`应用页（应用商店 / 已安装）`、`详情页子视图`。
- 轨道 `bg.segmentedTrack`（圆角 `14px`，内边距 `4px`），激活滑块为 `bg.surface` + 轻微投影，高度 `40px`，切换动画 `160ms`。

### 3.4 StatusChip & StatusDot（状态语义徽标）
- 高度 `24px`，圆角 `7px`，字号 `11px / 600`：
  - **运行中 / 在线 / 成功 / SSL 正常**：`status.successBg` + `status.successText`
  - **预警 / 部分运行 / 执行中 / SSL 临期（≤30天）**：`status.warningBg` + `status.warningText`
  - **异常 / 失败 / 连接中断 / SSL 已过期**：`status.dangerBg` + `status.dangerText`
  - **已停止 / 已禁用 / 未启用 HTTPS**：`bg.surfaceSoft` + `text.muted`
  - **默认服务器 / 可升级**：`brand.soft` + `brand.onSoft`

### 3.5 DangerConfirmDialog（高危操作强提示确认弹窗）
- **适用范围**：删除容器、删除 Compose、重建 Compose、卸载应用、删除计划任务、移除已保存服务器。
- **视觉结构**：居中圆角弹窗（`radius.xl = 26px`，左右距屏边 `24px`），顶部红色/琥珀色警示图标 + 粗体标题 + 含目标对象名称的风险说明文案 + 可选复选框区（**复选框一律默认不勾选**）+ 等宽双按钮（「取消」在左使用次要样式，「确认删除/卸载/重建」在右使用实心危险红或警告色）。
- **防误触约束**：点击遮罩背景不自动触发确认操作；确认请求发出后主按钮进入 Loading 态并禁用取消误点。

### 3.6 LogStreamBox & MonospaceCodeEditor（日志与 YAML 编辑区）
- 固定深色阅读区（`bg.codeBlock`），等宽字体 `12px / 19px`，支持横向滚动避免 YAML 缩进视觉错位。
- 日志区顶部提供紧凑工具条：关键词搜索、行数切换（`100/500/1000`）、实时追踪开关、一键复制。
- YAML 编辑器进入编辑态后展示行号与错误行红底高亮条，拦截不合法缩进/语法并提示具体行号。

---

## 4. 页面五态规范（State Matrix）

| 状态 | 规范要求 |
| --- | --- |
| **Loading（骨架屏）** | 使用与真实卡片相同圆角与高度的浅灰/深灰脉动色块（Shimmer），支持减少动态效果时退化为静态占位块；严禁阻断式全屏白屏转圈。 |
| **Content（正常态）** | 支持下拉刷新；Tab 1 概览页自动轮询时保持静默局部更新，不重置滚动位置。 |
| **Empty（空态）** | 居中线性图标（`32px`）+ 一句简短中文原因 + 可选引导按钮（如「添加服务器」「清空筛选条件」）。 |
| **Error（异常态）** | 明确区分网络超时、自签名证书拒绝、401 鉴权/会话失效、IP 白名单受限，给出可执行操作按钮（「重试」「检查连接设置」「重新登录」）。 |
| **Submitting（提交态）** | 按钮文案替换为加载指示 + 禁用点击；结束后通过顶部/底部轻量 Toast（停留 2.4s）反馈结果并刷新最新状态。 |

---

## 5. iOS 与 Android 双端适配指引

HWPanel 采用 **iOS & Android 统一品牌设计语言**，在以下平台原生习惯处做差异适配（由架构与开发团队在对应端落盘）：

| 适配维度 | iOS 规范 | Android 规范 |
| --- | --- | --- |
| **安全区与状态栏** | 顶部适配灵动岛/刘海（默认 `50pt`），底部 Home Indicator 预留 `34pt`；底部 5 Tab 栏内边距自动叠加 `env(safe-area-inset-bottom)`。 | 顶部适配 `WindowInsets` 状态栏（Edge-to-Edge 透明沉浸），底部兼容手势导航条（约 `16–24dp`）与三键导航栏（`48dp`）。 |
| **页面返回与导航** | 顶部左上角返回箭头 + 上级页面名；支持左边缘右滑返回；模态抽屉支持下拉手势关闭。 | 顶部标准 Material 返回箭头；完整响应系统预测性返回手势（Predictive Back），弹窗打开时系统返回键优先关闭弹窗。 |
| **按压反馈与触感** | 卡片/按钮按压缩放 `0.97`，高危弹窗确认与开关切换触发轻触觉反馈（`UIImpactFeedbackGenerator` Light/Medium）。 | 保留 `0.97` 轻缩放或叠加克制的 Ripple 水波纹（限圆角裁剪内），高危确认触发 `HapticFeedbackConstants`。 |
| **字体与动态字号** | 默认 `SF Pro Text` + `PingFang SC`，等宽用 `SFMono-Regular`；支持系统字体缩放（至少兼容至 120% 不截断核心指标）。 | 默认 `Roboto` + `Noto Sans SC`，等宽用 `Roboto Mono`；遵循 `sp` 缩放与关键卡片多行折行兜底。 |
| **弹窗与键盘避让** | 底部 Sheet 采用 `26pt` 顶部圆角 + 顶部 `36×4pt` 拖拽把手；YAML 编辑与表单页自动随键盘上推并保留底部操作栏可见。 | 遵循 `adjustResize` 键盘避让；确认弹窗与 BottomSheet 兼容大屏折叠屏最大宽度居中约束（`maxWidth: 480dp`）。 |
| **安全存储映射** | 凭据（API-Key/密码/Token）写入 `iOS Keychain`（`kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`）。 | 凭据写入 `Android Keystore` 加密存储（`EncryptedSharedPreferences` / Jetpack Security）。 |


---

## 6. 原型类型 → 设计系统组件 → 令牌映射表（T03 输入）

为保证 `arch-bot` 与 `dev-bot` 1:1 映射 `screens/*.opendesign.json` 中的全部组件类型，统一收敛为以下基础与业务组件清单：

| 原型组件类型 | 设计系统组件 | 核心绑定令牌（`tokens.json`） |
| --- | --- | --- |
| `TopBar`, `BackButton`, `IconButton`, `BrandMark` | `HwTopBar` / `HwIconButton` | `bg.pillGlass`, `text.primary`, `brand.primary`, `iconSize.md`, `$extensions.hwpanel.layout.topBarHeight` |
| `ServerSwitchPill`, `LiveBadge` | `HwServerSwitchPill` | `bg.pillGlass`, `blur.pill`, `radius.pill`, `status.success`, `brand.soft` |
| `SearchPill` | `HwSearchPill` | `bg.surface`, `text.primary`, `text.subtle`, `radius.pill`, `elevation.*.card` |
| `SegmentedControl`, `MiniSegmented` | `HwSegmentedControl` | `bg.segmentedTrack`, `bg.surface`, `text.primary`, `text.muted`, `motion.duration.fast` |
| `FilterChipRail`, `HorizontalPillTabs`, `HorizontalCategoryRail`, `RangeChips` | `HwFilterChipRail` | `bg.surface`, `brand.primary`, `text.onBrand`, `text.muted`, `radius.pill` |
| `Card`, `FormCard`, `GroupedListCard`, `KeyValueCard`, `EnvVarCard`, `OperationBarCard` | `HwCard` + `HwListRow` | `bg.surface`, `radius.lg`, `spacing.cardPadding`, `border.hairline`, `elevation.*.card`, `state.pressOverlay` |
| `ServerOverviewCard`, `CurrentServerProfileCard` | `HwServerCard` | `bg.surface`, `bg.surfaceMuted`, `opacity.offlineCard`, `radius.lg`, `brand.primary`, `status.*` |
| `ResourceOverviewCard`, `RingGauge` | `HwRingGaugeCard` | `chart.track`, `chart.cpu/memory/disk`, `status.warning/danger`, `typography.scale.metricLarge` |
| `MetricSummaryCard`, `TwoColumnCardRow`, `SummaryStrip` | `HwMetricSummaryCard` | `bg.surface`, `bg.surfaceSoft`, `chart.netUp/netDown`, `spacing.3`, `radius.lg` |
| `AreaLineChart` | `HwAreaTrendChart` | `chart.cpu/memory/disk`, `chart.grid`, `chart.axis`, `bg.surface` |
| `ProcessTopCard`, `ProcessTableCard` | `HwProcessTable`（只读） | `bg.surface`, `border.hairline`, `typography.scale.bodyMedium`, `typography.scale.code` |
| `ContainerCard`, `ComposeCard` | `HwWorkloadCard` | `bg.surface`, `status.*`, `typography.scale.code`, `radius.lg` |
| `AppCatalogCard`, `InstalledAppCard` | `HwAppCard` | `bg.surface`, `radius.lg`, `radius.md`, `brand.soft`, `status.*` |
| `CronTaskCard` | `HwCronTaskCard` | `bg.surface`, `border.control`, `brand.primary`, `status.*` |
| `WebsiteReadOnlyCard`, `SslCertificateCard` | `HwWebsiteCard`（只读） | `bg.surface`, `status.success*/warning*/danger*`, `bg.surfaceSoft` |
| `StatusChip`, `Chip`, `StatusDot` | `HwStatusChip` / `HwStatusDot` | `radius.xs`, `typography.scale.badge`, `status.*`, `brand.soft/onSoft` |
| `ActionRow`, `PrimaryButton`, `SecondaryButton`, `DangerButton` | `HwButton` | `brand.primary/pressed`, `bg.surfaceSoft`, `status.danger`, `opacity.disabled`, `motion.pressScale` |
| `InlineResultBanner`, `InfoNoticeBanner`, `ReadOnlyNoticeStrip`, `SecurityFootnote` | `HwBanner` | `brand.soft`, `status.successBg/warningBg/dangerBg`, `radius.sm` |
| `DangerConfirmDialog`, `WarningConfirmDialog`, `CenterDialog` | `HwConfirmDialog` | `bg.surface`, `bg.overlay`, `radius.xl`, `zIndex.dialog`, `status.danger*` |
| `BottomSheet` | `HwBottomSheet` | `bg.surface`, `bg.overlay`, `border.control`, `radius.xl`, `zIndex.sheet` |
| `LogStreamBox`, `MonospaceCodeEditor` | `HwCodeViewport` / `HwYamlEditor` | `bg.codeBlock`, `text.code`, `typography.scale.code`, `status.dangerBg` |
| `EmptyStateCard`, `ErrorBannerCard`, `Skeleton`, `Toast` | `HwEmptyState` / `HwSkeleton` / `HwToast` | `skeleton.base/shimmer`, `iconSize.empty`, `zIndex.toast` |

---

## 7. DTCG 令牌规范与自动校验基线（v1.0.1 修订）

1. **严格 DTCG 结构**：`tokens.json` 中 `color` / `typography` / `spacing` / `radius` / `borderWidth` / `iconSize` / `blur` / `opacity` / `elevation` / `zIndex` / `motion` 全部节点采用标准 `$type` + `$value`；产品级元数据与布局常量归置于 `$extensions.hwpanel`，确保标准令牌生成器可直接解析。
2. **跨平台字重与阴影映射**：字重收敛为 `400 / 500 / 600 / 700`（移除 Android Roboto 缺失的 `650`）；字距改为数值型 `px`；阴影改为结构化对象（`offsetX/offsetY/blur/spread/color`）并附带 `$extensions.hwpanel.androidElevation`，供 Flutter `BoxShadow` 与 Android Elevation 自动生成。
3. **自动对比度门禁**：浅色与深色模式下，所有正文、次级文本与占位符/时间戳（`text.primary`、`text.secondary`、`text.muted`、`text.subtle`）在 `bg.surface` 与 `bg.canvas` 上均满足 **WCAG AA ≥ 4.5:1**（`text.subtle` 已在 v1.0.1 加深至浅色 `#666D7B` / 深色 `#8892A6`）。
4. **预览同步约定**：`docs/design/preview.html` 仅供交互视觉评审参考；工程实现一律以 `docs/design/tokens.json` 自动生成的主题代码作为唯一真相源（Single Source of Truth）。
