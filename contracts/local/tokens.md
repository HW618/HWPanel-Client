# 契约 · 设计令牌

源文件：`docs/design/tokens.json`（**v1.0.1 严格 DTCG**）
生成物：`src/core/theme/tokens.generated.ts`（入库，CI 校验可复现）
管线：`scripts/build-tokens.mjs`

## 变更

- 2026-11-27 / T02 / 初版
- 2026-11-27 / T02 / **对齐 tokens v1.0.1**：pm-bot 已修复引用断裂、补齐 DTCG 与缺口令牌、收敛字重、通过对比度门禁。本文随之改写；旧版的别名表降级为防御性校验。

---

## 1. 结构（已核实）

```
color · typography · spacing · radius · borderWidth · iconSize
blur · opacity · elevation · zIndex · motion      ← 全部标准 $type + $value
$extensions.hwpanel = { meta, layout, components } ← 非令牌的产品配置
```

- 已用脚本核验：**184 个叶子令牌，0 个结构错误**（无裸值、无缺 `$type`）。
- `$extensions.hwpanel` 里的 `layout` / `components`（Tab 定义、阈值）**不是令牌**，管线单独输出为 `layoutConfig` / `appConfig`，不要混进 theme。

## 2. 引用完整性（防御性校验，保留）

v1.0.1 之前有 4 个 OpenDesign 内部 ID 泄漏在原型里。现已全部修复（重跑审计：**0 断裂引用**）。管线仍需保留这张别名表作为**兜底**，防止将来重新导出设计稿时再次带出：

| 内部 ID | 语义键 | 历史出现位置 |
|---|---|---|
| `bg.heroGradient` | `bg.canvas` | 9 个 screen 的 `shell.backgroundToken` |
| `bg.pillGlass` | `bg.pillGlass` | `03-dashboard` 胶囊 |
| `spacing.3` | `spacing.cardGap` | `01`/`03`/`08` 列表间距 |
| `spacing.4` | `spacing.cardPadding` | `01` 卡片内边距 |

**硬规则不变**：遇到表外未知 ID，管线报错退出，不得静默 fallback。

## 3. 语义色

`color.semantic.light` 与 `.dark` 键名完全对齐（已校验差集为空）。
代码只用裸键（`bg.surface`、`text.muted`…），由 `ThemeProvider` 按当前模式取，**禁止**在业务代码写 `light.bg.surface`。

## 4. 平台换算（RN / Expo）

| 令牌 | v1.0.1 形态 | 换算 |
|---|---|---|
| `typography.scale.*` | `fontSize:"15px"`、`lineHeight:"22px"`、`letterSpacing:"0px"`、`fontWeight:400` | 去 `px` 转数字；`fontWeight` 取 `400/500/600/700`（已无 650） |
| `typography.scale.*.$value.fontFamily` | `"{typography.fontFamily.sans}"` | 解析别名引用后再取字符串 |
| `elevation.*` | `{offsetX,offsetY,blur,spread,color}` + `$extensions.hwpanel.androidElevation` | iOS：`shadowOffset/shadowRadius/shadowColor/shadowOpacity`；Android：`elevation: androidElevation` |
| `motion.duration.*` | `"160ms"` | 整数毫秒 |
| `motion.easing.standard` | `cubic-bezier(...)` | reanimated `Easing.bezier(...)` |
| `blur.tabBar` / `blur.pill` | `"18px"` / `"12px"` | expo-blur `intensity`/`experimentalBlurMethod` 需换算（见 §6） |
| `radius.pill` | 数值 | 直接用 |
| `opacity.disabled` | 数值 | 直接用 |

## 5. 缺口令牌（v1.0.1 已补齐，T02 逐项核对）

`blur`（tabBar / pill）、`opacity`（禁用等）、`borderWidth`、`iconSize`、`zIndex`（modal / toast）、`skeleton`、图表轴与网格、按压叠加色——均已在 tokens.json 中，T02 只需消费，**不要再自造常量**。

## 6. expo-blur 适配（唯一需要实测的点）

design token 给的是高斯模糊半径（px），`expo-blur` 的 `intensity` 是 0–100 的相对强度，两者不是线性等价。
T02 需在真机上定标：`blur.tabBar = 18px` → 一个 `intensity` 值，写进 `src/core/theme/blur.ts` 并注明是实测值，而不是把 18 直接当 intensity。

## 7. 对比度（已核验，T02 只需做回归门禁）

浅/深 × 正文/次级/辅助/占位 在 `bg.surface` 与 `bg.canvas` 上共 16 组，实测全部 ≥ 4.5:1：

| | light surface | light canvas | dark surface | dark canvas |
|---|---|---|---|---|
| `text.primary` | 17.20 | 15.50 | 15.73 | 17.58 |
| `text.secondary` | 11.21 | 10.10 | 11.53 | 12.89 |
| `text.muted` | 6.30 | 5.68 | 6.79 | 7.59 |
| `text.subtle` | 5.20 | **4.69** | 5.44 | 6.08 |

`text.subtle` 浅色 canvas 上 4.69 是余量最小的一组（设计值 `#666D7B`）。T02 的门禁脚本按 4.5 判定；若 pm-bot 后续再调色，以脚本结果为准。

## 8. 输出契约（TS）

```ts
export type ThemeMode = 'system' | 'light' | 'dark';
export type SemanticKey = keyof typeof lightSemantic;

export interface Theme {
  mode: 'light' | 'dark';
  color: Record<SemanticKey, string>;
  typography: Record<TypeScaleKey, TextStyleSpec>;
  spacing: Record<SpacingKey, number>;
  radius: Record<RadiusKey, number>;
  borderWidth: Record<BorderWidthKey, number>;
  iconSize: Record<IconSizeKey, number>;
  blur: Record<'tabBar'|'pill', number>;
  opacity: number;
  elevation: Record<'card'|'floating'|'tabBar', ShadowSpec>;
  motion: { duration: Record<'fast'|'page'|'gauge', number>; easing: [number,number,number,number]; pressScale: number };
  zIndex: Record<'modal'|'toast', number>;
}
```
