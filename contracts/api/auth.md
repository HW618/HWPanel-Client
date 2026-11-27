# 契约 · 鉴权与会话

服务：`/api/v2/core/auth`
源码位置：`core/router/ro_base.go`、`core/app/auth/api_auth.go`

## 变更

- 2026-11-27 / T05 / 初版，端点已核实，响应字段待回填

## 1. 端点

| 标记 | 方法 | 路径 | 用途 |
|---|---|---|---|
| ✅ | GET | `/auth/setting` | 登录策略：验证码是否开启、MFA 是否开启、密码策略。**用于预渲染，不要靠撞错** |
| ✅ | GET | `/auth/captcha` | 取图形验证码（图片 + 标识），带刷新 |
| ✅ | POST | `/auth/login` | 用户名密码登录（按需带验证码/入口） |
| ✅ | POST | `/auth/mfalogin` | MFA 登录（TOTP 6 位） |
| ✅ | POST | `/auth/mfa` | 已登录会话内做 MFA 校验 |
| ✅ | GET | `/auth/current` | 当前登录用户 |
| ✅ | POST | `/auth/logout` | 登出 |

## 2. 两种认证模式

### 2.1 API-Key（无会话）

请求头（名称已从上游核实，**落地前用真实面板复核一次**）：

```
1Panel-Token            : <API-Key>     ← 上游源码中的 token 头名，落地前用真实面板复核
1Panel-Timestamp        : <unix 秒>
1Panel-Signature-Version: <签名版本头>
```

- 签名：HMAC（`crypto/hmac` + `sha256`）
- 时间窗口：由面板的 `ApiKeyValidityTime` 决定，超出即 `ErrApiConfigKeyTimeInvalid`
- IP 白名单：超出即 `ErrApiConfigIPInvalid`
- 面板未启用 API 接口：`ErrApiConfigStatusInvalid`

> 客户端要求：设备时钟偏移导致的失败必须**单独提示"检查本机时间同步"**，不能并入"密钥错误"。

### 2.2 用户名密码（会话）

```
POST /auth/login  → 会话凭据（Cookie/Token，字段名待回填 🟡）
      ↓ 需要图形验证码时
GET /auth/captcha → POST /auth/login（携带验证码）
      ↓ 需要 MFA 时
POST /auth/mfalogin（6 位）
```

- 会话凭据**只能存 Keychain/Keystore**，且与服务器 ID 绑定。
- 401 → 触发"登录会话已过期"流程，一次重登，不自动重试第二次。

## 3. 安全入口（Entrance）

⬜ **未决 U1**：入口值与 `/api/v2` 的拼接方式（路径前缀 / Cookie / 请求头）尚未核实。

契约要求（不依赖 U1 的实现细节）：

- 每个服务器配置持有 `entrance?: string`，规范化（去首尾斜杠、去空白）。
- 入口错误必须可识别，并映射为 `kind: 'entrance'`，文案引导用户补填"安全入口"字段。
- 一旦 U1 确认，只允许改 `PanelTransport` 的 URL 拼装，**不允许**把入口逻辑散落到各 feature。

## 4. 客户端类型

```ts
export type AuthMode = 'api-key' | 'password';

export interface LoginPolicy {          // 🟡 字段名待回填
  captchaEnabled: boolean;
  mfaEnabled: boolean;
  passwordPolicy?: { minLength?: number };
}

export interface ConnectTestResult {
  ok: boolean;
  panelVersion?: string;
  hostname?: string;
  error?: PanelError;
}
```

## 5. 必测错误场景（AC-02）

| 场景 | kind | 文案要点 |
|---|---|---|
| 网络不可达/超时 | `timeout` / `network` | 检查网络与该地址端口 |
| 自签名证书且开关关闭 | `tls` | 提示开启"允许自签名证书"并显示风险 |
| 入口缺失/错误 | `entrance` | 引导补填安全入口 |
| API-Key 被拒 | `auth` + `ErrApiConfigKeyInvalid` | 检查密钥、启用状态 |
| IP 不在白名单 | `forbidden-ip` | 检查面板 API 白名单 |
| 时间戳过期 | `clock-skew` | 检查本机时间同步 |
| 需要验证码 | `captcha` | 弹窗取码，可刷新 |
| 需要 MFA | `mfa` | 6 位动态码弹窗 |

## 6. 禁止

- 不得把密码、API-Key、Cookie、Token 写进任何日志/崩溃上报/Metro console。
- 不得在未开启"允许自签名"时静默接受坏证书——tls 错误必须冒到 UI。
