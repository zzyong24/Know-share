# 页面规格 — admin（管理 / 审核控制台）

## 摘要

本产物把 `IA-011`（管理 / 审核控制台，仅管理员）落成可构建的页面/界面契约，覆盖审核治理闭环 `HARD-08` 的前端面：评审队列、风险摘要、详情面板、举报处理、破坏性操作二次确认与审计日志。所有页面追溯到 `FR-100`、`NFR-006`、`FLOW-005`，以及实体 `ENT-005/006/014/015/018`。设计真源为 `docs/design/generated/IA-011-admin-console.html`（+ `.png`）与 `docs/design/know-share-ui-overview.png`（管理面板缩览）。组件锚定 `UI_RULES.md` 的 `UI-003`（DataTable/ListRow/StatusPill/StatBlock）与 `UI-001` 令牌、`UI-002` 图标族。

### Artifact metadata

- Stage: `08-page-spec`
- Status: `needs-user-confirmation`
- 模块: `admin`（管理 / 审核控制台，仅管理员）
- Source inputs:
  - `aies/01-product/PRODUCT_SPEC.md`（`FR-100`、`NFR-006`、产品边界第 3 条"不自动越过人类同意"）
  - `aies/02-design/IA_SPEC.md`（`IA-011` 定义、权限敏感界面"仅管理员角色"）
  - `aies/02-design/UI_RULES.md`（`UI-001/002/003/004`、组件行为规则、无障碍底线、IA-011 归一说明与 Stitch 提示词）
  - `aies/01-product/LIGHT_DOMAIN_MODEL.md`（`ENT-005/006/014/015/018`、生命周期、`INV-02/11`）
  - `aies/01-product/BUSINESS_FLOW.md`（`FLOW-005`、决策点、审计与合规需求、`HARD-08`）
  - `aies/00-control/ID_REGISTRY.md`
  - `docs/design/generated/IA-011-admin-console.html` + `.png`、`docs/design/know-share-ui-overview.png`
- Upstream IDs: `IA-011`、`FR-100`、`NFR-006`、`FLOW-005`、`ENT-005`、`ENT-006`、`ENT-014`、`ENT-015`、`ENT-018`、`INV-02`、`INV-11`、`UI-001`、`UI-002`、`UI-003`、`UI-004`
- Decision IDs: `DEC-008`（完整目标产品、不弱化）、`DEC-011`（轻后端 + 聚合统计）、`DEC-012`（规范设计系统 + Material Symbols Outlined）
- 新增假设: `ASM-049`、`ASM-050`、`ASM-051`、`ASM-052`、`ASM-053`（见文末"拟新增假设"，**未写入 `DEFAULT_ASSUMPTIONS.md`**，在返回中列出待确认）
- Manifest status: stage `08-page-spec` = `needs-user-confirmation`
- PAGE-* 段: `PAGE-080` ~ `PAGE-089`

### 模块级权限与边界（贯穿本模块所有 PAGE）

- **仅管理员可见/可达**：整个 `IA-011` 及其下属界面要求登录 + `User.role = admin`（`ENT-001` 管理员角色，`IA_SPEC.md` 权限敏感界面）。非管理员命中路由返回 403/重定向到首页发现页（`IA-002`），主导航不渲染"审核控制台"入口（`IA_SPEC.md` 导航模型"具管理员角色时显示"）。
- **人类同意不可被越过**：所有处置动作（通过/退回/下架/封禁/标记处理）均为**管理员人工裁决**，系统不得自动执行终态处置；自动信号（如 `@system` 标记高风险）只能进入队列等待人工裁决，不得自动下架已发布模块（产品边界第 3 条；`NFR-005` 精神延伸到治理面）。
- **审计可追溯**：本模块任一处置写入 `ENT-018 AuditLog`（行动者/动作/目标/时间/原因），对应 `INV-11`、`FLOW-005` 审计与合规需求。
- **抗滥用对齐**：举报/处置入口受速率限制与身份核查约束（`NFR-006`），前端在动作上体现禁用/节流态。
- **零私有内容**：详情面板展示的是 `ENT-004 Manifest` 脱敏摘要与 `ENT-005 PrivacyScan` 结果，**绝不展示原始知识内容或私有 URL**（`INV-01/04`）；下架决策针对清单与公开关系，不触及原始内容（平台本就不持有）。
- **Telemetry 仅聚合无 PII**：本模块的统计/埋点对齐 `FR-140`/`FLOW-008`，仅聚合计数（待审数、处置数、各裁决占比等），不记录可识别个人的明细行为画像（`INV-09`、`NFR-001`）。

---

## PAGE-080 · 审核控制台总览页（IA-011 容器）

### Page purpose

- 管理员进入审核治理的单一入口与外壳容器：顶部呈现风险摘要 `StatBlock` 行（待审 / 高风险 / 今日举报 / 已处理），下方以两栏布局承载左侧评审队列（`PAGE-081`）+ 右侧详情面板（`PAGE-082`），底部承载审计日志（`PAGE-083`）。对应设计真源 `IA-011-admin-console.html` 整页结构与 `know-share-ui-overview.png` 管理面板缩览。
- 它解决 `HARD-08`/`FLOW-005` 的"管理员先看风险摘要与隐私发现，再批准/拒绝/要求修改"路径的着陆面。

### Upstream requirement links

- `IA-011`（管理 / 审核控制台）、`FR-100`（评审队列、风险摘要、批准/拒绝/要求修改、举报处理、审计轨迹）、`FLOW-005`（审核与举报治理）、`NFR-006`（抗滥用）。
- 实体：`ENT-015 ReviewItem`（队列项与风险摘要）、`ENT-014 Report`、`ENT-005 PrivacyScan`、`ENT-018 AuditLog`。
- 组件：`UI-003` 的 `AppShell`、`StatBlock`、`DataTable`、`ListRow`；令牌 `UI-001`；图标族 `UI-002`。
- `DEC-008`（完整目标产品，不切片弱化治理面）。

### Route or surface ID

- 路由：`/admin`（或 `/admin/review`），桌面 Web 优先（`ASM-016`）。
- 外壳：`AppShell` 顶栏含管理员标识徽（真源 HTML：`@zyongzhu24` + 主色"管理员"徽标）；主内容 `1280px` 居中容器。
- 子界面以同页区域 / 抽屉形式承载：`PAGE-081` 队列区、`PAGE-082` 详情面板（右栏 sticky）、`PAGE-083` 审计日志区。

### Data required

- 风险摘要四项聚合计数（`ENT-019 UsageStat` 管理子集 / 实时派生）：`pendingCount`（待审）、`highRiskCount`（高风险）、`reportsToday`（今日举报）、`resolvedCount`（已处理 / 今日或累计，口径见 `ASM-053`）。真源示例值：8 / 1 / 2 / 24。
- 当前管理员身份（`ENT-001`，role=admin）用于权限判定与审计行动者署名。
- 队列与详情、审计的数据由 `PAGE-081/082/083` 各自声明。

### Actions

- "刷新列表"（重新拉取队列 + 摘要计数）。
- "批量通过"（对当前已选/已过滤的低风险 `pass` 项批量裁决通过）——**破坏性/批量处置，触发二次确认对话框 `PAGE-085`**，并逐项写 `ENT-018`。
- 队列筛选切换（"全部状态" / "已过滤风险项"等 `StatusPill` 形态的筛选标签，真源 HTML 顶部）。

### States

- 默认（有待审项）：摘要 + 队列 + 详情 + 审计四区齐显。
- 加载中：摘要与队列分别显示 skeleton（`UI-003` loading 态）。
- 队列空：队列区显示 `EmptyState`（"暂无待审项"，Material Symbols `inbox` 图标 + 说明），详情面板显示空占位。
- 错误：摘要/队列拉取失败显示行内错误 + 重试按钮。
- 无权限：非管理员被拦截（见模块级权限）。

### Validation and error behavior

- 路由级 guard：未登录 → 跳转 GitHub 登录；登录但非 admin → 403 / 重定向，不渲染任何治理数据。
- "批量通过"仅对 `PrivacyScan = pass` 且无未决举报的项启用；存在 `warn`/`block` 或被举报项时该项从批量集合排除并提示（防止越过人工判断，呼应 `INV-02`）。
- 摘要计数与队列实际条数不一致时以队列实时数据为准并触发后台刷新。

### Telemetry or analytics

- 聚合事件（无 PII，`FR-140`/`FLOW-008`/`INV-09`）：`admin_console_view`、`admin_refresh`、`admin_bulk_approve`（仅计数与裁决类型，不含被处置用户身份明细）。
- 摘要四项计数本身即 `UsageStat` 管理子集的展示，口径标注见 `ASM-053`。

### Acceptance checks

- 仅管理员可加载本页；非管理员被拦截且导航无入口（`IA_SPEC.md` 权限）。
- 风险摘要以 `StatBlock`（大数字 + 标签 + Material Symbols Outlined 图标）呈现四项，语义色仅用于高风险/已处理等状态强调，主色用于品牌（`UI-001` 主色/成功色区分）。
- "批量通过"必经二次确认（`PAGE-085`）且产生审计记录。
- 页面追溯 `IA-011`/`FR-100`/`FLOW-005`，无未追溯新增功能（`UI-004` 第 6 条）。

---

## PAGE-081 · 评审队列（DataTable）

### Page purpose

- 以高密度 `DataTable` 列出待处置的 `ReviewItem`（由 `Submission` 或 `Report` 派生），每行让管理员一眼看清模块名、提交者、隐私门结果、风险标签、提交时间，并提供行内处置动作。对应真源 HTML 左栏表格。
- 这是 `FLOW-005` 决策点"评审裁决（批准/拒绝/要求修改）"与"举报是否成立（处罚/下架/驳回）"的主操作面。

### Upstream requirement links

- `IA-011`、`FR-100`（评审队列 + 操作）、`FLOW-005`（评审裁决、举报处理）、`NFR-006`。
- 实体：`ENT-015 ReviewItem`（关联 `Submission`/`Report`、裁决、风险摘要）、`ENT-006 Submission`（状态 `Submitted/InReview/ChangesRequested/...`）、`ENT-005 PrivacyScan`（pass/warn/block）、`ENT-014 Report`。
- 组件：`UI-003` `DataTable`/`ListRow`、`StatusPill`（pass/warn/block 语义色映射）；行为规则"状态用 StatusPill + 语义色 + 文字"。

### Route or surface ID

- 界面区：`/admin` 左栏（`col-span-8`），亦可深链选中项 `/admin/review?item=<reviewItemId>`。
- 列定义（真源 HTML 表头）：`模块名 & 提交者` | `隐私门结果` | `风险标签` | `提交时间` | `操作`。

### Data required

- `ReviewItem[]`：每项含
  - `reviewItemId`、来源类型（`submission` | `report`）；
  - 关联 `KnowledgeModule.title`（如"Agent 记忆系统设计模式"）+ 提交者 GitHub handle（如 `@zyong`）；
  - `PrivacyScan.gate` ∈ {`pass`,`warn`,`block`} → 映射为 `StatusPill` 文案"通过/警告/阻断"；
  - `riskLabel`：文字风险标签（如"无风险"/"疑似含私有路径"/"缺少版本说明"）+ 风险等级（无/低/中/高），**等级必须有文字而非仅靠颜色**（`UI-002`/无障碍底线）；
  - `submittedAt`（如 `2024-10-24 09:15`）；
  - `submissionStatus`（用于决定可用动作）。
- 真源示例：3 项（1 个 `pass` 无风险、1 个 `block` 高风险"疑似含私有路径"@ops-bot、1 个 `warn`"缺少版本说明"@trader）。

### Actions

- **选中行**：点击行 → 加载该项到详情面板 `PAGE-082`（真源脚本：选中行加主色 ring 高亮）。
- **通过**（行内，仅 `pass`/可接受 `warn` 经确认）：`ReviewItem` 裁决=批准 → 关联 `Submission` → `Approved/Published`，`KnowledgeModule` → `Published`；写 `ENT-018`。
- **退回 / 要求修改**：裁决=要求修改 → `Submission` → `ChangesRequested`；可附审核意见（详情面板 textarea）；写 `ENT-018`、触发通知（`FR-120`/`FLOW-006`）。
- **下架**（行内，针对 `block` 或举报成立项）：**破坏性，触发二次确认 `PAGE-085`** → `KnowledgeModule` → `Delisted/Removed`；写 `ENT-018`。
- 行内动作集合随状态/风险动态：`block` 行主动作为"下架"（danger 文字色）+ "退回"；`pass`/`warn` 行为"通过" + "退回"（真源 HTML 即如此区分）。

### States

- 行态：默认 / hover（浅灰底）/ 选中（主色 inset ring）。
- 高风险行：以 `error-container` 极浅底 + 行内 `priority_high` 图标 + 风险标签 danger 文字，凸显但仍含文字标签。
- 隐私门 `StatusPill` 三态：`通过`(success 浅底/绿)、`警告`(warning 浅底/橙)、`阻断`(danger 浅底/红)。
- 空 / 加载 / 错误：见 `PAGE-080`。
- 动作进行中：按钮 disabled + loading；速率受限时禁用并提示（`NFR-006`）。

### Validation and error behavior

- **`block` 项不可被"通过"**：含 `block` 级隐私发现的清单不得发布（`INV-02`）；UI 上 `block` 行不渲染"通过"按钮，仅"下架/退回"。
- "通过"对 `warn` 项需管理员显式确认风险标签已审阅（轻量内联确认或要求填写意见），不得静默放行（`HARD-08` 闭环）。
- 处置写入审计失败时，处置不视为成功并回滚 UI 状态 + 报错（保障 `INV-11`）。
- 同一项被并发处置：以服务端状态为准，过期处置返回冲突提示并刷新该行。

### Telemetry or analytics

- 聚合（无 PII）：`admin_review_action`，维度仅 `action`(approve/return/delist)、`gate`(pass/warn/block)、`source`(submission/report) 的计数，不含被处置者身份（`INV-09`/`FR-140`）。

### Acceptance checks

- 每行隐私门结果用 `StatusPill` + 语义色 + 文字三态呈现，风险等级有文字标签（不仅颜色）。
- `block` 行无"通过"动作；"通过"低风险项与"下架"高风险项可达且分别走正确状态机。
- 选中行驱动详情面板更新。
- 所有处置产生 `ENT-018` 审计记录，且不自动越过人工裁决（产品边界）。

---

## PAGE-082 · 评审详情面板（Manifest 摘要 + PrivacyScan + 举报详情）

### Page purpose

- 右栏 sticky 详情面板，展示当前选中 `ReviewItem` 的可裁决依据：`Manifest` 脱敏摘要（等宽 JSON）、`PrivacyScan` 详细发现（分级列表）、关联 `Report` 详情，以及审核意见输入与"标记处理完毕"动作。对应真源 HTML 右栏面板。
- 让管理员在不接触原始内容的前提下，凭脱敏清单 + 扫描发现 + 举报做出裁决（`FLOW-005`、`INV-01/04`）。

### Upstream requirement links

- `IA-011`、`FR-100`、`FLOW-005`、`NFR-006`。
- 实体：`ENT-004 Manifest`（脱敏摘要）、`ENT-005 PrivacyScan`（发现项 pass/warn/block + 泛化建议 + 敏感度声明）、`ENT-014 Report`（举报方/目标/原因）、`ENT-015 ReviewItem`、`ENT-018 AuditLog`。
- 组件：`Card`、等宽 `JetBrains Mono` 代码块（`UI-001` 字族）、行内分级条、`SecondaryButton`/`PrimaryButton`。

### Route or surface ID

- 界面区：`/admin` 右栏（`col-span-4`，sticky `top-24`）；与 `PAGE-081` 选中态联动。

### Data required

- 选中项标题（如"正在查看: 私有部署脚本集"）。
- **Manifest 摘要**（`ENT-004`，脱敏）：JSON 片段（真源示例 `id/version/entry/env`），**只展示清单字段，绝不展示原始知识内容/私有 URL**（`INV-04`）。
- **PrivacyScan 详细结果**（`ENT-005`）：发现项列表，每项含描述 + 分级（高危/中等/低/通过）+（可选）泛化/脱敏建议；真源示例"硬编码 IP 泄露=高危"、"未声明的 HTTP 请求=中等"。
- **举报详情**（`ENT-014`，若来源为举报）：举报原因文本 + 举报方 handle（真源示例 @sec-researcher 引述）。
- 审核意见草稿（可空）。

### Actions

- 在文本域填写**审核意见**（关联到裁决，写入 `ENT-018` 的原因字段）。
- "标记处理完毕"（对 `Report` 处置 / 关闭 `ReviewItem`）；若该处置含下架/封禁等终态，**走二次确认 `PAGE-085`**。
- （与 `PAGE-081` 行内动作一致的）通过/退回/下架也可在此面板触发，统一写审计。

### States

- 未选中任何项：面板显示引导空态（"从左侧队列选择一项以查看详情"）。
- 已选中：Manifest / PrivacyScan / 举报三段按有无数据条件渲染（无举报则隐藏举报段）。
- 提交意见中：按钮 loading；成功 → toast + 该项从队列移除/状态更新；失败 → 行内错误。

### Validation and error behavior

- Manifest 渲染前做白名单字段过滤，确保不出现非清单字段（防私有内容泄露，`INV-01/04`）——若检测到疑似原始内容字段，前端不渲染并标记异常。
- "标记处理完毕"在存在未读 `block` 级发现且裁决为通过时阻止（与 `INV-02` 一致），要求改为下架/退回或先解除阻断。
- 审核意见对"退回/要求修改""下架"为必填（保证审计原因可追溯，`INV-11`）。

### Telemetry or analytics

- 聚合（无 PII）：`admin_detail_view`、`admin_resolve`（维度 `outcome` 计数）。不记录 Manifest 内容或举报原文（`INV-09`/`NFR-001`）。

### Acceptance checks

- 面板仅展示脱敏 Manifest + 扫描发现 + 举报摘要，无原始私有内容/私有 URL。
- PrivacyScan 发现项含文字分级标签；与队列 `StatusPill` 语义一致。
- 退回/下架必填审核意见，并写入 `ENT-018`。

---

## PAGE-083 · 审计日志（ListRow，可追溯）

### Page purpose

- 页面底部以紧凑 `ListRow` 列表呈现审计轨迹：时间、行动者、动作、目标、原因/结果，让治理可追溯、可审查。对应真源 HTML 底部"审计日志"区。
- 直接落实 `ENT-018 AuditLog`、`INV-11`、`FLOW-005` 审计与合规需求、`NFR-006`。

### Upstream requirement links

- `IA-011`、`FR-100`、`NFR-006`、`FLOW-005`。
- 实体：`ENT-018 AuditLog`（行动者/动作/目标/时间）。
- 组件：`UI-003` `ListRow`、等宽时间戳、`StatusPill`/标签呈现目标。

### Route or surface ID

- 界面区：`/admin` 底部全宽区；可展开为独立 `/admin/audit` 列表页（分页/筛选），本规格按同页底部区 + 行展开链定义。

### Data required

- `AuditLog[]`：每条含 `time`（如 `11:15`，`ENT-018` 时间）、`actor`（如 `@admin`、`@system`，行动者）、`action`（如"驳回了/通过了/标记高风险"）、`target`（如 `模块#3291`，目标引用，非内容）、`note`（原因/结果，如"原因: 文档不全"/"已上线生产环境"/"触发自动阻断机制"）。
- 真源示例 3 条（@admin 驳回 #3291 文档不全；@admin 通过 #1284 已上线；@system 标记高风险 #1022 触发自动阻断）。

### Actions

- 点击行展开/跳转该审计条目详情（真源 `chevron_right`）→ 关联的 `ReviewItem`/`Module`。
- （可选，独立审计页）按行动者/动作/时间筛选与分页。

### States

- 有记录：时间倒序列表，hover 浅灰底。
- 系统行动者（`@system`）与人工行动者（`@admin`）以文案区分；高风险目标用语义浅底标签（含文字）。
- 空：`EmptyState`（"暂无审计记录"）。
- 加载 / 错误 / 加载更多（分页）。

### Validation and error behavior

- 审计为**只读不可编辑/删除**（合规要求，`NFR-006`/`INV-11`）；前端不提供任何编辑入口。
- 目标引用仅显示 ID/标题，不展示私有内容（`INV-04`）。

### Telemetry or analytics

- 聚合（无 PII）：`admin_audit_view`、`admin_audit_filter`（仅维度计数）。审计内容本身不进 Telemetry（审计与统计分离，`NFR-001`）。

### Acceptance checks

- 每条审计含行动者/动作/目标/时间四要素，可追溯（`INV-11`）。
- 列表只读；区分人工与系统行动者；目标不泄露私有内容。

---

## PAGE-084 · 举报处理流（Report 处置）

### Page purpose

- 承载"举报触发复核与基本处罚"的处置流：从队列中来源为 `Report` 的项进入，管理员审阅举报详情（`PAGE-082` 举报段）并裁定处罚/下架/驳回。本 PAGE 把举报特有的处置语义与状态从通用队列中显式化，确保 `FLOW-005` 举报治理闭环完整（产品规格"本产品不含争议仲裁机制，仅审核处罚/下架"）。

### Upstream requirement links

- `IA-011`、`FR-100`（举报处理）、`FLOW-005`（举报是否成立 → 处罚/下架/驳回）、`NFR-006`。
- 实体：`ENT-014 Report`（举报方/目标[模块/用户/交换]/原因/状态）、`ENT-015 ReviewItem`、`ENT-018 AuditLog`。

### Route or surface ID

- 复用 `/admin` 队列 + 详情面板；举报项在队列中以来源标识区分（`source=report`），深链 `/admin/review?item=<reviewItemId>&type=report`。

### Data required

- `Report`：举报方 handle、目标类型与引用（模块/用户/交换，仅引用不含私有内容）、举报原因文本、当前 `status`。
- 关联目标的最小裁决上下文（若目标为模块：其 `Manifest` 摘要 + `PrivacyScan`；若为用户/交换：公开关系引用）。

### Actions

- **驳回举报**：裁决=驳回 → `Report.status=dismissed`；写 `ENT-018`。
- **要求修改 / 退回**（目标为模块时）：→ `Submission.ChangesRequested`。
- **处罚 / 下架**：对成立举报，下架目标模块（`KnowledgeModule.Delisted/Removed`）或对用户施加基本处罚（标记/限流，受 `NFR-006`）——**破坏性，二次确认 `PAGE-085`**；写 `ENT-018` + 通知（`FR-120`）。
- 填写处置意见（必填，进审计原因）。

### States

- 举报待处理 / 处理中 / 已驳回 / 已处罚（下架）。
- 目标已被其他处置改变（如已下架）：提示并禁用重复终态动作。
- 加载 / 错误。

### Validation and error behavior

- 处罚/下架必填意见且经二次确认；不可对同一举报重复施加终态处罚。
- 不提供仲裁/申诉裁决 UI（产品边界：无争议仲裁机制）——只有处罚/下架/驳回三类出口。
- 所有出口写审计（`INV-11`）。

### Telemetry or analytics

- 聚合（无 PII）：`admin_report_resolve`（维度 `outcome`=dismiss/penalize/delist 计数）。不记录举报原文与当事人身份明细（`INV-09`/`NFR-001`）。

### Acceptance checks

- 举报三类出口（驳回/处罚-下架/退回）齐备且各写审计；处罚/下架经二次确认。
- 无仲裁裁决面（符合产品边界）。
- 处置不暴露目标私有内容（`INV-04`）。

---

## PAGE-085 · 破坏性操作二次确认对话框（下架 / 封禁 / 批量通过）

### Page purpose

- 全模块共享的破坏性/不可逆操作二次确认对话框：在"下架模块""封禁/处罚用户""批量通过"等动作执行前弹出，明确说明影响、要求确认（并对高危操作要求填写原因），防止误操作并保障人工同意与审计。对应 `UI_RULES.md` 组件行为规则"破坏性/不可逆操作需二次确认"与真源 HTML"确认对话框（破坏性操作）"状态。

### Upstream requirement links

- `IA-011`、`FR-100`、`NFR-006`、`FLOW-005`、产品边界第 3 条（不自动越过人类同意）。
- `UI_RULES.md` 组件行为规则（破坏性操作二次确认）、`UI-003`（PrimaryButton/SecondaryButton、danger 语义色）。
- 实体：`ENT-018 AuditLog`（确认即记录原因）。

### Route or surface ID

- 模态对话框（surface，无独立路由），由 `PAGE-080/081/082/084` 的破坏性动作触发，焦点陷阱 + Esc 取消（无障碍）。

### Data required

- 动作类型（`delist` | `ban`/`penalize` | `bulk_approve`）、目标摘要（模块名 + 提交者 / 用户 handle / 批量项数）、影响说明文案、（高危动作）原因输入。

### Actions

- "取消"（关闭，不执行）；"确认 + 动作名"（执行处置，主色或 danger 实心，按动作语义）；原因输入（下架/封禁必填）。

### States

- 默认 / 原因未填（确认按钮禁用，针对必填原因的动作）/ 执行中（loading）/ 成功（关闭 + toast）/ 失败（保留对话框 + 错误）。

### Validation and error behavior

- 下架、封禁/处罚必须填写原因方可确认（原因写入 `ENT-018`，`INV-11`）。
- 批量通过仅作用于校验通过的 `pass` 子集，确认文案显式列出将处置的条数并排除被举报/含 `block` 项（`INV-02`）。
- 执行失败回滚并保留对话框，不产生"半成功"无审计的状态。

### Telemetry or analytics

- 聚合（无 PII）：`admin_destructive_confirm`（维度 `action` 与 `confirmed/cancelled` 计数）。

### Acceptance checks

- 任一破坏性动作（下架/封禁/批量通过）执行前必经本对话框。
- 下架/封禁必填原因并写审计；可取消。
- 键盘可达、焦点陷阱、Esc 取消（`NFR-007`）。

---

## 模块级状态与无障碍（贯穿 PAGE-080~085）

- **States 总览**：default / loading(skeleton) / empty(EmptyState) / error(行内重试) / no-permission(403 拦截) / action-in-progress(disabled+loading) / rate-limited(禁用+提示)。
- **无障碍底线（`NFR-007`）**：表格表头与单元格关联（`scope`/`aria`）；隐私门与风险等级**不仅靠颜色**，同时有文字标签与图标；破坏性操作二次确认、焦点态可见（主色描边）；图标按钮有 `aria-label`；对比度 ≥ 4.5:1（主色 `#017A6E` 配白达标）。
- **响应式（`ASM-016`）**：桌面两栏（队列 + 详情）在平板折叠为顶部 Tab / 抽屉、移动单列；`DataTable` 在窄屏转卡片式行（`UI_RULES.md` 响应式规则）。

---

## 拟新增假设（标注；**未写入 `DEFAULT_ASSUMPTIONS.md`**，待用户确认）

| ID | 假设 | 若有误的风险 | 确认 |
| --- | --- | --- | --- |
| `ASM-049` | 审核控制台的子界面（队列/详情/审计）在**同一 `/admin` 页内分区/抽屉**呈现，而非各自独立路由页 | 若需独立路由页（深链/分页扩展），路由与状态管理需调整 | 用户 / 服务契约阶段 |
| `ASM-050` | "批量通过"为目标产品治理面的一项动作（真源 HTML 含该按钮，`FR-100` 未逐字列出）；仅作用于 `pass` 且无未决举报的子集，逐项写审计、不越过人工判断 | 若产品不希望任何批量处置，应移除该动作 | 用户 |
| `ASM-051` | 详情面板的"审核意见 / 处置原因"对退回/下架/封禁为**必填**，以保证 `ENT-018` 审计原因可追溯（`INV-11` 精神延伸） | 若允许无原因处置，必填校验需放宽 | 用户 |
| `ASM-052` | 对用户的"封禁/处罚"为基本处罚（标记/限流），与 `NFR-006`/`FLOW-005`"基本处罚"一致；不含分级申诉/仲裁 | 若需更完整的处罚分级，需在领域模型/服务契约扩展 | 用户 / 后端规格阶段 |
| `ASM-053` | 风险摘要"已处理"计数口径默认为**当日已处置数**（真源示例 24）；属 `ENT-019 UsageStat` 管理子集，聚合无 PII | 若口径应为累计或滚动窗口，统计口径需调整 | 用户 / `FLOW-008` 对齐 |

> 说明：真源 HTML 中出现的色板（如 Material 派生 `primary/secondary/...`、`ROUND_EIGHT` 圆角）属 `UI_RULES.md` 已登记的 Stitch 设计系统 v2 偏差（`ASM-015` 范畴），本规格一律以 `UI-001` 规范令牌（主色 `#017A6E`、`--radius-card 12px`）为准；语义色按 success/warning/danger 映射隐私门 pass/warn/block。

---

## 质量门结果

```text
Gate: 06-page-spec-gate
Status: pass（内容自检）— needs-user-confirmation
Evidence:
  - 本文件 aies/02-design/admin/PAGE_SPEC.md
  - 上游对照：aies/02-design/IA_SPEC.md(IA-011)、aies/01-product/PRODUCT_SPEC.md(FR-100/NFR-006/产品边界)、
    aies/01-product/BUSINESS_FLOW.md(FLOW-005/审计合规/HARD-08)、aies/01-product/LIGHT_DOMAIN_MODEL.md(ENT-005/006/014/015/018, INV-02/11)、
    aies/02-design/UI_RULES.md(UI-001/002/003/004, 组件行为规则, IA-011 Stitch 提示词)、aies/00-control/ID_REGISTRY.md
  - 设计真源：docs/design/generated/IA-011-admin-console.html(+.png)、docs/design/know-share-ui-overview.png
Findings:
  - 每个 PAGE 含 purpose/data/actions/states/validation/telemetry/acceptance 九字段，均填具体项目内容。✅
  - 全部 PAGE 追溯 IA-011 + FR-100 + FLOW-005 + NFR-006 + 对应 ENT；无仅因设计图出现而存在的页面（PAGE-080~085 均对应 FR-100 治理能力或 UI_RULES 强约束行为）。✅
  - 风险等级有文字标签（非仅颜色）；隐私门 pass/warn/block 用语义色 StatusPill + 文字（无障碍底线）。✅
  - 审计可追溯（ENT-018/INV-11）；破坏性操作（下架/封禁/批量通过）经二次确认（PAGE-085）。✅
  - 评审动作不自动越过人类同意（模块级边界 + INV-02 block 不可通过）。✅
  - Telemetry 对齐 FR-140/FLOW-008，聚合无 PII（INV-09/NFR-001）。✅
  - 仅管理员权限贯穿；零私有内容（INV-01/04）。✅
  - 拟新增假设 ASM-049~053 已标注，未写入 DEFAULT_ASSUMPTIONS.md。✅
Hard-Limit Policy: 本模块拆 6 个 PAGE（PAGE-080~085），系按 IA-011 真源结构（容器/队列/详情/审计/举报流/破坏性确认）与 FR-100 治理能力划分，非按设计图碎片化；广度服务于 HARD-08 治理闭环核心路径，已说明理由。
Decision: needs-user-confirmation — 待用户确认 5 条新增假设（尤以 ASM-050 批量通过、ASM-053 已处理口径）后转 passed。
```
