# 契约 · 计划任务

服务：`/api/v2/cronjobs`（`agent/router/ro_cronjob.go`）

## 变更

- 2026-11-27 / T11 / 初版，端点已核实，响应字段待回填

## 1. 端点

| 标记 | 方法 | 路径 | 用途 |
|---|---|---|---|
| ✅ | POST | `/cronjobs/search` | 任务列表 |
| ✅ | GET | `/cronjobs/capabilities` | 面板能力（哪些任务类型可用） |
| ✅ | POST | `/cronjobs/load/info` | 任务详情 |
| ✅ | POST | `/cronjobs/status` | 启用 / 禁用 |
| ✅ | POST | `/cronjobs/handle` | 立即执行 |
| ✅ | POST | `/cronjobs/stop` | 停止运行中的任务 |
| ✅ | POST | `/cronjobs/del` | 删除 |
| ✅ | POST | `/cronjobs/search/records` | 执行历史 |
| ✅ | POST | `/cronjobs/records/log` | 单次执行日志 |
| ✅ | POST | `/cronjobs/next` | 下次执行时间 |

未列入的（新建、更新、导入导出、分组、清理记录）**一期禁止调用**：一期不支持新建/编辑任务。

## 2. 客户端类型

```ts
export type CronState = 'enabled' | 'disabled' | 'running';
export type CronRunStatus = 'success' | 'failed' | 'running' | 'never';

export interface CronTask {
  id: string; name: string;
  typeLabel: string;          // Shell / 网站备份 / 数据库备份 / 目录备份 / URL 访问
  cronExpr: string;           // 原样展示
  humanSchedule: string;      // 客户端生成，见 §3
  enabled: boolean; running: boolean;
  lastRunAt?: string; lastStatus: CronRunStatus;
}

export interface CronRecord {
  id: string; startedAt: string; durationMs: number; status: CronRunStatus;
}
```

## 3. 人类可读周期（`humanSchedule`）

上游只给 cron 表达式，**中文描述由客户端生成**（`src/core/cron/humanize.ts`）：

- 覆盖常见形态：`* * * * *`、`0 3 * * *`、`*/5 * * * *`、`0 3 * * 1`、`0 0 1 * *` 等；
- 无法解析时**回退为表达式本身**，不要显示"未知"；
- 与 `cronjobs/next` 的"下次执行时间"组合展示，二者不一致时以面板时间为准。

## 4. 规则

1. 启停开关即时生效：乐观切换 + 失败回滚 + Toast；任务运行中时开关置灰并展示「停止」。
2. 立即执行后：跳转或滑出执行历史，并开始对**该次记录**轮询日志，直到状态离开 `running`。
3. 删除：强提示弹窗（任务名 + "定时调度与关联执行记录将被清除且不可恢复"）。
4. 日志区复用 `LogStreamBox`，默认 200 行，支持复制；运行中自动追加。
5. 历史列表按开始时间倒序，点击某条展开其日志；切换记录要取消上一条的轮询。
