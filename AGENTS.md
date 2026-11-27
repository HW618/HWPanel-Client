# HWPanel Client — 工程约定

面向在本仓库工作的 agent。人类需求见 `docs/prd.md`，架构见 `docs/architecture.md`，
切片见 `docs/tasks.md`，**接口事实以 `contracts/**` 为准**。

## 事实顺序

1. `contracts/**` — 接口与类型
2. `docs/architecture.md` — 分层与决策
3. `docs/prd.md` — 业务规则与验收
4. `docs/design/**` — 视觉源（`tokens.json` 是唯一颜色/尺寸来源）

冲突时按上面顺序取胜；发现冲突先提，不要自行改高优先级文件。

## 硬规则

- **只做一期范围**。表外能力（终端、文件、AI、网站写操作、新建容器/编排/任务、私有仓库、主从、生物识别、推送、多语言）不实现、不放入口、不留死分支。
- **不硬编码视觉值**：颜色、间距、圆角、字号、阴影、动效只能来自 `src/core/theme`。
- **不硬编码中文文案**：全部走 `src/core/i18n`。
- **页面不直连 transport**：只经 `src/features/*/api`。
- **写操作按钮必须 Loading 防抖**，高危操作必须经 `useDangerConfirm()`。
- **凭据只进 SecureStore**，任何日志/上报前过 `redact()`。
- **`TODO(verify)`**：契约里标 🟡/⬜ 的字段，实现前先用真实面板确认；不要按猜测发布界面。

## 提交

- 分支 `feat/<Txx-slug>`；一个切片一个 PR。
- PR 描述含 `Refs: Txx`、`AC-xx`、契约变更说明。
- 不要提交 `*.jks`、`*.keystore`、`*.mobileprovision`、`.env*`。

## 命令（T01 落地后生效）

```
npm run typecheck
npm run lint
npm run test
npm run tokens:build   # 重新生成主题令牌
npm run tokens:check   # CI：生成物是否可复现
```
