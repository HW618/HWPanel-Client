# 契约 · 容器

服务：`/api/v2/containers`（`agent/router/ro_container.go`）

## 变更

- 2026-11-27 / T08 / 初版，端点已核实，响应字段待回填

## 1. 端点

| 标记 | 方法 | 路径 | 用途 |
|---|---|---|---|
| ✅ | POST | `/containers/search` | 分页列表（含状态/名称过滤） |
| ✅ | POST | `/containers/list` | 全量列表 |
| ✅ | GET | `/containers/status` | 状态汇总（Tab 徽标/筛选计数） |
| ✅ | POST | `/containers/info` | 容器详情（端口/卷/网络/环境变量） |
| ✅ | POST | `/containers/inspect` | 原始 inspect（详情补全） |
| ✅ | POST | `/containers/operate` | 启动 / 停止 / 重启 / 删除 |
| ✅ | POST | `/containers/item/stats` | 单个容器实时 CPU/内存 |
| ✅ | GET | `/containers/list/stats` | 列表批量统计 |
| ✅ | GET | `/containers/search/log` | **SSE 日志流**（详见 §4） |
| ✅ | POST | `/containers/download/log` | 日志下载（一期不用，留作后续） |

未列入契约的端点（创建、更新、镜像、网络、卷、文件、commit、prune 等）**一期禁止调用**。

## 2. 客户端类型

```ts
export type ContainerState = 'running' | 'stopped' | 'restarting' | 'exited' | 'dead';
export type ContainerFilter = 'all' | 'running' | 'stopped' | 'abnormal';

export interface ContainerSummary {
  id: string; name: string; image: string; tag: string;
  state: ContainerState;
  ports: { host: string; container: string; protocol: 'tcp'|'udp' }[];
  stats?: { cpuPercent: number; memMB: number; memPercent: number };
}

export interface ContainerDetail extends ContainerSummary {
  created: string; restartPolicy: string;
  networks: { name: string; ip: string; mode: string }[];
  mounts: { source: string; target: string; mode: string }[];
  envs: { key: string; value: string; sensitive: boolean }[];
}

export type ContainerAction = 'start' | 'stop' | 'restart' | 'delete';
```

## 2.1 实测返回

`POST /containers/list` → `[{ "name": "3x-ui", "state": "running" }, ...]`（只有 name/state，用于选择器）

`GET /containers/status` →

```json
{"created":0,"running":3,"paused":0,"restarting":0,"removing":0,"exited":0,
 "dead":0,"containerCount":3,"composeCount":3,"composeTemplateCount":0,
 "imageCount":3,"networkCount":4,"volumeCount":0,"repoCount":1}
```

状态枚举因此确认为：`created / running / paused / restarting / removing / exited / dead`，与 `domain/status-mapper.md` 一致。

`POST /containers/search` 的分页元素字段名仍是 🟡（未实测，列表页用它可以一次拿到镜像/端口）。

## 4. 日志是 SSE，不是轮询

实测（v2.5.1）：

```
GET /api/v2/containers/search/log
    ?container=<name>        // 或 ?compose=<docker-compose 绝对路径>
    &since=<1h|all|...>&tail=<n>&follow=<true|false>&timestamp=<true|false>&operateNode=
Accept: text/event-stream      ← 必须带，否则返回 {"code":200,"message":"success","data":null}
```

- 响应 `Content-Type: text/event-stream`，每个事件形如 `data: <base64 字符串>`，**内容要 Base64 解码**后才是日志行。
- `follow=true` 时保持连接持续推送；`follow=false` 推完即断。
- **API-Key 模式同样可用**（已实测通过鉴权），不需要会话 Cookie。
- 客户端实现要点：
  1. 用支持自定义请求头的 SSE 客户端（`EventSource` 不能设 header），必须能带 API-Key 三件套或 Cookie。
  2. 每收到一个 `data:` 事件就 base64 解码追加到环形缓冲。
  3. 离开页面/切容器必须 `abort()`，否则连接会一直挂着。
  4. 断线重连要有退避，且 `follow=true` 断线后不能重复拉全量。

## 3. 规则

1. 筛选胶囊 `异常` 的映射由 `domain/status-mapper.md` 决定（上游状态枚举 → `abnormal` 集合），不得在页面里手写判断。
2. 写操作成功/失败后**必须重新拉取该项最新状态**，不能只靠本地乐观更新（AC-04.1）。
3. 请求进行中按钮进入 `Submitting` 态并防重复提交；删除必须走 `useDangerConfirm()`（PRD 4.8）。
4. 删除运行中容器时展示"强制删除"复选框，**默认不勾选**。
5. 环境变量：`sensitive: true` 的项默认掩码，点击显隐；掩码不得把明文写进 state 之外的地方。
6. 日志：默认 200 行，可选 **100 / 200 / 500 / 1000**（与 PRD §5.2 及 `06` 原型一致）；渲染上限 1000 行并用 FlashList 虚拟化；搜索高亮在本地做，不重新请求。
7. 实时追踪 = `follow=true` 的 SSE 连接；关闭追踪或离开页面必须 `abort()`，否则连接会一直挂着吃流量与内存。

## 4. 错误

容器不存在（已被外部删除）返回业务错误时，UI 提示"该容器已不存在"并从列表移除，不弹通用错误页。
