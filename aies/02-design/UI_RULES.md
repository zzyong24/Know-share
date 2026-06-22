# UI 规则

## 摘要

本产物为 Know-share 建立**唯一一套规范设计系统（ONE canonical design system）**，并定义"生成/还原"一致性规则，使 7 张已有设计图（已覆盖界面的视觉真源）与用 Stitch 生成的缺失界面在令牌、图标族、组件上**完全一致**。本阶段不定义页面字段与交互细节（留给 08 页面规格）。

### 产物元数据

- Stage: `07-ui-generation-or-import`
- Status: `needs-user-confirmation`
- 模式：**混合（hybrid）**——已有图导入 + Stitch 生成缺失界面
- Source inputs: `docs/design/*.png`（7 张）、`aies/02-design/IA_SPEC.md`、`aies/01-product/PRODUCT_SPEC.md`、`aies/01-product/LIGHT_DOMAIN_MODEL.md`
- 新增 ID: `UI-001`（设计令牌）、`UI-002`（规范图标族）、`UI-003`（规范组件）、`UI-004`（生成/还原一致性规则）
- 新增决策: `DEC-012`（确立唯一规范设计系统 + Material Symbols Outlined 为规范图标族；已据生成 HTML 修订）
- 新增假设: `ASM-015`（色值从压缩 PNG 采样，待像素级核对）、`ASM-016`（桌面 Web 优先，移动响应式在页面规格细化）

---

## 视觉真源（Source of visual truth）

| 设计图 | 覆盖界面 | 角色 |
| --- | --- | --- |
| `docs/design/know-share-website-style-v1.png` | `IA-001` 站点外壳 + `IA-002` 发现 | **风格基线**：全站视觉与导航的总规范 |
| `docs/design/know-share-ui-overview.png` | `IA-002/003/007/005/008/011` 六屏总览 | 多界面排布与一致性参照 |
| `docs/design/know-share-module-detail.png` | `IA-003` 知识模块详情 | 决策面、信息密度最高 |
| `docs/design/know-share-trust-profile.png` | `IA-007` 信任档案 | 声誉面、图表风格 |
| `docs/design/know-share-exchange-records.png` | `IA-005` 公开交换记录 | 台账列表风格 |
| `docs/design/know-share-agent-skills.png` | `IA-008` Agent 技能目录 | 卡片网格 + 彩色图标徽 |
| `docs/design/know-share-submit-module.png` | `IA-004` 提交模块向导 | 多步流程 + 隐私门 |

- **规则**：以上 7 张为**已覆盖界面的视觉真源**；其中 `website-style-v1` 为最高层风格基线，任何冲突以它为准。
- UI 图是"需规范化的输入、而非实现契约"（`ASM-003`）；本产物把它们抽象为令牌/组件，缺失界面由 Stitch 在同一套令牌下生成（`stitch` in `skill_registry.yaml`）。

---

## 设计令牌（Design tokens）`UI-001`

> 色值由 `docs/design/*.png` **全分辨率采样**得到（主色 H≈174° 深青绿）。受 PNG 压缩影响，十六进制为近似值，登记为 `ASM-015` 待像素级核对。命名采用与未来 Tailwind/CSS 变量兼容的语义令牌。

### 颜色 — 品牌与强调

| 令牌 | 值（近似） | 用途 | 来源 |
| --- | --- | --- | --- |
| `--color-primary` | `#017A6E` | 品牌主色、主 CTA（提交模块/请求交换）、Logo、激活态 | 采样 H174 S0.99 |
| `--color-primary-hover` | `#016458` | 主色按钮悬停/按下 | 主色加深 |
| `--color-primary-subtle` | `#E6F4F1` | 主色浅底（标签、选中行、图标容器底） | 主色 10% |
| `--color-accent` | `#019997` | 次强调（链接、图表线、信息高亮） | 采样 H179 |

### 颜色 — 中性

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--color-bg` | `#FBFCFD` | 页面底色（近白冷灰） |
| `--color-surface` | `#FFFFFF` | 卡片/面板表面 |
| `--color-border` | `#E7EAEE` | 卡片边框、分隔线 |
| `--color-text` | `#1F2937` | 主文本 |
| `--color-text-muted` | `#6B7280` | 次文本、标签、占位 |
| `--color-text-subtle` | `#9CA3AF` | 弱化说明文字 |

### 颜色 — 语义状态

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--color-success` | `#16A34A` | 成功/已验证/已完成（GitHub Verified、交换完成） |
| `--color-warning` | `#D97706` | 待处理/警告（隐私门 warn、待确认交换） |
| `--color-danger` | `#DC2626` | 风险/拒绝/举报（隐私门 block、管理风险） |
| `--color-info` | `#2563EB` | 中性信息提示 |

> 说明：`--color-primary`（青绿）与 `--color-success`（标准绿）刻意区分——主色用于品牌/CTA，成功色仅用于状态语义，避免"满屏一种绿"导致状态不可辨。该区分对应 7 张图中"绿色 CTA"与"绿色对勾/Verified 徽"的不同色温。

### 排版

| 令牌 | 值 | 说明 |
| --- | --- | --- |
| 字族（西文/数字） | `Inter` | 界面无衬线，匹配图中现代无衬线观感 |
| 字族（中文） | 系统中文无衬线（`PingFang SC` / `Microsoft YaHei` 回退） | 中英混排 |
| 字族（代码/Manifest） | `JetBrains Mono`（等宽） | 模块详情/提交向导的 JSON Manifest 代码块 |
| `--text-display` | 28–32px / 600 | 页面主标题（如"公开交换记录"） |
| `--text-h2` | 20–22px / 600 | 区块标题 |
| `--text-h3` | 16px / 600 | 卡片标题 |
| `--text-body` | 14px / 400 | 正文（界面默认密度） |
| `--text-sm` | 13px / 400 | 次要信息、表格 |
| `--text-xs` | 12px / 500 | 标签、徽章、计数 |
| `--text-stat` | 24–28px / 700 | 统计大数字（如 `12,857`、信任分 `824`） |

### 间距、圆角、阴影

| 令牌 | 值 | 说明 |
| --- | --- | --- |
| 间距基数 | `4px` 栅格（4/8/12/16/20/24/32） | 高密度界面以 8/12/16 为主 |
| `--radius-card` | `12px` | 卡片/面板 |
| `--radius-control` | `8px` | 按钮、输入框、标签 |
| `--radius-pill` | `999px` | 状态药丸、徽章 |
| `--shadow-card` | `0 1px 2px rgba(16,24,40,.06)` | 卡片轻阴影（图中卡片为低阴影 + 描边） |
| 内容最大宽 | `1280px` 居中 | 桌面主内容容器 |

---

## 规范图标集与组件（Canonical icon set and components）`UI-002` `UI-003`

### 规范图标族 `UI-002`

- **唯一规范图标族 = Material Symbols Outlined**（Google，outline 风格，weight ~300–400，FILL 0、无填充字形）。这是 Stitch（底层 Gemini）原生渲染的图标族，也是已有 7 张图（同一 Stitch 流水线产出）使用的图标族——选它即对"视觉真源"的真实还原，且跨 7 旧图 + 生成的新屏天然一致。
- **决策依据（`DEC-012`，已修订）**：初版曾选 Lucide，但读生成 HTML 发现 Stitch 实际产出的是 Material Symbols Outlined（如 `search`/`verified`/`check_circle`/`hourglass_empty`）；强行换 Lucide 等于和工具对着干并制造跨屏漂移。改以 Material Symbols Outlined 为规范，**消除生成器与规范之间的冲突**。
- **实现期等价替换**：若最终前端栈偏好 Lucide（如 shadcn/ui 生态），`lucide-react` 可作为 1:1 等价替换（两者皆 outline，按图标名映射，例 `search`→`Search`、`verified`→`BadgeCheck`、`check_circle`→`CheckCircle2`）。规范参照仍以 Material Symbols Outlined 为准，替换在阶段 09/11 决定并记录。
- **冲突归一**：彩色方块图标徽**不作为独立图标族**，降级为一个**组件**（见 `IconChip`）——其容器是主色/语义色浅底圆角方块，**内部字形仍来自 Material Symbols Outlined**。这样既保留视觉层次，又只剩一套字形真源。
- **禁止**：不得引入 Font Awesome、emoji、填充态 Material 变体或任何第二图标族；不得在同一界面混用 filled 与 outline 风格。GitHub Octocat 标记是**唯一例外**的品牌图标（用于 GitHub 登录/身份），按品牌规范使用。

### 规范组件 `UI-003`

> 以下为全站复用的组件规范；字段级/状态级细节在 08 页面规格与 09 组件规格细化（`COMP-*`）。

| 组件 | 规范 | 出现界面 |
| --- | --- | --- |
| `AppShell` | 顶栏：左 Logo（青绿 K 标）+ 水平主导航；右 全局搜索框 + GitHub 登录态 + 主色"提交模块"CTA | `IA-001` 全部界面 |
| `PrimaryButton` | 主色实心、`--radius-control`、`--text-body/500`、hover 加深 | 全站 |
| `SecondaryButton` | 描边/浅底、文字主色或中性 | 全站 |
| `Card` | 白底 + `--color-border` 描边 + `--shadow-card` + `--radius-card` + 16–20px 内边距 | 发现/技能/详情 |
| `ModuleCard` | 模块卡：标题、脱敏摘要、来源统计、主题标签、信任信号、"请求交换"CTA | `IA-002/003` |
| `StatusPill` | 药丸徽章；色映射：success/warning/danger/info/primary-subtle | 交换状态、隐私门、Verified |
| `TrustBadge` | 圆形/盾形信任徽章 + 等级文案 | `IA-007` |
| `IconChip` | 浅底圆角方块（主色或语义色）+ 内嵌 Material Symbols Outlined 字形（归一后的"彩色图标徽"） | `IA-008` 等 |
| `StatBlock` | 大数字（`--text-stat`）+ 标签 + Material Symbols Outlined 图标 + 可选趋势 | 发现底部、信任档案 |
| `DataTable` / `ListRow` | 高密度行列表：头像/图标 + 主文本 + 元信息 + 右侧操作；斑马/hover 态 | `IA-005/011` |
| `LineChart` / `DonutChart` | 折线/面积图用 `--color-accent`；环形图用主色+语义色分段 | `IA-007/003` |
| `Stepper` | 左侧竖向步骤指示 + 当前步高亮（主色） | `IA-004` |
| `ConsentGate` | 隐私门：pass/warn/block 三态用语义色 + 明确同意按钮 | `IA-004` |
| `SearchBar` | 顶栏全局搜索，圆角输入 + Material Symbols Outlined 的 search 图标 | `IA-001` |
| `EmptyState` | 居中图标（Material Symbols Outlined）+ 说明 + 主 CTA | 各空状态 |

---

## 生成/还原一致性规则（Generation/restoration consistency rules）`UI-004`

适用于用 Stitch（或任何生成器）产出/还原界面时，确保跨屏一致：

1. **先立基线、后生成**：本 UI_RULES.md 的令牌（`UI-001`）+ 图标族（`UI-002`）+ 组件（`UI-003`）是唯一基线。Stitch 项目内先用 `create_design_system` 落地令牌（种子色 `#017A6E`、`Inter`、圆角 `ROUND_TWELVE`、浅色模式），再 `generate_screen_from_text` 逐屏生成。
2. **源不一致先归一**：图标统一到 Material Symbols Outlined；彩色方块降级为 `IconChip` 组件。绝不把冲突变体带入新界面。
3. **每条提示词都钉死同一系统**：每个 Stitch 提示词必须重述同一套令牌、同一图标族、同一组件规范，引用目标 `IA-*` 及其状态（空/加载/错误），并用 `MOCK_DATA_SPEC` 风格的真实 MOCK 内容（10 阶段产出前，先用提示词内联的拟真中文内容）。
4. **image2 漂移防控**：图生图/参照还原会在图标、按钮、间距上漂移；提示词须显式声明"完全匹配既定设计系统、只用该图标族、按钮与间距与规范一致"，并点名要归一的元素。
5. **生成后一致性检查（gate 05）**：对每张生成图核对——主色是否 `#017A6E`、是否仅 Material Symbols Outlined 图标、卡片/按钮圆角与阴影是否一致、统计/状态色语义是否正确、是否误引入第二图标族或 filled 图标。不符则带着具体差异回炉重生成。
6. **不得越权**：生成界面不得引入未追溯到 `IA-*`/`FR-*` 的新功能或新界面（`PROJECT_CONTEXT.md` 实现规则）。

---

## 已覆盖界面的还原说明

7 张图已是这些界面的视觉真源，无需重新生成；08 页面规格直接据其 + 本令牌细化字段。归一动作：

| 界面 | 真源图 | 归一动作（统一到规范） |
| --- | --- | --- |
| `IA-001` 站点外壳 | website-style-v1 | 顶栏图标统一 Material Symbols Outlined；CTA 用 `--color-primary` |
| `IA-002` 发现 | website-style-v1 / overview | 卡片统一 `ModuleCard`；底部统计用 `StatBlock`（Material Symbols Outlined 图标） |
| `IA-003` 模块详情 | module-detail | 指标图标统一 Material Symbols Outlined；环形图用主色分段；代码块用等宽字 |
| `IA-004` 提交向导 | submit-module | `Stepper` + `ConsentGate` 三态语义色；Manifest 代码块等宽字 |
| `IA-005` 交换记录 | exchange-records | 列表统一 `ListRow`；状态统一 `StatusPill`；交换方向图标用 Material Symbols Outlined |
| `IA-007` 信任档案 | trust-profile | 信任分/折线图用 `--color-accent`；徽章统一 `TrustBadge`；指标图标 Material Symbols Outlined |
| `IA-008` Agent 技能 | agent-skills | 彩色图标徽归一为 `IconChip`（Material Symbols Outlined 字形）；卡片统一 `Card` |
| `IA-011` 审核台 | ui-overview（管理面板） | 队列统一 `DataTable`；风险等级用语义色；**信息密度较高，确认作为已覆盖但建议生成高保真补全（见下）** |

> 注：`IA-011` 仅在 overview 小图中出现，分辨率不足以作详尽真源，**已列入下方 Stitch 生成清单**做高保真补全。

---

## 缺失界面的 Stitch 提示词（已生成 — 见上方归一化）

共 7 屏：`IA-006`、`IA-009`、`IA-010`、`IA-011`、`IA-012`、`IA-013`、`IA-014`。全部 `deviceType = DESKTOP`，绑定同一 Stitch 设计系统 `assets/4528660503651777687`，已生成并归档于 `docs/design/generated/`（见上方「Stitch 生成产物归一化」）。下列提示词为可复现的生成脚手架；**末段"约束句"逐字保留**。

### 共享设计系统片段（每条提示词内引用）

```text
Design system (MUST MATCH EXACTLY — Know-share canonical):
  - Theme: light, near-white page bg (#FBFCFD), white cards with 1px border (#E7EAEE),
    radius 12px cards / 8px controls, low shadow, max content width 1280px, 8/12/16px spacing.
  - Primary/brand color: deep teal-green #017A6E (CTAs, active state, logo).
    Accent #019997 (links, chart lines). Success #16A34A, Warning #D97706, Danger #DC2626.
  - Typography: Inter (UI), monospace JetBrains Mono for code/JSON, large bold numbers for stats.
  - Icons: ONE family only — Material Symbols Outlined (Google), outline style, weight
    ~300-400, FILL 0, NO filled glyphs, NO second icon set. Colored icon "chips" = tinted
    rounded square container with a Material Symbols Outlined glyph inside.
  - Components: top AppShell (logo + horizontal nav + global search + GitHub login + green
    "提交模块" CTA), Card, StatusPill, StatBlock, DataTable/ListRow, primary/secondary buttons.
  - Language: all UI copy in Simplified Chinese.
Constraint: Match the established design system above exactly. Do not introduce new icon
styles, colors, or component variants. Keep icons (Material Symbols Outlined only), buttons, radius,
and spacing identical to the canonical set across all screens. GitHub Octocat is the only
brand-icon exception, used only for GitHub login/identity.
```

### `IA-006` 交换详情

```text
Screen: 交换详情 (IA-006)
Purpose / primary job: 查看单次交换的完整生命周期，并在被接受后进入联系方式披露与私下交付。
Layout & regions: AppShell 顶栏；主区左 2/3 = 交换时间线（状态机：Requested→Accepted→
  Delivered→Completed/Closed）+ 双方模块/请求摘要 + 验证摘要 + 结构化反馈区；
  右 1/3 侧栏 = 交换双方卡（GitHub 身份 + TrustBadge）、当前状态 StatusPill、
  "披露联系方式"动作（仅 Accepted 后可见，默认私密）、私有交付通道提示（GitHub 私有仓库）。
Components & states: 时间线（active/completed step）、StatusPill（各状态色）、
  ContactDisclosure 卡（未接受=锁定占位/已接受=显示）、反馈表单（empty/submitted）、loading、error。
Content: 拟真中文内容——模块"Agent 记忆系统设计模式"、双方用户 @zyongzhu24 / @knowledge-trader、
  状态"已接受待交付"、披露通道"GitHub 私有仓库邀请"。
Design system (MUST MATCH EXACTLY — 见上共享片段)
Accessibility: 键盘可达时间线与动作按钮、状态有文字标签非仅颜色、对比度≥4.5:1。
Constraint: 见上共享片段约束句。
[追溯] IA-006 · FR-040 · FR-130 · ENT-007/009/010 · INV-03（联系方式仅 Accepted 后披露）
```

### `IA-009` 个人中心 Dashboard

```text
Screen: 个人中心 Dashboard (IA-009)
Purpose / primary job: 已登录用户集中管理"我的模块/草稿、收到/发起的交换、收藏、通知入口"。
Layout & regions: AppShell；顶部欢迎条 + 关键 StatBlock（我的模块数/进行中交换/信任分/未读通知）；
  下方左侧竖向子导航（我的模块 | 草稿 | 收到的交换 | 发起的交换 | 收藏 | 设置入口）；
  右侧主区 = 选中分区的列表（ModuleCard 网格 或 交换 ListRow + StatusPill）。
Components & states: StatBlock、ModuleCard、ListRow、StatusPill、EmptyState（无模块→引导提交向导）、
  loading skeleton、error。
Content: 拟真中文——"我的模块(6)"、"草稿(2)"、"收到的交换(3 待处理)"、信任分 824。
Design system (MUST MATCH EXACTLY — 见上共享片段)
Accessibility: 子导航键盘可达、当前分区有 aria-current、空状态有明确 CTA。
Constraint: 见上共享片段约束句。
[追溯] IA-009 · FR-060 · FR-070 · ASM-014 · ENT-003/007/013
```

### `IA-010` 通知中心

```text
Screen: 通知中心 (IA-010)
Purpose / primary job: 查看并处理交换/评审/反馈/社区事件通知，驱动各方推进。
Layout & regions: AppShell；主区单列通知流，顶部筛选标签（全部 | 交换 | 评审 | 反馈 | 社区）+
  "全部标记已读"动作；每条 = 类型 IconChip + 主文本 + 时间 + 直达动作链接；未读用主色左条/圆点。
Components & states: ListRow（已读/未读两态）、筛选 Tab、IconChip（按类型着色，Material Symbols Outlined 字形）、
  EmptyState（无通知→说明何时会通知）、loading、分页/加载更多。
Content: 拟真中文——"@knowledge-trader 接受了你的交换请求"、"你的模块通过隐私评审"、
  "收到一条新的交换反馈"。
Design system (MUST MATCH EXACTLY — 见上共享片段)
Accessibility: 未读状态非仅靠颜色（含图标/文字）、列表项键盘可达、时间用相对+绝对 title。
Constraint: 见上共享片段约束句。
[追溯] IA-010 · FR-120 · FLOW-006 · ENT-017
```

### `IA-011` 管理 / 审核控制台

```text
Screen: 管理 / 审核控制台 (IA-011)
Purpose / primary job: 管理员处理评审队列、风险摘要、举报，并留审计轨迹。
Layout & regions: AppShell（含管理员标识）；顶部风险摘要 StatBlock（待审/高风险/今日举报/已处理）；
  主区 DataTable 评审队列（提交项：模块名 + 提交者 + 隐私门结果 + 风险标签 + 操作[通过/退回/下架]）；
  右侧/抽屉 = 选中项详情（Manifest 摘要 + PrivacyScan 结果 + 举报详情）；底部审计日志区。
Components & states: DataTable（行 hover/选中）、StatusPill（pass/warn/block 语义色）、
  风险标签、操作按钮、审计 ListRow、EmptyState（队列空）、loading、确认对话框（破坏性操作）。
Content: 拟真中文——队列含 3 个待审模块、1 个高风险（疑似含私有路径）、2 条举报。
Design system (MUST MATCH EXACTLY — 见上共享片段)
Accessibility: 表格有表头关联、破坏性操作需二次确认、风险等级有文字标签。
Constraint: 见上共享片段约束句。
[追溯] IA-011 · FR-100 · FLOW-005 · ENT-014/015/018
```

### `IA-012` 开放 API / agent 集成

```text
Screen: 开放 API / agent 集成 (IA-012)
Purpose / primary job: 面向开发者/agent 展示公开读取 API 文档、认证写说明、零私有泄露承诺。
Layout & regions: AppShell；左侧 API 目录导航（端点分组：发现 | 模块 | 交换 | 反馈 | 统计）；
  右侧主区 = 端点文档（方法+路径 + 说明 + 请求/响应 JSON 代码块 + 认证要求徽）；
  顶部醒目"零私有内容泄露"承诺横幅（success 浅底）。
Components & states: 端点 ListRow、HTTP 方法 Pill（GET/POST 色区分）、等宽 JSON 代码块、
  认证徽（公开读/需认证写）、复制按钮、EmptyState、loading。
Content: 拟真中文+真实风格——`GET /api/modules`、`GET /api/exchanges`、`GET /api/stats`，
  写操作标注"需 GitHub 认证 + 同意门"。
Design system (MUST MATCH EXACTLY — 见上共享片段)
Accessibility: 代码块可键盘聚焦+复制、方法色非唯一区分（含文字）、目录可键盘导航。
Constraint: 见上共享片段约束句。
[追溯] IA-012 · FR-110 · NFR-002 · ENT-019 · INV-01（零私有内容）
```

### `IA-013` 仓库 / 帮助 / 关于（含平台统计）

```text
Screen: 仓库 / 帮助 / 关于 (IA-013)
Purpose / primary job: 展示开源可审计性、隐私说明、以及平台聚合使用统计（不含 PII）。
Layout & regions: AppShell；顶部关于 Hero（产品理念一句话 + GitHub 仓库链接 + 开源徽）；
  中部"平台统计"区 = StatBlock 网格（模块总数/交换总数/活跃用户/隐私门通过率）+ 趋势 LineChart；
  下部 = 隐私与信任说明卡片 + 帮助/FAQ 折叠列表 + 可审计规则链接。
Components & states: StatBlock、LineChart（accent 色）、Card、Accordion（FAQ）、
  外链按钮（GitHub）、EmptyState（统计无数据）、loading。
Content: 拟真中文——统计"模块 1,842 / 交换 12,857 / 活跃用户 2,196 / 隐私门通过率 98.6%"
  （与 website-style-v1 底部统计风格一致）。
Design system (MUST MATCH EXACTLY — 见上共享片段)
Accessibility: 统计数字有文字标签、图表有可读摘要、FAQ 折叠键盘可达。
Constraint: 见上共享片段约束句。
[追溯] IA-013 · NFR-004 · FR-140 · ENT-019 · FLOW-008
```

### `IA-014` 设置 / 联系方式

```text
Screen: 设置 / 联系方式 (IA-014)
Purpose / primary job: 本人管理联系方式与可见性、同意记录、账户设置；联系方式默认私密。
Layout & regions: AppShell；左侧设置子导航（联系方式 | 隐私与同意 | 账户 | 通知偏好）；
  右侧主区 = 联系方式表单（多通道：GitHub/邮箱/自定义 + 每项可见性=默认私密开关）+
  "披露策略"说明（仅交换被接受后对该次对方披露）+ 同意记录列表。
Components & states: 表单字段、可见性开关（默认私密/关）、说明 Callout（强调默认私密）、
  同意记录 ListRow、保存/取消按钮、保存成功 toast、校验 error、loading。
Content: 拟真中文——联系方式"GitHub @zyongzhu24（私密）、邮箱（私密）"、
  披露策略提示文案、同意记录 2 条。
Design system (MUST MATCH EXACTLY — 见上共享片段)
Accessibility: 表单 label 关联、开关有状态文字、危险/隐私项有清晰说明、键盘可达。
Constraint: 见上共享片段约束句。
[追溯] IA-014 · FR-130 · NFR-005 · DEC-010 · ENT-008/021 · INV-03
```

---

---

## Stitch 生成产物归一化（已生成）

缺失 7 屏已用 Stitch 全部生成、下载并核验，归档于 `docs/design/generated/`（每屏 `.html` 真实页面 + `.png` 预览）。

- **Stitch 项目**：`projects/7946899781188074425`（"Know-share UI 还原"）。
- **规范设计系统资产**：`assets/4528660503651777687`（"Know-share Canonical"，种子色 `#017A6E`、Inter、浅色）。所有生成均绑定该资产。

| IA | 界面 | 产物（docs/design/generated/） | 一致性核验 |
| --- | --- | --- | --- |
| `IA-006` | 交换详情（样板屏） | `IA-006-exchange-detail.{html,png}` | ✅ 主色/Material Symbols/AppShell/时间线状态机/披露入口 |
| `IA-009` | 个人中心 Dashboard | `IA-009-dashboard.{html,png}` | ✅ StatBlock/侧导航激活/ModuleCard/草稿空状态 |
| `IA-010` | 通知中心 | `IA-010-notifications.{html,png}` | ✅ 筛选 Tab/IconChip 分类/未读 teal 左条/空状态 |
| `IA-011` | 审核控制台 | `IA-011-admin-console.{html,png}` | ✅ 管理员徽标/风险 StatBlock/DataTable+隐私门 Pill/高风险红标/审计日志 |
| `IA-012` | 开放 API | `IA-012-open-api.{html,png}` | ✅ 零泄露横幅/方法 Pill/JSON 代码块/复制（**外壳漂移已回炉重生成**，见下） |
| `IA-013` | 仓库/关于 | `IA-013-about-repo.{html,png}` | ✅ 开源 Hero/平台统计 4 StatBlock+折线图/隐私信任卡/FAQ |
| `IA-014` | 设置/联系方式 | `IA-014-settings-contact.{html,png}` | ✅ 披露策略 Callout/联系渠道默认私密+开关/同意记录 |

### 生成后一致性检查结果（gate 05 第 5 条）

逐屏对 HTML 源码核验：主色 `#017A6E` 命中、**仅 Material Symbols Outlined 图标（每屏 9–27 处）、零 Lucide/FontAwesome/emoji**、卡片白底+`#E7EAEE`描边、Inter+JetBrains Mono、简体中文、规范 AppShell 与页脚。截图逐屏目视复核一致。

- **发现并修复的漂移（IA-012）**：首次生成把 AppShell 漂移成英文开发者门户头（Dashboard/API Docs/Sign Up）。`edit_screens` 定点替换未能刷新导出文件，遂**整屏重生成**（提示词开头强钉规范中文 AppShell），复核通过。教训已写入下方"生成器注意"。
- **设计系统演化（可接受）**：Stitch 在后续生成中把资产 bump 到 v2，自动扩展了一套 Material 派生色板并把圆角记为 `ROUND_EIGHT`。但**实际渲染的 HTML 仍用我们的 Tailwind 令牌**（`#017A6E`/`#FBFCFD`/`#E7EAEE` 等命中），12↔8px 圆角差异视觉可忽略；登记为 `ASM-015` 范畴内的已知偏差，不影响跨屏一致。

### 生成器注意（写给后续阶段）

- Stitch 原生用 Material Symbols 渲染图标——这正是 `DEC-012` 改以 Material Symbols 为规范的原因；勿在提示词里要求 Lucide。
- `edit_screens` 改的是 Stitch 端实时 DOM，但生成时导出的 `.html` 文件不随之刷新；要拿到改后的代码，**整屏重生成**比 edit 更可靠。
- "开发者/管理"类界面易把 AppShell 漂移成英文门户头；提示词须在**开头**强钉规范中文 AppShell（已在 IA-012/013/014 验证有效）。

---

## 布局原则（Layout principles）

- 桌面 Web 优先；顶部 `AppShell` 固定，主内容 `1280px` 居中容器，左侧子导航 + 右侧内容的两栏式用于私域/设置/管理界面。
- 信息密度偏高：列表/表格紧凑行高，卡片间距 `12–16px`，统计区用大数字 `StatBlock` 强化价值橱窗。
- 公共面（发现/详情/交换记录/信任档案）以卡片与列表为主；流程面（提交向导）用左侧 `Stepper` 线性推进。

## 组件行为规则（Component behavior rules）

- 主 CTA 全站唯一主色实心样式；同屏不出现两个等权主 CTA。
- 状态一律用 `StatusPill` + 语义色 + **文字**（不靠颜色单独传达，对应无障碍）。
- 隐私/同意门（`ConsentGate`）为强约束：block 态禁止继续、warn 态需显式确认、pass 态方可推进（对应 `INV` 与 `NFR-005`）。
- 联系方式相关控件默认私密态；披露动作仅在交换 `Accepted` 后出现（`INV-03`/`FR-130`）。
- 破坏性/不可逆操作（下架、披露、删除）需二次确认。

## 无障碍底线（Accessibility floor）`NFR-007`

- 文本对比度 ≥ `4.5:1`，大字 ≥ `3:1`；主色 `#017A6E` 配白字达标。
- 所有交互元素键盘可达，焦点态可见（主色描边）。
- 状态/类型不得仅靠颜色区分，须同时有图标或文字。
- 图标按钮有 `aria-label`；图表提供可读文字摘要；表单 label 与控件关联。
- 该底线在 12 阶段前端验证中以浏览器证据核验。

## 响应式规则（Responsive rules）

- 断点：`<768px` 移动、`768–1279px` 平板、`≥1280px` 桌面。
- 桌面两栏（侧导航 + 内容）在平板折叠为顶部 Tab/抽屉、在移动为单列 + 汉堡导航。
- 卡片网格 `≥1280px` 3–4 列、平板 2 列、移动 1 列；`DataTable` 在窄屏转为卡片式行。
- **范围说明（`ASM-016`）**：7 张真源图与 Stitch 生成均为桌面布局；移动/平板适配的具体断点行为在 08 页面规格逐面细化，本阶段只立原则。

## 未决设计假设（Unresolved design assumptions）

| ID | 假设 | 风险 | 确认 |
| --- | --- | --- | --- |
| `ASM-015` | 令牌色值（尤其主色 `#017A6E`、各语义色）由压缩 PNG 采样近似得出 | 与设计原意可能有微差，影响品牌一致性 | 用户像素级核对或提供原始色板后定稿 |
| `ASM-016` | 桌面 Web 优先，移动/平板响应式细节延后到页面规格 | 若需移动优先，布局规范要调整 | 页面规格阶段 / 用户确认目标设备 |
| `DEC-012`（已确认+修订） | 规范图标族 = Material Symbols Outlined（据生成 HTML 修订，原选 Lucide）；彩色方块降级为 `IconChip` | 若最终前端栈坚持 Lucide，需在阶段 09/11 做图标名映射替换 | 用户已确认改用 Material Symbols |

---

## 质量门结果

```text
Gate: 05-ui-gate
Status: pass（内容+生成后一致性检查通过）— 待用户对最终 UI 产物签字
Evidence:
  - aies/02-design/UI_RULES.md 对照 docs/design/*.png（7 张全分辨率采样）、IA_SPEC.md、PRODUCT_SPEC.md
  - docs/design/generated/ 7 屏 .html/.png（Stitch 项目 7946899781188074425 / 设计系统 assets/4528660503651777687）
  - 逐屏 HTML 源码核验：主色命中、仅 Material Symbols Outlined、零 Lucide/FontAwesome/emoji
Findings:
  - 视觉源真已命名（7 张图 + website-style-v1 为最高基线）。✅
  - 唯一规范设计系统已定义：令牌 UI-001 + 单一图标族 UI-002(Material Symbols Outlined) + 规范组件 UI-003。✅
  - 源不一致已归一：彩色方块图标徽 → IconChip 组件（Material Symbols Outlined 字形），不带入冲突变体。✅
  - 生成/还原一致性规则 UI-004 已立并执行（image2 漂移防控 + 生成后逐屏检查）。✅
  - 缺失 7 屏已用 Stitch 生成、下载、核验、归一化（见「Stitch 生成产物归一化」）。✅
  - 跨屏一致：AppShell/令牌/图标族/组件统一；新旧 14 屏同系统。✅
  - 漂移已处置：IA-012 外壳英文化 → 整屏重生成修复；记录于归一化段。✅
  - 无障碍与响应式期望已显式（NFR-007 / ASM-016）。✅
Known risks: ASM-015（色值采样近似，待像素级核对）；设计系统 v2 圆角 ROUND_EIGHT 与规范 12px 的微差（视觉可忽略）。
Decision: 内容与生成后一致性均通过 → 待用户对最终 UI 产物与 7 屏生成结果签字确认 → 转 passed → 进入 08-page-spec
```
