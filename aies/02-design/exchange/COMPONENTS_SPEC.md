# 组件规格 · exchange 模块（公开台账 + 交换详情）

## 摘要

本产物把 `PAGE-030`（公开交换记录/脱敏台账，`IA-005`）与 `PAGE-031`（交换详情，`IA-006`）所需的**模块特有组件**落成可实现的组件契约（`COMP-090`~`COMP-109`）。共享组件（`COMP-001`~`COMP-040`，由 `aies/02-design/_shared/COMPONENTS_SPEC.md` 拥有）**只引用 ID、不重定义**。锚定 `DEC-014` 栈（Next.js + TypeScript + Tailwind + shadcn/ui）、`DEC-012` 单一图标族（Material Symbols Outlined，实现以 `lucide-react` 1:1 等价替换）。所有交换状态名严格对齐 `FLOW-003` 状态机（`Requested → Accepted → PrivatePreparing → Delivered → Completed → WaitingForFeedback → Closed`；异常 `Rejected/Cancelled/Expired/Flagged`）。平台不承载内容（`INV-01`），组件渲染前做"零私有内容"白名单守卫（`INV-04`）。

### 产物元数据

- Stage: `09-frontend-spec`（模块组件规格扇出）
- Status: `passed（2026-06-23 用户签字）`
- Source inputs: `aies/03-frontend/FRONTEND_SPEC.md`、`aies/02-design/exchange/PAGE_SPEC.md`、`aies/02-design/UI_RULES.md`、`aies/02-design/IA_SPEC.md`、`aies/01-product/LIGHT_DOMAIN_MODEL.md`、`aies/01-product/BUSINESS_FLOW.md`、`aies/00-control/ID_REGISTRY.md`、`docs/design/know-share-exchange-records.png`、`docs/design/generated/IA-006-exchange-detail.{html,png}`
- Upstream IDs: `PAGE-030`、`PAGE-031`、`IA-005`、`IA-006`、`FR-040`、`FR-130`、`FR-050`、`FLOW-003`、`FLOW-004`、`FLOW-005`、`FLOW-006`、`ENT-007`、`ENT-008`、`ENT-009`、`ENT-010`、`ENT-001`、`ENT-011`、`INV-01`、`INV-03`、`INV-04`、`INV-05`、`INV-06`、`UI-001`、`UI-002`、`UI-003`、`NFR-007`
- 引用的共享组件（不重定义）: `COMP-011` StatusPill、`COMP-012` TrustBadge、`COMP-015` DataTable、`COMP-016` ListRow、`COMP-021` EmptyState、`COMP-022` TopicChip、`COMP-025` ConfirmDialog、`COMP-029` Toast、`COMP-030` FormField、`COMP-032` Pagination/LoadMore、`COMP-033` Skeleton、`COMP-034` Avatar、`COMP-035` RatingInput、`COMP-036` Timeline、`COMP-027` Tabs、`COMP-009` Card、`COMP-007` PrimaryButton、`COMP-008` SecondaryButton
- COMP 段位: `COMP-090`~`COMP-109`（本模块用 `COMP-090`~`COMP-098`，`COMP-099`~`COMP-109` 预留）
- 新增假设: `ASM-085`~`ASM-088`（见文末；本阶段不改 `DEFAULT_ASSUMPTIONS.md`，仅登记并返回）

> **字段约定（8 字段）**：每个组件按 ① 职责与归属 ② Props/输入 ③ 状态（States） ④ 变体（Variants） ⑤ 无障碍（a11y，`NFR-007`） ⑥ 数据契约（字段白名单 + 不变量守卫） ⑦ 追溯（PAGE/IA/FR/FLOW/ENT/INV） ⑧ 测试要点 描述。

---

## COMP 清单（索引）

| COMP ID | 组件 | 落地（组合的共享组件） | 主要使用 PAGE |
| --- | --- | --- | --- |
| `COMP-090` | `ExchangeLedgerTable`（公开脱敏台账表） | `COMP-015` DataTable + `COMP-016` ListRow + `COMP-011` StatusPill + `COMP-091` + `COMP-034` Avatar + `COMP-022` TopicChip | `PAGE-030` |
| `COMP-091` | `ExchangeDirectionMarker`（互惠/单向方向标记） | Material Symbols `sync`/`arrow_forward` 字形 | `PAGE-030`、`PAGE-031` |
| `COMP-092` | `ExchangeLedgerFilters`（状态/主题/搜索/排序筛选条） | `COMP-027` Tabs + `COMP-022` TopicChip + 搜索输入 | `PAGE-030` |
| `COMP-093` | `ExchangeTimeline`（生命周期时间线） | `COMP-036` Timeline 基元 + `COMP-011` StatusPill | `PAGE-031` |
| `COMP-094` | `ExchangePartyCard`（双方身份/信任卡） | `COMP-009` Card + `COMP-034` Avatar + `COMP-012` TrustBadge | `PAGE-031` |
| `COMP-095` | `ContactDisclosurePanel`（联系方式披露/撤回区） | `COMP-007` PrimaryButton + `COMP-008` SecondaryButton + `COMP-025` ConfirmDialog + `COMP-030` FormField + `COMP-029` Toast | `PAGE-031` |
| `COMP-096` | `PrivateDeliveryNote`（私下交付通道提示） | `COMP-009` Card | `PAGE-031` |
| `COMP-097` | `ExchangeFeedbackSection`（结构化反馈区·状态门控容器） | 嵌入 trust-feedback `COMP-116` FeedbackForm（反馈表单真源）+ 状态门控外壳 | `PAGE-031` |
| `COMP-098` | `ExchangeVerificationSummary`（可公开验证摘要） | `COMP-009` Card + `COMP-011` StatusPill | `PAGE-031` |
| `COMP-099`~`COMP-109` | 预留 | — | — |

---

## COMP-090 · `ExchangeLedgerTable`（公开脱敏台账表）

1. **职责与归属**：渲染公开、可匿名访问的交换台账，每行 = 一次 `Exchange`（`ENT-007`）的脱敏投影，展示"谁与谁、就哪类模块、进行到哪个状态、何时"的关系与进度。落地 `UI-003` `DataTable`/`ListRow`；组合共享 `COMP-015` DataTable（紧凑/hover/表头关联）+ `COMP-016` ListRow + `COMP-011` StatusPill（状态药丸）+ `COMP-091` ExchangeDirectionMarker（方向）+ `COMP-034` Avatar（双方头像）+ `COMP-022` TopicChip（主题）+ `COMP-012` TrustBadge（轻量信任信号，只读）。本组件**不承载内容**（`INV-01`），仅消费脱敏字段。
2. **Props/输入**：`rows: ExchangeLedgerRow[]`、`isLoading: boolean`、`sort: 'latest' | 'mostActive'`、`onRowClick(exchangeId)`（→ `PAGE-031` `/exchanges/:exchangeId`）、`onPartyClick(login)`（→ 信任档案 `IA-007`）、`onTopicClick(tag)`、`density?: 'compact'`（默认 compact）、`zebra?: boolean`。每行 `ExchangeLedgerRow`：`exchangeId`(脱敏号 `#EX-2024-8842`)、`requester{login,avatarUrl,verified,trustLevel}`、`target{login,avatarUrl,verified,trustLevel}`、`direction:'reciprocal'|'oneway'`、`targetModuleName`、`topics:string[]`、`offeredModuleName?`、`status:FlowStatus`、`createdAt`、`updatedAt`。
3. **状态**：加载态（行级 `COMP-033` Skeleton）；就绪/默认态（高密度行 + hover 高亮 + 可斑马）；空注册表态与筛选无结果态委托外层 `COMP-021` EmptyState（本表只在有行时渲染）；错误态（列表请求失败，配重试，由页面壳处理）。`Flagged` 行按 `ASM-032`/`FLOW-005` 默认隐藏或仅显示中性"审核中"——本表接收的 `rows` **已是脱敏后投影**，不在前端做举报明细处理。
4. **变体**：`density='compact'`（默认，对齐高密度台账）；`zebra` 斑马纹开/关；窄屏（`<768px`，`ASM-016`）`DataTable` 转卡片式行（每行折叠为卡片）。
5. **无障碍（NFR-007）**：表头与单元格关联（`scope`/`aria`）；行可键盘聚焦与回车进入详情；状态不仅靠颜色（`COMP-011` 含文字）；方向标记含 `aria-label`（"互惠交换"/"单向请求"）；头像/handle 链接有可读文本。
6. **数据契约（白名单 + 守卫）**：仅接受脱敏字段——`exchangeId`(脱敏号 `ASM-031`/`ASM-085`)、双方公开身份(`ENT-001`/`DEC-006`)、`direction`(由 `offeredModule` 是否为空派生，`INV-05`)、目标/可选提供模块名 + 主题(`ENT-003`/`ENT-020` 公开元数据)、`status`(`FLOW-003`)、时间、`trustLevel`(`ENT-011` 派生只读)。**渲染前守卫**：丢弃并告警任何私有仓库 URL/邀请/原始内容/未披露联系方式字段（`INV-01/04`）；缺失可公开字段以占位 `—` 显示，不回退私有数据。
7. **追溯**：`PAGE-030` · `IA-005` · `FR-040` · `FLOW-003` · `ENT-007/001/003/011/020` · `INV-01/04/05` · `UI-003`。
8. **测试要点**：渲染含双方/方向/状态/时间且 DOM 无私有 URL/内容（`INV-01/04` 断言）；`reciprocal` 与 `oneway` 行可区分（`INV-05`）；状态文案+色严格映射 `FLOW-003`；行点击/handle 点击回调正确路由；键盘遍历与焦点可见；窄屏转卡片行。

---

## COMP-091 · `ExchangeDirectionMarker`（互惠/单向方向标记）

1. **职责与归属**：用单一图标族（`UI-002`/`DEC-012`）字形表达交换方向——互惠 = `sync`、单向 = `arrow_forward`，由 `Exchange.offeredModule` 是否为空区分（`INV-05`）。在台账行（`COMP-090`）与详情双模块卡之间（`PAGE-031`）复用。纯展示基元，不含交互逻辑。
2. **Props/输入**：`direction: 'reciprocal' | 'oneway'`、`size?: 'sm'|'md'`、`tone?: 'muted'|'primary'`。
3. **状态**：无内部态（受控展示）；`reciprocal`→`sync`、`oneway`→`arrow_forward`。
4. **变体**：尺寸 sm/md；色调 muted（台账行内）/ primary（详情连接标记，对齐生成页中间 `sync`）。
5. **无障碍**：图标带 `aria-label`（"互惠交换"/"单向请求"），非仅颜色/形状传达；装饰性容器 `aria-hidden` 由文本兜底。
6. **数据契约**：只入 `direction` 枚举（由上游派生于 `INV-05`）；不接收模块内容。
7. **追溯**：`PAGE-030/031` · `INV-05` · `DEC-009`(互惠可选) · `UI-002` · `ENT-007`。
8. **测试要点**：`reciprocal` 渲染 `sync`、`oneway` 渲染 `arrow_forward`；`aria-label` 与方向一致；仅使用 Material Symbols Outlined 字形（无第二图标族，`DEC-012`）。

---

## COMP-092 · `ExchangeLedgerFilters`（状态/主题/搜索/排序筛选条）

1. **职责与归属**：为台账提供状态分组筛选、主题筛选、关键词搜索与排序，全部反映到 URL searchParams（可分享深链 `?status=&topic=&q=&page=&sort=`）。组合共享 `COMP-027` Tabs（状态分组）+ `COMP-022` TopicChip（主题）+ 搜索输入（shadcn Input）。
2. **Props/输入**：`value:{status?,topic?,q?,sort?}`、`onChange(next)`、`topicOptions:string[]`、`statusGroups`（进行中=`Requested/Accepted/PrivatePreparing/Delivered`、已完成=`Completed/Closed`、未成=`Rejected/Cancelled/Expired`；`Flagged` 不单列，`ASM-032`）、`resultCount?:number`。
3. **状态**：默认/激活筛选态（高亮当前 Tab/Chip）；空关键词不触发空态错误；非法/未知状态参数回退"全部"并规范化 URL。
4. **变体**：桌面横向筛选条；窄屏折叠为下拉/抽屉（`ASM-016`）。
5. **无障碍**：Tabs 用 `aria-selected`/`role=tab`；搜索框 label 关联；当前筛选有 `aria-current`；键盘可遍历全部控件。
6. **数据契约**：只读取/写回 URL 查询维度（状态/主题/关键词/排序/页码）；关键词只搜模块名/主题，**不搜私有字段**（`PAGE-030` Data）。
7. **追溯**：`PAGE-030` · `FLOW-003`(状态分组) · `IA-005` · `INV-04`。
8. **测试要点**：状态/主题/关键词/排序写入并回读 URL；非法 `status` 规范化为"全部"；`Flagged` 不出现在公开筛选项（`ASM-032`）；键盘可达。

---

## COMP-093 · `ExchangeTimeline`（生命周期时间线）

1. **职责与归属**：竖向展示单次交换的 `FLOW-003` 生命周期。组合共享 `COMP-036` Timeline 基元 + `COMP-011` StatusPill。步骤名与状态机**严格一一对应**，异常态显示为终止/中断步骤 + 中性说明（不泄私有原因）。
2. **Props/输入**：`steps: TimelineStep[]`、`currentStatus: FlowStatus`。`TimelineStep`：`key`、`label`、`status:'completed'|'active'|'pending'|'terminated'`、`timestamp?`、`actorLogin?`。
3. **状态**：步骤↔状态对照——步骤1「已发起交换」=`Requested`；步骤2「已接受交换请求·等待双方交付」=`Accepted`/`PrivatePreparing`（active 主色，对齐生成页）；步骤3「待交付/已交付」=`Delivered`；步骤4「完成交换」=`Completed`→`WaitingForFeedback`→`Closed`。异常（`Rejected/Cancelled/Expired/Flagged`）= `terminated` 步骤 + 中性说明。整页加载用 `COMP-033` Skeleton。
4. **变体**：正常推进态 / 异常终止态（`Rejected/Cancelled/Expired`）/ 审核中态（`Flagged` 中性"审核中"）。
5. **无障碍**：每步状态有文字标签（非仅颜色/连线，`NFR-007`）；时间线键盘可达；`active` 步有 `aria-current=step`；时间用相对 + 绝对 `title`。
6. **数据契约**：步骤来源于状态机推进事件与时间戳（`ENT-007`），含行为者 handle（公开身份）；**绝不读取或展示交付物内容**（`INV-01`）；异常分支只显示中性说明、不展示私有原因（`FLOW-003` 异常仅记录不公开）。
7. **追溯**：`PAGE-031` · `IA-006` · `FLOW-003` · `ENT-007` · `INV-01` · `UI-003`(Timeline)。
8. **测试要点**：步骤 label 与 `FLOW-003` 状态名一一映射；异常态显示中性说明不泄私有原因；`active` 步高亮 + `aria-current`；状态有文字标签。

---

## COMP-094 · `ExchangePartyCard`（双方身份/信任卡）

1. **职责与归属**：在详情右栏展示交换双方公开身份与信任信号。组合 `COMP-009` Card + `COMP-034` Avatar（GitHub 头像）+ `COMP-012` TrustBadge（Verified/信任级别）。信任为只读轻量信号，详细解释留信任档案（`ASM-035`/`ENT-011`）。
2. **Props/输入**：`requester:{login,avatarUrl,verified,trustLevel,role:'requester',successfulExchanges}`、`target:{login,avatarUrl,verified,trustLevel,role:'owner',successfulExchanges}`、`onPartyClick(login)`（→ `IA-007`）。
3. **状态**：默认态（双方卡）；加载态（`COMP-033` Skeleton）。角色标签固定（请求发起方 / 模块拥有者）。
4. **变体**：右栏堆叠（桌面）/ 顶部并排（窄屏单列，`ASM-016`）。
5. **无障碍**：头像有 `alt`（handle）；`TrustBadge` 含文字等级（非仅徽形）；handle 为可聚焦链接，`aria-label` 含角色。
6. **数据契约**：仅公开身份字段（GitHub handle/头像/Verified，`ENT-001`/`DEC-006`）+ 派生信任级别（`ENT-011`）+ 公开成功交换次数；**不含联系方式**（联系方式仅在 `COMP-095` 按 `INV-03` 门控）。
7. **追溯**：`PAGE-031` · `IA-006` · `ENT-001/011` · `DEC-006` · `ASM-035`。
8. **测试要点**：渲染双方 handle/头像/角色/信任徽；点击 handle 路由信任档案；卡内**无联系方式字段**；信任级别为文字 + 徽。

---

## COMP-095 · `ContactDisclosurePanel`（联系方式披露/撤回区）★核心

1. **职责与归属**：承载本模块最关键私域动作——联系方式披露与撤回。**仅在交换进入 `Accepted` 及之后、且当前用户为该次参与方**时可用（`INV-03`/`DEC-010`）。组合 `COMP-007` PrimaryButton（「披露联系方式」）+ `COMP-030` FormField（选择披露哪些方式）+ `COMP-025` ConfirmDialog（披露/撤回二次确认，同意门语义）+ `COMP-008` SecondaryButton（「撤回披露」）+ `COMP-029` Toast。披露生成 `ContactDisclosure` 快照（`ENT-009`）。
2. **Props/输入**：`exchangeStatus: FlowStatus`、`viewerRole:'requester'|'owner'|'spectator'`、`isAuthenticated:boolean`、`myContacts: ContactInfo[]`（来自本人，`ENT-008`：`{type:'github'|'email'|'im'|'custom', label, masked}`）、`myDisclosure?: DisclosureSnapshot`（我已披露的方式 + 快照时间，`ENT-009`）、`peerDisclosure?: DisclosureSnapshot`（对方对我的披露快照）、`onDisclose(selectedTypes)`、`onRevoke()`、`onConsentWritten`。
3. **状态（三态，对齐 `PAGE-031`）**：
   - **锁定态**（状态 `< Accepted`，或非参与方/未登录）：披露入口隐藏或显示占位「交换被接受后可披露联系方式」，**不渲染任何真实联系方式**（`INV-03`）。
   - **可披露态**（`Accepted`+ 且为参与方，未披露）：显示「披露联系方式」`PrimaryButton` + 可选方式清单 + 说明文案（"披露将允许对方查看你选择的 GitHub / 邮箱 / IM 账号"）。
   - **已披露态**：显示我已披露的方式（含快照时间）+「撤回披露」+ 撤回语义说明；若对方也已披露，展示对方披露快照（`ENT-009`）。
   提交失败态：明确错误 + 重试，且**失败不产生部分披露快照**。
4. **变体**：披露方式可多选；撤回需 `ConfirmDialog`；披露动作需 `ConfirmDialog`（不可逆/隐私敏感，`UI_RULES` 组件行为规则）。
5. **无障碍**：动作按钮 label 明确；ConfirmDialog 焦点陷阱 + 可读后果说明；方式清单为 label 关联的可选项；键盘可达。
6. **数据契约（最高约束）**：
   - 状态 `< Accepted` 时**不可用且不渲染真实联系方式**（`INV-03`）。
   - 仅该次参与方可披露/查看对方披露；非参与方/未登录绝不可见任何联系方式（默认私密，`DEC-010`）。
   - 披露前写入 `Consent`（`INV-08`/`NFR-005`）；缺同意记录则动作被拒。
   - 撤回语义：撤回前二次确认；撤回后明确提示"已披露的快照对方仍可见，撤回仅停止未来披露"（`ASM-013`/`ENT-009`）。
   - 披露动作不记录"披露了什么、对谁"到遥测（`INV-09`/`INV-03`）。
7. **追溯**：`PAGE-031` · `IA-006` · `FR-130` · `DEC-010` · `ENT-008/009/021` · `INV-03/08/09` · `UI_RULES`(ConsentGate/默认私密)。
8. **测试要点**：状态 `< Accepted` 时锁定且 DOM 无真实联系方式（`INV-03` 断言）；非参与方/未登录不可见联系方式；披露需选方式 + 二次确认 + 写 `Consent`，生成对方可见快照；撤回二次确认 + 明示快照不可收回（`ASM-013`）；提交失败不产生部分快照。

---

## COMP-096 · `PrivateDeliveryNote`（私下交付通道提示）

1. **职责与归属**：提示本次交换约定的平台外私有交付通道（默认 GitHub 私有仓库邀请，`ASM-007`；备选 DM/批准链接）与交付指引。组合 `COMP-009` Card。**通道仅为状态/约定文案，绝不含真实私有仓库 URL/邀请链接**（`INV-04`），平台不内置 IM 内容（`ASM-033`）。
2. **Props/输入**：`channel:'github_private_repo'|'dm'|'approval_link'`、`channelLabel`、`deliveryHint`、`canMarkDelivered:boolean`、`onMarkDelivered()`、`imButtonEnabled:boolean`（仅对方已披露 IM 类联系方式后为 true）、`onOpenIm()`。
3. **状态**：默认提示态；「标记为已交付」按当前状态（`PrivatePreparing`/`Delivered`）门控显隐；「在线沟通(IM)」按钮在对方未披露 IM 时禁用并提示先完成披露（锚定 `FR-130`/`ASM-007` 备选通道，`ASM-033`）。
4. **变体**：通道为 GitHub 私有仓库（默认文案）/ DM / 批准链接。
5. **无障碍**：禁用按钮含 `aria-disabled` + 文字原因；指引文本可读；按钮键盘可达。
6. **数据契约**：仅约定/状态文案，**无真实私有 URL/邀请**（`INV-04`）；IM 按钮仅在 `peerDisclosure` 含 IM 类型后启用，避免暗示平台内置 IM（守 `INV-01`/`ASM-033`）。
7. **追溯**：`PAGE-031` · `IA-006` · `FR-040`/`FR-130` · `ASM-007`(私有通道) · `ASM-033`(不内置 IM) · `INV-01/04`。
8. **测试要点**：渲染约定通道文案但 DOM 无真实仓库 URL/邀请（`INV-04` 断言）；IM 按钮仅对方披露 IM 后启用否则禁用 + 提示；「标记为已交付」按状态门控。

---

## COMP-097 · `ExchangeFeedbackSection`（结构化反馈区）

1. **职责与归属**：交换详情页（`PAGE-031`/`IA-006`）的反馈区**容器**——按 `FLOW-003`/`FLOW-004` 的交换状态门控反馈的可见/可填，并展示对方反馈。**结构化反馈表单本体的唯一真源是 trust-feedback 模块的 `COMP-116 FeedbackForm`**（维度/计权/校验契约归 trust-feedback，`ASM-088`/`ASM-090`、`COMP-116` 嵌入说明）：本组件**嵌入 `COMP-116` 作为填写/提交 surface，不重复组合 `COMP-035`/`COMP-030`/`COMP-007` 自建表单**，仅提供状态门控外壳与对方反馈展示。**本区不计算信任权重**（`INV-10`，权重在信任模块）。
2. **Props/输入**：`exchangeStatus: FlowStatus`、`viewerRole`、`myFeedback?:Feedback`、`peerFeedback?:Feedback`、`windowState:'open'|'closed'`、`onSubmit(payload)`（透传给嵌入的 `COMP-116`）。维度集合（清单一致性、隐私边界、结构清晰度、有用性、再次交换意愿）由 `COMP-116` 契约定义，本容器不另行声明。
3. **状态（两态 + 已提交）**：锁定态（`待交换完成后开启`，灰化/grayscale，对齐生成页 opacity，不渲染 `COMP-116`）；开启态（`Completed`/`WaitingForFeedback` 后嵌入 `COMP-116` 可填写提交）；已提交态（`COMP-116` 转只读 + 展示己方反馈，等待/显示对方反馈）；窗口到期 `Closed` 后缺失方反馈不可补（`ASM-011`，提示窗口状态）。
4. **变体**：锁定 / 开启 / 已提交。
5. **无障碍**：表单维度的 label 关联与键盘可操作由嵌入的 `COMP-116`/`COMP-035` 保证；锁定态有文字说明（非仅 grayscale）；提交后状态有可读反馈。
6. **数据契约**：仅在 `Completed`/`WaitingForFeedback` 后开启 `COMP-116`；维度评分必填校验、公开文本长度/敏感内容校验由 `COMP-116` 承担；提交写 `ENT-010`（`FLOW-004`）；不在本组件做信任计算（`INV-10`）。
7. **追溯**：`PAGE-031` · `IA-006` · `FR-050` · `FLOW-004` · `ENT-010` · `INV-10` · `COMP-116`(反馈表单真源) · `UI-003`(RatingInput)。
8. **测试要点**：锁定态正确灰化 + 文字说明、不可提交且不挂载 `COMP-116`；开启态嵌入 `COMP-116` 且含五维度（`FR-050`）；不自建第二套反馈表单（断言复用 `COMP-116` 而非直接组合 `COMP-035`/`COMP-030`）；提交后展示己方反馈并等待对方；`Closed` 后缺失方不可补（`ASM-011`）。

---

## COMP-098 · `ExchangeVerificationSummary`（可公开验证摘要）

1. **职责与归属**：展示基于**可公开/可引用**信号的核验摘要——身份已核实（双方 GitHub Verified）、模块所有权（发布/贡献权属引用）、交付物完整性（状态占位）。组合 `COMP-009` Card + `COMP-011` StatusPill。**只引用身份/所有权/状态，绝不读取或展示交付物内容**（`INV-01`/`ASM-034`）。
2. **Props/输入**：`items: VerificationItem[]`。`VerificationItem`：`key:'identity'|'ownership'|'delivery'`、`label`、`status:'verified'|'pending'|'na'`、`note?`。
3. **状态**：默认态（核验项列表 + 状态 Pill）；交付物完整性在交付前为 `pending` 状态占位（"待双方在私有通道交付"）；加载态委托页面 Skeleton。
4. **变体**：身份/所有权/交付三类核验项。
5. **无障碍**：每项状态有文字标签（非仅颜色）；Pill 含文字；列表语义清晰。
6. **数据契约**：仅引用可公开核验信号（GitHub Verified `ENT-001`/`DEC-006`、模块所有权引用 `ENT-003`、交付状态 `ENT-007`）；"交付物完整性"仅为**状态占位**，不读私有交付物（`INV-01`/`ASM-034`）；DOM 级零私有内容守卫（`INV-04`）。
7. **追溯**：`PAGE-031` · `IA-006` · `ENT-001/003/007` · `DEC-006` · `INV-01/04` · `ASM-034`。
8. **测试要点**：渲染身份/所有权/交付三项核验且 DOM 无交付物内容（`INV-01` 断言）；交付前"交付物完整性"为状态占位；状态有文字标签。

---

## 拟新增假设（本阶段不改 `DEFAULT_ASSUMPTIONS.md`，仅登记并在返回列出）

| ID | 假设 | 风险 | 确认 |
| --- | --- | --- | --- |
| `ASM-085` | `ExchangeLedgerTable`/`ExchangeTimeline` 消费的是**上游已脱敏的行/步骤投影**（脱敏号、公开身份、状态、时间），举报明细过滤（`ASM-032`/`FLOW-005`）在数据层完成，组件不做举报逻辑 | 若脱敏责任要下沉到组件，组件需额外守卫逻辑 | 服务契约阶段（确认脱敏投影边界） |
| `ASM-086` | 联系方式在前端**仅以脱敏占位/类型标签**呈现可选项，真实值在披露后由后端按 `INV-03` 仅对该次对方返回；`ContactDisclosurePanel` 不缓存对方真实值于公开可达状态 | 若需前端持有明文做交互，须重审隐私边界 | 服务契约阶段 |
| `ASM-087` | `ExchangeTimeline` 的步骤集与四步可视模型（发起/接受/交付/完成）固定，`FLOW-003` 的中间态（`PrivatePreparing`/`WaitingForFeedback`）折叠进相邻可视步骤的子状态，状态名仍严格对齐 | 若需逐状态独立可视步骤，时间线步骤数需扩展 | 用户 / 页面规格对齐 |
| `ASM-088` | 共享组件 `COMP-035` RatingInput 与 `COMP-036` Timeline 在 `_shared/COMPONENTS_SPEC.md` 提供可被 exchange 特化包装的基元 props；本模块仅包装不重定义（`ASM-065`） | 若共享基元 props 不足以支撑五维度/状态机特化，需回填共享规格 | 共享组件规格交叉审核 |

---

## 质量门自检（gates/07-frontend-spec-gate · exchange 组件扇出）

```text
Gate: 07-frontend-spec-gate（exchange 模块组件规格）
Status: pass（内容检查）— 待交叉审核 + 用户确认
Evidence:
  - 产物：aies/02-design/exchange/COMPONENTS_SPEC.md（COMP-090~098；COMP-099~109 预留）
  - 上游对照：FRONTEND_SPEC.md（COMP 段分配 COMP-090~109、共享 COMP-001~040、DEC-014 栈、DEC-012 图标）、
    exchange/PAGE_SPEC.md（PAGE-030/031）、UI_RULES.md（UI-001/002/003 + 组件行为规则）、IA_SPEC.md（IA-005/006）、
    LIGHT_DOMAIN_MODEL.md（ENT-007/008/009/010/001/011、INV-01/03/04/05/06/08/09/10）、
    BUSINESS_FLOW.md（FLOW-003 状态机 / FLOW-004 反馈）、ID_REGISTRY.md
Findings:
  - 每个组件含 8 字段（职责/Props/States/Variants/a11y/数据契约/追溯/测试）。✅
  - 共享组件只引用 ID（COMP-011/012/015/016/021/022/025/027/029/030/032/033/034/035/036/007/008/009），不重定义。✅
  - 仅用本模块段 COMP-090~109（实际 090~098，余预留），无跨段碰撞。✅
  - 状态机命名严格对齐 FLOW-003（Requested→Accepted→PrivatePreparing→Delivered→Completed→WaitingForFeedback→Closed + 异常），ExchangeTimeline 步骤↔状态一一对照。✅
  - 不承载内容（INV-01）：台账/时间线/验证摘要/交付提示均含零私有内容守卫；验证摘要只引用身份/所有权/状态（ASM-034）。✅
  - 联系方式：默认私密、仅 Accepted 后对该次参与方披露、可撤回但快照不可收回、披露写 Consent（INV-03/08、DEC-010、ASM-013）。✅
  - 私有交付通道仅状态/约定文案、无真实 URL（INV-04/ASM-007）；IM 按钮锚定备选通道、平台不内置 IM（ASM-033）。✅
  - 锚定 shadcn + Tailwind + 单一图标族 Material Symbols Outlined（DEC-012/DEC-014）；未碰控制/他模块/共享 spec；仅写本文件。✅
  - 新增假设 ASM-085~088 已标注、未改 DEFAULT_ASSUMPTIONS.md。✅
Decision: 待 spec 交叉审核（共享 COMP 基元 props 充分性）+ 用户确认组件边界 → 转 passed → 进入下游（MOCK_DATA_SPEC / 服务契约）
```
