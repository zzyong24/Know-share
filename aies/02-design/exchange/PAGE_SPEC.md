# 页面规格 · exchange 模块（公开交换记录 + 交换详情）

## 摘要

本产物把 `IA-005`（公开交换记录/台账，脱敏）与 `IA-006`（交换详情，含联系方式披露入口）落成可实现的页面契约。视觉真源：`docs/design/know-share-exchange-records.png`（IA-005）、`docs/design/generated/IA-006-exchange-detail.html` + `IA-006-exchange-detail.png`（IA-006，Stitch 高保真页）。字段与状态在 `UI_RULES.md` 令牌/组件（`UI-001/002/003`）下细化；本阶段不做组件级 `COMP-*` 与服务 `API-*` 绑定。

### 产物元数据

- Stage: `08-page-spec`
- Status: `needs-user-confirmation`
- Source inputs: `aies/01-product/PRODUCT_SPEC.md`、`aies/02-design/IA_SPEC.md`、`aies/02-design/UI_RULES.md`、`aies/01-product/LIGHT_DOMAIN_MODEL.md`、`aies/01-product/BUSINESS_FLOW.md`、`aies/00-control/ID_REGISTRY.md`、`docs/design/know-share-exchange-records.png`、`docs/design/generated/IA-006-exchange-detail.{html,png}`
- Upstream IDs: `IA-005`、`IA-006`、`FR-040`、`FR-130`、`FR-050`、`FR-120`、`FLOW-003`、`FLOW-004`、`FLOW-006`、`FLOW-008`、`ENT-007`、`ENT-008`、`ENT-009`、`ENT-010`、`ENT-001`、`ENT-011`、`INV-01`、`INV-03`、`INV-04`、`INV-05`、`INV-06`、`UI-001`、`UI-002`、`UI-003`
- Decision IDs: `DEC-009`（互惠可选/单向）、`DEC-010`（联系方式默认私密、接受后披露）、`DEC-011`（轻后端聚合统计）、`DEC-012`（规范设计系统/图标族）
- 新增假设: `ASM-031`、`ASM-032`、`ASM-033`、`ASM-034`、`ASM-035`（见文末「拟新增假设」；本阶段不改 `DEFAULT_ASSUMPTIONS.md`）
- Manifest status: stage `08-page-spec`（exchange 模块）= `needs-user-confirmation`
- PAGE 段位：`PAGE-030` ~ `PAGE-039`（本模块用 `PAGE-030`、`PAGE-031`）

---

## PAGE 清单

| PAGE ID | 页面名 | Route | 对应 IA | 访问 |
| --- | --- | --- | --- | --- |
| `PAGE-030` | 公开交换记录（脱敏台账） | `/exchanges` | `IA-005` | 公开匿名可看（脱敏） |
| `PAGE-031` | 交换详情 | `/exchanges/:exchangeId` | `IA-006` | 公开可看脱敏面；私域动作（披露/确认/反馈）需登录且为该次参与方 |

---

## PAGE-030 · 公开交换记录（脱敏台账）

### Page purpose

- Field guidance: describe page purpose with concrete names, examples, and source references.
- Current content：作为**公开、可匿名访问的交换台账**，透明披露平台上"谁与谁、就哪类模块、进行到哪个状态、结果如何"的**关系与进度**，但**绝不暴露私有内容**（仓库内容、私有 URL、未披露的联系方式）。它是产品"公共图书馆目录 + 私下握手"心智里"握手记录墙"，让消费方/旁观者据公开记录评估社区活跃度与可信度，并由此进入单次 `交换详情`（`PAGE-031`）。追溯 `IA-005`、`FR-040`、`FLOW-003`、`INV-01/04`。视觉真源：`docs/design/know-share-exchange-records.png`（列表行 + 双方头像 + 交换方向 + 状态药丸 + 平台统计侧栏）。

### Upstream requirement links

- Field guidance: describe upstream requirement links with concrete names, examples, and source references.
- Current content：
  - `IA-005` 交换记录（公开台账）；导航模型「公共主导航·交换记录」；权限敏感界面「公开但匿名可看·交换记录(脱敏)」。
  - `FR-040` 交换请求与公开记录（公开交换台账，不泄露仓库内容）。
  - `FLOW-003` 交换生命周期状态机（状态名以此为准：`Requested→Accepted→PrivatePreparing→Delivered→Completed→WaitingForFeedback→Closed`，异常 `Rejected/Cancelled/Expired/Flagged`）。
  - `ENT-007` Exchange（请求方、目标模块、可选提供模块、生命周期状态、时间戳；不含内容）；`ENT-001` User（双方 GitHub 身份/Verified）；`ENT-011` TrustProfile（信任级别派生，列表内仅作轻量信号）。
  - `INV-01`（平台不存原始内容）、`INV-04`（公开记录不含私有内容/私有 URL）、`INV-05`（offeredModule 可为空 → 单向交换在台账可表达）。
  - `FLOW-008` 平台使用统计（侧栏聚合统计，不含 PII；`DEC-011`/`INV-09`）。
  - UI：`UI-003` 的 `DataTable`/`ListRow`、`StatusPill`、`StatBlock`、`SearchBar`、`EmptyState`；`UI-001` 令牌；`UI-002` Material Symbols Outlined（交换方向 `sync`/`arrow_forward`、状态图标）。`UI_RULES.md`「已覆盖界面还原说明·IA-005」：列表统一 `ListRow`、状态统一 `StatusPill`、交换方向图标用 Material Symbols Outlined。

### Route or surface ID

- Field guidance: describe route or surface id with concrete names, examples, and source references.
- Current content：路由 `/exchanges`（公共主导航「公开交换记录」激活项，对应生成页顶栏 `公开交换记录` 高亮）。Surface = `IA-005`。在 `AppShell`（`UI-003`）内渲染；面包屑根节点。深链接 `?status=accepted`、`?topic=<tag>`、`?q=<keyword>`、`?page=<n>` 用于筛选/分页可分享态。单行点击进入 `PAGE-031`（`/exchanges/:exchangeId`，`exchangeId` 为脱敏展示号如 `#EX-2024-8842`）。

### Data required

- Field guidance: describe data required with concrete names, examples, and source references.
- Current content：
  - **台账列表（每行 = 一次 Exchange，`ENT-007` 脱敏投影）**：脱敏交换号（`#EX-2024-8842`）；请求方与目标方的公开身份（GitHub handle + 头像 + Verified 徽，`ENT-001`/`DEC-006`）；交换方向标记（`sync` 互惠 / `arrow_forward` 单向，由 `offeredModule` 是否为空区分，`INV-05`）；目标模块名 + 主题标签（`ENT-003`/`ENT-020`，仅公开元数据）；可选提供模块名（互惠时）；当前状态（`FLOW-003` 状态，经 `StatusPill` 显示）；时间（发起时间/最近更新，相对+绝对 `title`）；轻量信任信号（双方信任级别派生标记，`ENT-011`，只读不解释）。
  - **筛选/搜索面**：状态筛选标签（按 `FLOW-003` 状态分组：进行中=`Requested/Accepted/PrivatePreparing/Delivered`、已完成=`Completed/Closed`、未成=`Rejected/Cancelled/Expired`；`Flagged` 不在公开面单列，见 Validation）；主题/标签筛选；关键词搜索（按模块名/主题，不搜私有字段）；排序（最新/最活跃）。
  - **平台统计侧栏（`ENT-019` UsageStat 聚合）**：交换总数、进行中数、完成率、热门交换主题 Top N、近期里程碑（聚合、`INV-09` 不含 PII）。对应真源图右侧统计列。
  - **空状态文案数据**（无交换/筛选无结果）。
  - **绝不出现的数据（硬约束）**：原始知识内容、私有仓库 URL/邀请、未经披露的联系方式、私有交付物本身（`INV-01/04`）。

### Actions

- Field guidance: describe actions with concrete names, examples, and source references.
- Current content：
  - 浏览/滚动台账；按状态标签筛选；按主题筛选；关键词搜索；切换排序；分页或加载更多（均反映到 URL 查询参数，可分享）。
  - 点击任一行 → 进入 `PAGE-031` 交换详情（`/exchanges/:exchangeId`）。
  - 点击双方 handle/头像 → 进入对应用户信任档案（`IA-007`，跨模块）。
  - 点击主题标签 → 以该标签过滤台账（或跳发现页同主题，路由由 shell 决定）。
  - 侧栏统计为只读展示（无写操作）。
  - 无登录要求；本页**不含**发起/接受/披露等私域写操作（这些在 `PAGE-031` 或模块详情/个人中心）。

### States

- Field guidance: describe states with concrete names, examples, and source references.
- Current content：
  - **加载态**：`ListRow` skeleton（行级）+ 统计 skeleton。
  - **就绪/默认态**：台账列表（高密度 `ListRow`，hover 高亮，可斑马），每行带 `StatusPill`（状态色映射见下）与交换方向图标。
  - **空态（空注册表）**：`EmptyState`（居中 Material Symbols 图标 + 文案「还没有公开交换记录」+ 说明「交换如何发起」+ 指向发现页/模块详情的 CTA）——对齐 `IA_SPEC.md` 空状态「无交换记录：解释交换如何发起」。
  - **筛选无结果态**：`EmptyState` 变体（「当前筛选无匹配交换」+ 清除筛选动作）。
  - **错误态**：列表加载失败（重试动作）；统计加载失败（统计区降级为占位，不阻塞列表）。
  - **分页/加载更多态**：底部加载指示；末页提示。
  - **StatusPill 状态→语义色映射（`UI-001` 语义色 + 文字，不靠颜色单独传达，`NFR-007`）**：`Requested` info/中性；`Accepted` primary-subtle/warning（"已接受·待交付"，对齐生成页 warning 脉冲点）；`PrivatePreparing`/`Delivered` warning（进行中）；`Completed`/`Closed` success；`Rejected`/`Cancelled`/`Expired` danger 或 muted（未成）。每个 Pill 含状态文字标签。

### Validation and error behavior

- Field guidance: describe validation and error behavior with concrete names, examples, and source references.
- Current content：
  - **脱敏不变量（最高约束）**：渲染前对每行做"零私有内容"校验——任何私有仓库 URL、邀请链接、原始内容、未披露联系方式不得进入 DOM（`INV-01/04`、`FLOW-003`「状态只反映关系与进度」）。若某交换缺少可公开字段，则该字段显示为占位（如"—"），不回退到私有数据。
  - **Flagged/审核中交换**：处于 `Flagged`（举报→`FLOW-005`）的交换不在公开台账暴露争议内容；按 `FLOW-005`「不公开内容」，要么隐藏该行、要么仅显示中性"审核中"状态而不附举报详情（默认隐藏争议明细）。
  - **筛选/搜索校验**：非法/未知状态参数回退到"全部"；空关键词不触发空态错误；URL 参数被规范化。
  - **未成状态语义**：`Rejected/Cancelled/Expired` 仅作状态展示，不展示原因明细（原因属私域/审计，`FLOW-003` 异常分支仅记录原因不公开）。
  - **错误恢复**：列表请求失败显示可重试错误；统计失败不阻断列表（独立降级）。

### Telemetry or analytics

- Field guidance: describe telemetry or analytics with concrete names, examples, and source references.
- Current content：对齐 `FR-140`/`FLOW-008`，仅聚合、**不含 PII**（`INV-09`）。事件：台账页浏览量、筛选/搜索使用频次（按状态/主题维度聚合）、行点击进入详情的转化（聚合计数）、空态/错误态出现频次。侧栏展示的统计本身来自 `ENT-019` UsageStat（交换总数/进行中/完成率/热门主题）。禁止记录"某用户查看了哪条交换"等可关联个人的明细。

### Acceptance checks

- Field guidance: describe acceptance checks with concrete names, examples, and source references.
- Current content：
  1. 匿名（未登录）可打开 `/exchanges` 并看到脱敏台账（`IA-005` 公开可看）。
  2. 每行展示双方公开身份、交换方向（互惠/单向可区分，`INV-05`）、目标模块主题、`FLOW-003` 状态 Pill、时间；**无任何私有内容/私有 URL/未披露联系方式**（`INV-01/04`，DOM 级核验）。
  3. 状态 Pill 的文案与色严格映射 `FLOW-003` 状态名，且状态不仅靠颜色区分（含文字，`NFR-007`）。
  4. 状态/主题/关键词筛选与排序生效且反映到可分享 URL；非法参数被规范化。
  5. 空注册表/筛选无结果显示对应 `EmptyState` 与正确 CTA。
  6. 侧栏统计为聚合值、无 PII；统计失败时列表仍可用。
  7. 点击行进入 `/exchanges/:exchangeId`；点击 handle 进入信任档案。
  8. 键盘可遍历行与筛选控件，焦点态可见（`NFR-007`）。

---

## PAGE-031 · 交换详情

### Page purpose

- Field guidance: describe page purpose with concrete names, examples, and source references.
- Current content：展示**单次交换的完整生命周期**（`FLOW-003` 状态机时间线）、双方身份与信任、可公开的验证摘要、结构化反馈，并承载本模块最关键的私域动作——**联系方式披露**（仅在交换进入 `Accepted` 后，对该次对方可见；用户可选披露哪些、可撤回；撤回只影响未来）与**私下交付通道提示**（默认 GitHub 私有仓库邀请，`ASM-007`，平台只引用状态、不持有内容）。脱敏面公开可看，私域动作仅对登录的该次参与方可用。追溯 `IA-006`、`FR-040`、`FR-130`、`FR-050`、`FLOW-003/004`、`ENT-007/008/009/010`、`INV-01/03/04/06`。视觉真源：`docs/design/generated/IA-006-exchange-detail.html`（左 2/3 时间线+内容摘要+验证摘要+反馈；右 1/3 参与方卡+状态+披露动作+私下交付提示+举报）。

### Upstream requirement links

- Field guidance: describe upstream requirement links with concrete names, examples, and source references.
- Current content：
  - `IA-006` 交换详情（含联系方式披露入口）；权限敏感界面「发起交换/交换详情 `IA-006`：需登录；联系方式仅在 `Accepted` 后对该次对方可见」。
  - `FR-040` 交换生命周期 + 私下交付跟踪（不泄露仓库内容）。
  - `FR-130` 联系方式与私下连接（默认私密、接受后披露、可编辑/撤回）；`DEC-010`。
  - `FR-050`/`FLOW-004` 结构化反馈维度（清单一致性、隐私边界、结构清晰度、有用性、再次交换意愿）；`INV-10`（参与方反馈权重高于社交信号，本页只采集，不计算）。
  - `FLOW-003` 状态机（时间线步骤、`Accepted` 触发披露、`Delivered→Completed` 需双方确认 `INV-06`、`WaitingForFeedback→Closed`）。
  - `ENT-007` Exchange、`ENT-008` ContactInfo、`ENT-009` ContactDisclosure（披露快照，`ASM-013` 撤回只影响未来）、`ENT-010` Feedback、`ENT-001` User、`ENT-011` TrustProfile。
  - `INV-01`（不存内容）、`INV-03`（联系方式默认私密、仅 `Accepted` 后对该次对方披露）、`INV-04`（不含私有 URL）、`INV-05`（offeredModule 可空）、`INV-06`（双方确认完成）。
  - `FLOW-006`/`FR-120`（状态变化/披露/反馈触发通知，跨 `IA-010`）。`ASM-007`（私有交付主通道 GitHub 私有仓库，DM/批准链接为备选）。
  - UI：`UI-003` 时间线（基于布局原则，竖向 step active/completed）、`StatusPill`、`TrustBadge`、`IconChip`、`PrimaryButton`/`SecondaryButton`、`Card`、`ConsentGate`（披露=同意门语义）；`UI_RULES.md` 组件行为规则「联系方式控件默认私密态；披露动作仅在 `Accepted` 后出现」「破坏性/不可逆操作需二次确认」。

### Route or surface ID

- Field guidance: describe route or surface id with concrete names, examples, and source references.
- Current content：路由 `/exchanges/:exchangeId`（如 `/exchanges/EX-2024-8842`）。Surface = `IA-006`。入口：`PAGE-030` 行点击、个人中心（`IA-009`）「收到/发起的交换」列表、通知（`IA-010`）直达链接。面包屑：`公开交换记录 > 交换详情`（对齐生成页 `chevron_right` 面包屑）。布局两栏（生成页：左 `lg:col-span-2` 主区 + 右 `aside` 侧栏；窄屏单列，`ASM-016`）。

### Data required

- Field guidance: describe data required with concrete names, examples, and source references.
- Current content：
  - **交换头**：脱敏交换号（`#EX-2024-8842`）、发起时间（`ENT-007`）。
  - **生命周期时间线（`FLOW-003`）**：步骤序列与各步状态（completed/active/pending）+ 时间戳 + 行为者 handle（"已发起交换·由 @knowledge-trader 发起"/"已接受交换请求·等待双方交付"/"待交付模块"/"完成交换"）。步骤须映射真实状态机（见 States 的步骤↔状态对照）。
  - **交换内容摘要**：目标模块卡（"请求交换"侧：模块名、脱敏摘要、主题、公开评分/信任信号，`ENT-003/004`）；可选提供模块卡（"对等提供"侧，互惠时存在；单向交换此侧显示"未提供对等模块"，`INV-05`）；中间 `sync` 连接标记。**仅公开元数据，无私有内容**（`INV-01/04`）。
  - **验证摘要**：基于**可公开/可引用**信号的核验项——身份已核实（双方 GitHub Verified，`ENT-001`/`DEC-006`）、模块所有权（双方对各自模块的发布/贡献权属引用）、交付物完整性（"待双方在私有通道交付"状态占位）。**注意**：此摘要只引用身份/所有权/状态，**不读取也不展示交付物内容**（`INV-01`）。
  - **参与方卡（右栏）**：双方 GitHub 头像 + handle + Verified/信任徽（`TrustBadge`/`ENT-011`）+ 角色（请求发起方/模块拥有者）+ 公开成功交换次数。
  - **当前状态卡**：`StatusPill`（如"已接受·待交付" warning 脉冲）。
  - **联系方式披露区（`ENT-008/009`，核心）**：当前用户对本次交换的披露状态（未披露/已披露哪些方式）；可披露的联系方式清单（来自本人 `ContactInfo`，类型如 GitHub/邮箱/自定义 IM，`FR-130`）；对方已对我披露的方式（若对方已披露，显示已披露快照 `ENT-009`）；披露动作与撤回动作；披露说明文案（"披露将允许对方查看你选择的 GitHub 邮箱或 IM 账号"）。
  - **私下交付通道提示（`ASM-007`）**：本次约定通道（默认"GitHub 私有仓库邀请"，可为 DM/批准链接备选）；交付指引（"交付后点击『标记为已交付』以开启评价"）。**通道引用为状态/约定文案，不含真实私有仓库 URL/邀请链接**（`INV-04`）。
  - **结构化反馈区（`ENT-010`/`FLOW-004`）**：反馈维度（清单一致性、隐私边界、结构清晰度、有用性、再次交换意愿）、可选公开文本；锁定/开启状态（仅 `Completed`/`WaitingForFeedback` 后开启）。
  - **举报入口**：举报或申诉此交换（`ENT-014`→`FLOW-005`，跨模块）。

### Actions

- Field guidance: describe actions with concrete names, examples, and source references.
- Current content：
  - **公开（任何访客）**：查看时间线、内容摘要（脱敏）、验证摘要、参与方与状态；点 handle 进信任档案；点举报入口（举报本身需登录）。
  - **接受/拒绝交换（仅目标模块所有者，`Requested` 态）**：接受 → 状态转 `Accepted`（触发 `FLOW-006` 通知 + 解锁双方披露入口）；拒绝 → `Rejected`。需 `Consent`（`ENT-021`/`INV-08`）。
  - **撤回请求（仅请求方，`Requested` 态）**：→ `Cancelled`。
  - **披露联系方式（仅该次参与方，仅 `Accepted` 及之后态）**：选择披露哪些方式 → 二次确认（同意门，`NFR-005`/`ConsentGate`）→ 生成 `ContactDisclosure` 快照（`ENT-009`，对该次对方可见）。`INV-03`。
  - **撤回披露（披露方）**：撤回后停止未来披露；**已生成的快照不可收回**（`ASM-013`），UI 明确告知此语义。
  - **标记为已交付 / 确认完成（双方各自，`PrivatePreparing`/`Delivered` 态）**：`Delivered→Completed` 需**双方各自确认**（`INV-06`）；单方点击仅记录己方确认，等待对方。
  - **提交结构化反馈（双方，`Completed`/`WaitingForFeedback` 态）**：填写维度评分 + 可选公开文本 → 提交（`ENT-010`/`FLOW-004`）。
  - **私下沟通通道**：进入约定通道提示；"在线沟通(IM)"按钮仅在对方已披露 IM 类联系方式后有效（否则禁用并提示先完成披露）——把生成页该按钮锚定到 `FR-130`/`ASM-007` 备选通道，避免暗示平台内置 IM 内容。
  - **举报或申诉此交换**：登录后提交举报（`ENT-014`→`FLOW-005`）。

### States

- Field guidance: describe states with concrete names, examples, and source references.
- Current content：
  - **加载/错误态**：整页 skeleton；加载失败重试。
  - **时间线步骤↔`FLOW-003` 状态对照**：步骤1「已发起交换」=`Requested`；步骤2「已接受交换请求·等待双方交付」=`Accepted`/`PrivatePreparing`（active 主色，对齐生成页）；步骤3「待交付/已交付」=`Delivered`；步骤4「完成交换」=`Completed`→`WaitingForFeedback`→`Closed`。异常态（`Rejected`/`Cancelled`/`Expired`/`Flagged`）在时间线显示为终止/中断步骤 + 中性说明（不展示私有原因）。
  - **当前状态卡**：`StatusPill` 随状态变化（"已接受·待交付" warning；"已完成" success；"已拒绝/已取消/已过期" danger/muted；"审核中" 中性，`Flagged`）。
  - **披露区三态**：
    - **锁定态（`Requested` 或非参与方/未登录）**：披露入口隐藏或显示"交换被接受后可披露联系方式"占位（`INV-03`，对齐生成页"披露动作仅 `Accepted` 后出现"）。
    - **可披露态（`Accepted`+ 且为参与方，尚未披露）**：显示「披露联系方式」`PrimaryButton` + 可选方式清单 + 说明文案。
    - **已披露态**：显示我已披露的方式（含快照时间）+「撤回披露」+ 撤回语义说明；若对方也已披露，展示对方披露快照（`ENT-009`）。
  - **反馈区两态**：锁定态（`待交换完成后开启`，灰化，对齐生成页 opacity/grayscale）；开启态（`Completed`+，可填写提交）；已提交态（展示己方反馈，等待/显示对方反馈）。
  - **交付确认态**：未确认 / 己方已确认待对方 / 双方已确认（→`Completed`，`INV-06`）。
  - **角色态差异**：请求方、目标所有者、旁观访客看到的动作集不同（动作按角色 + 状态门控显隐）。

### Validation and error behavior

- Field guidance: describe validation and error behavior with concrete names, examples, and source references.
- Current content：
  - **披露门控（最高约束）**：披露动作在状态 < `Accepted` 时不可用且不渲染真实联系方式（`INV-03`）；仅该次参与方可披露/查看对方披露；非参与方/未登录绝不可见任何联系方式（默认私密，`DEC-010`）。
  - **披露不可收回语义**：撤回前二次确认；撤回后明确提示"已披露的快照对方仍可见，撤回仅停止未来披露"（`ASM-013`/`ENT-009`）。披露动作本身需二次确认（不可逆/隐私敏感，`UI_RULES.md` 组件行为规则）。
  - **同意门**：接受交换、披露联系方式前写入 `Consent`（`INV-08`/`NFR-005`）；缺同意记录则动作被拒。
  - **完成确认**：单方点"确认完成"不直接转 `Completed`，须双方各自确认（`INV-06`）；UI 显示"等待对方确认"。
  - **反馈校验**：反馈仅在 `Completed`/`WaitingForFeedback` 后可提交；窗口到期后台账可 `Closed`，缺失方反馈不可补（`ASM-011`，本页提示窗口状态）。维度评分必填项校验、公开文本长度/敏感内容校验。
  - **零私有内容**：内容摘要、验证摘要、交付提示均做 DOM 级校验，不出现私有仓库 URL/邀请/原始内容（`INV-01/04`）；"在线沟通(IM)"仅在对方披露 IM 后启用，否则禁用并提示。
  - **状态非法跃迁**：UI 只暴露当前状态允许的动作；过期/竞态（如对方已先行动）时刷新状态并提示重试。
  - **错误恢复**：披露/确认/反馈提交失败显示明确错误与重试，且失败不产生部分披露快照。

### Telemetry or analytics

- Field guidance: describe telemetry or analytics with concrete names, examples, and source references.
- Current content：对齐 `FR-140`/`FLOW-008`，仅聚合、**不含 PII**（`INV-09`）。可聚合事件：详情页浏览（聚合）、状态推进计数（按 `FLOW-003` 状态维度，如 Accepted/Completed 数）、披露动作发生次数（聚合计数，**不记录披露了什么、对谁**）、反馈提交率、完成率。**禁止**记录某用户的联系方式内容、披露对象、私有通道引用等任何 PII（`INV-09`/`INV-03`）。状态变化/披露/反馈另触发 `FLOW-006`/`FR-120` 站内通知（属 `IA-010`，非遥测）。

### Acceptance checks

- Field guidance: describe acceptance checks with concrete names, examples, and source references.
- Current content：
  1. 公开访客可看时间线、脱敏内容摘要、验证摘要、参与方与状态；页面**不含**任何私有内容/私有 URL/未披露联系方式（`INV-01/04`，DOM 级核验）。
  2. 时间线步骤与 `FLOW-003` 状态名一一对应；异常态（拒绝/取消/过期/审核中）显示中性说明、不泄私有原因。
  3. 状态 < `Accepted` 时披露入口锁定/不渲染联系方式；进入 `Accepted` 后仅该次参与方可见并可披露（`INV-03`/`DEC-010`）。
  4. 披露需选择方式 + 二次确认 + 写 `Consent`；披露生成 `ContactDisclosure` 快照对该次对方可见（`ENT-009`/`INV-08`）。
  5. 撤回披露仅停止未来披露、已披露快照仍可见，UI 明确告知（`ASM-013`）。
  6. `Delivered→Completed` 需双方各自确认，单方确认显示"等待对方"（`INV-06`）。
  7. 反馈仅在 `Completed`/`WaitingForFeedback` 后开启，含 `FR-050` 五维度；锁定态正确灰化。
  8. 私下交付提示展示约定通道（默认 GitHub 私有仓库邀请）但不含真实 URL/邀请（`INV-04`/`ASM-007`）；"在线沟通(IM)"仅对方披露 IM 后启用。
  9. 遥测仅聚合、无 PII；披露动作不记录内容/对象（`INV-09`/`INV-03`）。
  10. 动作按角色 + 状态门控正确显隐；键盘可达时间线与动作按钮，状态有文字标签（`NFR-007`）。

---

## 拟新增假设（本阶段不改 `DEFAULT_ASSUMPTIONS.md`，仅登记并在返回列出）

| ID | 假设 | 风险 | 确认 |
| --- | --- | --- | --- |
| `ASM-031` | 公开台账与详情页用**脱敏交换号**（如 `#EX-2024-8842`）作为对外标识与路由参数，不暴露内部主键 | 若需更短/不同的对外编号体系，路由与展示需调整 | 服务契约阶段 |
| `ASM-032` | `Flagged`（举报/审核中）交换在公开面**默认隐藏争议明细**（隐藏该行或仅显示中性"审核中"状态），与 `FLOW-005`「不公开内容」一致 | 若产品要求审核中交换完全不可见 vs 显示中性状态，需用户定夺其一 | 用户 / 审核模块对齐 |
| `ASM-033` | 生成页右栏「在线沟通(IM)」按钮**锚定到 `FR-130`/`ASM-007` 备选私有通道**：仅当对方披露了 IM 类联系方式后启用，平台不内置即时通讯内容（守 `INV-01`） | 若期望平台内置 IM，会触碰"平台不承载内容"边界 | 用户确认（建议维持不内置） |
| `ASM-034` | 生成页「自动验证状态」=**仅引用身份/所有权/状态信号的可公开核验摘要**，不读取也不展示交付物内容（守 `INV-01`）；"交付物完整性"仅为状态占位 | 若被实现为读取私有交付物内容，则违反 `INV-01` | 服务契约阶段（明确该校验数据来源） |
| `ASM-035` | 公开台账每行展示的**双方信任级别为只读轻量信号**，详细解释留在信任档案（`IA-007`/`ENT-011`），台账不做信任计算/解释 | 若台账需就地解释信任，信息密度与 `ENT-011` 派生口径需扩展 | 信任模块对齐 |

---

## 质量门自检（gates/06-page-spec-gate.md）

```text
Gate: 06-page-spec-gate
Status: pass（内容检查）— 待用户确认
Evidence:
  - 产物：aies/02-design/exchange/PAGE_SPEC.md
  - 上游对照：IA_SPEC.md(IA-005/006)、PRODUCT_SPEC.md(FR-040/FR-130/FR-050/FR-140)、
    BUSINESS_FLOW.md(FLOW-003/004/006/008 状态机)、LIGHT_DOMAIN_MODEL.md(ENT-007/008/009/010/001/011, INV-01/03/04/05/06)、
    UI_RULES.md(UI-001/002/003 组件与行为规则)、ID_REGISTRY.md
  - 设计真源：docs/design/know-share-exchange-records.png(IA-005)、docs/design/generated/IA-006-exchange-detail.{html,png}(IA-006)
Findings:
  - 两页均含 purpose/data/actions/states/acceptance（9 字段齐备）。✅
  - 每页追溯到 IA-005/006 与 FR/FLOW/ENT/INV；无脱离上游的页面或字段。✅
  - 状态机状态名与 FLOW-003 严格一致（Requested→Accepted→PrivatePreparing→Delivered→Completed→WaitingForFeedback→Closed + 异常）。✅
  - 联系方式：默认私密、仅 Accepted 后对该次对方披露、可撤回但快照不可收回（INV-03/DEC-010/ASM-013）。✅
  - 平台只记录关系与状态、零私有内容（INV-01/04）；私有交付通道仅状态/约定文案（ASM-007）。✅
  - 遥测对齐 FR-140/FLOW-008，聚合无 PII（INV-09）。✅
  - 设计真源中的歧义元素已锚定上游并登记假设：offeredModule 可空→单向(INV-05)、IM 按钮→ASM-033、自动验证→ASM-034。✅
  - 新增假设 ASM-031~021 已标注，未改 DEFAULT_ASSUMPTIONS.md 或其他控制/模块文件。✅
Decision: 待用户确认两页契约与新增假设 → 转 passed → 进入下游（COMP/MOCK/服务契约）
```
