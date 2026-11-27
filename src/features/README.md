# features/

每个一期能力一个垂直目录：`api / hooks / components / screens`。

- `overview` — T06/T07
- `containers` — T08/T09
- `apps` — T10
- `tasks` — T11
- `more` — T12
- `servers` — T04/T05（多实例注册表、连接表单）

规则（`docs/architecture.md` §3）：页面不直连 transport，只经各自 `api/`；
每个 queryKey 以 `serverId` 开头。
