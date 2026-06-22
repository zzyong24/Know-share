# 共享组件库规格（COMPONENTS_SPEC · _shared）

## 摘要

本产物定义 Know-share **全站共享组件库 `COMP-001~040`** 的完整契约。它落地 `UI_RULES.md` 的规范组件 `UI-003`（在 `UI-001` 设计令牌与 `UI-002` 单一图标族之下），实现锚定 `FRONTEND_SPEC.md` 的技术栈（`DEC-014`：Next.js + TypeScript + Tailwind + shadcn/ui）。各业务模块的 `COMPONENTS_SPEC.md` 只**引用**这些 `COMP-*`，不重复定义；模块特有组件使用各自分配的 COMP 段（见 `FRONTEND_SPEC §7`）。

每个组件一节，覆盖模板 8 字段：Component name / Purpose / Props or inputs / Events or outputs / States / Accessibility requirements / Data dependencies / Tests。无障碍字段是 `NFR-007` 的落点；状态非仅靠颜色、默认私密、等宽代码块等关键不变量写进契约与测试。

### 产物元数据

- Stage: `09-frontend-spec`
- Status: `needs-user-confirmation`
- Upstream IDs: `FRONTEND_SPEC.md`（权威 §6 索引、§4 令牌、§5 图标）、`UI-001/002/003`、`IA-001~014`、`PAGE-001~105`、`ENT-*`、`INV-*`、`NFR-007`
- Decision IDs: `DEC-012`（Material Symbols Outlined 单一图标族；实现期 lucide-react 1:1 替换）、`DEC-014`（前端栈 Next.js+TS+Tailwind+shadcn/ui）；约束遵守 `DEC-007`（无经济模型）
- COMP 段: `COMP-001~040`（本规格拥有；`COMP-037~040` 标预留/按需）
- 实现锚定: shadcn/ui 基元 + Tailwind 令牌（`styles/`）；图标走规范族（Material Symbols Outlined），实现以 `lucide-react` 替换并维护 `docs/icon-map.md`
- 新增假设: `ASM-068`~`ASM-073`（见文末；未写入 `DEFAULT_ASSUMPTIONS.md`，待编排者登记）
- Manifest: pending
- 关联: 阶段 10 `MOCK_DATA_SPEC.md`、阶段 15 `SERVICE_CONTRACT.md`、阶段 12 前端验证、`TEST_PLAN.md`

### 全局实现约定（适用于所有组件）

- **令牌**：颜色/圆角/阴影/字体一律用 `UI-001` 令牌的 Tailwind 类（`bg-surface`、`border-border`、`text-text`/`text-muted`、`rounded-card`/`rounded-control`/`rounded-pill`、`shadow-card`、主色 `primary`/`primary-hover`/`primary-subtle`、`accent`、语义 `success/warning/danger/info`）。不得硬编码十六进制。
- **图标**：单一族（`DEC-012`）。组件 props 以规范名（Material Symbols 名，如 `swap_horiz`）传入，运行时经 `docs/icon-map.md` 映射到 `lucide-react` 组件渲染（如 `ArrowLeftRight`）。禁止第二图标族 / filled 变体 / emoji。GitHub Octocat 为唯一品牌例外（仅身份/登录）。
- **状态非仅颜色（`NFR-007`）**：任何用颜色传达语义之处（状态、风险、方法、未读）必须同时有文字与/或图标。
- **键盘可达**：所有交互元素可 Tab 聚焦、焦点态可见（主色描边 `focus-visible:ring-primary`）；图标按钮必带 `aria-label`。
- **对比度**：正文 ≥ 4.5:1，大字 ≥ 3:1；主色 `#017A6E` 配白字达标。
- **测试栈**：组件单测 Vitest + Testing Library（断言 states + a11y 角色/标签/键盘 + 关键不变量）；E2E 走 Playwright（阶段 12）。
- **数据来源**：组件层不直接取数；数据经 props 注入，取数由页面/`lib/queries/*`（TanStack Query）完成，先对接 MOCK（阶段 10），形状最终以 `SERVICE_CONTRACT`（阶段 15）为准。前端按字段白名单渲染公开数据（`INV-01/04`）。

---

## COMP-001 · AppShell

### Component name
`AppShell`（全局站点外壳布局）。落地 `UI-003 AppShell`；实现 `IA-001`。文件 `components/shared/app-shell.tsx`。

### Purpose
为全站提供统一外壳：固定顶栏（`TopNav` + `GlobalSearchBar` + `GitHubAuthButton` + `SubmitModuleCTA`）、`1280px` 居中主内容容器、可选左侧子导航（私域/设置/管理两栏式）、`Footer`。所有 `PAGE-*` 渲染在其插槽内，保证导航/搜索/登录/提交入口跨屏一致。

### Props or inputs
- `children: ReactNode`（主内容插槽）。
- `sidebar?: ReactNode`（左侧子导航插槽；私域 `PAGE-060~064`、管理 `PAGE-080~085` 用，公开页传 `undefined`）。
- `session?: { login: string; avatarUrl: string; isAdmin: boolean } | null`（登录态；`null`=匿名）。
- `containerWidth?: 'default' | 'wide'`（默认 `1280px` 居中）。
- `activeNav?: string`（当前主导航项 key，用于高亮）。

### Events or outputs
自身无业务事件；转发子组件事件（搜索提交、登录、提交 CTA、导航跳转）。布局变化（断点折叠）为内部行为。

### States
- 匿名 vs 已登录（决定右侧区与 `(auth)`/`(admin)` 导航项可见性）。
- 管理员（`session.isAdmin`）显示审核控制台入口（`IA-011`/`FR-100`）。
- 响应式：`≥1280` 两栏；`768–1279` 侧栏折叠为顶部 Tab/抽屉；`<768` 单列 + 汉堡菜单（`ASM-016`）。
- 顶栏 sticky；滚动时保持可见。

### Accessibility requirements
- 顶栏用 `role="banner"`（`<header>`）、主内容 `<main>`、页脚 `<footer role="contentinfo">`；提供"跳到主内容"skip link。
- 子导航用 `<nav aria-label="区段导航">`，当前项 `aria-current="page"`。
- 汉堡菜单按钮带 `aria-label`、`aria-expanded`；展开后焦点可循环、Esc 关闭。
- 内容区与顶栏对比、焦点顺序自上而下逻辑正确。

### Data dependencies
`ENT-001` User（`session.login`/`avatarUrl`/`isAdmin` 角色）。匿名时零私有内容（`INV-04`）。无直接取数。

### Tests
渲染匿名 vs 登录 vs 管理员三态：管理员显示审核入口、匿名隐藏 `(auth)` 项；skip link 可聚焦并跳转 `<main>`；窄断点（mock matchMedia）折叠为汉堡且 `aria-expanded` 切换；`<header>/<main>/<footer>` landmark 存在。

---

## COMP-002 · TopNav

### Component name
`TopNav`（主水平导航）。落地 `UI-003 AppShell` 顶栏的导航部分；实现 `shadcn NavigationMenu`。

### Purpose
渲染公共主导航（发现 `IA-002` / 交换记录 `IA-005` / 信任网络 `IA-007` / Agent 技能 `IA-008` / 仓库帮助 `IA-013`）与登录增项（个人中心 `IA-009` / 通知 `IA-010` / 设置 `IA-014`），管理员另显审核台 `IA-011`。

### Props or inputs
- `items: { key: string; label: string; href: string; requiresAuth?: boolean; requiresAdmin?: boolean }[]`。
- `activeKey?: string`、`session?: {...} | null`。

### Events or outputs
- `onNavigate(href)`（默认走 Next `<Link>`，可注入分析回调）。

### States
- 项 active（主色文字/下划线）、hover、focus、disabled（无）。
- 按 `session` 过滤需登录/管理员项（与 `IA_SPEC` 导航模型一致）。
- 窄屏由 `AppShell` 收进抽屉/汉堡。

### Accessibility requirements
- `shadcn NavigationMenu` 提供 `role`/键盘（左右箭头、Home/End、Enter）；当前项 `aria-current="page"`；下拉子菜单 `aria-expanded`。

### Data dependencies
`ENT-001`（角色判定）。导航 items 为静态配置（路由对齐各 `PAGE_SPEC` Route）。

### Tests
active 项有 `aria-current`；登录态切换显示/隐藏增项；管理员显示审核台；键盘左右箭头在项间移动焦点。

---

## COMP-003 · GlobalSearchBar

### Component name
`GlobalSearchBar`（全局搜索框）。落地 `UI-003 SearchBar`；实现 `shadcn Input + Command`（cmdk）。实现 `IA-001` 全局搜索（`FR-001`）。

### Purpose
顶栏圆角搜索输入 + `search` 图标，键入触发联想（模块/主题/用户/交换），提交路由到搜索结果（`PAGE-003`）。

### Props or inputs
- `placeholder?: string`（默认"搜索模块、主题、用户…"）。
- `suggestions?: { type: 'module'|'topic'|'user'|'exchange'; id: string; label: string; href: string }[]`。
- `loading?: boolean`、`defaultValue?: string`。

### Events or outputs
- `onChange(query)`（防抖，驱动联想取数）。
- `onSubmit(query)`（回车/点击→路由到 `PAGE-003`）。
- `onSelectSuggestion(item)`（深链跳转）。

### States
default / focused / typing / loading（联想加载占位）/ has-suggestions / empty（无联想，提示"按回车搜索"）/ disabled。

### Accessibility requirements
- combobox 模式：input `role="combobox"`、`aria-expanded`、`aria-controls` 指向 listbox；选项 `role="option"`、`aria-selected`；上下键移动、Enter 选择、Esc 关闭。
- `search` 图标装饰性 `aria-hidden`；input 有可见 label 或 `aria-label="全局搜索"`。
- 联想类型不仅靠颜色，含类型文字/图标。

### Data dependencies
`ENT-003/020/001/007`（模块/主题/用户/交换的联想来源；公开字段白名单 `INV-04`）。取数走 `lib/queries/search`（MOCK→契约）。

### Tests
键入触发防抖 `onChange`；联想 listbox `role`/`aria-expanded` 正确；上下键+Enter 选中调用 `onSelectSuggestion`；空态文案；Esc 收起。

---

## COMP-004 · GitHubAuthButton

### Component name
`GitHubAuthButton`（GitHub 登录态按钮）。落地 `UI-003 AppShell` 登录区；实现 `shadcn Button`（+ `Avatar`/`DropdownMenu`）。实现 `DEC-006`/`NFR-005`/`FLOW-007`。

### Purpose
匿名态显示"用 GitHub 登录"（Octocat 品牌图标，唯一例外）；登录态显示头像 + 用户菜单（个人中心/设置/退出）。

### Props or inputs
- `session?: { login: string; avatarUrl: string; verified?: boolean } | null`。
- `loading?: boolean`。

### Events or outputs
- `onSignIn()`（发起 GitHub OAuth）。
- `onSignOut()`、`onMenuSelect(key)`。

### States
anonymous（登录按钮）/ authenticating（loading）/ authenticated（头像+菜单）/ verified 标记（GitHub Verified，`success` 语义，附文字）/ error（登录失败提示）。

### Accessibility requirements
- Octocat 图标按钮带 `aria-label="使用 GitHub 登录"`。
- 用户菜单 `shadcn DropdownMenu`：触发器 `aria-haspopup`/`aria-expanded`、菜单项键盘可达、Esc 关闭。
- Verified 状态有文字（"已验证"）非仅图标色。

### Data dependencies
`ENT-001` User（GitHub 身份、`verified`）。会话由 `(auth)` 中间件提供。

### Tests
匿名渲染登录按钮且点击触发 `onSignIn`；登录态渲染 `Avatar` + 菜单；菜单项键盘可达；verified 含文字标签；Octocat 有 `aria-label`。

---

## COMP-005 · SubmitModuleCTA

### Component name
`SubmitModuleCTA`（提交模块主色 CTA）。落地 `UI-003 PrimaryButton` 在外壳的特化用法；实现 `shadcn Button(variant=primary)`。实现 `IA-004`/`FR-030`。

### Purpose
全站常驻主色实心入口，跳转提交向导（`PAGE-020`）。同屏唯一主 CTA（组件行为规则）。

### Props or inputs
- `requiresAuth?: boolean`（默认 true）、`session?`、`size?: 'sm'|'md'`。

### Events or outputs
- `onClick()`：已登录→`/submit`；匿名→先触发登录（`onRequireAuth`）。

### States
default / hover（主色加深）/ focus / 匿名（点击引导登录）/ disabled。

### Accessibility requirements
主色 `#017A6E` + 白字达 4.5:1；focus 环可见；含图标时图标 `aria-hidden`，按钮有可读文字"提交模块"。

### Data dependencies
`ENT-001`（登录判定）。无取数。

### Tests
渲染主色实心 + 文字；匿名点击触发 `onRequireAuth` 而非直接跳转；登录态跳 `/submit`；focus 态可见。

---

## COMP-006 · Footer

### Component name
`Footer`（站点页脚）。`UI-003 AppShell` 配套；纯组合（无 shadcn 基元）。

### Purpose
展示开源/仓库链接、关于/帮助、隐私说明入口、版权；强化 `NFR-004` 开源可审计与隐私边界可见。

### Props or inputs
- `links: { label: string; href: string; external?: boolean }[]`、`repoUrl?: string`。

### Events or outputs
仅链接导航（外链 `target=_blank rel="noopener"`）。

### States
default；外链有图标标识；窄屏堆叠。

### Accessibility requirements
`<footer role="contentinfo">`；外链含"（新窗口打开）"可读提示；链接对比达标、键盘可达。

### Data dependencies
静态配置 + `repoUrl`（关于 `PAGE-100`）。不含 PII（`INV-09`）。

### Tests
渲染链接组；外链带 `rel="noopener"` 与新窗口提示；landmark `contentinfo` 存在。

---

## COMP-007 · PrimaryButton

### Component name
`PrimaryButton`（主色实心按钮）。落地 `UI-003 PrimaryButton`；实现 `shadcn Button(variant=default/primary)`。

### Purpose
全站主操作（请求交换、提交、保存、确认）。主色实心、`rounded-control`、`text-body/500`、hover 加深。

### Props or inputs
- `children`、`size?: 'sm'|'md'|'lg'`、`loading?: boolean`、`disabled?: boolean`、`iconLeft?`/`iconRight?`（规范图标名）、`type?: 'button'|'submit'`、`fullWidth?`。

### Events or outputs
- `onClick(e)`；loading 期间吞掉点击防重复提交。

### States
default / hover / active / focus / loading（内联 spinner + `aria-busy`，禁用点击）/ disabled。

### Accessibility requirements
原生 `<button>`；disabled 时 `aria-disabled`；loading 时 `aria-busy="true"` 且保留可读文字；focus 环可见；图标 `aria-hidden`，纯图标按钮须 `aria-label`。

### Data dependencies
无（纯展示/行为）。

### Tests
点击触发 `onClick`；loading 时禁止重复点击且 `aria-busy`；disabled 不触发；图标按钮 a11y label 断言。

---

## COMP-008 · SecondaryButton

### Component name
`SecondaryButton`（次要/描边按钮）。落地 `UI-003 SecondaryButton`；实现 `shadcn Button(variant=outline/ghost/secondary)`。

### Purpose
次要操作（取消、查看更多、筛选）。描边/浅底、文字主色或中性。与 `PrimaryButton` 同屏区分主次（同屏唯一主 CTA）。

### Props or inputs
同 `COMP-007`，外加 `variant?: 'outline'|'ghost'|'subtle'`。

### Events or outputs
`onClick(e)`。

### States
default / hover / active / focus / loading / disabled。

### Accessibility requirements
同 `COMP-007`；描边态与背景对比 ≥ 3:1，文字 ≥ 4.5:1；focus 可见。

### Data dependencies
无。

### Tests
三 variant 渲染正确类；点击/disabled/focus 行为；与 PrimaryButton 不同时存在两个主 CTA（组合用例由页面测试覆盖）。

---

## COMP-009 · Card

### Component name
`Card`（基础卡片）。落地 `UI-003 Card`；实现 `shadcn Card`（Header/Content/Footer）。

### Purpose
全站内容容器：白底 + `border-border` 描边 + `shadow-card` + `rounded-card` + 16–20px 内边距。`ModuleCard`、统计卡、说明卡等的底座。

### Props or inputs
- `children`、`header?`/`footer?: ReactNode`、`interactive?: boolean`（整卡可点）、`as?: 'div'|'article'|'section'`、`padding?: 'sm'|'md'`。

### Events or outputs
- `interactive` 时 `onClick`/键盘 Enter 触发。

### States
default / hover（`interactive` 时轻抬升）/ focus（可点卡 focus 环）/ selected（主色描边，列表选中行场景）。

### Accessibility requirements
`interactive` 卡须有 `role="button"`/`tabIndex=0` + Enter/Space 激活 + `aria-label`，或内部用单一真链接（推荐后者，避免嵌套交互）；语义结构用 `<article>`/`<section>` + 标题。

### Data dependencies
无（由使用方注入内容）。

### Tests
渲染描边+阴影+圆角令牌类；`interactive` 时键盘 Enter 触发 `onClick`；非 interactive 不可聚焦；selected 态描边。

---

## COMP-010 · ModuleCard

### Component name
`ModuleCard`（知识模块卡片）。落地 `UI-003 ModuleCard`（`Card` 组合）。用于发现 `PAGE-002`、模块详情相关 `PAGE-010`、档案 `PAGE-040`、个人中心 `PAGE-060`。

### Purpose
公开"目录卡片"：标题、脱敏摘要、来源统计、主题标签（`TopicChip`）、信任信号（`TrustBadge`）、状态（`StatusPill`）、"请求交换"CTA。仅渲染公开脱敏字段（`INV-01/04`）。

### Props or inputs
- `module: { id; title; summary; topics: string[]; sourceStats: {...}; trustLevel; status; exchangeCount; favoriteCount; freshness }`（来自 `ENT-003`+`ENT-004` Manifest 公开投影）。
- `owner?: { login; avatarUrl; verified? }`（`ENT-001`）。
- `actions?: { onRequestExchange?; onFavorite?; favorited?: boolean }`。
- `variant?: 'grid'|'list'`、`href`。

### Events or outputs
- `onRequestExchange(moduleId)`（需登录；匿名引导登录）。
- `onFavorite(moduleId)`、`onOpen(href)`。

### States
default / hover / loading（用 `Skeleton`）/ favorited / status 多态（Draft/Published/Updated/Delisted → `StatusPill`）/ 无 owner（匿名展示）。

### Accessibility requirements
卡内单一主链接（标题→详情）避免嵌套交互；"请求交换"为独立按钮带 `aria-label="请求交换 <模块名>"`；收藏切换按钮 `aria-pressed`；统计有文字标签；信任/状态非仅颜色。

### Data dependencies
`ENT-003` KnowledgeModule、`ENT-004` Manifest（脱敏摘要/来源统计/主题/新鲜度）、`ENT-001` owner、派生信任级别（`ENT-011`）。**白名单渲染**：异常含私有字段则丢弃并告警（`INV-04`）。

### Tests
仅渲染公开字段（注入含私有字段的 mock 应被丢弃并告警）；`onRequestExchange` 匿名时引导登录；收藏 `aria-pressed` 切换；status 映射正确 `StatusPill`；loading 显示 `Skeleton`。

---

## COMP-011 · StatusPill

### Component name
`StatusPill`（语义状态药丸）。落地 `UI-003 StatusPill`；实现 `shadcn Badge`（自定 variant）。

### Purpose
统一表达状态/语义：交换生命周期（Requested/Accepted/…/Completed/Rejected/…）、隐私门 pass/warn/block、GitHub Verified、模块状态。**状态非仅颜色**（`NFR-007`）——色 + 文字（+ 可选图标）。

### Props or inputs
- `tone: 'primary'|'success'|'warning'|'danger'|'info'|'neutral'`。
- `label: string`（必填文字，强约束）。
- `icon?`（规范图标名）、`size?: 'sm'|'md'`、`variant?: 'solid'|'subtle'`。

### Events or outputs
通常无（展示型）；可选 `onClick`（如作筛选 chip）。

### States
六色调 × solid/subtle；with/without icon；交互态（可点时 hover/focus）。

### Accessibility requirements
- **文字必填**——禁止纯色无文字（测试强制断言）。
- 色 + 文字双通道传达；subtle 底色与文字对比 ≥ 4.5:1。
- 作状态描述时用 `role` 适配（如交换状态可加 `aria-label`）；可点版本为 `<button>`。

### Data dependencies
状态值来自 `ENT-007`（Exchange 状态机）、`ENT-005`（PrivacyScan pass/warn/block，`INV-02`）、`ENT-001`（Verified）、`ENT-003`（模块状态）。映射表在组件内（值→tone+默认 label）。

### Tests
每个状态值映射正确 tone + 文字；**断言 label 非空**（无文字应报错/兜底显示 raw 值）；subtle 对比通过；可点版本键盘可达；block 态文字含"阻止"语义。

---

## COMP-012 · TrustBadge

### Component name
`TrustBadge`（信任徽章）。落地 `UI-003 TrustBadge`（`Badge` 组合）。用于信任档案 `PAGE-040`、信任网络 `PAGE-043`、`ModuleCard`。

### Purpose
圆形/盾形信任标记 + 等级文案（如"高信任 / 824 分"），表达可解释的信任级别与用户信用（`ENT-011`）。

### Props or inputs
- `level: 'high'|'medium'|'low'|'new'`、`score?: number`、`label?: string`、`size?`、`showScore?: boolean`、`badges?: { type; label }[]`（`ENT-012`）。

### Events or outputs
- `onExplain?()`（点击打开信任解释 `Drawer`/`PAGE-041`，落地 `HARD-03` 可解释性）。

### States
四级（high/medium/low/new）配色 + 文案；with/without score；可点（带解释入口）vs 静态；loading。

### Accessibility requirements
等级用文字+图标非仅颜色；`onExplain` 入口为按钮带 `aria-label="查看信任解释"`；分数有可读单位标签。

### Data dependencies
`ENT-011` TrustProfile（派生：信用分、模块信任级别、徽章）、`ENT-012` Badge。来源说明 `INV-10`（交换反馈权重高于社交信号）由后端派生，组件只展示。

### Tests
四级映射正确文案/图标；`showScore` 渲染分数+单位；`onExplain` 可键盘触发；等级含文字非仅色。

---

## COMP-013 · IconChip

### Component name
`IconChip`（着色图标方块）。落地 `UI-003 IconChip`（归一后的"彩色图标徽"，`DEC-012`）。用于 Agent 技能 `PAGE-050`、通知 `PAGE-062`、统计 `PAGE-102`。

### Purpose
浅底圆角方块（主色或语义色）+ **内嵌单一族字形**（Material Symbols Outlined / lucide 替换）。保留视觉层次，只剩一套字形真源（`UI-002` 冲突归一）。

### Props or inputs
- `icon: string`（规范图标名）、`tone: 'primary'|'success'|'warning'|'danger'|'info'|'accent'|'neutral'`、`size?: 'sm'|'md'|'lg'`、`shape?: 'rounded'|'circle'`。

### Events or outputs
通常装饰型，无事件（语义由相邻文字承担）。

### States
各 tone 浅底；尺寸；无独立交互态（除非容器可点）。

### Accessibility requirements
- 默认装饰性：`aria-hidden="true"`，语义由相邻文本表达（如通知类型文字）。
- 若 chip 是唯一语义载体，必须提供 `aria-label`/visually-hidden 文本——**禁止仅靠颜色/图标传达类型**（`NFR-007`）。

### Data dependencies
图标名经 `docs/icon-map.md` 映射。类型来自使用场景（通知 `ENT-017` 事件类型 / 技能 `ENT-016` 类别 / 统计指标 `ENT-019`）。

### Tests
渲染单一族字形（无第二族/filled）；tone→浅底令牌类；装饰态 `aria-hidden`；作唯一语义载体时有可读 label。

---

## COMP-014 · StatBlock

### Component name
`StatBlock`（统计数字块）。落地 `UI-003 StatBlock`。用于发现底部 `PAGE-002`、信任档案 `PAGE-040`、平台统计 `PAGE-102`、审核摘要 `PAGE-080`、个人中心 `PAGE-060`。

### Purpose
价值橱窗：大数字（`text-stat`）+ 标签 + 图标（`IconChip`/字形）+ 可选趋势（升/降 + 百分比）。展示聚合指标（`ENT-019`，不含 PII，`INV-09`）。

### Props or inputs
- `value: string|number`（已格式化，如 `12,857`）、`label: string`、`icon?`、`tone?`、`trend?: { direction: 'up'|'down'|'flat'; delta: string }`、`loading?`。

### Events or outputs
- `onClick?()`（可选，下钻到明细）。

### States
default / loading（`Skeleton`）/ with-trend（up=success / down=danger 或中性，含箭头+文字）/ empty（"—" 占位）。

### Accessibility requirements
- 大数字有关联文字标签（label 与 value `aria-labelledby` 关联）。
- 趋势方向非仅颜色——含箭头图标 + 文字（如"↑ 12%"）。
- 数字用 `tabular-nums`；屏读可读"模块总数 12,857，较上周上升 12%"。

### Data dependencies
`ENT-019` UsageStat（用户数/模块数/交换数/隐私门通过率等聚合）、`ENT-011`（信任分）、`ENT-003` 计数。**断言不含 PII**（`INV-09`）。

### Tests
渲染 value+label 关联；趋势含箭头+文字非仅色；loading→Skeleton；empty→占位；格式化数字 tabular。

---

## COMP-015 · DataTable

### Component name
`DataTable`（紧凑数据表）。落地 `UI-003 DataTable`；实现 `shadcn Table` + `TanStack Table`。用于交换记录 `PAGE-030`、审核队列 `PAGE-081`、审计日志 `PAGE-083`。

### Purpose
高密度行列表：表头关联、hover/选中行、排序、可选行操作。窄屏转卡片式行（响应式，`ASM-016`）。

### Props or inputs
- `columns: ColumnDef[]`（含 header、cell 渲染、`sortable?`、`align?`）。
- `data: Row[]`、`getRowId`、`onSort?`、`sorting?`、`onRowClick?`、`rowActions?`、`selectable?`、`density?: 'compact'|'comfortable'`、`loading?`、`emptyState?: ReactNode`。

### Events or outputs
- `onSort(columnId, dir)`、`onRowClick(row)`、`onRowAction(action, row)`、`onSelectionChange(ids)`。

### States
default / hover 行 / selected 行（主色浅底）/ sorted 列（升降指示）/ loading（行 `Skeleton`）/ empty（`EmptyState`）/ 窄屏卡片模式。

### Accessibility requirements
- 原生 `<table>` 语义：`<th scope="col">`、行头 `scope="row"`；排序列 `aria-sort`。
- 行操作为真实按钮带 `aria-label`（含行上下文）；可选行用 checkbox + 关联 label。
- 排序触发器键盘可达；窄屏卡片模式保留同等信息与可达性。
- 风险/状态列非仅颜色（用 `StatusPill`）。

### Data dependencies
交换记录 `ENT-007`（脱敏，`INV-04`）、审核 `ENT-015`/`ENT-006`/`ENT-005`、审计 `ENT-018`。公开台账不含私有内容（`INV-01/04`）。取数 `lib/queries/*`。

### Tests
表头 `scope`/`aria-sort` 正确；点击排序触发 `onSort` 并更新 `aria-sort`；行点击/操作带行上下文 label；空态渲染 `EmptyState`；loading 行 Skeleton；注入私有字段被白名单丢弃（交换台账）。

---

## COMP-016 · ListRow

### Component name
`ListRow`（通用列表行）。落地 `UI-003 DataTable/ListRow`。用于通知 `PAGE-062`、审计 `PAGE-083`、API 端点 `PAGE-090`、个人中心交换列表 `PAGE-060`、同意记录 `PAGE-064`。

### Purpose
单行复合：左 头像/`IconChip` + 中 主文本/副文本 + 右 元信息/操作。列表/通知/审计的通用基元（区别于表格的紧凑多列）。

### Props or inputs
- `leading?: ReactNode`（Avatar/IconChip）、`title: ReactNode`、`subtitle?`、`meta?`（时间/状态）、`actions?`、`href?`、`unread?: boolean`、`tone?`、`as?: 'li'|'div'|'a'`。

### Events or outputs
- `onClick?`/`onAction?`。

### States
default / hover / unread（主色左条 + 圆点 + 文字"未读"）/ read / with-actions / selected。

### Accessibility requirements
- 列表用 `<ul>`/`<li>` 或 `role="list"`；行内单一主链接。
- **未读非仅颜色**——含图标/visually-hidden "未读"文本（`PAGE-062` 通知，`NFR-007`）。
- 时间用相对文本 + `<time datetime>` 绝对 title。

### Data dependencies
通知 `ENT-017`（事件类型/引用/已读）、审计 `ENT-018`、同意 `ENT-021`、交换 `ENT-007`。

### Tests
unread 渲染左条+圆点+可读"未读"文本；read 态无；时间含 `<time>` 绝对 title；行操作带上下文 label；列表语义。

---

## COMP-017 · LineChart

### Component name
`LineChart`（折线/面积图）。落地 `UI-003 LineChart`；实现 `Recharts`，主题对齐 `--color-accent`。用于信任分趋势 `PAGE-040`、平台统计趋势 `PAGE-102`。

### Purpose
展示时间序列趋势（信任分、平台用量），线条用 `accent`。提供可读文字摘要满足 `NFR-007`。

### Props or inputs
- `data: { x: string; y: number }[]`、`xLabel`/`yLabel`、`series?`、`color?`（默认 accent）、`height?`、`summary: string`（**必填**：图表文字摘要）、`loading?`、`emptyMessage?`。

### Events or outputs
- `onPointHover?`/`onPointClick?`（可选下钻）。

### States
default / loading（Skeleton）/ empty（无数据文案）/ tooltip hover。

### Accessibility requirements
- **图表必带文字摘要**（`summary`，`role="img"` + `aria-label` 或相邻 visually-hidden 段，`NFR-007`）。
- 提供数据表替代（visually-hidden `<table>`）供屏读；颜色非唯一区分（多 series 时加图例文字/虚实线型）。
- tooltip 键盘可达或提供等价数据访问。

### Data dependencies
`ENT-011`（信任分趋势）、`ENT-019` UsageStat（聚合趋势，`INV-09` 不含 PII）。

### Tests
`summary` 必填（缺失报错/兜底）；渲染 `role="img"`+label；空/loading 态；数据表替代存在且与数据一致；线色用 accent 令牌。

---

## COMP-018 · DonutChart

### Component name
`DonutChart`（环形/分段图）。落地 `UI-003 DonutChart`；实现 `Recharts`，主色 + 语义色分段。用于信任分构成 `PAGE-040/041`、模块来源构成 `PAGE-010`。

### Purpose
展示构成/占比（信任分维度、隐私门通过率构成、来源统计分布），分段用主色 + 语义色。

### Props or inputs
- `segments: { label; value; tone }[]`、`centerLabel?`、`summary: string`（必填）、`height?`、`loading?`。

### Events or outputs
- `onSegmentClick?`。

### States
default / loading / empty / segment hover（高亮 + tooltip）。

### Accessibility requirements
- 同 `LineChart`：必带文字摘要、数据表替代、图例文字标签；分段非仅靠颜色（图例含 label + 百分比文字）。

### Data dependencies
`ENT-011`（信任维度构成）、`ENT-004`（来源统计）、`ENT-019`（通过率，`INV-09`）。

### Tests
`summary` 必填；图例每段含 label+百分比文字；空/loading；分段 tone 用令牌；数据表替代一致。

---

## COMP-019 · Stepper

### Component name
`Stepper`（竖向步骤指示）。落地 `UI-003 Stepper`。用于提交向导 `PAGE-020~024`。

### Purpose
左侧竖向步骤指示，当前步主色高亮，已完成步打勾。引导提交向导 5 步线性推进（选类型→清单→隐私门→预览→提交）。

### Props or inputs
- `steps: { key; label; status: 'pending'|'active'|'done'|'error'|'blocked' }[]`、`currentKey`、`onStepClick?`（仅允许回到已完成步）、`orientation?: 'vertical'|'horizontal'`。

### Events or outputs
- `onStepClick(key)`（受限导航；前进受隐私门约束，见 `ConsentGate`）。

### States
每步：pending / active（主色）/ done（对勾，success）/ error / blocked（隐私门 block 时锁住后续步，`INV-02`）。

### Accessibility requirements
- `<ol>` 有序列表；当前步 `aria-current="step"`；步状态有文字（"第 3 步，进行中"）非仅颜色。
- 不可达步禁用且 `aria-disabled`；键盘只能进入允许的步。

### Data dependencies
向导本地状态（步进）；隐私门结果 `ENT-005`（block→锁后续）。`ASM-027` 深链步进。

### Tests
当前步 `aria-current="step"`；done 步含对勾+文字；blocked 时后续步 `aria-disabled` 且不可点；只能回退到已完成步；状态文字非仅色。

---

## COMP-020 · ConsentGate

### Component name
`ConsentGate`（隐私/同意门，三态）。落地 `UI-003 ConsentGate`。用于提交向导隐私门 `PAGE-022`（强约束），并复用于联系/交换前同意点（`FLOW-007`）。

### Purpose
隐私门：pass/warn/block 三态用语义色 + 文字 + 明确同意按钮。**block 禁止继续、warn 需显式确认、pass 方可推进**（`INV-02`/`NFR-005`/`INV-08`）——本组件是这些不变量的 UI 落点。

### Props or inputs
- `result: 'pass'|'warn'|'block'`、`findings: { level; message; suggestion? }[]`（来自 `ENT-005` PrivacyScan）、`consentRequired?: boolean`、`consentText`、`onConsent?`、`onProceed?`、`loading?`。

### Events or outputs
- `onConsent(checked)`（同意勾选→写 `ENT-021` Consent）。
- `onProceed()`（仅 pass，或 warn 且已确认时启用；block 永久禁用）。

### States
- pass（success，可继续）/ warn（warning，需勾选同意才可继续）/ block（danger，**继续按钮禁用且不可绕过**）/ loading（扫描中）。
- 同意复选未勾时 proceed 禁用（warn）。

### Accessibility requirements
- 三态用语义色 + 标题文字 + 图标（非仅颜色）。
- 发现项列表可读，suggestion 关联；同意复选有关联 label；block 态 proceed 按钮 `aria-disabled` + 说明"存在阻止项，无法发布"。
- 焦点流：扫描结果→同意→继续。

### Data dependencies
`ENT-005` PrivacyScan（findings pass/warn/block，`HARD-01`）、`ENT-021` Consent（写入，`INV-08`）。`INV-02`：含 block 不得发布。

### Tests
- **block 态 proceed 始终禁用**（核心不变量断言，不可绕过）。
- warn 态未勾同意 proceed 禁用、勾选后启用。
- pass 态可直接继续。
- `onConsent` 触发写同意；三态文字+图标非仅色；findings 渲染含 suggestion。

---

## COMP-021 · EmptyState

### Component name
`EmptyState`（空状态）。落地 `UI-003 EmptyState`。用于发现无结果 `PAGE-002`、无模块 `PAGE-060`、无交换 `PAGE-030`、无通知 `PAGE-062`、无信任历史 `PAGE-040` 等（对齐 `IA_SPEC` 空状态）。

### Purpose
居中图标（单一族）+ 标题 + 说明 + 主 CTA，把空场景转为引导（如无模块→提交向导）。

### Props or inputs
- `icon: string`、`title`、`description`、`action?: { label; onClick|href }`、`secondaryAction?`、`tone?`。

### Events or outputs
- `onAction()`（如跳提交向导 `PAGE-020`）。

### States
default；with/without CTA；不同场景文案。

### Accessibility requirements
图标 `aria-hidden`，语义在标题/说明文字；CTA 为真实按钮/链接键盘可达；标题用合适 heading 级别。

### Data dependencies
无（文案由使用方注入，对应各 `IA_SPEC` 空状态说明）。

### Tests
渲染标题/说明/图标；CTA 触发 `onAction`；无 CTA 时不渲染按钮；图标装饰性 `aria-hidden`。

---

## COMP-022 · TopicChip

### Component name
`TopicChip`（主题标签）。落地 `UI-003` 标签类；实现 `shadcn Badge`。用于发现筛选 `PAGE-002`、模块详情 `PAGE-010`。

### Purpose
展示/选择主题标签（`ENT-020`），作发现的筛选维度（`FR-010`）。

### Props or inputs
- `label`、`count?`、`selected?: boolean`、`removable?: boolean`、`onClick?`、`onRemove?`、`href?`。

### Events or outputs
- `onClick(topic)`（筛选切换）、`onRemove(topic)`。

### States
default / selected（主色浅底+主色文字）/ hover / removable（带 ×）/ with-count。

### Accessibility requirements
可点为 `<button>`/`<a>`；selected 用 `aria-pressed`；移除按钮独立 `aria-label="移除主题 <名>"`；非仅靠颜色表达选中（含勾或加粗）。

### Data dependencies
`ENT-020` Topic/Tag（名称、关联计数）。

### Tests
selected `aria-pressed`；点击触发 `onClick`；removable × 触发 `onRemove` 且有 label；count 渲染。

---

## COMP-023 · MethodPill

### Component name
`MethodPill`（HTTP 方法药丸）。落地 `UI-003`（API 文档场景的 StatusPill 特化）；实现 `shadcn Badge`。用于开放 API `PAGE-090`。

### Purpose
GET/POST/PUT/DELETE 方法标识，色区分 + **文字**（方法名本身即文字，满足非仅颜色，`NFR-002` agent 可读、`INV-04` 零私有）。

### Props or inputs
- `method: 'GET'|'POST'|'PUT'|'PATCH'|'DELETE'`、`size?`。

### Events or outputs
通常无。

### States
各方法固定色映射（GET=info、POST=success、PUT/PATCH=warning、DELETE=danger）+ 方法文字。

### Accessibility requirements
方法名为文字（非仅颜色）；色 + 文字双通道；对比达标；等宽或清晰字重。

### Data dependencies
`ENT-019`/API 文档配置（`IA-012`）。展示公开读 API（`GET /api/modules` 等），不含 contact（`ASM-055`/`INV-04`）。

### Tests
每方法映射正确色+文字；文字始终存在（非仅色）；对比通过。

---

## COMP-024 · CodeBlock

### Component name
`CodeBlock`（等宽代码块 + 复制）。落地 `UI-003`（详情/提交 Manifest、API JSON）。用于模块详情 `PAGE-010`、提交预览 `PAGE-023`、API 文档 `PAGE-090`。

### Purpose
等宽（`JetBrains Mono`）展示 JSON Manifest / 请求响应示例，带复制按钮。**等宽字体**是契约（`UI-001`）。

### Props or inputs
- `code: string`、`language?: 'json'|'bash'|'text'`、`showCopy?: boolean`（默认 true）、`maxHeight?`、`label?`（描述用途）。

### Events or outputs
- `onCopy(success)`（复制成功触发 `Toast`）。

### States
default / copied（按钮短暂"已复制"）/ scrollable（超高滚动）/ copy-error。

### Accessibility requirements
- `<pre><code>` 等宽；复制按钮 `aria-label="复制代码"`，复制后 `aria-live` 播报"已复制"。
- 代码块可键盘聚焦滚动（`tabindex=0` + 可见 focus）；语言标识为文字。

### Data dependencies
`ENT-004` Manifest（脱敏 JSON）、API 示例（`ENT-019`/契约）。**白名单**：不渲染私有 URL/内容（`INV-01/04`）。

### Tests
渲染等宽字类（JetBrains Mono）；复制按钮 a11y label + 点击后 `aria-live` 播报；可键盘聚焦滚动；注入私有 URL 的 mock 被过滤/告警。

---

## COMP-025 · ConfirmDialog

### Component name
`ConfirmDialog`（破坏性二次确认）。落地 `UI-003`（组件行为规则）；实现 `shadcn AlertDialog`。用于审核处置 `PAGE-085`、设置 `PAGE-063`、披露/下架/删除。

### Purpose
破坏性/不可逆操作（下架、披露联系方式、删除、拒绝/处罚）的二次确认（`UI_RULES` 组件行为规则）。

### Props or inputs
- `open`、`title`、`description`、`confirmLabel`、`cancelLabel?`、`tone?: 'danger'|'default'`、`requireTyping?: string`（高危需输入确认词）、`loading?`。

### Events or outputs
- `onConfirm()`、`onCancel()`、`onOpenChange(open)`。

### States
closed / open / 高危（`requireTyping` 未匹配时 confirm 禁用）/ loading（确认中）/ 完成关闭。

### Accessibility requirements
- `AlertDialog` 语义：`role="alertdialog"`、`aria-modal`、焦点陷入、Esc 取消、打开时焦点落在取消（安全默认）。
- danger 态文字明确后果，非仅红色；`requireTyping` 输入有关联 label。

### Data dependencies
依操作而定：披露 `ENT-009`（`INV-03` 仅 Accepted 后）、下架 `ENT-003`、审核处置 `ENT-015`、写 `ENT-018` AuditLog（`INV-11`）。

### Tests
打开焦点落取消；Esc/取消触发 `onCancel`；`requireTyping` 不匹配时 confirm 禁用、匹配后启用；danger 文字含后果说明；焦点陷入。

---

## COMP-026 · Drawer

### Component name
`Drawer`（抽屉/侧滑面板）。落地 `UI-003`；实现 `shadcn Sheet`。用于信任解释 `PAGE-041`、审核详情 `PAGE-082`、技能详情 `PAGE-051`。

### Purpose
从侧边滑出的子 surface，承载详情/解释而不离开当前列表上下文（信任解释、审核项详情、技能详情）。

### Props or inputs
- `open`、`side?: 'right'|'left'`、`title`、`children`、`size?: 'sm'|'md'|'lg'`、`onOpenChange`。

### Events or outputs
- `onOpenChange(open)`、`onClose()`。

### States
closed / opening / open / closing；loading（内容加载 Skeleton）。

### Accessibility requirements
- `role="dialog"`、`aria-modal`、`aria-labelledby` 指向标题；焦点陷入、Esc 关闭、关闭后焦点回触发元素。
- 遮罩点击关闭可配置；窄屏占满宽度。

### Data dependencies
信任解释 `ENT-011`、审核 `ENT-015`/`ENT-005`、技能 `ENT-016`。深链支持（`ASM-043`）。

### Tests
打开焦点陷入 + `aria-labelledby`；Esc/遮罩关闭触发 `onOpenChange(false)`；关闭后焦点归还；loading Skeleton。

---

## COMP-027 · Tabs

### Component name
`Tabs`（筛选/分区 Tab）。落地 `UI-003`；实现 `shadcn Tabs`。用于通知筛选 `PAGE-062`、设置分区 `PAGE-063`、API 分组 `PAGE-090`。

### Purpose
同一路由内分区/筛选切换（通知按类型、设置按 section、API 按端点组）。窄屏作两栏折叠的承载（`ASM-016`）。

### Props or inputs
- `tabs: { key; label; count?; icon? }[]`、`activeKey`、`onChange`、`variant?: 'underline'|'pill'`、`syncToUrl?: boolean`（深链，`ASM-036`/`ASM-043`）。

### Events or outputs
- `onChange(key)`（可同步 URL searchParams）。

### States
active tab（主色）/ hover / focus / with-count / disabled tab。

### Accessibility requirements
- `shadcn Tabs` 提供 `role="tablist"`/`tab`/`tabpanel`、`aria-selected`、箭头键导航、`tabpanel` 关联；active 非仅颜色（含下划线/加粗）。

### Data dependencies
计数来自相应实体（通知 `ENT-017` 未读分类计数等）。`syncToUrl` 用 searchParams。

### Tests
`role=tablist`/`aria-selected` 正确；箭头键切换焦点；`onChange` 触发并可同步 URL；active 非仅色；count 渲染。

---

## COMP-028 · Accordion

### Component name
`Accordion`（折叠面板/FAQ）。落地 `UI-003`；实现 `shadcn Accordion`。用于关于/帮助 FAQ `PAGE-104`。

### Purpose
FAQ 与可折叠说明（隐私说明、可审计规则），节省纵向空间。

### Props or inputs
- `items: { key; question; answer: ReactNode }[]`、`type?: 'single'|'multiple'`、`defaultOpen?`。

### Events or outputs
- `onValueChange(openKeys)`。

### States
collapsed / expanded（单/多开）；hover/focus。

### Accessibility requirements
- 触发器为 `<button aria-expanded>` + `aria-controls` 指向面板；面板 `role="region" aria-labelledby`；Enter/Space 切换、键盘可达。

### Data dependencies
静态 FAQ 内容（`PAGE-104`，`NFR-004` 可审计、隐私说明）。无 PII。

### Tests
触发器 `aria-expanded` 切换；面板 `aria-labelledby` 关联；single 模式互斥展开；键盘 Enter 切换。

---

## COMP-029 · Toast

### Component name
`Toast`（瞬时通知）。落地 `UI-003`；实现 `shadcn Sonner`。用于保存成功 `PAGE-063`、复制成功（`CodeBlock`）、各写动作反馈。

### Purpose
非阻断式反馈（保存成功、复制成功、操作失败），自动消失，对应乐观更新（如通知已读 `ASM-045`）。

### Props or inputs（API：`toast(...)` 调用）
- `message`、`tone?: 'success'|'error'|'info'|'warning'`、`duration?`、`action?: { label; onClick }`、`description?`。

### Events or outputs
- `onActionClick?`、`onDismiss?`。

### States
visible / auto-dismissing / with-action / stacked（多条堆叠）/ error（更长停留）。

### Accessibility requirements
- 容器 `aria-live="polite"`（error 用 `assertive`）、`role="status"`；可键盘聚焦含 action 的 toast；非仅颜色（含图标 + 文字）；不抢焦点。

### Data dependencies
无（由写 mutation 成功/失败触发）。

### Tests
触发后 `aria-live` 播报；tone→图标+文字非仅色；action 可点；error 停留更久；自动消失。

---

## COMP-030 · FormField

### Component name
`FormField`（表单字段封装）。落地 `UI-003`；实现 `react-hook-form` + `shadcn Form/Label/Input` + `zod`。用于设置 `PAGE-063`、反馈 `PAGE-042`、提交向导各步 `PAGE-020~024`。

### Purpose
统一字段：label 关联控件、描述、错误信息、必填标识。承载校验（`ASM-029` 同意门、字段校验）。

### Props or inputs
- `name`、`label`、`control`（rhf）、`description?`、`required?`、`error?`、`children`（任意输入控件：Input/Textarea/Select/Switch/RatingInput）、`hint?`。

### Events or outputs
透传控件的 `onChange`/`onBlur`（由 rhf 管理）；不自持业务事件。

### States
default / focused / filled / error（红框 + 错误文字）/ disabled / required（标识）。

### Accessibility requirements
- `<label htmlFor>` 与控件 `id` 关联；错误用 `aria-invalid` + `aria-describedby` 指向错误文本；必填 `aria-required`；错误文字非仅颜色（含图标/文字）。

### Data dependencies
依字段而定（联系方式 `ENT-008`、反馈维度 `ENT-010`、提交字段 `ENT-004`/`ENT-006`）。zod schema 在 `lib/`。

### Tests
label `htmlFor` 关联控件 id；error 时 `aria-invalid` + `aria-describedby`；required `aria-required`；错误文字非仅色；校验失败展示 zod 消息。

---

## COMP-031 · VisibilityToggle

### Component name
`VisibilityToggle`（可见性开关，默认私密）。落地 `UI-003`；实现 `shadcn Switch`。用于设置·联系方式 `PAGE-064`（`IA-014`）。

### Purpose
联系方式可见性开关（私密/公开），**默认私密**（`INV-03`/`DEC-010`）+ 状态文字。是 `INV-03` 的关键 UI 落点。

### Props or inputs
- `value: 'private'|'public'`、`onChange`、`label`（如"GitHub 联系方式"）、`disclosurePolicyHint?`、`disabled?`。
- **默认值约定**：未提供时按 `private` 渲染。

### Events or outputs
- `onChange('private'|'public')`（改 public 为显式 opt-in；可触发 `ConfirmDialog`）。

### States
- private（默认，关，文字"私密"）/ public（开，文字"公开"）/ disabled / changing（保存中）。
- 改为 public 时提示后果（仅 opt-in 才公开）。

### Accessibility requirements
- `shadcn Switch` role=`switch` + `aria-checked`；**状态有文字**（"私密"/"公开"）非仅开关位置/颜色（`NFR-007`）；label 关联；披露策略说明可读。

### Data dependencies
`ENT-008` ContactInfo（可见性 private/public/exchange-revealed）。`INV-03`：默认私密；披露仅 Accepted 后对该次对方（披露逻辑在交换流，本组件只管 private/public 偏好）。

### Tests
- **默认渲染 private**（不变量断言）。
- 切换 public 触发 `onChange` 且显示后果提示；状态有文字标签非仅色；`aria-checked` 正确；disabled 不可切。

---

## COMP-032 · Pagination / LoadMore

### Component name
`Pagination` / `LoadMore`（分页 / 加载更多）。落地 `UI-003` 列表分页。用于发现 `PAGE-002`、交换记录 `PAGE-030`、通知 `PAGE-062`、审计 `PAGE-083`。

### Purpose
长列表分页或增量加载。两种形态共用契约：页码分页（表格）与"加载更多"（流式列表如通知）。

### Props or inputs
- `mode: 'pages'|'loadMore'`、`page?`、`pageCount?`、`hasMore?`、`loading?`、`total?`、`onPageChange?`、`onLoadMore?`。

### Events or outputs
- `onPageChange(page)`、`onLoadMore()`。

### States
default / loading（按钮/页码禁用 + spinner）/ no-more（"已全部加载"）/ single-page（隐藏）。

### Accessibility requirements
- 页码导航 `<nav aria-label="分页">`；当前页 `aria-current="page"`；"加载更多"为按钮带 `aria-label`，加载中 `aria-busy`；新加载项焦点/`aria-live` 友好。

### Data dependencies
列表查询的分页游标/页码（`lib/queries/*`）。深链页码（searchParams）。

### Tests
pages 模式当前页 `aria-current`、`onPageChange` 触发；loadMore `hasMore=false` 显示"已全部加载"且按钮隐藏/禁用；loading `aria-busy`。

---

## COMP-033 · Skeleton

### Component name
`Skeleton`（加载占位）。落地 `UI-003`；实现 `shadcn Skeleton`。用于全站加载态（卡片/行/统计/图表/抽屉）。

### Purpose
数据加载期的占位骨架，减少布局抖动，配合 TanStack Query loading 态。

### Props or inputs
- `variant?: 'text'|'card'|'row'|'avatar'|'stat'|'chart'`、`count?`、`width?`/`height?`、`className?`。

### Events or outputs
无。

### States
loading（动画）；不同 variant 形状。

### Accessibility requirements
- 容器 `aria-busy="true"` / `aria-hidden`（装饰），由父区域提供 `aria-live`/loading 文本（如"加载中"）供屏读，避免空读；不抢焦点。

### Data dependencies
无。

### Tests
渲染各 variant 形状；`aria-hidden`/装饰；`count` 渲染多个；父级 loading 文本存在（集成）。

---

## COMP-034 · Avatar

### Component name
`Avatar`（GitHub 头像）。落地 `UI-003`；实现 `shadcn Avatar`。用于全站用户身份（卡片/列表/档案/顶栏）。

### Purpose
显示 GitHub 头像 + fallback（首字母/默认图），可叠加 Verified 角标。

### Props or inputs
- `src?`、`login: string`、`size?: 'xs'|'sm'|'md'|'lg'`、`verified?: boolean`、`alt?`。

### Events or outputs
- `onClick?`（跳档案 `PAGE-040`，可选）。

### States
loaded / fallback（加载失败/无图→首字母）/ verified（角标，success + 可读）/ loading。

### Accessibility requirements
- `alt` 含用户标识（如"@login 的头像"）；fallback 首字母 + `aria-label`；verified 角标有 visually-hidden "已验证"文本非仅颜色。

### Data dependencies
`ENT-001` User（GitHub `avatarUrl`/`login`/`verified`）。

### Tests
有 src 渲染图 + alt；加载失败渲染 fallback 首字母；verified 含可读文本；尺寸类正确。

---

## COMP-035 · RatingInput

### Component name
`RatingInput`（结构化反馈输入）。落地 `UI-003`（反馈场景）。用于反馈表单 `PAGE-042`（`IA-006` 交换详情内反馈区）。

### Purpose
采集结构化反馈维度（清单一致性/隐私边界/结构清晰度/有用性/再次交换意愿，`ENT-010`），非自由打星而是结构化维度评分。

### Props or inputs
- `dimensions: { key; label; description? }[]`、`value: Record<key, number>`、`scale?: number`（默认 5）、`onChange`、`disabled?`、`required?`。

### Events or outputs
- `onChange(dimensionKey, score)`、`onComplete?(allScores)`。

### States
empty / partially-rated / complete / disabled / error（必填未填）。

### Accessibility requirements
- 每维度为 `radiogroup`（`role="radiogroup" aria-labelledby`），分值为 radio，键盘箭头选择；当前值有文字（"4 / 5"）非仅图标；维度 label 关联。

### Data dependencies
`ENT-010` Feedback 维度（5 维），权重由后端（`INV-10`，社交信号权重更低）。`ENT-007` 关联交换。

### Tests
渲染各维度 radiogroup；箭头键改分触发 `onChange`；分值有文字；required 未填报错；维度 label 关联。

---

## COMP-036 · Timeline

### Component name
`Timeline`（通用竖向时间线）。落地 `UI-003`（交换详情场景的通用基元）。用于交换详情 `PAGE-031`（模块特化的交换状态机 timeline 在 exchange 模块 `COMP-090~109` 基于此构建）。

### Purpose
通用竖向时间线基元：节点 + 连接线 + 内容，按时间展示事件序列。交换生命周期等具体语义由模块层包装。

### Props or inputs
- `items: { key; title; description?; timestamp; status?: 'done'|'completed'|'active'|'pending'|'error'|'terminated'; icon? }[]`、`orientation?: 'vertical'`、`compact?`。
  - 状态语义：`done`/`completed`（已完成，二者等价，供模块层按语义选用）、`active`（进行中，主色）、`pending`（未开始/弱化）、`error`（错误）、`terminated`（异常终止，如交换的 Rejected/Cancelled/Expired —— 与 error 区分，用中性而非告警语气）。模块特化（如 exchange `COMP-093 ExchangeTimeline`）只取用本枚举值，不另定义状态字。

### Events or outputs
- `onItemClick?`。

### States
节点 done/completed / active（主色）/ pending（弱化）/ error / terminated（异常终止，中性收尾，非告警色）；空（无事件）；loading。

### Accessibility requirements
- `<ol>` 有序；每项时间用 `<time datetime>`；节点状态有文字 + 图标非仅颜色；active 项 `aria-current` 适配。

### Data dependencies
通用——交换详情用 `ENT-007` 状态变更序列（不含私有内容，`INV-01/04`）+ `ENT-018` 审计事件。具体映射在 exchange 模块组件。

### Tests
按时间序渲染节点；状态含文字+图标非仅色；时间 `<time datetime>`；`<ol>` 语义；空/loading 态。

---

## COMP-037 · 预留（PaginationVariant，按需）

### Component name
`COMP-037`（预留）。计划用途：分页器变体（如游标/无限滚动哨兵），在 `COMP-032` 不足时引入。**当前预留，按需启用。**

### Purpose
预留给分页/虚拟滚动的变体需求；启用前不实现。任何启用须追溯到具体 `PAGE-*` 列表需求，不得越权（`NFR-003`）。

### Props or inputs / Events or outputs / States / Accessibility requirements / Data dependencies / Tests
预留——启用时按 `COMP-032` 同等标准补全 8 字段（键盘可达、`aria-live` 增量加载、无障碍分页语义）。

---

## COMP-038 · 预留（FilterBar，按需）

### Component name
`COMP-038`（预留）。计划用途：发现/列表的组合筛选条（主题 + 排序 + 状态聚合），在 `TopicChip`+`Tabs` 组合不足时上升为独立组件。**当前预留，按需启用。**

### Purpose
预留给发现页 `PAGE-002` 复杂筛选编排；当前用 `COMP-022 TopicChip` + `COMP-027 Tabs` + `COMP-003` 组合满足。启用须追溯 `FR-010`。

### Props or inputs / Events or outputs / States / Accessibility requirements / Data dependencies / Tests
预留——启用时补全 8 字段（筛选状态深链、`aria` 分组、清除筛选可达）。

---

## COMP-039 · 预留（NotificationItem 基元，按需）

### Component name
`COMP-039`（预留）。计划用途：通知项专用基元，若 `ListRow` 在通知场景（`PAGE-062`）特化逻辑过多则上升。**当前预留，按需启用。**

### Purpose
预留——当前通知项用 `COMP-016 ListRow`（unread 态 + `IconChip` 类型）满足。启用须追溯 `FR-120`/`ENT-017`，并保持未读非仅颜色（`NFR-007`）。

### Props or inputs / Events or outputs / States / Accessibility requirements / Data dependencies / Tests
预留——启用时补全 8 字段，继承 `ListRow` 的未读可达性约束。

---

## COMP-040 · 预留（按需）

### Component name
`COMP-040`（预留）。计划用途：未来跨模块共享需求的占位（如全局 Banner/Callout 若多模块复用则收敛到此）。**当前预留，按需启用。**

### Purpose
预留段尾位，给后续阶段（10/11/12）发现的跨模块共享组件留 ID。任何启用须可追溯到 `UI-003`/`PAGE-*`/产品规格，遵守 `DEC-007`（无经济模型）与单一图标族（`DEC-012`），不得引入不可追溯组件（硬规则）。

### Props or inputs / Events or outputs / States / Accessibility requirements / Data dependencies / Tests
预留——启用时按模板 8 字段补全并登记。

---

## 本阶段新增假设（未写入 DEFAULT_ASSUMPTIONS.md，待编排者登记）

| ID | 假设 | 风险 | 确认 |
| --- | --- | --- | --- |
| `ASM-068` | 共享组件以 props 注入数据、不自取数；取数由页面 + `lib/queries/*`（TanStack Query）负责 | 若团队偏好组件内取数（如 RSC 数据组件），契约需调整 | 前端实现确认 |
| `ASM-069` | 图表（`COMP-017/018`）的文字摘要 `summary` 为**必填** prop，无摘要不渲染图表（落 `NFR-007`） | 增加调用方负担；若改自动生成摘要需新逻辑 | 前端实现/无障碍确认 |
| `ASM-070` | `StatusPill`/`MethodPill` 的 `label`/方法文字为必填，禁止纯色无文字（落 `NFR-007` 状态非仅颜色） | 视觉若想要纯色 chip 会冲突 | 设计/无障碍确认 |
| `ASM-071` | `ConsentGate` 的 block 态"继续"按钮在前端**硬禁用且不可绕过**（落 `INV-02`）；最终发布拦截仍以后端为准 | 前端拦截非安全边界，须后端二次校验 | 服务契约阶段 |
| `ASM-072` | `VisibilityToggle` 未提供值时默认渲染 `private`（落 `INV-03` 默认私密） | 若某场景需默认公开会与不变量冲突，应显式传值 | 组件规格确认 |
| `ASM-073` | `COMP-037~040` 为预留位，当前用现有组件组合满足；启用须追溯 `UI-003`/`PAGE-*` 并补全 8 字段 | 若过早实现易产生不可追溯组件 | 后续阶段按需确认 |

## 质量门结果（自检）

```text
Gate: 07-frontend-spec-gate
Status: pass（内容自检通过）— 待用户确认 + 与各模块 COMPONENTS_SPEC 交叉审核
Evidence:
  - aies/02-design/_shared/COMPONENTS_SPEC.md 对照 FRONTEND_SPEC.md §6（COMP-001~040 索引/边界）、§4 令牌、§5 图标
  - 对照 UI_RULES.md（UI-001/002/003）、IA_SPEC.md（IA-001~014）、LIGHT_DOMAIN_MODEL.md（ENT-*/INV-*）、ID_REGISTRY.md（PAGE-*）
  - 模板：COMPONENTS_SPEC_TEMPLATE.md 8 字段
Findings:
  - COMP-001~040 全覆盖 FRONTEND_SPEC §6 表（COMP-007/008、017/018 拆为独立节；COMP-037~040 标预留并说明当前由组合满足）。✅
  - 每节含 8 字段，内容具体到 props/事件/状态/无障碍/数据/测试；实现锚定 shadcn 基元 + Tailwind 令牌。✅
  - 追溯：每组件标注 UI-003 落地名、主要 PAGE-*/IA-*、相关 ENT-*/INV-*。✅
  - 无障碍字段具体（角色/键盘/aria/对比度/状态文字化），为 NFR-007 落点。✅
  - 关键不变量写进契约+测试：StatusPill 状态非仅颜色（NFR-007）、ConsentGate block 不可绕过（INV-02）、VisibilityToggle 默认私密（INV-03）、CodeBlock 等宽、白名单渲染（INV-01/04）、UsageStat 无 PII（INV-09）。✅
  - 单一图标族（DEC-012）：props 传规范名经 icon-map 映射 lucide，禁第二族/filled；Octocat 唯一例外。✅
  - 无经济模型冲突（DEC-007）：未引入支付/计费类组件。✅
  - 未引入不可追溯组件；预留位明确"按需 + 须追溯"。✅
Findings（待办，非本节阻塞）:
  - 与 10 模块 COMPONENTS_SPEC 交叉审核（确认模块只引用不重定义 COMP-001~040）。
  - 编排者登记 COMP-001~040 与 ASM-068~073 到 ID_REGISTRY/DEFAULT_ASSUMPTIONS（本 agent 不改控制文件）。
  - 用户确认组件边界与栈（DEC-014）。
Decision: 内容自检通过 → 待交叉审核 + 用户确认 → 进入 10-mock-data-spec
```
