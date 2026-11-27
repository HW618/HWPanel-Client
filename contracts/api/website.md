# 契约 · 网站（一期只读）

服务：`/api/v2/websites`（`agent/router/ro_website.go`、`ro_website_ssl.go`）

## 变更

- 2026-11-27 / T12 / 初版，端点已核实，响应字段待回填

## 1. 端点（仅读）

| 标记 | 方法 | 路径 | 用途 |
|---|---|---|---|
| ✅ | POST | `/websites/search` | 网站分页列表 |
| ✅ | GET | `/websites/list` | 网站全量列表 |
| ✅ | GET | `/websites/:id` | 网站详情 |
| ✅ | GET | `/websites/domains/:websiteId` | 绑定域名 |
| ✅ | POST | `/websites/ssl/search` | SSL 列表（用于到期扫描） |
| ✅ | GET | `/websites/ssl/website/:websiteId` | 某站点的证书 |

**明确禁止调用**：`POST /websites`、`/operate`、`/update`、`/del`、`/batch/*`、`/config/*`、`/https`（写）、`/rewrite/*`（写）、`/dir/*`（写）、`/proxies/*`（写）、`/ssl` 下所有写与申请端点。

> 只读不是"UI 不放入口"就够了：客户端 API 层应当**不存在**这些方法，从代码结构上杜绝。

## 2. 客户端类型

```ts
export type SiteState = 'running' | 'stopped';
export type SslState = 'ok' | 'expiring' | 'expired' | 'none';

export interface WebsiteSummary {
  id: string; primaryDomain: string; state: SiteState;
  typeLabel: string;            // 静态 / 反向代理 / PHP / 运行环境
  ssl: { state: SslState; daysLeft?: number };
}

export interface WebsiteDetail extends WebsiteSummary {
  domains: string[];
  port?: string;
  rootOrUpstream?: string;      // 静态站点根目录 或 反代上游
  sslDetail?: { issuer: string; notBefore: string; notAfter: string; daysLeft: number };
}
```

## 3. 规则

1. SSL 梯度统一由 `domain/status-mapper.md` 的 `sslTone(daysLeft)` 计算：`>30` 绿、`1–30` 琥珀、`已过期` 红、`未开启` 灰。
2. 列表顶部固定提示条："当前版本支持网站运行状态与 SSL 证书巡检，配置与建站功能将于后续版本提供"。
3. 详情页底部固定脚注："如需修改站点配置或续签证书，请前往 1Panel Web 端操作"。
4. 「证书预警数」= 所有站点中 `daysLeft <= 30 || expired` 的计数，供 Tab 5 徽标使用。

## 4. 验收

AC-07.1：页面不得出现新建、编辑、删除、启停任何入口；DOM/可访问性树里也不得存在这些按钮。
