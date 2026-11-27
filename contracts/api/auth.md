# 契约 · 鉴权与会话

服务：`/api/v2/core/auth`
源码依据：`core/router/ro_base.go`、`core/app/auth/api_auth.go`、`frontend/src/api/index.ts`

## 变更

- 2026-11-27 / T05 / 初版
- 2026-11-27 / T05 / **U1 已解**：入口不是 URL 前缀，是登录请求头；补会话语义（Cookie + CSRF）；U4 结论更新

## 1. 基址

- `baseURL = /api/v2`（前端 `.env.production` / `.env.development` 均为该值，已核实）
- 核心接口在 `/api/v2/core/**`，业务在 `/api/v2/**`
- **入口不进 URL**（见 §4）

## 2. 端点

| 标记 | 方法 | 路径 | 用途 |
|---|---|---|---|
| ✅ | GET | `/core/auth/setting` | 登录策略：验证码/MFA 是否开启，用于预渲染 |
| ✅ | GET | `/core/auth/captcha` | 图形验证码（图片 + 标识） |
| ✅ | POST | `/core/auth/login` | 用户名密码登录 |
| ✅ | POST | `/core/auth/mfalogin` | MFA 登录（6 位 TOTP） |
| ✅ | POST | `/core/auth/mfa` | 已登录会话内 MFA |
| ✅ | GET | `/core/auth/current` | 当前用户 |
| ✅ | POST | `/core/auth/logout` | 登出 |

## 3. 两种认证模式

### 3.1 API-Key（无会话）

```
1Panel-Token             : <API-Key>     ← 上游源码中的 token 头名，落地前用真实面板复核
1Panel-Timestamp         : <unix 秒>
1Panel-Signature-Version : <签名版本>
```

- 签名：HMAC-SHA256；时间窗口由面板 `ApiKeyValidityTime` 决定。
- 失败 key：`ErrApiConfigStatusInvalid`（未启用 API 接口）、`ErrApiConfigKeyTimeInvalid`、`ErrApiConfigKeyInvalid`、`ErrApiConfigIPInvalid`。
- API-Key 模式**不走 Cookie/CSRF**（无会话）。

### 3.2 用户名密码（会话）

```
POST /core/auth/login      → Set-Cookie（会话）
POST /core/auth/mfalogin   → 完成两步验证
```

会话是 **Cookie 会话**（前端 `withCredentials: true` 已核实），因此客户端必须：

1. **每个服务器一个独立 Cookie 罐**（RN 的 `fetch` 不自动持久化 Cookie，必须由 `PanelTransport` 实现）。
2. 非 GET/HEAD/OPTIONS/TRACE 请求，从 Cookie 读 `pcsrftoken`，放进 `X-CSRF-Token` 头（前端行为）——**漏了会被 CSRF 中间件拒绝**。
3. 所有请求带 `Accept-Language`（我们固定 `zh-CN`）。

## 4. 安全入口（Entrance）— U1 已解

入口**不是** URL 路径前缀，也不是普通 Cookie 依赖，而是：

> 在登录类请求上携带请求头 `EntranceCode: base64(entrance)`。

前端只在以下请求上设置该头（已核实）：

```
/core/auth/login  /core/auth/mfalogin
/core/auth/passkey/begin  /core/auth/passkey/finish
/core/auth/oidc/begin     /core/auth/oidc/finish
/core/auth/saml2/begin    /core/auth/saml2/finish
```

契约要求：

- 服务器配置持有 `entrance?: string`，规范化（去首尾斜杠与空白）。
- 只在上述登录类请求上附加 `EntranceCode`；**不要**给所有请求都加。
- 入口错误 → `kind: 'entrance'`，文案引导补填。
- 实际面板若与源码行为不一致（例如 v2.5.x 某小版本改成 Cookie 校验），只改 `PanelTransport` 的 header 注入逻辑，业务层不动。

## 5. 版本探测（U4）

`GET /dashboard/base/os` 只返回 `os / platform / platformFamily / kernelArch / kernelVersion / diskSize`，**不含面板版本**（已核实接口定义）。

版本号候选：`POST /settings/search`（系统设置）或 `/core/settings/**` 下的某个聚合接口。**待真实面板确认后回填**，确认前：
- 版本探测失败不得阻塞连接；
- 拿不到版本时跳过兼容提示，不要显示"未知版本"这类噪音。

## 6. 客户端类型

```ts
export type AuthMode = 'api-key' | 'password';

export interface LoginPolicy {          // 🟡 字段名待回填
  captchaEnabled: boolean;
  mfaEnabled: boolean;
}

export interface ConnectTestResult {
  ok: boolean;
  panelVersion?: string;
  hostname?: string;
  error?: PanelError;
}

export interface Session {
  cookies: Record<string, string>;   // 由 PanelTransport 的 Cookie 罐维护
  csrfToken?: string;                // = cookies['pcsrftoken']
}
```

## 7. 必测错误场景（AC-02）

| 场景 | kind | 文案要点 |
|---|---|---|
| 网络不可达/超时 | `network` / `timeout` | 检查网络与该地址端口 |
| 自签名证书且开关关闭 | `tls` | 提示开启"允许自签名证书"并显示风险 |
| 入口缺失/错误 | `entrance` | 引导补填安全入口 |
| API-Key 被拒 | `auth` + `ErrApiConfigKeyInvalid` | 检查密钥、启用状态 |
| IP 不在白名单 | `forbidden-ip` | 检查面板 API 白名单 |
| 时间戳过期 | `clock-skew` | 检查本机时间同步 |
| 需要验证码 | `captcha` | 弹窗取码，可刷新 |
| 需要 MFA | `mfa` | 6 位动态码弹窗 |
| CSRF 失败 | `auth` | 内部刷新 Cookie 后重试一次，仍失败则重新登录 |

## 8. 禁止

- 不得把密码、API-Key、Cookie、Token 写进任何日志/崩溃上报/Metro console。
- 不得在未开启"允许自签名"时静默接受坏证书。
- 不得把入口拼进 URL——源码行为是请求头。
