# 契约 · 凭据保险库（本地）

源：PRD §4.2、§5.2；AC-02；design-spec §5「安全存储映射」。

## 变更

- 2026-11-27 / T04·T05 / 初版

## 1. 键空间

`expo-secure-store`，key 规则：

```
hwp.<serverId>.apiKey       // API-Key 模式
hwp.<serverId>.username
hwp.<serverId>.password
hwp.<serverId>.session      // 会话凭据（Cookie/Token 序列化）
hwp.<serverId>.mfaSecret?   // 一期不保存 TOTP 密钥
```

## 2. 平台映射

| 平台 | 实现 | 访问策略 |
|---|---|---|
| iOS | Keychain | `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` |
| Android | EncryptedSharedPreferences（Keystore 派生密钥） | 不参与 Auto Backup |

- `expo-secure-store` 的 `keychainAccessible` 必须显式设置，不依赖默认值。
- Android 侧需在 manifest 中 `android:allowBackup="false"`（或 exclude 该 shared prefs），否则凭据可能被系统备份带出。

## 3. 不变量

1. 明文凭据**只存在于内存中的 `PanelClient` 生命周期内**，不进入 Zustand/Query 缓存、不进 AsyncStorage、不进崩溃上报。
2. 切换服务器不读取其它服务器的凭据；`PanelClient` 销毁时清空内存引用。
3. 删除服务器：元数据与全部 `hwp.<serverId>.*` 在同一事务语义下清除；失败必须回报（不能"看起来删了但凭据还在"）。
4. 修改地址/认证模式：保留 `serverId`，但**清空旧模式的凭据**（例如 api-key → password 时删掉 `apiKey`）。
5. 会话 401：清 `session`，保留账密（用于一键重登）；用户选择"不保存密码"时不写 `password`。

## 4. 生物识别

一期**不实现**。`accessControl` 参数保留但不启用；不要在代码里留下 `requireAuthentication: true` 的死分支。

## 5. 校验

- 单元测试：写入/读取/删除/跨模式切换四条路径。
- 集成测试：删除服务器后，重新添加同地址的新服务器，**不得**复用旧凭据。
- 发布前检查：`expo-secure-store` 之外没有任何模块 import 了存储层。
