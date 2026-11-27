# contracts/ — 契约总则

本目录是 **App 与 1Panel 之间、以及 App 内部各垂直切片之间的唯一事实来源**。
实现与契约不一致时，改实现；契约要变，先改这里，再改代码，并在 PR 里引用本节。

## 1. 上游基线

- 仓库：`1Panel-dev/1Panel`（GPL-3.0）
- 分支 / 版本：`dev-v2`，以 **`v2.5.1`** 为契约基线
- 基址：业务 `/api/v2/**`，核心 `/api/v2/core/**`
- **面板 API 不是稳定的公开 API**。App 必须能拿到面板版本，并对未知小版本给出中文降级提示，而不是崩溃或静默错算。

> GPL-3.0 提示：本目录只描述字段语义与调用方式，不得把上游 Go 源码整段复制进本仓库。

## 2. 状态标记

每个端点/字段后可能带以下标记，含义固定：

| 标记 | 含义 |
|---|---|
| ✅ | 已从上游 `dev-v2` 路由源码核实 |
| 🟡 | 路由已核实，**响应字段名未核实**，用真实面板抓包回填 |
| ⬜ | 尚不存在，由实现方提出后补进契约 |

**未标记 ✅ 的字段一律不得写进已发布的产品逻辑**，只能落在 `TODO(verify)` 分支里。

## 3. 目录

```
contracts/
  api/        auth · monitor · container · compose · app · cron · website
  domain/     errors · status-mapper · thresholds
  local/      server-registry · credential-vault · routes · tokens
```

## 4. 变更流程

1. 改契约 → 2. 在对应文件顶部 `## 变更` 追加一行（日期 / 切片编号 / 一句话）→ 3. 同步 `src/contracts/**` 的 TS 类型 → 4. PR 描述里引用。

## 5. 客户端统一包络（已在 v2.5.1 真实面板验证）

```ts
interface PanelEnvelope<T> {
  code: number;    // 200 = 成功
  message: string;
  data: T;
}
```

**关键：HTTP 状态码恒为 200**，成功/失败只看 body 里的 `code`。

实测（未带凭据时）：

```
HTTP/1.1 200
{"code":401,"message":"用户未登录: 当前会话已过期！","data":null}
```

因此 HTTP 拦截器不能按 4xx/5xx 判错；必须先解析 body 再分流。唯一例外是网络层失败（连接、TLS、超时），那些没有 body。

`code !== 200` → 转 `PanelError`（`domain/errors.md`）。业务层只拿 `data` 或 `PanelError`。

## 6. 已验证环境

`2026-11-27` 对着 owner 提供的 `1Panel v2.5.1`（Ubuntu 24.04）跑通：API-Key 鉴权、`/dashboard/*`、`/containers/*`、`/settings/search`、SSE 日志流。标 ✅ 的字段来自真实响应，不是推断。
