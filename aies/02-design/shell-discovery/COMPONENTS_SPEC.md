# 组件规格 — shell-discovery（站点外壳 + 发现/注册表）

## Artifact metadata

- Stage: `09-components-spec`
- Status: `passed（2026-06-23 用户签字）`
- 模块: shell-discovery（覆盖 `PAGE-001` 全局外壳、`PAGE-002` 发现/注册表、`PAGE-003` 全局搜索结果）
- COMP 段（模块特有）: `COMP-041`~`COMP-049`
- Upstream IDs:
  - PAGE: `PAGE-001`、`PAGE-002`、`PAGE-003`
  - IA: `IA-001`、`IA-002`
  - FR: `FR-001`、`FR-010`、`FR-140`；触及出口 `FR-020`、`FR-040`、`FR-070`
  - NFR: `NFR-002`、`NFR-007`
  - FLOW: `FLOW-002`、`FLOW-008`
  - ENT: `ENT-003`、`ENT-004`、`ENT-019`、`ENT-020`；结果面触及 `ENT-001`、`ENT-007`、`ENT-011`
  - INV: `INV-01`、`INV-04`、`INV-09`
  - UI: `UI-001`（令牌）、`UI-002`（Material Symbols Outlined）、`UI-003`（规范组件）、`UI-004`
  - DEC: `DEC-009`（互惠可选 → CTA「请求交换」）、`DEC-011`（聚合统计）、`DEC-012`（规范图标族）、`DEC-014`（前端栈）
- 引用的共享组件（COMP-001~040，`_shared/COMPONENTS_SPEC.md` 拥有，本文件**只引用不重定义**）:
  - `COMP-001` AppShell、`COMP-002` TopNav、`COMP-003` GlobalSearchBar、`COMP-004` GitHubAuthButton、`COMP-005` SubmitModuleCTA、`COMP-006` Footer
  - `COMP-009` Card、`COMP-010` ModuleCard、`COMP-011` StatusPill、`COMP-013` IconChip、`COMP-014` StatBlock、`COMP-016` ListRow、`COMP-021` EmptyState、`COMP-022` TopicChip、`COMP-027` Tabs、`COMP-032` Pagination/LoadMore、`COMP-033` Skeleton、`COMP-034` Avatar、`COMP-007` PrimaryButton、`COMP-008` SecondaryButton
- 拟新增假设（供主 agent 登记，未改任何控制文件）: `ASM-074`、`ASM-075`、`ASM-076`（见文末）
- Manifest status: stage `09-components-spec`（shell-discovery）= `pending`
- 栈锚定: Next.js App Router + TS + Tailwind + shadcn/ui；图标单一族 Material Symbols Outlined（实现期 `lucide-react` 1:1 等价，`DEC-012`/`DEC-014`）

> 范围说明：本模块特有组件 = 发现页与搜索结果面**特有的编排/控制类**组件（筛选、排序、主题行、统计条、搜索分组/结果行）。卡片本体（`COMP-010 ModuleCard`）、统计单元（`COMP-014 StatBlock`）、主题标签基元（`COMP-022 TopicChip`）、列表行基元（`COMP-016 ListRow`）、分类 Tab 基元（`COMP-027 Tabs`）、加载占位（`COMP-033 Skeleton`）、空状态（`COMP-021 EmptyState`）均为共享组件，本模块组件**组合/编排**它们而非重写。AppShell 与全站导航/搜索框/登录态/提交 CTA 由 `COMP-001~005` 提供，发现/搜索两页直接复用，本文件不重定义外壳。

---

## COMP-041 — DiscoveryHero（发现页价值主张）

### Component name

- `DiscoveryHero`，落地 `app/components/shell-discovery/DiscoveryHero.tsx`。
- 发现页 `PAGE-002` 顶部 Hero 区：主标题「让 Agent 帮你发现值得互换的知识库模块」+ 副标题/价值主张，对应真源 `know-share-website-style-v1.png` 顶部标题区。
- 非共享：标题文案与该价值橱窗布局为发现页特有，不在其他页复用。

### Purpose

- 承载 `PAGE-002` 区域①「标题/价值主张 Hero」，向人/agent 一句话传达发现页的用途（不接触私有内容即可评估是否请求交换），追溯 `IA-002` 内容层级「首屏=发现，价值橱窗」、`FLOW-002`。

### Props or inputs

- `title: string`（默认产品主张文案；可由上层注入便于 i18n/AB）。
- `subtitle?: string`（副说明，如"浏览脱敏清单卡片，评估后再请求交换"）。
- `align?: 'left' | 'center'`（默认 `left`，对齐真源左对齐 Hero）。
- 无业务数据输入（纯展示，IA 决定而非用户数据，`PAGE-002` Data required「主导航项静态配置」同类）。

### Events or outputs

- 无交互输出（不含 CTA；提交/搜索 CTA 在 `COMP-005`/`COMP-003`，不在 Hero 内重复主 CTA，遵 `UI_RULES`「同屏不出现两个等权主 CTA」）。

### States

- `default`：标题 + 副标题渲染。
- `loading`：不适用（静态文案，无需骨架）。
- 响应式：`<768px` 字号降一档、保持左对齐（`ASM-016` 桌面优先，移动细化）。

### Accessibility requirements

- 主标题用语义 `<h1>`（页面唯一），副标题用 `<p>`；与 `PAGE-002` 文档大纲一致（`NFR-007`）。
- 文本对比度 ≥ 4.5:1（`--color-text` on `--color-bg`，`NFR-007`）。
- 纯文本，无仅靠颜色传达的信息。

### Data dependencies

- 无服务端数据；文案为静态配置（`PAGE-002` Data required 未列 Hero 取数）。

### Tests

- 渲染 `<h1>` 文案与默认主张一致；`subtitle` 缺省时不渲染空 `<p>`。
- a11y：存在唯一 `<h1>`、对比度断言。
- 快照：left/center 对齐类名正确。

---

## COMP-042 — DiscoveryFilters（发现筛选器）

### Component name

- `DiscoveryFilters`，落地 `app/components/shell-discovery/DiscoveryFilters.tsx`。
- `PAGE-002` 区域②「筛选控制行」；筛选维度据 `ASM-017` = {模块类型(`ENT-003.type`)、主题标签(`ENT-020`)、信任级别(`ENT-011`)、是否 GitHub Verified}。
- 非共享：筛选维度集合与 URL 参数映射为发现页特有；内部用 shadcn `Select`/`Popover`/`Checkbox` 基元组合，但组合策略不共享。

### Purpose

- 提供 `PAGE-002` Actions「选择筛选条件 → 即时过滤列表并更新 URL 查询参数（可分享/可深链）」，追溯 `FR-010`、`ENT-003/011/020`。`PAGE-003` 模块结果亦可复用以收窄模块分组（同一维度集合）。

### Props or inputs

- `value: { type?: ModuleType[]; topic?: string[]; trustLevel?: TrustLevel[]; verifiedOnly?: boolean }`（受控，来源 URL `searchParams`，`PAGE-002` Data required「筛选维度」）。
- `options: { types: ModuleType[]; topics: TopicOption[]; trustLevels: TrustLevel[] }`（可选维度集合，来自发现查询的聚合元数据）。
- `loading?: boolean`（选项加载中禁用控件但保持可见）。
- `compact?: boolean`（窄屏折叠为「筛选」抽屉触发，`PAGE-002` 响应式态）。

### Events or outputs

- `onChange(next: FilterValue)`：任一维度变更即触发，上层据此更新 URL `searchParams` 与 TanStack Query key（`FRONTEND_SPEC §8`，URL 深链 `ASM-027` 同类）。
- `onClear()`：清除全部筛选（与无结果态「清除筛选」联动）。
- 不直接发起任何写动作（纯查询参数，`INV` 无关）。

### States

- `default`：各维度控件可用，已选项以 `COMP-022 TopicChip`/`COMP-011 StatusPill` 风格回显。
- `loading`：`options` 拉取中 → 控件禁用 + 轻骨架，筛选行结构即时可见（`PAGE-002`「筛选/排序控件即时可用」）。
- `active`（有已选筛选）：显示「清除筛选」次按钮（`COMP-008`）。
- `compact/drawer`：`<768px` 折叠为「筛选」按钮 → 打开抽屉（共享 `COMP-026 Drawer` 引用），内含同一组控件。
- `invalid-param`：URL 含非法筛选值时上层回退默认，本组件按白名单忽略未知值，不报错（`PAGE-002` Validation「参数非法→回退默认」）。

### Accessibility requirements

- 每个筛选控件有可见 `<label>` 或 `aria-label`；下拉用 shadcn（Radix）保证键盘可达与 `aria-expanded`（`NFR-007`）。
- 已选状态不仅靠颜色：选中项带文字/勾选图标（Material Symbols `check`）（`NFR-007`、`UI_RULES`）。
- 「清除筛选」为可聚焦按钮，焦点态主色描边可见。
- 抽屉模式聚焦陷阱 + Esc 关闭（Radix Sheet 默认）。

### Data dependencies

- 可选项来自发现查询的聚合（`ENT-003.type` 枚举、`ENT-020` 热门主题、`ENT-011` 信任级别枚举、`GitHub Verified` 布尔），经 `lib/queries/discovery.ts`（`FRONTEND_SPEC §8`）。
- 不取用任何私有内容/PII（`INV-01`/`INV-04`/`DEC-010`）。

### Tests

- 切换任一维度触发 `onChange` 携带正确 `FilterValue`；多维度可叠加。
- 有已选项时渲染「清除筛选」，点击触发 `onClear`。
- a11y：所有控件有可达名、键盘可操作、选中态含非颜色指示。
- 非法/未知筛选值被忽略不抛错。
- `compact` 下渲染抽屉触发而非内联控件行。

---

## COMP-043 — SortControl（排序控件）

### Component name

- `SortControl`，落地 `app/components/shell-discovery/SortControl.tsx`。
- `PAGE-002` 区域②排序部分；排序维度据 `ASM-017` = {相关度、最新、最热门、信任分}。
- 非共享：排序选项集合为发现/搜索模块结果特有；底层用 shadcn `Select`/`ToggleGroup`，组合不共享。

### Purpose

- 提供 `PAGE-002` Actions「切换排序 → 重排列表并更新 URL」，追溯 `FR-010`、派生信任分（`ENT-011`）、热度（`FR-070` 派生计数）。`PAGE-003` 模块分组可复用。

### Props or inputs

- `value: SortKey`（`'relevance' | 'latest' | 'popular' | 'trust'`，受控，来源 URL `searchParams`，`PAGE-002` Data required「排序维度」）。
- `options?: SortKey[]`（默认四项；上层可裁剪，如纯浏览无查询词时隐藏 `relevance`）。
- `disabled?: boolean`。

### Events or outputs

- `onChange(next: SortKey)`：变更即触发，上层更新 URL `?sort=` 与 query key。
- 不发起写动作。

### States

- `default`：当前排序项高亮（主色，`UI-001`）+ 文字标签。
- `disabled`：加载/无数据时禁用。
- `invalid`：URL `sort` 非法 → 上层回退 `relevance`/默认，本组件渲染回退值（`PAGE-002` Validation）。
- 响应式：窄屏收为下拉单选（`ASM-016`）。

### Accessibility requirements

- 用 `aria-label="排序方式"` 的可达控件；选项有文字（非仅图标），当前项 `aria-checked`/`aria-current`（`NFR-007`）。
- 键盘可在选项间切换；焦点态可见。

### Data dependencies

- 无独立取数；`value` 来自 URL，结果排序由查询参数交给后端/MOCK（`FRONTEND_SPEC §8`，契约以阶段 15 为准）。

### Tests

- 切换排序触发 `onChange` 携带正确 `SortKey`；当前项有 `aria-current`。
- 非法 `value` 回退默认且不抛错。
- a11y：可达名、键盘切换、选项含文字标签。

---

## COMP-044 — TopicChipRow（热门主题标签行）

### Component name

- `TopicChipRow`，落地 `app/components/shell-discovery/TopicChipRow.tsx`。
- `PAGE-002` 区域②「热门主题标签」；由共享 `COMP-022 TopicChip` 组成一行可点击主题（`ENT-020` 按使用频次聚合）。
- 非共享：横向溢出/换行布局 + 「以该主题筛选」联动为发现页特有；单个标签复用 `COMP-022`，本组件只做编排。

### Purpose

- 提供 `PAGE-002` Actions「点击热门主题标签 → 以该主题筛选」，追溯 `FR-010`、`ENT-020`，作为 `DiscoveryFilters.topic` 的快捷入口。

### Props or inputs

- `topics: { id: string; name: string; count?: number }[]`（热门主题集合，`ENT-020` 名称 + 关联模块数聚合）。
- `selected?: string[]`（当前已选主题，与 `DiscoveryFilters.value.topic` 同源，用于高亮）。
- `maxVisible?: number`（超出折叠为「更多」，默认按行宽自适应）。
- `loading?: boolean`。

### Events or outputs

- `onSelect(topicId: string)`：点击某主题 → 上层加入筛选（更新 `topic` 参数）。
- `onToggleMore?()`：展开/收起溢出主题。
- 纯筛选导航，无写动作。

### States

- `default`：标签行渲染，选中态用 `COMP-022` 的 selected 变体（主色浅底 `--color-primary-subtle`）。
- `loading`：渲染若干 `COMP-033 Skeleton` 占位标签。
- `empty`：无热门主题时整行不渲染（不留空块）。
- 溢出：超过行宽折叠「更多 N」。

### Accessibility requirements

- 每个主题为可聚焦按钮/链接，有可读名（含 count 时如「检索增强，128 个模块」）（`NFR-007`）。
- 选中态非仅颜色：选中标签带勾选/加重文字（`NFR-007`）。
- 「更多」按钮有 `aria-expanded`。

### Data dependencies

- `ENT-020` 热门主题聚合（名称 + 模块数），来自发现查询（`lib/queries/discovery.ts`）。
- 不含 PII（`INV-09`）。

### Tests

- 渲染传入主题数量；点击触发 `onSelect` 携带正确 `topicId`。
- `selected` 中的主题渲染选中态（含非颜色指示）。
- 空数组时不渲染容器。
- a11y：标签可聚焦、有可读名。

---

## COMP-045 — PlatformStatsStrip（平台聚合统计条）

### Component name

- `PlatformStatsStrip`，落地 `app/components/shell-discovery/PlatformStatsStrip.tsx`。
- `PAGE-002` 区域④「底部平台统计 strip」：4 个共享 `COMP-014 StatBlock`（模块总数/交换总数/活跃用户/隐私门通过率）+ 社区/「为什么选择 Know-share」说明卡（共享 `COMP-009 Card`），对应真源底部 strip（`1,842 / 12,857 / 2,196 / 98.6%`）。
- 非共享：strip 编排（4 统计 + 说明卡的布局与口径绑定）为发现页/关于页同口径特有；统计单元本体复用 `COMP-014`，不重写。

### Purpose

- 落地 `PAGE-002` Telemetry「底部统计 strip 直接呈现 `ENT-019` 聚合指标」与 `FR-140`/`FLOW-008`，作为价值橱窗的信任锚（`IA-002` 含平台统计）。`PAGE-100~105` 关于页统计区可复用同组件（同口径，`FRONTEND_SPEC` 跨模块引用）。

### Props or inputs

- `stats: { modules: number; exchanges: number; activeUsers: number; privacyPassRate: number }`（聚合指标，`ENT-019`，口径同真源；来源轻后端 `FR-140`/`FLOW-008`）。
- `notes?: { title: string; body: string; href?: string }[]`（社区/「为什么选我们」说明卡内容）。
- `loading?: boolean`、`error?: boolean`。

### Events or outputs

- `onNoteLink?(href)` / 内部以共享按钮路由「了解更多」→ `IA-013`（`PAGE-002` Actions「底部统计 strip『了解更多/关于』→ 路由 IA-013」）。
- 无写动作、不绑定个人（仅聚合，`INV-09`）。

### States

- `default`：4 `StatBlock`（大数字 `--text-stat`，千分位格式化）+ 说明卡网格。
- `loading`：`StatBlock` 显示数字骨架（共享 `COMP-033`），`PAGE-002`「统计 strip 显示数字骨架」。
- `error/partial`：单项缺失/为 0 → 显示 `0` 或「—」，不显示假占位数据；整段失败 → 静默隐藏或显示「统计暂不可用」，不阻断卡片浏览（`PAGE-002` States/Validation）。
- 响应式：`≥1280px` 4 列、平板 2 列、移动 1 列（`UI_RULES` StatBlock 网格）。

### Accessibility requirements

- 每个统计数字有文字标签（如「模块总数 1,842」），数字非唯一信息载体（`NFR-007`、`UI_RULES` 无障碍）。
- 「隐私门通过率」百分比有单位与说明可读文本。
- 「了解更多」为可聚焦链接，有可读名指向 `IA-013`。

### Data dependencies

- `ENT-019` UsageStat 聚合（模块/交换/活跃用户/隐私门通过率），轻后端计算（`FR-140`/`DEC-011`），**不含 PII**（`INV-09`）。
- 经 `lib/queries/stats.ts`（`FRONTEND_SPEC §8`）。

### Tests

- 渲染 4 个 `StatBlock` 且数字千分位格式化（`12857`→`12,857`）。
- 缺失/0 值显示「—」/`0` 而非假数据；`error` 时不抛错、可静默隐藏。
- a11y：每数字有文字标签、对比度达标；「了解更多」链接可达且指向 `/about`(`IA-013`)。
- `loading` 渲染数字骨架。

---

## COMP-046 — SearchScopeTabs（搜索结果分类 Tab）

### Component name

- `SearchScopeTabs`，落地 `app/components/shell-discovery/SearchScopeTabs.tsx`。
- `PAGE-003` 分类 Tab：{全部 | 模块 | 主题 | 用户 | 交换}，基于共享 `COMP-027 Tabs`；切换更新 `?type=`（`FR-001`「路由到模块/主题/用户/交换」）。
- 非共享：四类实体的分类集合 + 各类结果计数徽标 + `?type=` 映射为搜索结果面特有；Tab 基元复用 `COMP-027`。

### Purpose

- 落地 `PAGE-003` Actions「切换分类 Tab → 更新结果分组与 `?type=`」，把全局搜索查询解析为四类实体结果分组（`FR-001`、`IA-001`×`IA-002`）。

### Props or inputs

- `value: SearchScope`（`'all' | 'modules' | 'topics' | 'users' | 'exchanges'`，来源 URL `?type=`）。
- `counts?: Partial<Record<SearchScope, number>>`（各分类结果计数，用于 Tab 旁徽标，`PAGE-003` Data required「各分类结果计数」）。
- `disabled?: boolean`。

### Events or outputs

- `onChange(next: SearchScope)`：切换分类，上层更新 `?type=` 与对应分组查询。
- 非法 `type` → 上层回退 `all`，本组件渲染回退值（`PAGE-003` Validation「非法 type 回退全部」）。

### States

- `default`：当前 Tab 主色下划线/高亮（`UI-001`）+ 计数徽标。
- `loading`：计数加载中徽标显骨架，Tab 结构可用。
- 响应式：`<768px` 横向可滚动（`PAGE-003` 响应式「分类 Tab 在窄屏可横向滚动」）。

### Accessibility requirements

- 用 Radix Tabs 语义：`role="tablist"`/`tab`/`tabpanel` 关联，键盘左右切换（`NFR-007`）。
- 当前 Tab `aria-selected`；计数以可读文本（如「模块 12」）。
- 当前态非仅颜色：含下划线/加重文字（`NFR-007`）。

### Data dependencies

- 各分类计数来自搜索查询聚合（`lib/queries/search.ts`）。
- 不含 PII（`INV-09`）。

### Tests

- 切换 Tab 触发 `onChange` 携带正确 `SearchScope`；当前 Tab `aria-selected`。
- 计数徽标渲染传入数值；缺失时不渲染徽标。
- 非法 `value` 渲染回退 `all`。
- a11y：tablist 语义、键盘切换、当前态含非颜色指示、窄屏可横向滚动。

---

## COMP-047 — SearchResultGroup（搜索结果分组容器）

### Component name

- `SearchResultGroup`，落地 `app/components/shell-discovery/SearchResultGroup.tsx`。
- `PAGE-003` 各分组容器：按分类渲染结果——模块组用共享 `COMP-010 ModuleCard`，主题/用户/交换组用对应结果行（`COMP-048`/`COMP-049` 及主题行）+ 分组标题 + 计数 + 「加载更多」（共享 `COMP-032`）。
- 非共享：分组编排（标题 + 计数 + 该类专用结果项 + 加载更多 + 该组空态）为搜索面特有；结果项本体复用共享/本模块结果行组件。

### Purpose

- 落地 `PAGE-003` States「默认（有结果）：各组结果列表（模块用 ModuleCard，其余用 ListRow）」，统一管理某一分类结果的标题/加载/空/错误/分页（`FR-001`、`FR-010`）。

### Props or inputs

- `scope: SearchScope`（决定渲染哪类结果项）。
- `title: string`（分组标题，如「模块结果」）。
- `items: SearchResultItem[]`（该分类结果，字段按 scope：模块=`ENT-003`+`ENT-004` 同 `PAGE-002` 卡片脱敏边界；主题=`ENT-020`+模块数；用户=`ENT-001` 公开身份；交换=`ENT-007` 脱敏台账行）。
- `totalCount?: number`、`hasMore?: boolean`、`loading?: boolean`、`error?: boolean`。
- `renderItem?`（可选，默认按 `scope` 选用 `COMP-010`/`COMP-048`/`COMP-049`/主题行）。

### Events or outputs

- `onLoadMore()`：「加载更多」拉取该分类下一批（`PAGE-003` Actions）。
- `onItemActivate(item)`：点击结果项 → 各 scope 对应出口（模块→`IA-003`、主题→以该主题筛选的 `PAGE-002` `/?topic=`、用户→`IA-007`、交换→`IA-005`/`IA-006`），由结果项组件冒泡。
- 结果项上的写动作（模块「请求交换/收藏」）匿名时引导登录（透传，`PAGE-003` States「登录差异」、`NFR-005`/`NFR-006`）。

### States

- `default`：分组标题 + 计数 + 结果项列表/网格（模块组网格随断点变列）。
- `loading`：结果区骨架占位（`COMP-033`）。
- `empty`：该分组无结果时由上层用共享 `COMP-021 EmptyState`（「没有与 “<query>” 匹配的结果」+ 建议）；本组件在 scope 级空时可渲染轻量分组空提示。
- `error`：分组加载失败 → 行内错误 + 「重试」，不暴露后端细节（`PAGE-003` States「错误态」）。
- `hasMore`：渲染「加载更多」（`COMP-032`）。

### Accessibility requirements

- 分组标题用语义标题层级（`<h2>`/`<h3>`），与计数关联可读（如「模块结果，共 12 条」）（`NFR-007`）。
- 列表用 `role=list`/`listitem` 或语义结构；「加载更多」为可聚焦按钮、加载中 `aria-busy`。
- 结果项键盘可达（`PAGE-003` Acceptance「键盘可达 SearchBar、分类 Tab 与结果项」）。

### Data dependencies

- 按 scope 取对应实体集合（`ENT-003/004` 模块、`ENT-020` 主题、`ENT-001` 用户公开身份、`ENT-007` 脱敏台账），经 `lib/queries/search.ts`。
- **零私有内容守卫**：渲染前按字段白名单过滤，疑似含私有内容/私有 URL 的字段不渲染（前端二次防线，`INV-01`/`INV-04`/`ASM-020`/`ASM-076`）。

### Tests

- 按 `scope` 选用正确结果项组件（modules→`ModuleCard`、users→`UserResultRow`、exchanges→`ExchangeResultRow`、topics→主题行）。
- `hasMore` 时渲染「加载更多」，点击触发 `onLoadMore`。
- `error` 渲染重试且不抛错；`loading` 渲染骨架。
- 私有字段守卫：注入含私有 URL 的脏数据时该字段不渲染（`INV-04` 断言）。
- a11y：分组标题层级正确、列表语义、结果项键盘可达。

---

## COMP-048 — UserResultRow（用户搜索结果行）

### Component name

- `UserResultRow`，落地 `app/components/shell-discovery/UserResultRow.tsx`。
- `PAGE-003` 用户分类结果项：基于共享 `COMP-016 ListRow`，含 `COMP-034 Avatar`（GitHub 头像）+ 用户名 + `GitHub Verified` `COMP-011 StatusPill` + 派生信用分。
- 非共享：用户结果行的字段编排（公开身份 + Verified + 信用分 + 跳档案出口）为搜索面特有；行基元/头像/药丸复用共享组件。

### Purpose

- 落地 `PAGE-003` 用户结果呈现与出口「用户结果 → `IA-007`」，仅展示 `ENT-001` 公开身份（GitHub 用户名/头像/Verified/派生信用分），**非 PII、非 `ENT-008` 联系方式**（`FR-001`、`DEC-010`）。

### Props or inputs

- `user: { login: string; avatarUrl: string; githubVerified: boolean; trustScore?: number; domainTags?: string[] }`（`ENT-001` 公开字段；`PAGE-003` Data required「用户结果」）。
- `query?: string`（用于命中词高亮，可选）。

### Events or outputs

- `onActivate()`：点击 → 路由用户档案 `/u/:login`(`IA-007`)（`PAGE-003` Actions）。
- 行上若有「关注/认可」轻量社交动作（可选），匿名引导登录（`NFR-005`，默认不内联写动作以保持结果面只读浏览）。

### States

- `default`：头像 + `@login` + Verified 药丸（`COMP-011`，success 语义 + 文字「GitHub Verified」）+ 可选信用分。
- `hover/focus`：行高亮（`COMP-016` 行为）。
- `loading`：作为分组骨架的一部分（`COMP-033`）。
- 无 Verified：不显示 Verified 药丸（不显示伪徽）。

### Accessibility requirements

- 整行可作单一可聚焦链接（指向档案），有可读名（如「用户 @zyongzhu24，GitHub 已验证」）（`NFR-007`）。
- Verified 状态非仅颜色：药丸含图标（Material Symbols `verified`）+ 文字（`NFR-007`、`UI_RULES`）。
- 头像有 `alt`（用户名）。

### Data dependencies

- `ENT-001` 公开身份 + `ENT-011` 派生信用分（可选）；**不取联系方式/PII**（`INV-01`/`DEC-010`）。

### Tests

- 渲染头像/用户名/Verified 药丸（仅当 `githubVerified`）；点击触发 `onActivate` 路由 `/u/:login`。
- 无 `githubVerified` 时不渲染 Verified 药丸。
- a11y：行可达名、Verified 含非颜色指示、头像 alt。
- 断言不渲染任何联系方式字段（`INV-04`）。

---

## COMP-049 — ExchangeResultRow（交换记录搜索结果行）

### Component name

- `ExchangeResultRow`，落地 `app/components/shell-discovery/ExchangeResultRow.tsx`。
- `PAGE-003` 交换分类结果项：基于共享 `COMP-016 ListRow`，展示 `ENT-007` 脱敏台账行（方向/状态/时间），状态用 `COMP-011 StatusPill`。
- 非共享：交换台账结果行的脱敏字段编排（方向/状态/时间 + 跳台账出口）为搜索面特有；行基元/状态药丸复用共享组件。

### Purpose

- 落地 `PAGE-003` 交换结果呈现与出口「交换记录结果 → `IA-005`/`IA-006`」，仅展示 `ENT-007` 脱敏台账（方向/状态/时间），**不含私有通道内容**（`INV-04`、`FR-001`）。

### Props or inputs

- `exchange: { id: string; direction: 'incoming' | 'outgoing' | 'mutual'; status: ExchangeStatus; updatedAt: string; targetModuleTitle?: string }`（`ENT-007` 脱敏字段；`PAGE-003` Data required「交换记录结果」）。
- `query?: string`（命中词高亮，可选）。

### Events or outputs

- `onActivate()`：点击 → 路由交换台账/详情（`/exchanges` `IA-005` 或 `/exchanges/:id` `IA-006`，按上下文）。
- 无写动作（结果面只读浏览）。

### States

- `default`：方向图标（Material Symbols `swap_horiz`/`arrow` 系，单一族）+ 模块标题/引用 + 状态 `StatusPill`（按生命周期状态语义色 + 文字）+ 相对时间。
- `hover/focus`：行高亮。
- `loading`：分组骨架一部分。
- 状态覆盖 `ENT-007` 生命周期（Requested/Accepted/.../Closed/Rejected 等）各对应 `StatusPill` 语义。

### Accessibility requirements

- 行可作可聚焦链接，可读名含状态与方向文字（如「交换 已接受待交付，发起方向」）（`NFR-007`）。
- 状态/方向非仅颜色：含图标 + 文字（`NFR-007`、`UI_RULES`「状态用 StatusPill + 文字」）。
- 时间用相对文本 + `title` 绝对时间（对齐通知中心时间惯例 `UI_RULES`）。

### Data dependencies

- `ENT-007` 脱敏台账（方向/状态/时间/目标模块标题）；**不取私有通道内容/私有 URL/联系方式**（`INV-01`/`INV-04`/`DEC-010`）。

### Tests

- 渲染方向图标 + 状态药丸（语义色 + 文字）+ 相对时间；点击触发 `onActivate` 路由正确出口。
- 各 `ExchangeStatus` 映射正确 `StatusPill` 语义。
- a11y：行可达名含状态/方向文字、非颜色指示、时间有绝对 title。
- 断言不渲染私有通道内容/私有 URL/联系方式（`INV-04`）。

---

## 共享组件引用清单（本模块用到的 COMP-001~040，不重定义）

| 共享 COMP | 用途（本模块） | 出现 PAGE |
| --- | --- | --- |
| `COMP-001` AppShell | 两页的持久外壳容器 | PAGE-001/002/003 |
| `COMP-002` TopNav | 主导航 | PAGE-001 |
| `COMP-003` GlobalSearchBar | 外壳搜索框 + 搜索面顶部改词重搜 | PAGE-001/003 |
| `COMP-004` GitHubAuthButton | 登录态 | PAGE-001 |
| `COMP-005` SubmitModuleCTA | 提交模块 CTA | PAGE-001 |
| `COMP-006` Footer | 页脚 | PAGE-001/002/003 |
| `COMP-007/008` Primary/SecondaryButton | 清除筛选/重试/了解更多等 | PAGE-002/003 |
| `COMP-009` Card | 统计条说明卡 | PAGE-002 |
| `COMP-010` ModuleCard | 发现卡片网格 + 搜索模块结果 | PAGE-002/003 |
| `COMP-011` StatusPill | Verified/交换状态 | PAGE-002/003 |
| `COMP-013` IconChip | 统计/空态图标容器（按需） | PAGE-002 |
| `COMP-014` StatBlock | 平台统计单元（×4） | PAGE-002 |
| `COMP-016` ListRow | 用户/交换/主题结果行基元 | PAGE-003 |
| `COMP-021` EmptyState | 空注册表/无结果 | PAGE-002/003 |
| `COMP-022` TopicChip | 主题标签基元 | PAGE-002 |
| `COMP-026` Drawer | 窄屏筛选抽屉 | PAGE-002 |
| `COMP-027` Tabs | 搜索分类 Tab 基元 | PAGE-003 |
| `COMP-032` Pagination/LoadMore | 加载更多 | PAGE-002/003 |
| `COMP-033` Skeleton | 各加载态占位 | PAGE-002/003 |
| `COMP-034` Avatar | 用户结果头像 | PAGE-003 |

---

## 拟新增假设（供主 agent 登记，未修改任何控制文件）

| 拟新增 ID | 假设 | 风险 | 确认 |
| --- | --- | --- | --- |
| `ASM-074` | `PlatformStatsStrip` 与关于页（`PAGE-100~105`）统计区共用同一组件与口径（模块/交换/活跃用户/隐私门通过率），避免两处口径漂移。 | 若关于页统计维度更丰富（如趋势折线由 about 模块特有组件承载），需拆分共用边界；当前仅共用 4 指标 strip。 | 组件规格交叉审核 / about 模块协同 |
| `ASM-075` | 搜索结果面默认不在结果项内联写动作（请求交换/收藏/关注）；写动作主要在模块详情/发现卡，结果行以「跳转到对应 IA 后再操作」为主，匿名时由目标页引导登录。 | 若产品希望搜索结果项直接发起请求交换，需在 `UserResultRow`/模块结果项加内联写 CTA 与登录引导；当前为最小只读结果面。 | 用户确认搜索面交互深度 |
| `ASM-076` | 发现/搜索结果组件统一执行「私有内容二次防线」：渲染前按字段白名单过滤，疑似私有内容/私有 URL 字段不渲染（与 `ASM-020` 同源，落到组件层）。 | 主防线应在服务契约/隐私门（`HARD-01`/`INV-01`/`INV-04`）；前端为冗余保险，若与后端契约重复在阶段 15 归口。 | 服务契约阶段对齐 |

> 以上为非阻塞缺口的显式假设，未触碰 `DEFAULT_ASSUMPTIONS.md`/`ID_REGISTRY.md`/`FRONTEND_SPEC.md`/共享 spec 等文件。

## Gate 自检（09-components-spec 标准）

- 每个组件含 8 字段（name/purpose/props/events/states/a11y/data/tests），无空字段：✅（COMP-041~049 九个组件俱全）。
- 可追溯：每组件锚定 `PAGE-001/002/003`、`IA-001/002`、`FR-001/010/140`、`ENT-003/004/019/020`（结果面触及 `ENT-001/007/011`）、`UI-001/002/003`、`DEC-009/011/012/014`：✅。
- 不引入无追溯组件：✅（无新增功能/界面/实体；筛选/排序维度据 `ASM-017`，私有守卫据 `ASM-020/070`）。
- 共享组件只引用不重定义（COMP-001~040 列引用清单，未重写 AppShell/ModuleCard/StatBlock/EmptyState/TopicChip/ListRow/Tabs/Skeleton 等）：✅。
- 锚定 shadcn + Tailwind + 单一图标族（Material Symbols Outlined / lucide-react 等价，`DEC-012`/`DEC-014`），未引入第二图标族：✅。
- 无障碍具体（键盘可达、状态非仅颜色、aria/label、对比度、tablist 语义、骨架 aria-busy）：✅。
- 测试要点具体（事件载荷、状态、a11y、私有字段守卫断言）：✅。
- 隐私边界：用户结果不含 PII/联系方式、交换结果不含私有通道内容、统计仅聚合（`INV-01/04/09`、`DEC-010`）：✅。
- 未碰控制文件/其他模块/FRONTEND_SPEC/共享 spec，只写本文件，未跑 git：✅。
- 结论：**pass（待用户确认）**。
```
