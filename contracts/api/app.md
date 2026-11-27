# 契约 · 应用商店与已安装应用

服务：`/api/v2/apps`（`agent/router/ro_app.go`）

## 变更

- 2026-11-27 / T10 / 初版；异步任务日志通道未决（U3）

## 1. 端点

| 标记 | 方法 | 路径 | 用途 |
|---|---|---|---|
| ✅ | POST | `/apps/search` | 应用商店列表（分类/关键词） |
| ✅ | GET | `/apps/tags` | 分类标签（**唯一来源，禁止前端写死**） |
| ✅ | GET | `/apps/:key` | 应用基础信息 |
| ✅ | GET | `/apps/detail/:appId/:version/:type` | 应用详情与参数定义 |
| ✅ | GET | `/apps/icon/:key` | 应用图标 |
| ✅ | POST | `/apps/install` | 安装（返回任务 ID） |
| ✅ | POST | `/apps/installed/search` | 已安装列表 |
| ✅ | GET | `/apps/installed/info/:id` | 已安装详情 |
| ✅ | GET | `/apps/installed/params/:id` | 已配置参数（只读展示） |
| ✅ | POST | `/apps/installed/check` | 实例名重名校验 |
| ✅ | POST | `/apps/installed/loadport` | 端口占用校验 |
| ✅ | POST | `/apps/installed/op` | 启动 / 停止 / 重启 / 升级 / 卸载 |
| ✅ | POST | `/apps/installed/update/versions` | 可升级版本列表 |
| ✅ | GET | `/apps/installed/delete/check/:id` | 卸载前置检查 |
| ⬜ | — | 任务日志 | **U3**：安装/升级的异步日志通道（WS 或轮询） |

未列入的（同步、配置修改、端口修改、忽略升级、私有仓库）**一期禁止调用**。

## 2. 客户端类型

```ts
export interface AppCatalogItem {
  key: string; name: string; tags: string[]; description: string; installed: boolean;
}

export interface AppInstallParam {
  key: string; label: string; type: 'text'|'password'|'number'|'select'|'switch';
  required: boolean; default?: unknown; options?: { label: string; value: string }[];
  placeholder?: string;
}

export interface InstalledApp {
  id: string; instanceName: string; appKey: string; version: string;
  state: 'running'|'stopped'; upgradable: boolean; targetVersion?: string;
  port?: string; installPath?: string;
}

export type AppAction = 'start'|'stop'|'restart'|'upgrade'|'uninstall';
```

## 3. 安装表单

1. 参数由 `detail` 返回的**动态定义**渲染，不允许按应用名写死字段。
2. 校验：必填、端口范围与占用（`installed/loadport`）、实例名重复（`installed/check`）。
3. 错误内联到字段下方，不用 Toast。
4. 提交成功后跳「任务进度与日志页」，携带 `taskId`。

## 4. 异步任务日志 — U3 已解（轮询，不是 WebSocket）

已从上游前端核实：安装/升级任务日志走**轮询**，间隔 **3 秒**，无 WebSocket。

| 标记 | 方法 | 路径 | 用途 |
|---|---|---|---|
| ✅ | POST | `/logs/tasks/read` | 按行读取任务日志（前端超时 40s） |
| ✅ | POST | `/logs/tasks/search` | 任务列表/历史 |
| ✅ | GET | `/logs/tasks/executing/count` | 正在执行的任务数 |

请求体（`Log.TaskLogReadReq`）：至少包含 `taskID` 与行偏移；返回增量行。

```ts
interface TaskStream {
  subscribe(taskId: string, onEvent: (e: TaskEvent) => void): () => void; // 返回取消函数
}
type TaskEvent =
  | { kind: 'log'; lines: string[] }
  | { kind: 'status'; status: 'running' | 'success' | 'failed' }
  | { kind: 'progress'; percent?: number };
```

规则：

1. 页面只依赖 `TaskStream`，不直接 `setInterval`。实现内部按 3 秒轮询 `/logs/tasks/read`。
2. 离开页面必须取消订阅；回来先拉一次当前状态，再决定是否继续轮询（任务可能已结束）。
3. 轮询到 `status !== running` 即停，不要无限拉。
4. 增量拼接用行偏移，避免重复渲染整段日志。

## 5. 卸载（AC-05.2）

强提示弹窗，两个复选框**默认均不勾选**：

- `同时删除应用持久化数据与备份`
- `同时删除关联容器镜像`

按钮：危险红 `确认卸载`；取消在左。

## 6. 规则

1. 分类栏消费 `/apps/tags`；原型里写死的 8 个分类**不作为实现依据**。
2. 升级/卸载成功后刷新已安装列表与可升级角标。
3. 「已安装」筛选的 `可升级` 依赖 `upgradable` 字段，不在客户端比较版本号（除非上游不给该字段，届时补契约）。
