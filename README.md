# HWPanel Client

1Panel v2 的 iOS / Android 客户端（Expo SDK 54 + React Native 0.81 + TypeScript strict）。

- 需求：`docs/prd.md`
- 架构：`docs/architecture.md`
- 任务切片：`docs/tasks.md`
- 接口契约：`contracts/**`（唯一事实来源）
- 工程约定：`AGENTS.md`

## 环境

- Node 20+（CI 使用 22）
- iOS：Xcode + CocoaPods
- Android：Android SDK（platform 36）、JDK 17

`modules/hwp-transport` 是本地 Expo Module（原生代码），因此 **Expo Go 无法加载**；
请使用 `npx expo run:ios` / `npx expo run:android` 或 EAS Development Build。

## 命令

```sh
npm install
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint（含禁裸中文文案规则）
npm run test        # jest
npm run format      # Prettier
npm run ios         # expo run:ios
npm run android     # expo run:android
npm run tokens:build # TODO(T02) 占位
npm run tokens:check # TODO(T02) 占位
```

## 目录

```
app/                  Expo Router 路由（5 Tab + 各 Tab 独立 Stack）
src/core/             主题、i18n、设计系统、transport、query 等横切能力
src/features/         按业务切片组织的 api / hooks / components / screens
modules/hwp-transport 本地 Expo Module：按实例放宽 TLS 的 HTTP 传输
```
