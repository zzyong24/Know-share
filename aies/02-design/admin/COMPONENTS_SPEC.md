# 组件规格 — admin（管理 / 审核控制台）

## 摘要

本产物把 admin 模块页面规格（`PAGE-080~085`）落成可实现的**模块特有组件**契约。仅定义 admin 段编号 `COMP-170~189`（`FRONTEND_SPEC.md §7` 防碰撞分配）；全站共享组件（`COMP-001~040`，`_shared/COMPONENTS_SPEC.md` 拥有）**只引用 ID、不重复定义**。组件锚定技术栈 shadcn/ui + Tailwind（`DEC-014`）、单一图标族 Material Symbols Outlined（实现期 1:1 替换 `lucide-react`，`DEC-012`/`UI-002`），落地 `UI-001` 令牌与 `UI-003` 规范组件，遵循无障碍底线（`NFR-007`）与治理硬约束（人工同意不可越过、风险等级文字标签、审计可追溯）。

### 产物元数据

- Stage: `09-component-spec`
- Status: `needs-user-confirmation`
- 模块: `admin`（管理 / 审核控制台，仅管理员 `IA-011`）
- COMP 段（本模块特有）: `COMP-170~189`
- Source inputs:
  - `aies/03-frontend/FRONTEND_SPEC.md`（技术栈、共享组件库 `COMP-001~040`、COMP 段分配、状态/数据获取约定）
  - `aies/02-design/admin/PAGE_SPEC.md`（`PAGE-080~085`）
  - `aies/02-design/UI_RULES.md`（`UI-001/002/003/004`、组件行为规则、无障碍底线）
  - `aies/02-design/IA_SPEC.md`（`IA-011` 仅管理员）
  - `aies/01-product/LIGHT_DOMAIN_MODEL.md`（`ENT-005/006/014/015/018`、`INV-02/11`）
  - `aies/01-product/BUSINESS_FLOW.md`（`FLOW-005`、决策点、审计合规）
  - `aies/00-control/ID_REGISTRY.md`
- Upstream IDs: `PAGE-080~085`、`IA-011`、`FR-100`、`FLOW-005`、`NFR-006`、`NFR-007`、`ENT-004/005/006/014/015/018/019`、`INV-01/02/04/11`、`UI-001/002/003/004`
- Decision IDs: `DEC-008`（完整目标产品、不弱化）、`DEC-011`（轻后端 + 聚合统计）、`DEC-012`（Material Symbols Outlined）、`DEC-014`（前端栈 Next.js+TS+Tailwind+shadcn）
- 关联假设: `ASM-049~053`（admin PAGE_SPEC 新增，未写入 `DEFAULT_ASSUMPTIONS.md`）；本阶段新增 `ASM-100~102`（见文末）

### 组件契约模板（每个 COMP 8 字段 + metadata 行）

每个组件先给一行 **metadata**（落地基元 / 主要 PAGE / 引用的共享组件），再展开 **8 字段**：
`1) 用途` · `2) Props` · `3) Events` · `4) States` · `5) A11y（NFR-007）` · `6) Data（实体/字段）` · `7) Tests` · `8) Traceability（追溯）`。

### 引用的共享组件（只引用、不在此定义；契约见 `_shared/COMPONENTS_SPEC.md`）

`COMP-001 AppShell`、`COMP-007 PrimaryButton`、`COMP-008 SecondaryButton`、`COMP-009 Card`、`COMP-011 StatusPill`、`COMP-014 StatBlock`、`COMP-015 DataTable`、`COMP-016 ListRow`、`COMP-021 EmptyState`、`COMP-024 CodeBlock`、`COMP-025 ConfirmDialog`、`COMP-026 Drawer`、`COMP-029 Toast`、`COMP-030 FormField`、`COMP-032 Pagination/LoadMore`、`COMP-033 Skeleton`、`COMP-034 Avatar`。

---

## COMP-170 · `AdminConsoleShell`（审核控制台外壳与权限门）

**metadata** — 落地：组合共享 `COMP-001 AppShell` + Next.js `(admin)` 段中间件 / 布局；主要 PAGE：`PAGE-080`；引用：`COMP-001`、`COMP-014`、`COMP-029`。

1. **用途**：admin 模块单一外壳容器，承载顶部风险摘要行（`COMP-171`）+ 两栏（队列 `COMP-173` / 详情 `COMP-176`）+ 底部审计（`COMP-180`）；并在客户端落地"仅管理员"权限门与管理员标识徽（`@handle` + 主色"管理员"徽标）。
2. **Props**：`admin: { handle: string; avatarUrl: string }`、`children`（区域插槽：summary / queue / detail / audit）、`isAuthorized: boolean`（由中间件/会话派生）。
3. **Events**：`onUnauthorized()`（非管理员 → 重定向首页发现页 `IA-002` / 403）；`onRefresh()`（刷新队列 + 摘要，对应 `PAGE-080` "刷新列表"）。
4. **States**：`authorized` / `forbidden`（403 拦截，不渲染任何治理数据）/ `loading`（摘要+队列 skeleton）/ `error`（行内错误 + 重试）。
5. **A11y**：管理员徽标含文字"管理员"非仅色块；主区 `<main>` landmark；刷新按钮有 `aria-label`；焦点态主色描边。
6. **Data**：当前管理员 `ENT-001`（role=admin）用于权限判定 + 审计行动者署名；不拉取任何私有内容（`INV-01/04`）。
7. **Tests**：非管理员渲染 → 断言触发 `onUnauthorized` 且子区域不渲染；管理员渲染 → 四区域插槽就位；loading 态显示 skeleton。
8. **Traceability**：`PAGE-080`、`IA-011`（仅管理员）、`FR-100`、`NFR-006`、`ENT-001`；权限门对齐 `IA_SPEC.md` 权限敏感界面。

---

## COMP-171 · `RiskSummaryRow`（风险摘要行）

**metadata** — 落地：4× 共享 `COMP-014 StatBlock` 的横向行容器；主要 PAGE：`PAGE-080`；引用：`COMP-014`。

1. **用途**：顶部呈现四项聚合计数（待审 / 高风险 / 今日举报 / 已处理），每项为一个 `StatBlock`（大数字 + 文字标签 + Material Symbols Outlined 图标 + 可选趋势）。**不新造统计组件**，仅按 admin 语义编排 `COMP-014`。
2. **Props**：`pendingCount: number`、`highRiskCount: number`、`reportsToday: number`、`resolvedCount: number`、`onItemClick?(key)`（可选：点击"待审/高风险"快捷过滤队列）。
3. **Events**：`onItemClick(key: 'pending'|'highRisk'|'reportsToday'|'resolved')`（可选联动 `COMP-173` 筛选）。
4. **States**：`default` / `loading`（每格 `COMP-033 Skeleton`）/ `error`（行内）；**高风险格 `highRiskCount>0` 用 danger 语义强调**（同时含文字标签"高风险"，不仅颜色）。
5. **A11y**：每格数字有关联文字标签；高风险用文字 + 图标 + 色三重表达；图标按钮（若可点）有 `aria-label`；对比度 ≥4.5:1（主色配白达标）。
6. **Data**：`ENT-019 UsageStat` 管理子集（聚合无 PII，`INV-09`）：`pendingCount`/`highRiskCount`/`reportsToday`/`resolvedCount`；"已处理"口径默认当日（`ASM-053`）。语义色仅用于状态强调，主色用于品牌（`UI-001`）。
7. **Tests**：四格渲染对应数字与标签；`highRiskCount=0` 不渲染 danger 强调、>0 渲染且含文字；loading 显示 skeleton。
8. **Traceability**：`PAGE-080`、`FR-100`、`ENT-019`、`INV-09`、`UI-001`、`UI-003`（StatBlock）、`ASM-053`。

---

## COMP-172 · `QueueFilterBar`（队列筛选条）

**metadata** — 落地：shadcn `ToggleGroup` / `Tabs` + `COMP-011 StatusPill` 形态标签；主要 PAGE：`PAGE-080`、`PAGE-081`、`PAGE-084`；引用：`COMP-011`。

1. **用途**：评审队列顶部筛选切换（"全部状态" / "已过滤风险项" / 来源 `submission`/`report` 等），筛选标签用 `StatusPill` 形态呈现；驱动 `COMP-173` 数据集与 URL searchParams 深链（`ASM-049`）。
2. **Props**：`value: { status?: 'all'|'risk'; source?: 'all'|'submission'|'report'; gate?: ('pass'|'warn'|'block')[] }`、`counts?`（各筛选项计数）。
3. **Events**：`onChange(next)`（写入 URL searchParams，触发队列重取）。
4. **States**：`default` / 选中项主色高亮 / `disabled`（加载中）。
5. **A11y**：`role="tablist"`/`toggle group`，当前项 `aria-current`/`aria-pressed`；筛选项文字非仅颜色；键盘左右切换。
6. **Data**：派生自 `ReviewItem` 集合的来源/风险维度；不含 PII。
7. **Tests**：切换筛选 → `onChange` 携带正确维度；URL searchParams 同步；选中态可键盘达到。
8. **Traceability**：`PAGE-080`（筛选切换）、`PAGE-081`、`PAGE-084`（`source=report` 区分）、`ASM-049`（同页深链）。

---

## COMP-173 · `ReviewQueueTable`（评审队列表）

**metadata** — 落地：共享 `COMP-015 DataTable`（shadcn Table + TanStack Table）+ `COMP-011 StatusPill` + `COMP-174 RiskLabel` + `COMP-175 ModerationActionBar`；主要 PAGE：`PAGE-081`、`PAGE-084`；引用：`COMP-015`、`COMP-011`、`COMP-034`。

1. **用途**：高密度 `DataTable` 列出待处置 `ReviewItem`，列：`模块名 & 提交者` | `隐私门结果`(StatusPill) | `风险标签`(COMP-174) | `提交时间` | `操作`(COMP-175)。点击行驱动详情面板 `COMP-176`。
2. **Props**：`items: ReviewItem[]`、`selectedId?: string`、`bulkSelectable?: boolean`（批量通过用，仅 `pass` 且无未决举报项可选）、`loading?`。
3. **Events**：`onSelectRow(reviewItemId)`（加载详情 + 主色 inset ring 高亮）、`onRowAction(reviewItemId, action)`（透传 `COMP-175`）、`onBulkSelectionChange(ids)`。
4. **States**：行 `default` / `hover`（浅灰底）/ `selected`（主色 inset ring）/ **高风险行**（`error-container` 极浅底 + `priority_high` 图标 + 风险标签 danger 文字）；表级 `loading`(skeleton) / `empty`(`COMP-021 EmptyState`，`inbox` 图标 "暂无待审项") / `error`(行内重试) / 行动作 `in-progress`(按钮 disabled+loading) / `rate-limited`(禁用+提示)。
5. **A11y**：表头 `scope` 与单元格关联；行可键盘选中（`Enter`）；隐私门与风险等级**不仅靠颜色**（文字 + 图标）；高风险行除色底外含 `priority_high` 图标 + danger 文字标签。
6. **Data**：`ENT-015 ReviewItem`（`reviewItemId`、来源 `submission|report`）、关联 `ENT-003 KnowledgeModule.title` + 提交者 handle、`ENT-005 PrivacyScan.gate ∈ {pass,warn,block}`、`riskLabel` + 风险等级（无/低/中/高，**必含文字**）、`submittedAt`、`ENT-006 Submission.status`（决定可用动作）。**仅引用，不含原始内容**（`INV-01/04`）。
7. **Tests**：`block` 行不渲染"通过"动作（`INV-02`）；选中行 → `onSelectRow` 触发且高亮；高风险行含 `priority_high` 图标 + 文字风险标签；空态显示 EmptyState；批量集合排除 `warn/block` 与被举报项（`ASM-050`）。
8. **Traceability**：`PAGE-081`、`PAGE-084`、`FR-100`、`FLOW-005`（评审裁决/举报处理）、`ENT-015/006/005/003`、`INV-02`、`NFR-006`、`UI-003`（DataTable/StatusPill）。

---

## COMP-174 · `RiskLabel`（风险等级文字标签）

**metadata** — 落地：标签元素（非共享 StatusPill；风险**等级**而非门控状态）；主要 PAGE：`PAGE-081`、`PAGE-082`；引用：—。

1. **用途**：呈现 `ReviewItem`/`PrivacyScan` 的**风险等级**（无 / 低 / 中 / 高）+ 风险描述文本（如"疑似含私有路径""缺少版本说明""无风险"）。**等级必须有文字而非仅靠颜色**（`UI-002` / `NFR-007` 硬项）。
2. **Props**：`level: 'none'|'low'|'medium'|'high'`、`text: string`（描述）、`icon?`（high → `priority_high`）。
3. **Events**：—（纯展示）。
4. **States**：按等级映射语义色底 + 文字：`high`→danger、`medium`→warning、`low`→info/中性、`none`→success/中性；高等级含 `priority_high` 图标。
5. **A11y**：等级以**文字词**（"高风险"等）+ 图标 + 色三重表达；不依赖颜色单独传达；对比度 ≥4.5:1。
6. **Data**：`ENT-005 PrivacyScan` 派生风险等级与描述；`ENT-015` riskLabel 文本。不含原始内容。
7. **Tests**：每个 level 渲染对应文字词与色；`high` 含 `priority_high` 图标；移除颜色（仅文本）仍可辨等级（无障碍断言）。
8. **Traceability**：`PAGE-081`/`PAGE-082`、`UI-002`、`NFR-007`（状态非仅颜色）、`ENT-005/015`。

---

## COMP-175 · `ModerationActionBar`（处置动作条）

**metadata** — 落地：共享 `COMP-007 PrimaryButton` + `COMP-008 SecondaryButton` + `COMP-025 ConfirmDialog`（破坏性）；主要 PAGE：`PAGE-081`、`PAGE-082`、`PAGE-084`；引用：`COMP-007`、`COMP-008`、`COMP-025`、`COMP-029`。

1. **用途**：管理员处置动作集合（通过 / 退回·要求修改 / 下架 / 标记处理完毕 / 驳回举报），动作集随状态与风险动态。破坏性动作（下架 / 封禁 / 批量通过）经二次确认 `COMP-178`；退回/下架/封禁**原因必填**（`ASM-051`）；**不自动越过人工同意**（产品边界第 3 条）。
2. **Props**：`reviewItem: ReviewItem`（含 gate、status、source）、`reason?: string`（来自 `COMP-177`，退回/下架/驳回为必填）、`busy?`、`rateLimited?`。
3. **Events**：`onApprove()`（仅 `pass`；`warn` 需显式确认风险已审阅）、`onReturn(reason)`（→ `Submission.ChangesRequested` + 通知 `FR-120`）、`onDelist(reason)`（破坏性 → `COMP-178` → `KnowledgeModule.Delisted/Removed`）、`onDismissReport(reason)`（`Report.dismissed`）、`onResolve(outcome, reason)`（标记处理完毕 / 举报处罚）。
4. **States**：动作集随风险：`block` 行主动作"下架"(danger 文字色)+"退回"，**无"通过"**（`INV-02`）；`pass`/`warn` 行"通过"+"退回"；`in-progress`(disabled+loading) / `rate-limited`(禁用+提示，`NFR-006`) / 必填原因未填时破坏性确认按钮禁用。
5. **A11y**：danger 动作有文字标签 + 图标（非仅红色）；按钮键盘可达、焦点可见；图标按钮 `aria-label`。
6. **Data**：写 `ENT-018 AuditLog`（行动者/动作/目标/时间/原因）；裁决驱动 `ENT-006 Submission` / `ENT-003 KnowledgeModule` / `ENT-014 Report` 状态机。原因写入审计原因字段（`INV-11`）。
7. **Tests**：`block` 项无"通过"按钮（`INV-02`）；下架/退回/驳回缺原因 → 确认禁用（`ASM-051`）；下架触发 `COMP-178`；审计写入失败 → 处置回滚 + 报错（`INV-11`）；速率受限 → 动作禁用（`NFR-006`）；任一处置不自动执行终态（人工裁决）。
8. **Traceability**：`PAGE-081`/`082`/`084`、`FR-100`、`FLOW-005`（评审裁决/举报处理）、`ENT-018/006/003/014`、`INV-02/11`、`NFR-006`、产品边界第 3 条、`ASM-051`。

---

## COMP-176 · `ReviewDetailPanel`（评审详情面板）

**metadata** — 落地：共享 `COMP-009 Card`（sticky 容器）组合 `COMP-024 CodeBlock` + `COMP-179 PrivacyScanFindings` + `COMP-181 ReportDetailCard` + `COMP-177` + `COMP-175`；主要 PAGE：`PAGE-082`、`PAGE-084`；引用：`COMP-009`、`COMP-024`、`COMP-026`、`COMP-029`。

1. **用途**：右栏 sticky 面板，展示选中 `ReviewItem` 的可裁决依据：**Manifest 脱敏摘要**（等宽 JSON，`COMP-024`）+ **PrivacyScan 发现**（`COMP-179`）+ **举报详情**（`COMP-181`，有则显）+ 审核意见输入（`COMP-177`）+ 处置动作（`COMP-175`）。窄屏折叠为抽屉 `COMP-026`（`ASM-049`）。
2. **Props**：`reviewItem?: ReviewItem`（未选中为空）、`manifestSummary`、`scanFindings`、`report?`、`title`（如"正在查看: 私有部署脚本集"）。
3. **Events**：`onSubmitDecision(action, reason)`（透传 `COMP-175`）、`onMarkResolved(reason)`。
4. **States**：`unselected`（引导空态 "从左侧队列选择一项以查看详情"）/ `selected`（Manifest / PrivacyScan / 举报三段按数据条件渲染，无举报隐藏举报段）/ `submitting`(按钮 loading) / `success`(toast + 项移除/状态更新) / `error`(行内)。
5. **A11y**：面板有标题 landmark；Manifest 代码块可键盘聚焦；三段有标题层级；动作键盘可达。
6. **Data**：`ENT-004 Manifest`（**仅清单字段** id/version/entry/env，**绝不展示原始内容/私有 URL**，`INV-04`）、`ENT-005 PrivacyScan`（发现项 + 分级 + 泛化建议）、`ENT-014 Report`、`ENT-015 ReviewItem`、`ENT-018 AuditLog`。**Manifest 渲染前白名单字段过滤**，检测疑似原始内容字段则不渲染并标记异常（`INV-01/04`）。
7. **Tests**：未选中显示引导空态；选中渲染三段；无举报隐藏举报段；Manifest 含非白名单字段 → 不渲染 + 异常标记；存在未读 `block` 且裁决为"通过"时"标记处理完毕"被阻止（`INV-02`）。
8. **Traceability**：`PAGE-082`/`084`、`FR-100`、`FLOW-005`、`ENT-004/005/014/015/018`、`INV-01/02/04`、`UI-001`（JetBrains Mono 等宽）。

---

## COMP-177 · `ReviewNoteInput`（审核意见 / 处置原因输入）

**metadata** — 落地：共享 `COMP-030 FormField`（rhf + zod）+ shadcn Textarea；主要 PAGE：`PAGE-082`、`PAGE-084`、`PAGE-085`；引用：`COMP-030`。

1. **用途**：审核意见 / 处置原因文本域，关联裁决并写入 `ENT-018` 原因字段。对**退回/要求修改/下架/封禁/驳回**为**必填**（`ASM-051`/`INV-11` 精神），对"通过"可空。
2. **Props**：`value: string`、`required: boolean`（按动作类型派生）、`maxLength?`、`placeholder`。
3. **Events**：`onChange(value)`、`onBlur()`（zod 校验）。
4. **States**：`default` / `required-empty`（必填未填，关联动作的确认按钮禁用）/ `error`（校验错误，label 关联）/ `disabled`（提交中）。
5. **A11y**：`label` 与控件关联；错误信息 `aria-describedby`；必填态有文字提示非仅样式。
6. **Data**：文本写入 `ENT-018 AuditLog.note`（原因/结果）；不进 Telemetry（`INV-09`/`NFR-001`，审计与统计分离）。
7. **Tests**：必填动作下空值 → 关联确认禁用且显示错误；"通过"动作下可空；输入写入审计原因字段（mock 断言）。
8. **Traceability**：`PAGE-082`/`084`/`085`、`ENT-018`、`INV-11`、`ASM-051`、`NFR-001`/`INV-09`（不进 Telemetry）。

---

## COMP-178 · `DestructiveConfirmDialog`（破坏性操作二次确认）

**metadata** — 落地：共享 `COMP-025 ConfirmDialog`（shadcn AlertDialog）+ `COMP-177`（高危原因输入）；主要 PAGE：`PAGE-085`（被 `PAGE-080/081/082/084` 触发）；引用：`COMP-025`、`COMP-177`、`COMP-007`、`COMP-008`。

1. **用途**：下架 / 封禁·处罚 / 批量通过执行前的模态二次确认：说明影响、（高危）要求填原因、防误操作、保障人工同意与审计。**对 `COMP-025` 的 admin 治理特化封装**（动作语义 + 必填原因 + 批量集合说明）。
2. **Props**：`action: 'delist'|'ban'|'penalize'|'bulk_approve'`、`targetSummary`（模块名+提交者 / 用户 handle / 批量项数与排除说明）、`impactText`、`requireReason: boolean`（下架/封禁 = true）、`reason?`、`busy?`。
3. **Events**：`onConfirm(reason?)`（执行处置，主色或 danger 实心按动作语义）、`onCancel()`（关闭不执行）。
4. **States**：`default` / `reason-empty`（必填动作确认禁用）/ `executing`(loading) / `success`(关闭 + toast) / `error`(保留对话框 + 错误，不产生"半成功"无审计态)。
5. **A11y**：焦点陷阱 + `Esc` 取消（`NFR-007`）；确认/取消键盘可达；danger 按钮含文字非仅红；标题/描述 `aria` 关联。
6. **Data**：确认即写 `ENT-018`（原因写入，`INV-11`）；`bulk_approve` 仅作用于 `PrivacyScan=pass` 且无未决举报子集，文案显式列条数并排除 `block`/被举报项（`INV-02`/`ASM-050`）。
7. **Tests**：任一破坏性动作执行前必经本对话框；下架/封禁缺原因 → 确认禁用；批量通过文案排除 `warn/block`/被举报项；执行失败保留对话框 + 不产生半成功态；`Esc` 取消。
8. **Traceability**：`PAGE-085`、`FR-100`、`NFR-006`、`NFR-007`、`FLOW-005`、产品边界第 3 条（不越过人类同意）、`ENT-018`、`INV-02/11`、`ASM-050/051`、`UI_RULES.md` 组件行为规则（破坏性二次确认）。

---

## COMP-179 · `PrivacyScanFindings`（PrivacyScan 发现项列表）

**metadata** — 落地：分级条目列表（`COMP-174 RiskLabel` 复用等级标签）；主要 PAGE：`PAGE-082`；引用：`COMP-174`。

1. **用途**：在详情面板内展示 `PrivacyScan` 详细发现：每项含描述 + 分级（高危/中等/低/通过）+ 可选泛化/脱敏建议；分级与队列 `StatusPill` / `RiskLabel` 语义一致。
2. **Props**：`findings: { id; description; severity: 'pass'|'low'|'medium'|'high'; suggestion?: string }[]`。
3. **Events**：—（纯展示；建议可"复制"走 `COMP-024` 内联）。
4. **States**：`default`（按严重度排序）/ `empty`（"无隐私发现"）/ `loading`。
5. **A11y**：每项分级用文字词（"高危"等）+ 图标 + 色；列表语义 `<ul>`；对比度达标。
6. **Data**：`ENT-005 PrivacyScan` 发现项（描述 + 分级 + 泛化建议 + 敏感度声明）。不含原始内容（`INV-01`）。
7. **Tests**：每项渲染分级文字 + 描述；`high` 项含 danger 文字标签与图标；建议存在时渲染且可复制；分级语义与队列一致。
8. **Traceability**：`PAGE-082`、`ENT-005`、`INV-01`、`NFR-007`（分级非仅颜色）、`FLOW-005`（凭扫描发现裁决）。

---

## COMP-180 · `AuditLogList`（审计日志列表，只读）

**metadata** — 落地：共享 `COMP-016 ListRow` + `COMP-032 Pagination/LoadMore`；主要 PAGE：`PAGE-083`；引用：`COMP-016`、`COMP-011`、`COMP-021`、`COMP-032`。

1. **用途**：页面底部紧凑 `ListRow` 列表呈现审计轨迹（时间 / 行动者 / 动作 / 目标 / 原因·结果），治理可追溯、**只读不可编辑或删除**。落实 `ENT-018`/`INV-11`/`FLOW-005`。
2. **Props**：`entries: AuditLog[]`、`paginated?`、`filter?`（可选独立审计页按行动者/动作/时间）。
3. **Events**：`onExpandEntry(id)`（展开/跳转关联 `ReviewItem`/`Module`，`chevron_right`）、`onFilterChange?`、`onLoadMore?`。
4. **States**：`default`（时间倒序，hover 浅灰底）/ `empty`(`COMP-021` "暂无审计记录") / `loading` / `error` / `load-more`；系统行动者 `@system` 与人工 `@admin` 文案区分；高风险目标用语义浅底标签（含文字）。
5. **A11y**：列表语义；行可键盘展开；时间戳等宽可读；目标标签文字非仅颜色；**无任何编辑/删除入口**。
6. **Data**：`ENT-018 AuditLog`（`time`/`actor`/`action`/`target`(仅 ID/标题引用)/`note`）。**目标不展示私有内容**（`INV-04`）；审计内容不进 Telemetry（`NFR-001`，审计与统计分离）。
7. **Tests**：每条含行动者/动作/目标/时间四要素（`INV-11`）；列表无编辑/删除入口（只读）；区分 `@system`/`@admin`；目标仅显示 ID/标题不泄露私有内容；空态显示 EmptyState。
8. **Traceability**：`PAGE-083`、`FR-100`、`NFR-006`、`FLOW-005`（审计合规）、`ENT-018`、`INV-04/11`、`UI-003`（ListRow）。

---

## COMP-181 · `ReportDetailCard`（举报详情卡）

**metadata** — 落地：共享 `COMP-009 Card` + `COMP-011 StatusPill`（举报状态）；主要 PAGE：`PAGE-082`、`PAGE-084`；引用：`COMP-009`、`COMP-011`、`COMP-034`。

1. **用途**：当 `ReviewItem` 来源为 `Report` 时，在详情面板展示举报详情：举报方 handle + 目标引用（模块/用户/交换，**仅引用不含私有内容**）+ 举报原因文本 + 当前状态。承载 `PAGE-084` 举报处置语义（驳回/退回/处罚-下架三类出口，无仲裁）。
2. **Props**：`report: { reporterHandle; targetType: 'module'|'user'|'exchange'; targetRef; reason: string; status }`。
3. **Events**：—（处置动作走 `COMP-175`；本卡仅展示）。
4. **States**：`default` / 状态 `pending`/`dismissed`/`penalized`(下架) 用 StatusPill 文字 + 色 / 目标已被其他处置改变（提示禁用重复终态，由 `COMP-175` 体现）。
5. **A11y**：举报方头像 `Avatar` 有 alt；状态文字非仅颜色；原因文本可读。
6. **Data**：`ENT-014 Report`（举报方/目标类型与引用/原因/状态）；目标为模块时关联 `Manifest` 摘要 + `PrivacyScan`；为用户/交换时仅公开关系引用（`INV-04`）。**不记录举报原文进 Telemetry**（`INV-09`/`NFR-001`）。
7. **Tests**：举报段仅在 `source=report` 渲染；目标仅显示引用不含私有内容；状态用 StatusPill 文字 + 色；无仲裁/申诉 UI（产品边界）。
8. **Traceability**：`PAGE-082`/`084`、`FR-100`（举报处理）、`FLOW-005`（举报是否成立→处罚/下架/驳回）、`ENT-014`、`INV-04`、产品边界（无争议仲裁机制）。

---

## COMP-182~189 · 预留

`COMP-182~189` 预留给 admin 模块后续扩展（如独立审计页 `/admin/audit` 的筛选器组件、用户处罚分级面板 `ASM-052` 升格后、队列批量选择工具条变体等）。当前目标产品范围内 `COMP-170~181` 已覆盖 `PAGE-080~085` 全部特有组件，无需占用预留段。

---

## 模块级组件约定（贯穿 COMP-170~189）

- **共享优先**：风险摘要/队列/详情/审计/确认均**复用** `COMP-014/015/016/024/025` 等共享组件，admin 段组件只做"治理语义编排 + 特有契约"，不重复实现共享底座（`ASM-065`）。
- **状态非仅颜色**（`NFR-007` 硬项）：隐私门三态（`COMP-011`）、风险等级（`COMP-174`）、审计目标标签均含文字 + 图标，移除颜色仍可辨。
- **人工同意不可越过**：所有处置（`COMP-175`/`COMP-178`）为管理员人工裁决，破坏性动作经二次确认；`@system` 自动信号仅进队列等待裁决，不自动执行终态（产品边界第 3 条；审计 `@system` 行可见但不构成处置）。
- **审计闭环**（`INV-11`）：任一处置经 `COMP-177` 原因 → 写 `ENT-018`（`COMP-180` 展示）；写审计失败则处置回滚。
- **零私有内容**（`INV-01/04`）：`COMP-176` Manifest 白名单过滤、`COMP-179`/`COMP-181` 仅展示脱敏/引用。
- **Telemetry 聚合无 PII**（`INV-09`/`NFR-001`）：组件埋点仅维度计数（`admin_*` 事件），不含被处置者身份/Manifest/举报原文。
- **响应式**（`ASM-016`）：两栏（`COMP-173`/`COMP-176`）平板折叠为 Tab/抽屉（`COMP-026`）、移动单列；`DataTable` 窄屏转卡片行。

---

## 本阶段新增假设（未写入 `DEFAULT_ASSUMPTIONS.md`，待编排者登记）

| ID | 假设 | 风险 | 确认 |
| --- | --- | --- | --- |
| `ASM-100` | 组件契约模板取 8 字段（用途/Props/Events/States/A11y/Data/Tests/Traceability），与 `FRONTEND_SPEC §6` 共享组件契约维度（props/events/states/a11y/data/tests）对齐并加用途+追溯 | 若团队定义了不同的固定模板字段，需统一字段 | 组件规格 / 编排者确认 |
| `ASM-101` | `RiskLabel`（`COMP-174`）作为 admin 特有组件独立于共享 `COMP-011 StatusPill`：StatusPill 表"隐私门状态(pass/warn/block)"，RiskLabel 表"风险等级(无/低/中/高)"，二者语义不同故分立 | 若团队希望风险等级也并入 StatusPill 变体，则 `COMP-174` 应降级为 StatusPill 用法而非独立组件 | 组件规格确认 |
| `ASM-102` | `DestructiveConfirmDialog`（`COMP-178`）作为对共享 `COMP-025 ConfirmDialog` 的 admin 治理特化封装（动作语义 + 必填原因 + 批量集合说明），不重复实现对话框底座 | 若 `PAGE-085` 被定位为完全跨模块共享组件，应迁入 `_shared` 段而非 admin 段 | 编排者 / 共享组件归属确认 |

---

## 质量门结果

```text
Gate: 07-frontend-spec-gate（组件规格扇出 · admin 分片）
Status: pass（内容自检）— 待交叉审核 + 用户确认
Evidence:
  - 本文件 aies/02-design/admin/COMPONENTS_SPEC.md（COMP-170~189）
  - 上游对照：FRONTEND_SPEC.md(COMP 段分配/共享库/栈)、admin/PAGE_SPEC.md(PAGE-080~085)、
    UI_RULES.md(UI-001/002/003/004/无障碍底线/破坏性二次确认)、IA_SPEC.md(IA-011 仅管理员)、
    LIGHT_DOMAIN_MODEL.md(ENT-004/005/006/014/015/018, INV-01/02/04/11)、BUSINESS_FLOW.md(FLOW-005)、ID_REGISTRY.md(COMP-*)
Findings:
  - 仅用 admin 段 COMP-170~189，未侵占他模块/共享段；共享组件只引用 ID 不重定义。✅
  - 每个 COMP 含 metadata 行 + 8 字段（用途/Props/Events/States/A11y/Data/Tests/Traceability），均具体。✅
  - COMP-170~181 全量覆盖 PAGE-080~085 特有组件；182~189 预留并说明理由。✅
  - 风险等级有文字标签（COMP-174/179，非仅颜色）；隐私门三态用共享 StatusPill 文字+色。✅
  - 人工同意不可越过（COMP-175/178 破坏性二次确认 + block 不可通过 INV-02）。✅
  - 审计可追溯（COMP-177 原因→ENT-018→COMP-180 只读，INV-11）；零私有内容（COMP-176 白名单/INV-01/04）。✅
  - Telemetry 聚合无 PII（INV-09/NFR-001）；锚定 shadcn+Tailwind+单一图标族（DEC-012/014）。✅
  - 未碰控制/他模块/共享 spec；只写本文件。✅
Decision: 待 spec 交叉审核（COMP ID 唯一性 + 共享引用一致）+ 用户确认 ASM-100~102 → passed
```
