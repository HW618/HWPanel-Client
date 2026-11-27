# HWPanel 架构基线（v1.0 · MVP 一期）

> 上游需求：`docs/prd.md` v1.0.0
> 设计源：`docs/design/tokens.json`、`docs/design/design-spec.md`、`docs/design/screens/*.opendesign.json`
> 契约：`contracts/**`（本目录为唯一事实来源）
> 切片：`docs/tasks.md`
>
> 本文件由 arch-bot 维护。改架构先改这里，再改代码。

---

## 1. 形态与技术栈

**单代码库 React Native（Expo）+ TypeScript，双端原生构建。**

| 关注点 | 选型 | 版本基线 |
|---|---|---|
| 运行时 | Expo SDK 54 / React Native 0.81 | 以 `npx expo install` 解析出的兼容版本为准 |
| 语言 | TypeScript strict | — |
| 路由 | Expo Router（文件路由 + 每组独立 Stack） | — |
| 服务端状态 | TanStack Query v5 | 每服务器一个 QueryClient 分区 |
| 客户端状态 | Zustand | 主题、轮询设置、UI 瞬时态 |
| 表单 | react-hook-form + zod | 安装参数、连接表单 |
| 安全存储 | expo-secure-store | Keychain / EncryptedSharedPreferences |
| 本地非敏感库 | expo-sqlite（或 MMKV） | 服务器元数据、偏好 |
| 毛玻璃 | expo-blur | 底部 Tab 栏、顶部胶囊 |
| 动效 | react-native-reanimated | `motion.duration.*`、`pressScale` |
| 列表 | @shopify/flash-list | 容器/应用/任务/日志 |
| 图表 | react-native-svg（环形图）+ victory-native（面积折线） | — |
| YAML | `yaml` 包 | 客户端语法校验 |
| i18n | i18next + react-i18next | 仅 `zh-CN` |
| 触感 | expo-haptics | — |
| 测试 | jest + @testing-library/react-native；Maestro 做 AC 级 E2E | — |

**为什么不是 WebView 壳**：日志流、轮询、Keychain、自签名证书、底部 Tab 的毛玻璃与按压反馈都要原生能力，壳方案在二期也走不远。

---

## 2. 关键决策：自签名证书（最高风险项）

RN 的 `fetch`/`XMLHttpRequest` 走系统网络栈，**无法按请求关闭证书校验**。因此：

- 定义 TS 接口 `PanelTransport`（`request()`、`openLogStream()`），业务层只依赖它。
- 实现放在**本地 Expo Module `modules/hwp-transport`**：
  - iOS：`URLSession` + `URLSessionDelegate.urlSession(_:didReceive challenge:)`，仅当该服务器记录 `allowSelfSigned=true` 时接受该主机证书。
  - Android：每主机一个 `OkHttpClient`，`HostnameVerifier` 与 `X509TrustManager` 仅在标记主机放宽。
- **绝不做全局 trust-all**，也不写 `NSAllowsArbitraryLoads`：放宽范围严格等于该条服务器配置。
- WebSocket（如安装任务日志走 WS）必须复用同一套信任配置，不能退回全局 `WebSocket`。

> T01 必须先交付一个最小可用的 `hwp-transport`（含 iOS/Android 各一条自签证书联通用例），否则 T05 无法验收 AC-02.3。若 Expo Module 路线受阻，回退方案是 dev client 内嵌原生模块 + EAS 自定义构建；**不允许**把 `allowSelfSigned` 降级成"忽略所有证书"。

---

## 3. 分层

```
app/                    路由与页面（只做编排，不写业务规则）
src/
  features/<domain>/    每个垂直切片一个目录：api / hooks / components / screens
  core/
    transport/          PanelTransport 接口 + hwp-transport 适配
    auth/               会话与凭据生命周期
    servers/            多实例注册表、当前服务器上下文
    query/              QueryClient 工厂、queryKey 规范、轮询策略
    theme/              ThemeProvider + tokens.generated.ts
    ui/                 设计系统原子与复合组件
    errors/             错误分类与中文文案
    i18n/               zh-CN 资源
  contracts/             contracts/** 的 TS 类型镜像（由契约生成或手写对齐）
```

规则：

1. **页面不直连 `PanelTransport`**，只经 `features/*/api`。
2. **任何颜色/间距/圆角/字号不得硬编码**，只能从 `theme` 取（ESLint 规则兜底，见 §7）。
3. **每个 queryKey 必须以 `serverId` 开头**，切机不串数据。
4. 高危写操作统一走 `useDangerConfirm()`，禁止各页自己拼弹窗。

---

## 4. 多实例与请求上下文

- `ServerRegistry`：本地保存 `{id, name, endpoint, entrance, authType, allowSelfSigned, isDefault, lastSeenAt, lastError}`。**唯一默认服务器**由注册表事务保证。
- `CredentialVault`：API-Key / 用户名密码 / 会话令牌，只进 Keychain/Keystore，key = `hwp.<serverId>.<kind>`。删除服务器必须在同一事务里清空全部 kind。
- `PanelClient`：每个服务器一个实例，持有自己的 transport、认证策略与 `QueryClient` 分区。
- 启动路由状态机严格按 PRD §3.1；`AC-01.1/1.2/1.3` 由同一个 `resolveEntry()` 纯函数决定，便于单测。
- 轮询生命周期：`AppState` + 当前路由双重门控；后台或离开概览/下钻页立即暂停（AC-03.3）。

---

## 5. 令牌管线（把 `tokens.json` 挂到代码里）

```
docs/design/tokens.json
  → scripts/build-tokens.mjs（Style Dictionary v4 + 自定义 transform）
  → src/core/theme/tokens.generated.ts   （light / dark 两套 + 类型）
  → ThemeProvider（跟随系统 / 浅色 / 深色）
```

必须处理的四件事（否则生成的令牌不可用）：

1. **内部 ID 别名**：原型里有 4 个 OpenDesign 内部 ID 泄漏，管线按别名表归一，不修改 pm-bot 的原始文件。别名表见 `contracts/local/tokens.md`。
2. **非 DTCG 节点**：`typography.scale.*`、`layout.*`、`components.*` 没有 `$value`，需在管线里按"裸值节点"读取（或由 pm-bot 改结构），不能依赖标准 DTCG 解析。
3. **平台换算**：`letterSpacing` 的 `em` → 逻辑像素（× fontSize）；`fontWeight` 650/600 → 双端可用档位（iOS 允许变量字重，Android 只有 400/500/700，650 归一到 600 或改用变量字体）；`elevation.*` 的 CSS shadow 字符串 → `{ shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation }`。
4. **补缺令牌**：模糊半径、禁用透明度、描边宽度、图标尺寸、骨架屏色、图表轴/网格色、按压覆盖色。缺口清单与建议值见 `contracts/local/tokens.md`。

生成物入库（`tokens.generated.ts`），CI 校验"重跑生成 == 仓库版本"，防止令牌与代码漂移。

---

## 6. 错误模型

统一为 `PanelError`（`contracts/domain/errors.md`）：

```
kind: 'network' | 'timeout' | 'tls' | 'auth' | 'entrance' | 'captcha'
    | 'mfa' | 'forbidden-ip' | 'clock-skew' | 'version' | 'business' | 'unknown'
panelCode?: string     // 上游业务错误 key
status?: number        // HTTP 状态
```

- 每种 `kind` 有唯一中文文案与唯一动作（重试 / 检查连接 / 重新登录 / 前往 Web 端）。
- 401 在传输层拦截一次：会话模式触发重新登录流程，API-Key 模式提示检查密钥与白名单。
- 任何日志、上报、Toast 都不得包含 token、密码、Cookie、请求头原值。

---

## 7. 质量门禁

- `tsc --noEmit`、ESLint（含三条自定规则：禁硬编码色值、禁裸字符串、禁页面直连 transport）、Prettier。
- 单测覆盖：`resolveEntry`、默认服务器唯一性、轮询门控、错误映射、令牌管线快照。
- 组件测试：每个 `src/core/ui` 组件在 light/dark 下各渲染一次。
- E2E（Maestro）：AC-01.3、AC-02.3、AC-03.3、AC-04.1、AC-05.2、AC-06.1、AC-07.1、AC-07.2。
- 安全：`grep` 校验源码与构建产物中无明文凭据字段名以外的敏感值；release 包禁用网络日志。

---

## 8. 已知未决（阻塞对应切片，不阻塞脚手架）

| # | 未决 | 影响 | 处置 |
|---|---|---|---|
| U1 | Entrance 与 `/api/v2` 的拼接方式（路径前缀 / Cookie / 请求头） | T05、所有请求 URL | 用真实面板抓一次登录请求后回填 `contracts/api/auth.md` |
| U2 | Compose 的日志与 YAML 读取入口 | T09 | 先按 `containers/search/log` 按 compose 过滤实现，契约留可替换点 |
| U3 | 应用安装/升级异步日志通道（WS 还是轮询） | T10 一半工作量 | 契约抽象为 `TaskStream`，两种实现都留接口 |
| U4 | 版本号读取端点 | T05 兼容提示 | 在实现时确认，契约只要求"能拿到 version" |

---

## 9. 范围守护（硬约束）

一期**不实现、不暴露入口**：网站写操作、容器 Web Terminal、新建容器/Compose/计划任务、私有应用仓库、主从节点、生物识别、推送、文件/终端/AI 助手、多语言。

代码层面强制：路由表（`contracts/local/routes.md`）是白名单，任何不在表内的路由不得注册；`excludedFromMvp` 字段在原型里出现的关键词，不得作为入口文案出现在 UI 中。
