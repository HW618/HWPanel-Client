# 契约 · 统一错误模型

## 变更

- 2026-11-27 / T05 起 / 初版

## 1. 形状

```ts
export type PanelErrorKind =
  | 'network' | 'timeout' | 'tls' | 'entrance' | 'auth'
  | 'captcha' | 'mfa' | 'forbidden-ip' | 'clock-skew'
  | 'version' | 'business' | 'unknown';

export interface PanelError {
  kind: PanelErrorKind;
  panelCode?: string;   // 上游业务错误 key
  status?: number;      // HTTP 状态
  message: string;      // 已完成中文化的用户可读文案
  retryable: boolean;
}
```

传输层负责把上游包络、HTTP 状态、网络异常**收敛成上面的结构**；业务层不再判断 `code === 200`。

## 2. 映射表

| 触发 | kind | 中文文案（要点） | 动作 |
|---|---|---|---|
| DNS/连接失败 | `network` | 无法连接到该面板，请检查地址与端口 | 重试 |
| 请求超时 | `timeout` | 连接超时，请检查网络或服务器状态 | 重试 |
| TLS 证书错误 | `tls` | 证书不受信任；如为自签名，请开启「允许自签名证书」 | 去设置 / 重试 |
| `ErrApiConfigStatusInvalid` | `auth` | 面板未启用 API 接口 | 去 Web 端启用 |
| `ErrApiConfigKeyInvalid` | `auth` | API-Key 无效 | 编辑密钥 |
| `ErrApiConfigKeyTimeInvalid` | `clock-skew` | 请求时间戳已过期，请检查本机时间同步 | 重试 |
| `ErrApiConfigIPInvalid` | `forbidden-ip` | 当前设备 IP 不在面板白名单 | 去 Web 端放行 |
| 安全入口校验失败 | `entrance` | 安全入口不正确，请补充或修改入口路径 | 编辑连接 |
| 需要图形验证码 | `captcha` | —（弹窗） | 输入验证码 |
| 需要 MFA | `mfa` | —（弹窗） | 输入 6 位动态码 |
| 会话 401 | `auth` | 登录会话已过期，请重新验证 | 重新登录 |
| 5xx | `business` | 面板服务异常（附带上游 message） | 重试 |
| 版本不兼容 | `version` | 当前面板版本未经验证，部分功能可能不可用 | 继续 / 帮助 |

上游 `message` 一律**追加**在我们自己的中文文案之后，不直接顶替。

## 3. 展示规则

1. `captcha` / `mfa` 不走错误页，走弹窗。
2. 其余 kind 按 design-spec §4 的 Error 态渲染（图标 + 原因 + 动作按钮）。
3. 列表页的单条失败（例如某容器已被外部删除）不得整页报错，用行内提示。
4. **禁止**把 `status`、`panelCode`、堆栈直接展示给用户；调试信息只在开发构建的日志里。

## 4. 脱敏

日志与上报前必须过 `redact()`：
- 抹掉 `authorization`、`cookie`、API-Key 头、`1Panel-Signature*`、请求体中的 `password`/`apiKey`/`token` 字段；
- URL query 里的 `entrance` 也需掩码。
