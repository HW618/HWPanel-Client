# 契约 · 容器编排（Compose）

服务：`/api/v2/containers/compose`（`agent/router/ro_container.go`）

## 变更

- 2026-11-27 / T09 / 初版；日志与 YAML 读取入口未决（U2）

## 1. 端点

| 标记 | 方法 | 路径 | 用途 |
|---|---|---|---|
| ✅ | POST | `/containers/compose/search` | 编排列表 |
| ✅ | POST | `/containers/compose/operate` | 启动 / 停止 / 重启 / 删除 / 重建 |
| ✅ | POST | `/containers/compose/update` | 保存 YAML（可选触发重建） |
| ✅ | POST | `/containers/compose/env` | 读取编排环境变量 |
| ✅ | POST | `/containers/compose/test` | 服务端 YAML 校验（可选，客户端已先校验） |
| ✅ | POST | `/containers/compose/clean/log` | 清理编排日志 |
| 🟡 | POST | `/containers/compose/env` | 读取编排文件与环境变量（请求体 `{path}`）；**已核实**是前端取编排内容的入口，返回形态待回填 |
| ✅ | GET | `/containers/search/log?compose=<path>` | **编排日志 = 同一个 SSE 端点**，把 `container=` 换成 `compose=`（传 docker-compose 文件绝对路径）。U2 已解 |

未列入的（新建编排、模板、pin）**一期禁止调用**：一期只支持查看与修改已有编排。

## 2. 客户端类型

```ts
export type ComposeState = 'running' | 'partial' | 'stopped';
export type ComposeAction = 'start' | 'stop' | 'restart' | 'rebuild' | 'delete';

export interface ComposeSummary {
  name: string; running: number; total: number;
  state: ComposeState; updatedAt: string;
}

export interface ComposeDetail extends ComposeSummary {
  services: { name: string; containerId: string; state: ContainerState }[];
  envs: { key: string; value: string }[];
  yaml?: string;
}
```

## 3. YAML 编辑规则（AC-04.3）

保存前**客户端**依次校验，任一失败即拦截并定位行号：

1. 非空；
2. 不含 Tab 缩进（警告，允许继续但提示）；
3. `yaml` 包可解析；
4. 顶层含 `services`。

保存成功后提供两个动作：
- 「仅保存」→ `compose/update`（不重建）
- 「保存并重建」→ 先 `compose/update`，再 `compose/operate(action=rebuild)`，且重建前弹**警告级**二次确认（`确认重建`）。

服务端校验失败时，把返回的错误信息原样展示在错误条，**不要吞掉**。

## 4. 规则

1. 编辑态离开页面/返回时，若内容已修改，弹"放弃修改？"确认；不得静默丢弃。
2. 删除编排：强提示弹窗，展示编排名 + 关联容器数 + "将停止并移除该编排管理的所有容器"，危险红按钮。
3. 重建：警告色，文案含"业务会短暂中断"。
4. 编排下子容器点击可跳转容器详情（`/tabs/containers/container/:id`），导航上下文保留在 Tab 2 的 Stack 内。

## 5. 已核实与未决

**已核实（来自上游前端）：**

1. **一个编排可能对应多个 YAML 文件**——`ComposeInfo.path` 是逗号分隔的多路径，前端按 `path.split(',')` 生成选择器。U2 的 YAML 读取必须支持多文件，不能假设只有一个 `docker-compose.yml`。
2. `POST /containers/compose/env` 以 `{path}` 为参数，是前端读取编排内容的入口。
3. `POST /containers/compose/update` 前端超时是 **10 分钟**——保存并重建是长请求，客户端超时不得用默认 15s，必须单独设。

4. **`POST /containers/compose/search` 实测返回**（`{page,pageSize}` 分页）：

```json
{"total":3,"items":[{
  "name":"3x-ui","createdAt":"...","createdBy":"1Panel",
  "containerCount":1,"runningCount":1,
  "configFile":"/opt/1panel/docker/compose/3x-ui/docker-compose.yml",
  "workdir":"/opt/1panel/docker/compose/3x-ui",
  "composeFileExists":true,"isPinned":false,
  "path":"/opt/1panel/docker/compose/3x-ui/docker-compose.yml",
  "containers":[{"containerID":"...","name":"3x-ui","createTime":"...","state":"running","ports":[]}],
  "env":""
}]}
```

注意：`path` 与 `configFile` 在实测样本里是**单个文件**；`path` 逗号多文件的情况仍需在别的面板上确认，客户端按"可能多文件"写但不假设一定有多个。

5. **U2 已解**：编排日志走 `GET /containers/search/log?compose=<path>` 的 SSE，与容器日志同一个端点、同一套 `Accept: text/event-stream` 与 base64 载荷。见 `container.md` §4。
