# 组件规格 · 知识模块详情（module-detail）

## 产物元数据

- Stage: `09-frontend-spec`（组件规格扇出）
- Status: `needs-user-confirmation`
- 模块: `module-detail`（覆盖 `IA-003`；页面 `PAGE-010~015`）
- COMP 段（本模块特有）: `COMP-050~069`（`FRONTEND_SPEC.md` §7 分配，防并行碰撞）
- Upstream IDs:
  - PAGE: `PAGE-010`（详情容器/概览）、`PAGE-011`（来源统计）、`PAGE-012`（隐私边界）、`PAGE-013`（Manifest 预览）、`PAGE-014`（信任侧栏）、`PAGE-015`（请求交换入口）
  - IA: `IA-003`（决策面）；下游 `IA-006`（交换详情）、`IA-007`（信任档案）
  - FR: `FR-020`、`FR-040`、`FR-050`、`FR-060`、`FR-070`、`FR-090`、`FR-110`、`FR-130`、`FR-140`
  - NFR: `NFR-001`、`NFR-002`、`NFR-003`、`NFR-005`、`NFR-006`、`NFR-007`
  - FLOW: `FLOW-002`、`FLOW-003`、`FLOW-005`、`FLOW-007`、`FLOW-008`
  - ENT: `ENT-003`、`ENT-004`、`ENT-005`、`ENT-011`、`ENT-001`、`ENT-012`、`ENT-013`、`ENT-014`、`ENT-007`、`ENT-020`、`ENT-021`
  - INV: `INV-01`、`INV-03`、`INV-04`、`INV-05`、`INV-08`、`INV-09`、`INV-10`、`INV-11`
  - DEC: `DEC-006`、`DEC-009`、`DEC-010`、`DEC-011`、`DEC-012`、`DEC-014`
  - UI: `UI-001`（令牌）、`UI-002`（Material Symbols Outlined）、`UI-003`（规范组件）
  - 本模块页面假设: `ASM-021`、`ASM-022`、`ASM-023`、`ASM-024`、`ASM-025`；新增组件级假设见文末 `ASM-077~080`
- 引用的共享组件（`_shared/COMPONENTS_SPEC.md` 拥有，本文件只引用不重定义）:
  - `COMP-001` AppShell、`COMP-007` PrimaryButton、`COMP-008` SecondaryButton、`COMP-009` Card、
    `COMP-011` StatusPill、`COMP-012` TrustBadge、`COMP-013` IconChip、`COMP-014` StatBlock、
    `COMP-018` DonutChart、`COMP-022` TopicChip、`COMP-024` CodeBlock、`COMP-025` ConfirmDialog、
    `COMP-026` Drawer、`COMP-029` Toast、`COMP-033` Skeleton、`COMP-034` Avatar、`COMP-021` EmptyState

## 摘要

本文件定义 `module-detail` 模块**特有**的前端组件（`COMP-050~069`），落地页面规格 `PAGE-010~015`。所有组件锚定 `FRONTEND_SPEC.md` 的栈（Next.js + TS + Tailwind + shadcn/ui，`DEC-014`）、`UI-001` 令牌、`UI-002` 单一图标族（Material Symbols Outlined，实现期以 `lucide-react` 1:1 替换，`ASM-066`），并复用上表共享组件。核心硬约束：页面只渲染 `ENT-004` Manifest 的**脱敏字段**，绝不出现原始知识内容、私有 URL 或联系方式（`INV-01`/`INV-03`/`INV-04`/`NFR-001`）；同屏唯一主 CTA = 「请求交换」（`UI_RULES`）。

本模块定义 9 个特有组件（`COMP-050~058`），`COMP-059~069` 暂留作扩展（如 Manifest 版本 diff 视图，属领域模型登记的扩展面，非本阶段范围）。

---

## COMP-050 · ModuleDetailLayout（详情页两栏布局容器）

### Component name
- `ModuleDetailLayout`。落地 `PAGE-010` 的桌面两栏决策面骨架：左 ~2/3 主区（模块头 + 摘要 + 来源统计 + Manifest 预览 + 隐私边界）、右 ~1/3 侧栏（信任侧栏 + 请求交换入口）。在 `COMP-001` `AppShell` 之内渲染（路由 `/modules/:moduleId`，`(public)` 段，匿名可访问）。

### Purpose
- 组织 `IA-003` 信息密度最高的决策面分区，保证桌面 `1280px` 居中两栏、`<768px` 单列时侧栏（信任 + CTA）按 `ASM-025` 下沉至摘要/统计之后、Manifest 之前，使「请求交换」在移动端仍高可见（`PAGE-010` 布局、`UI_RULES` 响应式、`ASM-016`/`ASM-025`）。

### Props or inputs
- `moduleId: string`（= `ENT-004.id`，如 `agent-memory-design-patterns`）。
- `slots`: `{ header, summary, sourceStats, manifest, privacy, sidebar }`（React 节点插槽，分别承载 `COMP-051`/摘要/`COMP-052`/`COMP-055`/`COMP-053`/侧栏组合）。
- `lifecycleState: 'Published' | 'Draft' | 'Delisted' | 'NotFound'`（决定渲染分支，对应 `PAGE-010` States 与 `ENT-003` 生命周期）。
- `isOwnerViewing: boolean`（owner 看自己模块，影响 Draft 预览与 CTA，`ASM-021`）。

### Events or outputs
- 无业务事件（纯布局容器）。仅向下传递 `lifecycleState` 决定子区可见性；`Delisted` 时不渲染 `manifest`/`sidebar` 插槽（`FR-090` 下架路径），`Draft` 时整体加「草稿·未公开」标记且仅 owner 可见（`PAGE-010` States）。

### States
- 加载：渲染 `COMP-033` `Skeleton` 占位（模块头 + 统计 + Manifest），不闪烁原始内容（`PAGE-010` 加载态）。
- 就绪（Published）：完整两栏。
- 下架（Delisted/Removed）：仅显「该模块已下架」占位（用 `COMP-021` `EmptyState`），隐藏 Manifest/侧栏/CTA。
- 草稿（Draft）：仅 owner 可见预览，标注草稿、无公开操作。
- 404（NotFound）：`COMP-021` `EmptyState` + 「返回发现」CTA（链 `/`）。

### Accessibility requirements
- 两栏用 `<main>` + `<aside>` 语义标记；单列折叠时 DOM 顺序与视觉顺序一致，键盘 tab 顺序合理（`NFR-007`）。
- 页面主标题用唯一 `<h1>`（模块标题），分区用 `<h2>`，与设计令牌 `--text-display`/`--text-h2` 对应。

### Data dependencies
- `GET /api/modules/:id`（`FR-110`，公开读、零私有内容 `INV-04`）返回的 `ENT-003` + `ENT-004` 脱敏数据；阶段 10 先对接 `MOCK_DATA_SPEC`，形状最终以阶段 15 `SERVICE_CONTRACT` 为准（`ASM-067`）。仅声明形状，不固化契约。
- 字段白名单渲染：异常含敏感字段（私有 URL/邮箱/`contact`）则丢弃并告警（`INV-04`、`FRONTEND_SPEC` §8）。

### Tests
- 单测：四种 `lifecycleState` 各渲染正确分支（Delisted 无 CTA/Manifest；Draft 非 owner 不渲染）。
- 响应式：`<768px` 侧栏 DOM 下沉至 Manifest 之前（`ASM-025`）。
- a11y：唯一 `<h1>`、`main`/`aside` 语义、键盘 tab 顺序断言（`NFR-007`）。

---

## COMP-051 · ModuleSummaryHeader（脱敏摘要头）

### Component name
- `ModuleSummaryHeader`。`PAGE-010` 主区顶部：模块标题 + Verified 标识 + owner handle + 主题标签行 + 脱敏摘要 + 操作行（收藏/认可/举报/复制深链接）。对应设计真源 `know-share-module-detail.png` 模块头「Agent 记忆系统设计模式」。

### Purpose
- 让消费方在 3 秒内读懂「这是什么知识、谁发布、可信吗、能否点开操作」，承载 `FLOW-002` 评估的首屏信息；只展示 `ENT-004` 脱敏 `summary`，绝不展示原始内容（`FR-020`/`INV-01`）。

### Props or inputs
- `title: string`、`summary: string`（脱敏摘要）、`ownerHandle: string`、`githubVerified: boolean`、`topics: Topic[]`（→ `ENT-020`，渲染为共享 `COMP-022` `TopicChip`）、`updatedAt: string`、`moduleType: string`。
- `isAuthenticated: boolean`（决定操作类按钮点击是否触发登录引导，`FLOW-007`）。
- `socialState`: `{ favorited: boolean; endorsed: boolean; rateLimited: boolean }`（`ENT-013`，`FR-070`）。
- `isOwnerViewing: boolean`（owner 隐藏举报、收藏自身等无意义操作）。

### Events or outputs
- `onToggleFavorite()` / `onToggleEndorse()`（`ENT-013` SocialSignal mutation，`FR-070`；favorite 唯一性 `INV-07` 由后端保证，前端乐观更新）。
- `onReport()`（打开举报流，二次确认走 `COMP-025` `ConfirmDialog`，写 `AuditLog` `INV-11`，速率限制 `NFR-006`）。
- `onCopyDeepLink()`（复制 `/modules/:moduleId`，成功触发 `COMP-029` `Toast`）。
- `onTopicClick(topicId)`（回发现页带筛选，链 `/?topic=...`，`FR-010`）。
- 未登录时上述写操作不静默失败：触发 GitHub 登录引导（`NFR-005`/`DEC-006`/`PAGE-010` Validation）。

### States
- 就绪、未登录（操作按钮可见、点击转登录）、owner 自看（收藏/举报隐藏或禁用）、速率受限（收藏/举报禁用 + 提示，`NFR-006`）、缺字段（无 `moduleType`/`updatedAt` 时隐藏该元信息而非显空）。

### Accessibility requirements
- Verified 用 `COMP-011` `StatusPill`（success 色 + 文字「GitHub Verified」+ Octocat 品牌例外图标，`UI-002`），非仅颜色（`NFR-007`）。
- 操作图标按钮（收藏/认可/举报/复制）均有 `aria-label`；收藏/认可的激活态用 `aria-pressed`。
- 标题为页面 `<h1>`（与 `COMP-050` 协调，本组件接受 `as="h1"`）。

### Data dependencies
- `ENT-003`（title/type/updated_at）、`ENT-004`（summary/topics）、`ENT-001`（owner_handle/githubVerified）、`ENT-013`（社交计数与本人状态）。读 `FR-110`/`FR-140`。

### Tests
- 仅渲染 `summary` 脱敏文本，断言不出现原始内容标记/私有 URL（`INV-01/04`）。
- 未登录点收藏 → 触发登录引导回调而非 mutation（`FLOW-007`）。
- Verified=true 渲染 success StatusPill + 文字 + Octocat；=false 不渲染（`PAGE-014` 一致）。
- a11y：所有图标按钮有 `aria-label`，激活态 `aria-pressed`。

---

## COMP-052 · SourceStatsPanel（来源统计与覆盖度区）

### Component name
- `SourceStatsPanel`。落地 `PAGE-011`：组合共享 `COMP-018` `DonutChart`（来源类型分布）+ 4 个共享 `COMP-014` `StatBlock`（设计图示例 `23 / 12 / 8 / 18.7k`）+ `freshness` 的 `COMP-011` `StatusPill`/`COMP-013` `IconChip`。位于 `#stats` 锚点。

### Purpose
- 让消费方在不看原始内容时估算「价值密度 + 活跃度」：来源构成、覆盖问题数、主题数、交换次数、浏览/收藏聚合（`PAGE-011`、`FR-020`/`FR-140`）。

### Props or inputs
- `sourceTypes: { label: string; ratio: number }[]`（`ENT-004.source_types`，喂给 `COMP-018` `DonutChart`，主色 + 语义色分段）。
- `stats`: 4 项 `{ icon, label, value }`，标签映射「覆盖问题数 / 主题数 / 交换次数 / 浏览或收藏」（`ASM-022`），值取 `covered_questions.length` / `topics.length` / `ENT-003.exchangeCount` / `viewCount|favoriteCount`。
- `freshness: string`（如「actively maintained」）。

### Events or outputs
- `onTopicClick(topicId)`（同 `COMP-051`，点主题回发现筛选，`IA-002`）。
- `DonutChart` 分段悬停由共享组件内处理；本组件保证同时渲染文字图例（`NFR-007`）。

### States
- 加载（图表骨架，复用 `COMP-033`）、就绪、空（无 `source_types` → 隐藏环形图，仅显计数；缺计数显 `0` 不显空白，`PAGE-011` Validation）、错误。

### Accessibility requirements
- 环形图必配文字图例（来源类别 + 占比），不仅靠颜色（`NFR-007`）；每个 `StatBlock` 有 Material Symbols Outlined 图标 + 文字标签 + 大数字（`--text-stat`）。
- 占比和 ≠ 100% 时归一化渲染并以图例兜底（`PAGE-011`）。

### Data dependencies
- `ENT-004`（source_types/covered_questions/freshness）、`ENT-003`（派生计数 exchangeCount/viewCount/favoriteCount，聚合无 PII `INV-09`）。

### Tests
- 无 `source_types` 时不渲染 DonutChart、仅渲染计数。
- 计数缺失渲染 `0`。
- a11y：DonutChart 有文字图例；StatBlock 图标 + 标签 + 数字齐全。
- 数字均为聚合派生，断言无 PII 字段（`INV-09`）。

---

## COMP-053 · PrivacyBoundaryCard（隐私边界与内容承诺卡）

### Component name
- `PrivacyBoundaryCard`。落地 `PAGE-012`（`#privacy` 锚点），基于共享 `COMP-009` `Card`：敏感度声明 + 隐私门分级摘要 + 脱敏说明 + 内容承诺 + 举报/可审计规则入口。Know-share 信任叙事「公开的只是脱敏清单」的可见化。

### Purpose
- 显式展示「平台不托管原始内容」的隐私边界，让用户在评估时看到 Know-share 的隐私承诺（`FR-090`、`INV-01`、`README` 核心理念）。

### Props or inputs
- `sensitivity: 'low' | 'medium' | 'high'`（→ `COMP-011` `StatusPill` 语义色 + 文字）。
- `privacyGate: 'pass' | 'warn'`（已发布态只可能 pass/warn；`block` 不可发布 `INV-02`）+ `gateExplanation: string`（一句话解释，不含原始扫描发现明细 `INV-01`）。
- `redactionNotes?: string`（脱敏说明，缺失时显默认承诺文案）。
- `contentCommitment?: string`（内容承诺文案，`HARD-07`；`ASM-023`：若数据契约不设该字段则仅显 `redactionNotes`）。
- `auditRulesUrl: string`（外链 `IA-013` 仓库/规则，`NFR-004`）。
- `isAuthenticated: boolean`。

### Events or outputs
- `onReport()`（同 `COMP-051` 举报动作，二次确认 `COMP-025`，速率限制 `NFR-006`；未登录触发登录引导）。
- `onViewAuditRules()`（外链 `IA-013`，新标签打开，`NFR-004`）。

### States
- 就绪（pass/warn 两态语义色）、字段缺失（无 `redactionNotes` 显默认承诺）、未登录（举报触发登录）。

### Accessibility requirements
- 敏感度/隐私门等级用 `StatusPill` + 文字，非仅颜色（`NFR-007`）。
- 外链按钮标注「在新标签打开」语义（`aria-label` 含外链说明）。

### Data dependencies
- `ENT-005` PrivacyScan **仅分级摘要**（pass/warn + sensitivity，绝不取原始发现明细，`INV-01`）、`ENT-004`（sensitivity/redaction_notes/content commitment）。

### Tests
- 断言区内永不渲染原始扫描命中/私有路径样例/原始内容（`INV-01/04`）——核心隐私不变量断言。
- 无 `redactionNotes` 显默认承诺文案。
- 未登录举报触发登录引导。
- a11y：敏感度 + 隐私门用 StatusPill + 文字。

---

## COMP-054 · ManifestPreview（脱敏 Manifest JSON 预览）

### Component name
- `ManifestPreview`。落地 `PAGE-013`（`#manifest` 锚点），包裹共享 `COMP-024` `CodeBlock`（等宽 `JetBrains Mono` + 复制）：渲染脱敏 `ENT-004` Manifest JSON，供 agent/开发者直读（`NFR-002`）。对应设计图右中代码面板「Manifest」。

### Purpose
- 以结构化清单形式公开模块的脱敏元数据，是 agent 可读的核心载体（`FR-020`/`NFR-002`），同时强制屏蔽 PII（`contact`）以守隐私边界。

### Props or inputs
- `manifest: object`（脱敏 Manifest：id/title/summary/topics/tags/language/owner_handle/exchange_intent/sensitivity/covered_questions/source_types/freshness/redaction_notes/private_exchange_options/license/updated_at/version）。
- `viewMode: 'compact' | 'full'`（预览/完整切换，`FR-020`「清单预览/完整视图」）。
- 内部**强制屏蔽** `contact` 及任何私有字段：组件在渲染前过滤白名单外字段（`ASM-024`，`INV-03/04`/`DEC-010`/`FR-130`）——即使 API 误传 `contact` 也不显示（`FR-110` 输出检查兜底）。

### Events or outputs
- `onCopy()`（复制 JSON，用 `COMP-008` `SecondaryButton` + `content_copy` 图标，成功触发 `COMP-029` `Toast`）。
- `onToggleView()`（切 compact/full）。

### States
- 加载（代码骨架，复用 `COMP-033`）、就绪、长内容滚动、复制成功 toast、错误（无法加载 → `COMP-021` `EmptyState`）。

### Accessibility requirements
- JSON 区可键盘聚焦 + 复制；复制按钮 `aria-label`「复制 Manifest JSON」（`NFR-007`）。
- 等宽字体保证结构可读（`UI-001` JetBrains Mono）。

### Data dependencies
- `ENT-004` 完整脱敏 Manifest（形状以 `examples/knowledge-module.manifest.json` 为准；与 `FR-110` API 输出同源同形）。

### Tests
- **核心隐私断言**：传入含 `contact`/私有 URL 的 manifest，渲染输出中绝不含这些字段（`ASM-024`/`INV-03/04`）。
- 复制按钮 → 触发 onCopy + toast。
- compact/full 切换渲染差异。
- a11y：代码块可键盘聚焦、复制按钮有 `aria-label`。

---

## COMP-055 · TrustSignalAside（信任信号与贡献者侧栏）

### Component name
- `TrustSignalAside`。落地 `PAGE-014`（右侧栏，位于 `COMP-056` CTA 上方）：贡献者 GitHub 身份卡（`COMP-034` `Avatar` + Verified `StatusPill`）+ 信任级别（`COMP-012` `TrustBadge`）+「信任如何形成」可展开解释 + 社交计数 + 跳档案链接。对应设计图右上 `@knowledge-trader` 身份卡。

### Purpose
- 让用户在发起交换前评估对方可信度，并体现「参与方反馈权重 > 社交信号」（`FR-050`/`FR-060`、`INV-10`）。

### Props or inputs
- `owner`: `{ handle, githubVerified, avatarUrl, joinedAt, creditScore, badges: Badge[] }`（`ENT-001`/`ENT-012`）。
- `trustLevel: string` + `trustExplanation: string`（`ENT-011` 派生，解释基于交换历史/反馈质量/验证/举报，`INV-10`）。
- `socialCounts`: `{ favorites: number; endorsements: number }`（`ENT-013`，权重低于参与方反馈，视觉上次要）。

### Events or outputs
- `onOpenProfile()`（跳贡献者信任档案 `IA-007`，链 `/u/:handle`，`FR-060`）。
- `onToggleTrustExplainer()`（展开/收起「信任如何形成」，可用共享 `COMP-026` `Drawer` 或就地折叠；聚合事件 `trust_explainer_opened` `INV-09`）。

### States
- 就绪、无信任历史（显「信任随交换积累」引导文案，不显 `0` 误导，`PAGE-014` 空状态）、未验证（无 Verified 徽、显普通身份）、加载、错误。

### Accessibility requirements
- Verified 用 success 色 + 文字 + Octocat 品牌例外（`UI-002`/`NFR-007`）。
- 「信任如何形成」展开控件键盘可达，`aria-expanded` 标注状态。
- 社交计数视觉与语义层级低于信任级别（`INV-10`）。

### Data dependencies
- `ENT-001`（owner 身份/creditScore/badges）、`ENT-011`（trustLevel + 解释，派生只读）、`ENT-013`（社交计数）、`ENT-012`（badges）。

### Tests
- 无信任历史显引导文案而非 `0`（`PAGE-014` Validation）。
- Verified=false 不渲染 Verified 徽。
- 信任级别视觉权重 > 社交计数（`INV-10` 体现）。
- a11y：解释展开 `aria-expanded`、Verified 文字 + 色。

---

## COMP-056 · RequestExchangeCTA（请求交换入口）

### Component name
- `RequestExchangeCTA`。落地 `PAGE-015`（右侧栏主色按钮 + 「Request/Contact Commitment」说明区）：详情页核心转化动作，基于共享 `COMP-007` `PrimaryButton`，连 `FLOW-003`。对应设计图右侧栏主色「请求交换」按钮。

### Purpose
- 把「可发现」转为「发起交换请求」，进入交换生命周期（`FR-040`/`FLOW-003`）；支持单向请求（`DEC-009`/`INV-05`）；本页**绝不披露联系方式**（`INV-03`/`DEC-010`）。

### Props or inputs
- `moduleId: string`（预填请求目标 `ENT-007.targetModule`）。
- `exchangeIntent?: string`（来自 Manifest，提示对方期望的交换方向，辅助决策）。
- `isAuthenticated: boolean`、`isOwnerViewing: boolean`（owner 看自己 → 隐藏/禁用 CTA，`ASM-021`）。
- `activeExchange?: { exchangeId: string }`（对该模块已有进行中交换 → CTA 改为「查看进行中的交换」跳 `IA-006`，`ASM-021`）。
- `contactCommitmentText?: string`（**说明性占位/锁定态**文案，`ASM-021`；绝不接受/渲染真实联系方式）。

### Events or outputs
- `onRequestExchange()`：未登录 → GitHub 登录引导（`DEC-006`/`FLOW-007`）；已登录 → 进入交换创建流（`/exchanges/new?target=:moduleId`，落 `IA-006`，途中经同意门写 `Consent` `INV-08`/`NFR-005`，可选附自有模块 `DEC-009`）。本组件只传 `target`，不加载用户可提供模块列表（在交换创建流加载）。
- `onViewActiveExchange()`（有活动交换时跳 `IA-006`，避免重复新建，`FLOW-003`）。
- 聚合事件 `exchange_cta_clicked` / `exchange_request_started`（无对手方 PII，`INV-09`/`NFR-001`）。

### States
- 未登录（CTA 可见、点击转登录）、已登录（CTA 可用）、owner 自看（隐藏/禁用 + 说明）、已有活动交换（改「查看进行中的交换」）、加载、错误。

### Accessibility requirements
- 唯一主色实心 `PrimaryButton`（同屏不出现第二个等权主 CTA，`UI_RULES`）。
- 「Contact Commitment」锁定态用文字 + 锁图标说明「接受交换后披露」，非仅图标（`NFR-007`）；移动端 CTA 仍高可见（`ASM-025`）。

### Data dependencies
- `ENT-007`（创建入口、targetModule）、`ENT-004.exchange_intent`、`ENT-021` Consent（创建前置，本组件不直接写，交由交换创建流）。本页**不读** `ENT-008` ContactInfo（`INV-03`）。

### Tests
- **核心隐私断言**：本组件绝不渲染任何真实联系方式，`contactCommitmentText` 仅占位文案（`INV-03`/`ASM-021`）。
- 未登录点击 → 登录引导回调，不发起创建（`FLOW-007`）。
- owner 自看 → CTA 禁用/隐藏（`ASM-021`）。
- 有 `activeExchange` → 渲染「查看进行中的交换」跳 `IA-006`。
- 单 CTA 不变量：同屏唯一主色实心按钮（`UI_RULES`）。

---

## COMP-057 · ModuleActionBar（模块操作行 · 可选拆出）

### Component name
- `ModuleActionBar`。`PAGE-010` 操作行的可拆分子组件：收藏/认可/举报/复制深链接的图标按钮组，供 `COMP-051` `ModuleSummaryHeader` 内嵌或在窄屏独立成行复用。

### Purpose
- 把社交/举报/复制操作收敛为一致的可复用动作条，统一未登录引导与速率限制行为，避免在 header 与移动端重复实现（`FR-070`/`FR-090`/`FLOW-007`）。

### Props or inputs
- `socialState: { favorited, endorsed, rateLimited }`、`isAuthenticated: boolean`、`isOwnerViewing: boolean`、`canReport: boolean`。

### Events or outputs
- 透传 `onToggleFavorite` / `onToggleEndorse` / `onReport` / `onCopyDeepLink`（语义同 `COMP-051`）；未登录统一触发登录引导（`FLOW-007`）。

### States
- 就绪、未登录、owner 自看（举报禁用）、速率受限（禁用 + 提示，`NFR-006`）。

### Accessibility requirements
- 每个图标按钮有 `aria-label`；toggle 类用 `aria-pressed`；操作组用 `role="toolbar"` + 键盘左右切换（`NFR-007`）。

### Data dependencies
- `ENT-013`（社交状态/计数）、`ENT-014`（举报创建，写 `AuditLog` `INV-11`）。

### Tests
- 未登录所有写操作触发登录引导。
- 速率受限时禁用 + 提示（`NFR-006`）。
- a11y：`role="toolbar"`、键盘可达、`aria-pressed`/`aria-label` 完整。

---

## COMP-058 · ReportModuleDialog（举报模块对话框）

### Component name
- `ReportModuleDialog`。基于共享 `COMP-025` `ConfirmDialog`（破坏性/敏感二次确认）的模块举报表单：原因选择 + 可选说明 + 二次确认。供 `COMP-051`/`COMP-053`/`COMP-057` 的举报动作复用。

### Purpose
- 落地 `PAGE-010`/`PAGE-012` 的「举报模块」动作（`ENT-014` Report，`FR-070`/`FR-090`/`FLOW-005`），强制身份核查 + 速率限制 + 二次确认，并写 `AuditLog`（`NFR-006`/`INV-11`）。

### Props or inputs
- `moduleId: string`、`open: boolean`、`reasons: { id, label }[]`（举报原因枚举）。
- `isAuthenticated: boolean`、`rateLimited: boolean`。

### Events or outputs
- `onSubmit({ reasonId, note? })`（创建 `ENT-014`，受速率限制，超限禁用提交 `NFR-006`；成功 `Toast` + 聚合事件 `report_submitted` `INV-09`）。
- `onCancel()`。
- 未登录打开时直接触发登录引导而非表单（`FLOW-007`/`NFR-005`）。

### States
- 关闭、打开（表单）、提交中、提交成功（toast + 关闭）、速率受限（提交禁用 + 提示）、未登录（转登录）、校验错误（未选原因）。

### Accessibility requirements
- 对话框 `role="dialog"` + `aria-modal`，焦点陷入与归还（shadcn AlertDialog 底座保证）；原因单选组键盘可达、label 关联（`NFR-007`）。
- 破坏性/敏感动作显式二次确认（`UI_RULES`）。

### Data dependencies
- `ENT-014` Report（创建）、`ENT-018` AuditLog（写入 `INV-11`）。聚合 telemetry 无 PII（`INV-09`）。

### Tests
- 未选原因 → 提交禁用/校验错误。
- 速率受限 → 提交禁用 + 提示（`NFR-006`）。
- 提交成功 → toast + 关闭 + 聚合事件。
- a11y：焦点陷入、`aria-modal`、原因组键盘可达。

---

## COMP-059 ~ COMP-069 · 预留

- 暂未使用，保留给本模块后续扩展：如 **Manifest 版本 diff 视图**（`ManifestDiffViewer`，对应 `PAGE-016~019` 预留子区与领域模型「模块版本/清单 diff」开放问题），属目标产品扩展面，非本阶段范围（`LIGHT_DOMAIN_MODEL` 开放建模问题、`PAGE_SPEC` 拆分理由）。引入时沿用本段编号，不占用其他模块段。

---

## 新增组件级假设（本模块，未修改 `DEFAULT_ASSUMPTIONS.md`）

| ID | 假设 | 依据 | 风险 | 确认 |
| --- | --- | --- | --- | --- |
| `ASM-077` | 8 字段组件契约模板取自 `product-to-code-orchestrator/templates/COMPONENTS_SPEC_TEMPLATE.md`（任务给定路径下未实体化该模板，故引用 skill 内规范模板的 8 字段：Component name / Purpose / Props / Events / States / Accessibility / Data / Tests） | skill 模板、`FRONTEND_SPEC` §6（props/events/states/a11y/data/tests） | 若团队最终模板字段不同，需按新字段重排（不影响内容） | 组件规格/编排者确认 |
| `ASM-078` | 举报动作复用共享 `COMP-025` `ConfirmDialog` 作底座，封装为本模块 `COMP-058` `ReportModuleDialog`（含原因表单），而非新建独立对话框基元 | `UI_RULES`「破坏性操作二次确认」、`PAGE-010/012` 举报动作 | 若 `_shared` 已提供通用 ReportDialog，则 `COMP-058` 降级为薄封装或删除 | 与 `_shared` 组件规格交叉审核 |
| `ASM-079` | `ModuleActionBar`（`COMP-057`）作为可复用动作条从 header 拆出，供桌面 header 内嵌与移动端独立成行复用 | `ASM-025` 移动端布局、`FR-070` 多处复用 | 若实现上直接内联进 header 更简单，可合并回 `COMP-051`（不影响契约） | 前端实现确认 |
| `ASM-080` | 「信任如何形成」解释优先就地折叠展开；信息量大时升级为共享 `COMP-026` `Drawer` | `PAGE-014` Actions、`FR-050` 页面层解释 | 若设计要求始终抽屉，固定用 `COMP-026` | 设计/前端实现确认 |

---

## 阻塞 / 待确认项

- 非阻塞：`ASM-021`（联系方式占位语义，关乎 `INV-03` 合规）与 `ASM-023`（内容承诺字段）继承自 `PAGE_SPEC`，待用户/设计与服务契约阶段确认；本组件规格已按「占位/锁定、绝不渲染真实联系方式」与「字段缺失降级」实现，合规侧偏保守。
- 非阻塞：共享组件 `COMP-024` `CodeBlock`、`COMP-018` `DonutChart`、`COMP-025` `ConfirmDialog` 等的最终 props 契约由 `_shared/COMPONENTS_SPEC.md` 拥有；本文件按 `FRONTEND_SPEC` §6 索引引用，若共享契约与此处假定不符需回填引用处（标记追踪，不阻塞）。
- 无硬阻塞。

---

## 质量门结果（gate 07 自检）

```text
Gate: 07-frontend-spec-gate（module-detail 组件规格扇出）
Status: pass（内容自检）— 待交叉审核 + 用户确认
Evidence: aies/02-design/module-detail/COMPONENTS_SPEC.md 对照 FRONTEND_SPEC.md(§6/§7/栈/令牌/图标)、
  PAGE_SPEC.md(PAGE-010~015)、UI_RULES.md(UI-001/002/003)、IA_SPEC.md(IA-003)、
  LIGHT_DOMAIN_MODEL.md(ENT-003/004/005/011 与 INV-01/03/04/05/08/09/10/11)、ID_REGISTRY.md、
  COMPONENTS_SPEC_TEMPLATE.md(8 字段)
Findings:
  - 9 个特有组件 COMP-050~058 均含 8 字段（name/purpose/props/events/states/a11y/data/tests）；COMP-059~069 预留并说明扩展面。✅
  - COMP 段严格落在分配区间 COMP-050~069，不越界占用他模块段。✅
  - 每组件追溯 PAGE-010~015 / IA-003 / FR-020/040/050/060/070/090/110/130/140 / ENT-* / INV-*；共享组件只引用 ID 不重定义。✅
  - 只展示脱敏内容：ManifestPreview 屏蔽 contact(ASM-024/INV-03/04)、PrivacyBoundaryCard 不渲染原始扫描发现(INV-01)、RequestExchangeCTA 不披露联系方式(INV-03/DEC-010)，均写成测试断言。✅
  - 单一主 CTA(请求交换)、StatusPill+文字非仅颜色、Material Symbols Outlined 单一族、等宽 JSON、12px 圆角——锚定 UI-001/002/003 与 shadcn+Tailwind(DEC-014)。✅
  - 同意门(INV-08)/登录引导(FLOW-007)/举报二次确认+速率限制(NFR-006/INV-11)/聚合无 PII(INV-09) 均落到组件契约。✅
  - 新增 4 条组件级假设(ASM-077~080)就地标注，未改 DEFAULT_ASSUMPTIONS.md。✅
  - 未碰控制文件/他模块/FRONTEND_SPEC/共享 spec；只写本文件。✅
Known risks: ASM-021(联系方式占位语义,关乎 INV-03)、ASM-023(内容承诺字段待数据契约)、共享组件最终 props 契约由 _shared 拥有(需交叉审核)。
Decision: 内容自检通过 → 待 spec 交叉审核 + 登记 COMP-* + 用户确认 → 进入 10-mock-data-spec
```
