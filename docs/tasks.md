# HWPanel MVP 任务切片（v1.0）

> 每个切片必须**独立可验收**：有自己的契约输入、自己的验收项、自己的 PR。
> 一个切片一个 `feat/<Txx-slug>` 分支；PR 描述里写 `Refs: Txx` 与对应 `AC-xx`。
> 契约见 `contracts/**`，架构见 `docs/architecture.md`，需求见 `docs/prd.md`。

## 依赖图

```
T01 ─ T02 ─ T03 ─┬─ T04 ─ T05 ─┬─ T06 ─ T07
                 │             ├─ T08 ─ T09
                 │             ├─ T10
                 │             ├─ T11
                 │             └─ T12
                 └─────────────────── T13（全部完成后）
```

T05 完成前，T06/T08/T10/T11/T12 只能做静态部分（骨架屏、空态、组件拼装），不得接真实接口。

---

## T01 · 工程脚手架与质量门禁

**产出**
- Expo + TypeScript strict 工程；iOS/Android 可构建（EAS 或本地 prebuild）
- Expo Router 骨架 + 5 Tab 空壳（路由表见 `contracts/local/routes.md`）
- ESLint / Prettier / tsc / jest 配置；CI（lint + typecheck + test）
- `.gitignore` 换成 RN 版本（`.expo/`、`node_modules/`、`ios/Pods/`、`android/.gradle/`、`*.jks`、`*.keystore`、`*.mobileprovision`、`GoogleService-Info.plist`）
- `modules/hwp-transport` 本地 Expo Module 骨架
- `zh-CN` 资源骨架（i18next），并加"禁止裸字符串"的 lint 规则

**验收**
- 双端启动到空 Tab 框架；CI 全绿；`npm run typecheck` 无错
- `hwp-transport` 至少有一个可调用的 `ping()`，双端都能返回

**依赖**：无

---

## T02 · 令牌管线与主题

**产出**
- `scripts/build-tokens.mjs`：`tokens.json` → `src/core/theme/tokens.generated.ts`
- 别名表（4 个内部 ID）、非 DTCG 节点处理、平台换算（见 `contracts/local/tokens.md`）
- `ThemeProvider`：跟随系统 / 浅色 / 深色，即时切换
- 缺口令牌先以常量补齐
- CI 校验"重新生成 == 仓库版本"

**验收**
- 三态切换全局即时生效，无闪白/闪黑
- 源码扫描：`src/**` 无 `#RRGGBB` 字面量（lint 规则）
- 对比度报告产出（不达标项列给 pm-bot，不自行改色）
- AC-07.2 的前置条件成立

**依赖**：T01

---

## T03 · 设计系统组件库

**产出**（`src/core/ui`）
- 原子：Card、StatusChip、StatusDot、Chip、SegmentedControl、SearchPill、FilterChipRail、IconButton、Switch、Checkbox
- 复合：RingGauge、MiniProgressBar、KeyValueCard、LogStreamBox、MonospaceCodeEditor、Skeleton、EmptyState、ErrorState、Toast、BottomSheet、DangerConfirmDialog
- `useDangerConfirm()`：统一高危确认 API
- 组件映射表：原型类型 → 组件名 → 令牌（把 design-spec 的 6 个扩到全部）

**验收**
- 每个组件在 light/dark 下各有一个渲染测试
- RingGauge 三档阈值着色正确（69/70/89/90 边界）
- DangerConfirmDialog：复选框默认不勾选、点遮罩不关闭、确认中按钮 Loading
- 无组件读取业务 store

**依赖**：T02

---

## T04 · 服务器注册表与启动路由

**产出**
- `ServerRegistry` 仓储（sqlite）+ `CredentialVault`（SecureStore）
- `resolveEntry()` 纯函数与启动路由
- 全部面板总览页（01）：卡片流、搜索、汇总条、`···` 菜单、删除确认、空态
- 在线探测（30s，仅列表可见时）

**验收**
- AC-01.1 / AC-01.2 / AC-01.3
- 默认唯一性：并发把两台设为默认，最终只有一台
- 删除服务器后凭据不残留（见 `credential-vault.md` §5）

**依赖**：T02

---

## T05 · 连接与鉴权

**产出**
- 添加/编辑面板页（02）：两种模式、地址规范化、安全入口、自签名开关与风险提示、测试连接
- 验证码弹窗、MFA 弹窗、会话 401 重登
- `PanelTransport` 真实实现（含 `hwp-transport` 自签名支持）
- 错误映射全量接通（`contracts/domain/errors.md`）
- 版本探测与不兼容提示

**验收**
- AC-02.1 / AC-02.2 / AC-02.3
- 自签名联通用例：开启开关能连、关闭必须报 `tls`（双端各一次）
- 时钟偏移、IP 白名单两种失败文案可区分

**依赖**：T04
**未决**：U1（Entrance 拼接）、U4（版本端点）——必须先抓真实面板确认

---

## T06 · 概览页与轮询生命周期

**产出**
- 主机摘要条、三环卡片、网络/磁盘 I/O 卡、进程 Top5（CPU/内存切换）
- 轮询门控（前台 + 页面可见）、手动刷新、切换服务器 Sheet
- 离线错误卡

**验收**
- AC-03.1 / AC-03.3
- 切到其它 Tab 或退到后台，5s 后无请求（用网络日志证明）

**依赖**：T03、T05

---

## T07 · 指标下钻与历史

**产出**
- 五维下钻（CPU/内存/磁盘/网络/进程）
- 1h/6h/24h 历史趋势 + 交互 tooltip
- 历史未开启 / 无数据两种空态
- 只读进程表（搜索、CPU/内存排序）

**验收**
- AC-03.2
- 进程页不存在任何 kill/stop 入口；契约层也没有该方法

**依赖**：T06
**未决**：U5（进程列表来源）

---

## T08 · 容器

**产出**
- 列表（搜索、四种筛选、状态映射）、详情（概览/日志）、生命周期操作
- 日志：行数切换、追踪、搜索高亮、复制、自动滚底
- 删除确认（含"强制删除"复选框）

**验收**
- AC-04.1 / AC-04.2
- 操作后立即反映真实状态（非仅乐观更新）
- 日志 1000 行时滚动不卡、内存不持续增长

**依赖**：T03、T05

---

## T09 · 编排 Compose

**产出**
- 编排列表、详情三 Tab（服务/YAML/日志）
- YAML 编辑器：行号、语法校验、错误定位、仅保存 / 保存并重建
- 重建与删除的确认弹窗

**验收**
- AC-04.3
- 非法 YAML（Tab 缩进、缺 services、语法错）分别给出不同提示并阻止提交

**依赖**：T08
**未决**：U2

---

## T10 · 应用商店与安装任务

**产出**
- 商店（分类消费 `/apps/tags`）、详情、安装表单（动态参数 + 内联校验）
- 任务进度与日志页（`TaskStream` 抽象）
- 已安装列表/详情、升级 Sheet、卸载双复选框确认

**验收**
- AC-05.1 / AC-05.2
- 两个复选框默认未勾选；未勾选时请求体不含对应字段
- 离开任务页取消订阅，返回能续看状态

**依赖**：T03、T05
**未决**：U3

---

## T11 · 计划任务

**产出**
- 列表（搜索、四筛选、启停开关）、立即执行、停止
- 执行历史 + 日志（轮询至结束）
- 删除确认
- `humanizeCron()`

**验收**
- AC-06.1
- 常见 cron 形态的中文描述正确；解析失败回退为表达式

**依赖**：T03、T05

---

## T12 · 更多 / 网站只读 / 设置

**产出**
- 更多主页（当前服务器卡、模块入口、外观/刷新设置、关于与安全说明）
- 网站列表与详情（只读）
- 主题 Sheet、轮询间隔 Sheet

**验收**
- AC-07.1 / AC-07.2
- 网站页可访问性树中不存在任何写操作按钮
- 轮询间隔修改后立即作用于概览页

**依赖**：T03、T05

---

## T13 · 范围守护与安全验收

**产出**
- 路由白名单测试、`excludedFromMvp` 关键词扫描
- 凭据脱敏测试（日志/上报）
- 全量 AC-01~AC-08 的 E2E（Maestro）清单
- 发布前检查脚本

**验收**
- AC-08 全绿：无终端/文件/AI/网站编辑/新建任务/新建编排/生物识别入口
- 扫描源码与构建产物，无明文凭据
- E2E 全部通过

**依赖**：T06–T12 全部完成

---

## 交付约定

1. 每个 PR 必须含：`Refs: Txx`、对应 `AC-xx`、以及"契约是否变更"的说明。
2. 契约变更单独 PR，先合并契约，再合并实现。
3. 生成物（`tokens.generated.ts`、路由类型）随源码入库，CI 校验可复现。
4. 未决项（U1–U5）在确认前，实现必须落在契约声明的抽象后面（`PanelTransport` / `TaskStream` / `useComposeYaml` / `useComposeLogs`），不得把猜测散进页面。
