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

## 5. 客户端统一包络

所有 REST 响应按上游包络解析：

```ts
interface PanelEnvelope<T> {
  code: number;    // 上游约定 200 为成功 🟡 以真实响应为准
  message: string;
  data: T;
}
```

`code !== 200`（或等价成功判定）→ 转成 `PanelError`，见 `domain/errors.md`。
**业务层永远拿不到原始包络**，只拿 `data` 或抛 `PanelError`。
