# 契约 · 状态映射与色彩语义

所有"上游状态 → 中文标签 → 视觉色"的换算集中在这里，**页面不得自写 if/else**。

## 变更

- 2026-11-27 / T03 / 初版

## 1. 色语义档位

| 档 | 背景 / 文字 | 用途 |
|---|---|---|
| `success` | `status.successBg` / `status.successText` | 运行中、在线、成功、SSL 正常 |
| `warning` | `status.warningBg` / `status.warningText` | 部分运行、执行中、SSL 临期、预警 |
| `danger` | `status.dangerBg` / `status.dangerText` | 异常、失败、连接中断、SSL 过期 |
| `neutral` | `bg.surfaceSoft` / `text.muted` | 已停止、已禁用、未启用 HTTPS |
| `brand` | `brand.soft` / `brand.onSoft` | 默认服务器、可升级 |

## 2. 映射

### 服务器
`online → success / "在线"`；`offline → danger / "无法连接"`；`default → brand / "默认服务器"`

### 容器
| 上游状态 | 中文 | 档 |
|---|---|---|
| running | 运行中 | success |
| restarting | 重启中 | warning |
| exited / stopped / created / paused | 已停止 | neutral |
| dead / removing | 异常 | danger |

筛选口径：`running` 取 `running`；`stopped` 取 `exited/stopped/created/paused`；`abnormal` 取 `dead/removing` 及上游其它非上述状态。

> 上游新增未知状态时归入 `abnormal` 并在开发构建报警，不得白屏。

### 编排
`running → 运行中 / success`；`partial → 部分运行 / warning`；`stopped → 已停止 / neutral`

### 应用实例
`running → 运行中 / success`；`stopped → 已停止 / neutral`；`upgradable → 可升级 / brand`

### 计划任务
`enabled → 已启用 / success`；`disabled → 已禁用 / neutral`；`running → 执行中 / warning`；
执行结果：`success → 成功 / success`；`failed → 失败 / danger`；`running → 执行中 / warning`；`never → 从未执行 / neutral`

### 网站 / SSL
`running → 运行中 / success`；`stopped → 已停止 / neutral`

```ts
sslTone(daysLeft, httpsEnabled):
  !httpsEnabled      → { neutral, '未开启 HTTPS' }
  daysLeft <= 0      → { danger,  '已过期' }
  daysLeft <= 30     → { warning, `${daysLeft} 天` }
  else               → { success, `${daysLeft} 天` }
```

## 3. 使用方式

```ts
// src/core/status
export function containerTone(s: ContainerState): { tone: Tone; label: string };
export function composeTone(s: ComposeState): ...;
export function cronTone(s: CronRunStatus): ...;
export function sslTone(daysLeft: number, httpsEnabled: boolean): ...;
```

所有函数返回**标签与档位**，组件只负责按档位取令牌，不判断业务。
