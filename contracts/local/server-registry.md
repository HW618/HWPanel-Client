# 契约 · 服务器注册表（本地）

不涉及面板，纯客户端。源：PRD §4.1 / §4.2、AC-01。

## 变更

- 2026-11-27 / T04 / 初版

## 1. 模型

```ts
export interface ServerRecord {
  id: string;                  // uuid，本地生成，永不复用
  name: string;                // 1–32 字符
  endpoint: string;            // 规范化后的 base URL，无尾斜杠
  entrance?: string;           // 规范化：去首尾斜杠
  allowSelfSigned: boolean;    // 默认 false
  authMode: 'api-key' | 'password';
  isDefault: boolean;
  createdAt: string;
  lastSeenAt?: string;
  lastError?: { kind: PanelErrorKind; message: string; at: string };
  panelVersion?: string;
  hostname?: string;
}
```

**凭据不在这个模型里**（见 `credential-vault.md`）。

## 2. 不变量

1. `isDefault === true` 的记录**有且最多一条**；设为默认必须在同一事务里取消其它条。
2. `id` 不可变；改名/改地址不改变 `id`（否则会丢凭据）。
3. `endpoint` 规范化规则：补协议（默认 `https://`）、去尾斜杠、保留端口、拒绝带路径/查询串的地址（路径只允许通过 `entrance` 表达）。
4. 删除服务器 → 同事务删除其全部凭据 + 该服务器的查询缓存分区。

## 3. 启动路由

```ts
type Entry =
  | { kind: 'servers-empty' }        // 无服务器 → 全部面板总览（空态）
  | { kind: 'servers-list' }         // 有服务器但无默认 → 全部面板总览
  | { kind: 'dashboard'; serverId: string };  // 有默认 → 单机概览

function resolveEntry(records: ServerRecord[]): Entry;
```

纯函数，先写单测（AC-01.1 / AC-01.2 / AC-01.3）。

默认服务器的记录即使离线也直接进入单机框架，并展示离线错误卡（不退回列表）——与 PRD §4.1「离线卡片可进入查看上次错误」一致。

## 4. 存储

- 元数据：`expo-sqlite`（表 `servers`），迁移脚本入库。
- 凭据：`expo-secure-store`，见下。
- 读写在 `ServerRegistry` 仓储层串行化，避免"设为默认"并发写坏唯一性。

## 5. 列表页派生数据

`online/offline` 不落库，由在线探测（30s）在内存里维护；进入列表时对全部服务器并发探测一次，有 8s 超时。

卡片离线态展示：置灰 + "无法连接 · 最后在线 {{lastSeenAt}}" + `lastError` 摘要。
