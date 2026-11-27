# 契约 · 设计令牌

源文件：`docs/design/tokens.json`（v1.0.0）
生成物：`src/core/theme/tokens.generated.ts`（入库，CI 校验可复现）
管线：`scripts/build-tokens.mjs`

## 变更

- 2026-11-27 / T02 / 初版：别名表、非 DTCG 节点处理、平台换算、缺口清单

---

## 1. 内部 ID 别名（必须先归一）

原型里泄漏了 OpenDesign 内部 ID。**不要修改 pm-bot 的原始文件**，在管线里按下表归一：

| 内部 ID | 语义键 | 出现位置 | 次数 |
|---|---|---|---|
| `bg.heroGradient` | `bg.canvas` | 9 个 screen 的 `shell.backgroundToken` | 9 |
| `bg.pillGlass` | `bg.pillGlass` | `03-dashboard` 服务器切换胶囊 | 1 |
| `spacing.3` | `spacing.cardGap`（= `spacing.3` = 12） | `01`/`03`/`08` 列表 `gapToken` | 3 |
| `spacing.4` | `spacing.cardPadding`（= `spacing.4` = 16） | `01` 卡片 `paddingToken` | 1 |

管线遇到表外未知 ID 必须**报错退出**，不得静默 fallback——否则深色模式会在无人察觉时退化。

## 2. 非 DTCG 节点

以下分组没有 `$value`/`$type`，标准 DTCG 解析会跳过：

- `typography.scale.*`（`fontSize/lineHeight/fontWeight/letterSpacing`）
- `typography.fontFamily.*`（有 `$value`，正常）
- `layout.*`（纯数值，非令牌，建议作为 `layoutConfig` 输出）
- `components.*`（Tab 定义与阈值，建议作为 `appConfig` 输出）

处理方式（二选一，**已选 A**）：
- **A（采用）**：管线按"裸值节点"读取，输出为 `theme.typography` / `layoutConfig` / `appConfig` 三段，不改 pm-bot 文件。
- B：pm-bot 把三者改成 `$value`/`$type` 或移入 `$extensions`。留作二期清理。

## 3. 语义键与主题

`color.semantic.light` 与 `.dark` 各有 40 个键，键名完全对齐（已校验差集为空）。
代码里只用裸键（`bg.surface`、`text.muted`…），由 `ThemeProvider` 按当前模式取 light/dark，**禁止**在业务代码写 `light.bg.surface`。

## 4. 平台换算规则

| 令牌 | 原值 | 换算 |
|---|---|---|
| `letterSpacing` | `"-0.03em"` | `parseFloat × fontSize`（px 数值） |
| `fontWeight` | `650` | iOS 保留；Android 归一到 `600`（或引入变量字体后保留） |
| `elevation.*` | CSS shadow 字符串 | 解析成 `{shadowColor, shadowOffset:{w,h}, shadowOpacity, shadowRadius}`；Android 另给 `elevation` 整数 |
| `motion.duration.*` | `"160ms"` | 整数毫秒 |
| `motion.easing.standard` | `cubic-bezier(...)` | 转 reanimated `Easing.bezier(...)` 参数 |
| `bg.*Glass` | `rgba(...)` + design-spec 的 `blur(18px)` | 颜色取令牌；**模糊半径需新增令牌**（见 §5） |
| `radius.pill` | `999` | 直接用；大于高度即胶囊 |

## 5. 缺口令牌（建议补充，T02 落地时以常量先行）

| 用途 | 建议键 | 建议值 |
|---|---|---|
| Tab 栏/胶囊毛玻璃模糊 | `blur.glass` | `18` |
| 禁用态整体透明度 | `opacity.disabled` | `0.45` |
| 骨架屏底色 | `skeleton.base` / `skeleton.shine` | `bg.surfaceSoft` / `bg.segmentedTrack` |
| 描边宽度 | `borderWidth.hairline` / `.focus` | `1` / `2` |
| 图标尺寸档 | `icon.sm/md/lg` | `16` / `20` / `24` |
| 图表轴与网格 | `chart.axis` / `chart.grid` | 浅 `text.subtle`/`border.hairline`；深 `text.subtle`/`border.hairline` |
| 列表行按压覆盖 | `overlay.pressed` | 浅 `rgba(0,0,0,0.04)`；深 `rgba(255,255,255,0.06)` |
| 弹窗层级 | `z.modal` / `z.toast` | `100` / `200` |

## 6. 可访问性

`text.subtle` 在浅色底（`bg.canvas` / `bg.surface`）上目测低于 AA 正文 4.5:1，且被用于占位符与时间戳。
T02 必须跑一次自动对比度校验（WCAG 2.1 AA）：

- 正文/辅助文字：≥ 4.5:1
- 大字号（≥18pt 或 14pt 加粗）与图标/控件边界：≥ 3:1

不达标的键出一份清单给 pm-bot，**不要自行改色值**。

## 7. 输出契约（TS）

```ts
export type ThemeMode = 'system' | 'light' | 'dark';
export type SemanticKey = keyof typeof lightSemantic;   // 40 键
export interface Theme {
  mode: 'light' | 'dark';
  color: Record<SemanticKey, string>;
  typography: Record<TypeScaleKey, TextStyleSpec>;
  spacing: Record<SpacingKey, number>;
  radius: Record<RadiusKey, number>;
  elevation: Record<'card'|'floating'|'tabBar', ShadowSpec>;
  motion: { duration: Record<'fast'|'page'|'gauge', number>; easing: [number,number,number,number]; pressScale: number };
  blur: { glass: number };
}
```
