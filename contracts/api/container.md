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
| ✅ | GET | `/containers/search/log` | 日志（含实时流参数） |
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

## 3. 规则

1. 筛选胶囊 `异常` 的映射由 `domain/status-mapper.md` 决定（上游状态枚举 → `abnormal` 集合），不得在页面里手写判断。
2. 写操作成功/失败后**必须重新拉取该项最新状态**，不能只靠本地乐观更新（AC-04.1）。
3. 请求进行中按钮进入 `Submitting` 态并防重复提交；删除必须走 `useDangerConfirm()`（PRD 4.8）。
4. 删除运行中容器时展示"强制删除"复选框，**默认不勾选**。
5. 环境变量：`sensitive: true` 的项默认掩码，点击显隐；掩码不得把明文写进 state 之外的地方。
6. 日志：默认 200 行，可切 100 / 500 / 1000；渲染上限 1000 行并用 FlashList 虚拟化；搜索高亮在本地做，不重新请求。
7. 实时追踪开关打开时按增量轮询/流式追加，**离开页面必须断开**，否则会持续吃流量与内存。

## 4. 错误

容器不存在（已被外部删除）返回业务错误时，UI 提示"该容器已不存在"并从列表移除，不弹通用错误页。
