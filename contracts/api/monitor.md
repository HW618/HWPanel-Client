# 契约 · 概览与监控

服务：`/api/v2`（`agent/router/ro_dashboard.go`、`ro_host.go`、`ro_process.go`）

## 变更

- 2026-11-27 / T06·T07 / 初版，端点已核实，响应字段待回填

## 1. 端点

| 标记 | 方法 | 路径 | 用途 |
|---|---|---|---|
| ✅ | GET | `/dashboard/base/:ioOption/:netOption` | 主机摘要（hostname/os/uptime/版本） |
| ✅ | GET | `/dashboard/current/:ioOption/:netOption` | 实时指标（CPU/内存/负载/网络/磁盘 IO） |
| ✅ | GET | `/dashboard/current/top/cpu` | 进程 Top5（按 CPU） |
| ✅ | GET | `/dashboard/current/top/mem` | 进程 Top5（按内存） |
| ✅ | GET | `/dashboard/base/os` | 操作系统信息 |
| ✅ | GET | `/hosts/monitor/setting` | **是否开启监控历史**（决定趋势图空态） |
| ✅ | POST | `/hosts/monitor/search` | 历史曲线（1h / 6h / 24h） |
| ✅ | GET | `/hosts/monitor/netoptions` | 网卡选项 |
| ✅ | GET | `/hosts/monitor/iooptions` | 磁盘/IO 选项 |
| ✅ | POST | `/process/listening` | 监听进程（下钻补充） |
| ✅ | GET | `/process/:pid` | 单进程详情 |
| 🟡 | GET | `/process/ws` | 进程流（**是否需要 WS 才能拿完整只读列表，待确认 U5**） |

`:ioOption` / `:netOption` 传 `all` 取全量；有具体网卡/磁盘时传其标识。

## 2. 客户端类型

```ts
export interface HostSummary {
  hostname: string;
  os: string;
  uptime: string;
  panelVersion: string;
}

export interface ResourceSnapshot {
  cpu:   { percent: number; cores: number };
  memory:{ percent: number; usedGB: number; totalGB: number };
  swap:  { percent: number; used: string; total: string };
  load:  { l1: number; l5: number; l15: number };
  disk:  { rootPercent: number; rootUsed: string; rootTotal: string; mountCount: number;
           readSpeed: string; writeSpeed: string };
  net:   { interfaceName: string; upSpeed: string; downSpeed: string;
           totalSent: string; totalRecv: string };
}

export interface ProcessRow {
  name: string; pid: number; user?: string;
  cpuPercent: number; memMB: number; memPercent: number;
}

export type MetricTab = 'cpu' | 'memory' | 'disk' | 'network' | 'processes';
export type HistoryRange = '1h' | '6h' | '24h';
```

## 3. 规则

1. **轮询只打 `/dashboard/current/*`**，`/dashboard/base/*` 仅在进入页面/手动刷新时打一次。
2. 轮询门控：前台 && 当前页 ∈ {概览, 下钻}；离开即停，回来先打一次再恢复定时（AC-03.3）。
3. 阈值着色一律读 `domain/thresholds.md`，不在组件里写数字。
4. 历史为空：先看 `monitor/setting`。未开启 → 空态文案"当前面板未开启监控历史记录，请前往 1Panel Web 端开启"；已开启但无数据 → "所选时间段暂无数据"。两者文案不同。
5. 进程下钻**只读**：契约层面不提供任何 stop/kill 端点，UI 不得出现相关按钮（AC-03.2 / AC-08）。
6. 单位与格式化：速率/容量的人类可读转换在 `src/core/format` 统一实现，双端一致；数值必须 `tabular-nums`。

## 4. 未决

- **U5**：`/process/ws` 是否为完整进程列表的唯一来源。若必须走 WS，`PanelTransport` 需要 `openProcessStream()`，并纳入自签名证书信任范围。
- **U4**：面板版本号的确切来源端点，与 `auth.md` 共用结论。
