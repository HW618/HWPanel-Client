# 契约 · 路由表（白名单）

来源：9 份 `.opendesign.json` 的 `route` / `navigate`。本表是**唯一白名单**：表外路由不得注册。

## 变更

- 2026-11-27 / T01 / 初版；修正 07 子页缺导航边、08/09 别名不一致

## 1. 表

| # | Expo Router 路径 | 原型 route | 底栏 | 来源 |
|---|---|---|---|---|
| 01 | `/servers` | `/servers` | 无 | 启动 / 胶囊「查看全部面板」 |
| 02 | `/servers/connect` | `/servers/connect` | 无 | 01 的 `+`、空态按钮、09 的「添加新面板」 |
| 03 | `/(tabs)/overview` | `/tabs/overview` | 有 | 默认机启动 / 卡片点击 |
| 04 | `/(tabs)/overview/metrics/[tab]` | `/tabs/overview/metrics/:tab` | 无 | 03 五处下钻 |
| 05 | `/(tabs)/containers` | `/tabs/containers` | 有 | Tab 2 |
| 06 | `/(tabs)/containers/[kind]/[id]` | `/tabs/containers/:kind/:id` | 无 | 05 卡片 / 日志 |
| 07a | `/(tabs)/apps` | `/tabs/apps` | 有 | Tab 3 |
| 07b | `/(tabs)/apps/catalog/[appId]` | `/tabs/apps/catalog/:appId` | 无 | 07a 商店卡片 →**补边** |
| 07c | `/(tabs)/apps/catalog/[appId]/install` | `/tabs/apps/catalog/:appId/install` | 无 | 07b 底部主按钮 →**补边** |
| 07d | `/(tabs)/apps/tasks/[taskId]` | `/tabs/apps/tasks/:taskId` | 无 | 07c 提交 →**补边** |
| 07e | `/(tabs)/apps/installed/[id]` | `/tabs/apps/installed/:instanceId` | 无 | 07a 已安装卡片 →**补边** |
| 08a | `/(tabs)/tasks` | `/tabs/tasks` | 有 | Tab 4 |
| 08b | `/(tabs)/tasks/[taskId]` | `/tabs/tasks/:taskId` | 无 | 08a 卡片（原型别名 `subpage-task-detail`） |
| 09a | `/(tabs)/more` | `/tabs/more` | 有 | Tab 5 |
| 09b | `/(tabs)/more/websites` | `/tabs/more/websites` | 无 | 09a（原型别名 `subpage-websites-list`） |
| 09c | `/(tabs)/more/websites/[siteId]` | `/tabs/more/websites/:siteId` | 无 | 09b 卡片 |

## 2. 导航实现

- 每个 Tab 是独立 `Stack`（`app/(tabs)/<tab>/_layout.tsx`），Tab 内页面 push 到自己的栈，返回不会跨 Tab。
- 底栏用自定义 `TabBar`：当前路由不在 `Tab 根页` 集合时隐藏（对应原型 `hasBottomTabBar: false`），带位移/透明度过渡而不是硬切。
- 参数类型用 `expo-router` 的 typed routes；`[tab]` 只允许 `cpu|memory|disk|network|processes`，`[kind]` 只允许 `container|compose`。

## 3. 弹层（不算路由）

| id | 类型 | 归属 |
|---|---|---|
| `sheet-server-switcher` | BottomSheet | 03 胶囊 |
| `sheet-theme-picker` | BottomSheet | 09a |
| `sheet-polling-interval` | BottomSheet | 09a |
| `sheet-app-upgrade` | BottomSheet | 07e |
| `modal-delete-server` | CenterDialog | 01 |
| `modal-captcha` / `modal-mfa` | CenterDialog | 02 |
| `modal-delete-container` / `modal-delete-compose` / `modal-rebuild-compose` | CenterDialog | 05·06 |
| `modal-delete-task` | CenterDialog | 08 |
| `modal-app-uninstall` | CenterDialog | 07e |

所有 danger/warning 弹窗经 `useDangerConfirm()`，参数见 PRD §4.8 表。

## 4. 禁止

- 无 `/terminal`、`/files`、`/ai`、`/websites/new`、`/websites/:id/edit`、`/containers/new`、`/compose/new`、`/tasks/new`。
- 路由白名单由一条测试守护：扫描 `app/**/_layout.tsx` 与 `router.push/get` 的字符串，出现表外路径即失败。
