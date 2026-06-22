# 组件规格 · open-api（开放 API / agent 集成）

## 摘要

本产物定义 `open-api` 模块（`PAGE-090` 开放 API 文档页，覆盖 `IA-012`）的**模块特有前端组件契约**，COMP 段 `COMP-190~209`。这些组件落地一个**面向开发者与 agent 的 API 文档展示页**——零私有泄露承诺横幅、API 分类导航、端点文档卡、认证说明块——而非服务契约本身（真正的 `API-*` 操作在阶段 15 `SERVICE_CONTRACT` 定稿）。

全站共享组件（`COMP-001~040`，由 `aies/02-design/_shared/COMPONENTS_SPEC.md` 拥有）在此**只引用 ID、不重复定义**：本模块复用 `COMP-001` AppShell、`COMP-009` Card、`COMP-023` MethodPill（方法文字+色）、`COMP-024` CodeBlock（等宽 JSON + 复制）、`COMP-011` StatusPill、`COMP-013` IconChip、`COMP-016` ListRow、`COMP-021` EmptyState、`COMP-027` Tabs、`COMP-033` Skeleton、`COMP-008` SecondaryButton。

每个组件按模板 **8 字段**（组件名 / 用途 / props / events / states / 无障碍 / 数据依赖 / 测试）展开，逐条追溯到 `PAGE-090`、`IA-012`、`FR-110`、`NFR-002`、`ENT-019`、`INV-01/04` 或显式假设。

### 产物元数据

- Stage: `09-component-spec`
- Status: `needs-user-confirmation`
- 模块: `open-api`（COMP 段 `COMP-190~209`）
- Upstream IDs: `PAGE-090`、`IA-012`、`FR-110`、`NFR-002`、`NFR-005`、`NFR-006`、`NFR-007`、`ENT-019`、`ENT-003/004/007/010`、`INV-01`、`INV-04`、`INV-09`、`FLOW-008`、`UI-001/002/003`、`UI_RULES.md` 无障碍底线
- Decision IDs: `DEC-006`（GitHub 身份）、`DEC-007`（无经济模型）、`DEC-011`（轻后端聚合）、`DEC-012`（Material Symbols Outlined 规范图标族）、`DEC-014`（前端栈 Next.js+TS+Tailwind+shadcn/ui）
- 引用共享组件: `COMP-001`、`COMP-008`、`COMP-009`、`COMP-011`、`COMP-013`、`COMP-016`、`COMP-021`、`COMP-023`、`COMP-024`、`COMP-027`、`COMP-033`（定义见 `_shared/COMPONENTS_SPEC.md`，本文件不重定义）
- 承接页面规格假设: `ASM-054`（路由 `/developers` + 分类锚点）、`ASM-055`（公开读不含 `contact`）、`ASM-056`（窄屏导航折叠）、`ASM-057`（速率限制仅文字标注）
- 新增组件级假设: `ASM-103`~`ASM-105`（见文末；本产物**不修改** `DEFAULT_ASSUMPTIONS.md`，仅登记并在返回中列出）

> 锚定 `DEC-014` 前端栈：shadcn/ui + Tailwind，单一图标族 Material Symbols Outlined（实现期 `lucide-react` 1:1 等价替换，`DEC-012`/`ASM-066`）。本文件不碰控制文件、不碰他模块、不改共享 spec，只写本文件，不跑 git。

---

## COMP 索引（本模块特有）

| COMP ID | 组件 | 落地 | 主要使用 | 引用的共享组件 |
| --- | --- | --- | --- | --- |
| `COMP-190` | `ZeroLeakBanner`（零泄露承诺横幅） | success/primary-subtle 浅底 + `shield` 图标 | `PAGE-090` 顶部 | — |
| `COMP-191` | `ApiCategoryNav`（API 分类导航） | 256px 侧栏 + 锚点 + `aria-current` | `PAGE-090` 左栏 | `COMP-008` |
| `COMP-192` | `EndpointCard`（端点文档卡） | `COMP-009` Card 组合 | `PAGE-090` 右栏（每端点一张） | `COMP-009`、`COMP-023`、`COMP-024`、`COMP-193` |
| `COMP-193` | `AuthBadge`（认证徽：公开读/需认证写） | `COMP-011` StatusPill 特化 | `EndpointCard` 内 | `COMP-011` |
| `COMP-194` | `AuthNoteBlock`（认证说明块） | Callout + `lock` 图标 | `POST` 端点卡内 / 页内说明 | `COMP-013` |
| `COMP-195` | `DeveloperResourceCard`（开发者资源卡） | `COMP-009` Card + 外链 | `PAGE-090` 左栏底部 | `COMP-009`、`COMP-008` |
| `COMP-196` | `EndpointFieldTable`（端点字段说明表） | 紧凑表（字段/类型/来源/追溯） | `EndpointCard` 展开区 | `COMP-016` |
| `COMP-197` | `RateLimitNote`（速率限制说明） | 行内中性文字标注 | `EndpointCard` / 页头说明 | — |
| `COMP-198` | `StatsTeaser`（可选真实聚合统计内联） | `ENT-019` 聚合数 + 降级占位 | 承诺横幅旁 / `#stats` 区 | `COMP-033` |
| `COMP-199` | `ApiDocsEmptyState`（文档加载失败空态） | `COMP-021` EmptyState 特化 | `PAGE-090`（异常） | `COMP-021`、`COMP-008` |
| `COMP-200`~`COMP-209` | 预留（按需扩展，如 SDK 下载卡、端点搜索、深链复制反馈条等） | — | — | — |

> 共享组件（`COMP-001` AppShell、`COMP-023` MethodPill、`COMP-024` CodeBlock、`COMP-011` StatusPill、`COMP-013` IconChip、`COMP-016` ListRow、`COMP-021` EmptyState、`COMP-027` Tabs、`COMP-033` Skeleton、`COMP-008/009`）的完整契约在 `_shared/COMPONENTS_SPEC.md`，此处仅引用 ID。

---

## COMP-190 · ZeroLeakBanner（零泄露承诺横幅）

- **组件名**：`ZeroLeakBanner`。落地 `PAGE-090` 顶部「零私有内容泄露」承诺横幅（`UI-003` 无现成横幅基元，故为模块特有组件，非共享 Callout 的简单复用——承载产品级承诺语义）。
- **用途**：把产品级承诺**可见化**：公开读 API 只暴露脱敏清单与聚合统计，绝不返回原始知识内容或私有 URL（`INV-01`、`INV-04`、`FR-110`）。归一化已移除真源 HTML 的"加密网关认证"未追溯文案，固定为可追溯承诺句。
- **Props / inputs**：
  - `title: string`（默认「零私有内容泄露」）。
  - `description: string`（默认「公开 API 只暴露脱敏清单与聚合统计，绝不返回原始知识内容或私有 URL」，追溯 `INV-01/04`）。
  - `icon: 'shield'`（Material Symbols Outlined `shield`，单一图标族，`DEC-012`/`UI-002`）。
  - `tone: 'success' | 'primary-subtle'`（默认 `success`，浅底；`--color-success #16A34A` 文/边，浅底用 success 10% 或 `--color-primary-subtle`，`UI-001`）。
  - `statsSlot?: ReactNode`（可选插入 `COMP-198` StatsTeaser，承诺旁展示真实聚合数）。
- **Events / outputs**：无交互输出（纯展示横幅）；若内嵌 `statsSlot`，统计交互由 `COMP-198` 自身负责。
- **States**：单一 `default`（静态展示）；无 loading/error 自身态（统计的加载/失败由内嵌 `COMP-198` 管理，不波及横幅本体）。
- **无障碍**：用 `role="note"` 或 `<section aria-label="隐私承诺">`；图标为装饰性，加 `aria-hidden="true"`，承诺语义由文字承载（状态非仅靠颜色，`NFR-007`）；success 浅底配深文字对比度 ≥ 4.5:1（`UI_RULES.md` 无障碍底线）。
- **数据依赖**：默认**静态文案**（前端内置常量，追溯 `INV-01/04`）；`statsSlot` 可选依赖 `ENT-019` UsageStat 聚合数（`COMP-198`）。无私有字段（`contact`/私有 URL/原始内容）进入本组件（`INV-01/04` 内容不变量）。
- **测试**：① 渲染断言承诺文案含「不返回原始知识内容或私有 URL」且**不含**「加密网关」字样（归一化回归，`PAGE-090` 归一项 1）；② a11y：图标 `aria-hidden`、对比度断言；③ 不渲染任何 `contact`/私有 URL（内容不变量断言，`INV-04`）。

---

## COMP-191 · ApiCategoryNav（API 分类导航）

- **组件名**：`ApiCategoryNav`。落地 `PAGE-090` 左侧 256px 侧栏分类导航（发现/模块/交换/反馈/统计），锚点跳转到右侧端点分组。
- **用途**：让 agent/开发者按端点分类快速定位（对齐 `IA-012`「端点分组」与 `PAGE-090` 分类锚点 `#discovery/#modules/#exchanges/#feedback/#stats`，`ASM-054`）；当前项高亮（`aria-current`）。
- **Props / inputs**：
  - `categories: { id: 'discovery'|'modules'|'exchanges'|'feedback'|'stats'; label: string; anchor: string; count?: number }[]`（label 简体中文：发现/模块/交换/反馈/统计；anchor = `#discovery` 等）。
  - `activeId?: string`（当前高亮分类；受控，由滚动监听或点击驱动）。
  - `orientation?: 'vertical' | 'horizontal'`（默认 `vertical`；窄屏切 `horizontal` 或交由 `COMP-027` Tabs，`ASM-056`）。
- **Events / outputs**：
  - `onNavigate(categoryId)`：点分类项 → 平滑滚动到对应端点分组锚点（`scroll-behavior: smooth`），并更新 `activeId`（`PAGE-090` Actions「分类锚点跳转」）。
  - 可选 `onActiveChange(categoryId)`：滚动驱动的高亮变更回调（IntersectionObserver）。
- **States**：`default`（各项静态）、`item-active`（当前项主色高亮 + `aria-current="true"`）、`item-hover/focus`（主色焦点描边）；无独立 loading/error（分类清单为静态，`ASM-103`）。
- **无障碍**：用 `<nav aria-label="API 分类">` 包裹 `<ul>`；当前项 `aria-current="true"`（`PAGE-090` 验收 6、`NFR-007`）；全键盘可达（Tab 聚焦、Enter 触发跳转）；高亮非仅靠颜色（主色 + 左侧条/加粗或 `aria-current`，`UI_RULES.md`）；锚点跳转后焦点管理避免迷失（可选 focus 目标分组标题）。
- **数据依赖**：分类清单为**静态配置**（前端常量，5 类固定对齐 `IA-012`）；可选 `count` 取自端点静态计数，不依赖运行时私有数据。
- **测试**：① 5 类齐全且 label 为简体中文（`IA-012` 端点分组）；② 点击触发 `onNavigate` 并设 `aria-current`；③ 键盘 Tab/Enter 可达（`NFR-007`）；④ 高亮非仅颜色（断言存在 `aria-current` 或文字/结构标记）。

---

## COMP-192 · EndpointCard（端点文档卡）

- **组件名**：`EndpointCard`。落地 `PAGE-090` 右侧端点文档流中每个端点一张文档卡（基于共享 `COMP-009` Card 组合）。这是本模块核心组件。
- **用途**：展示单个端点的方法/路径/说明/认证徽/可展开 JSON 示例与字段说明，让 agent **无需抓取页面**即可理解如何集成（`NFR-002`、`FR-110`、`PAGE-090`）。**强调：本卡仅文档展示，不执行真实写**（`POST` 不越过 `NFR-005` 同意门，`PAGE-090` Actions）。
- **Props / inputs**：
  - `method: 'GET' | 'POST'` → 渲染共享 `COMP-023` MethodPill（方法文字+色：`GET` 主色浅底、`POST` 中性/`--color-info` 浅底 + `lock`，文字始终在场，`PAGE-090` 归一项 2、`NFR-007`）。
  - `path: string`（如 `/api/modules`、`/api/modules/{id}`、`/api/exchanges`、`/api/stats`、`/api/feedback`）。
  - `summary: string`（一句中文说明，如「列出公开知识模块（脱敏清单），支持分页/筛选」）。
  - `auth: 'public-read' | 'auth-write'` → `COMP-193` AuthBadge（公开读 / 需认证写）。
  - `requestExample?: object`（仅 `POST`；JSON 请求示例，**响应不回显任何私有内容**，`INV-04`）。
  - `responseExample: object`（JSON 响应示例；字段经脱敏，**不含** `contact`/私有 URL/原始内容/凭据，`INV-01/04`、`ASM-055`）。
  - `fields: EndpointFieldRow[]`（传给 `COMP-196` EndpointFieldTable 的字段说明，含来源/追溯标注）。
  - `anchorId: string`（页内 `id`，供 `COMP-191` 跳转与深链复制）。
  - `defaultExpanded?: boolean`（首端点 `GET /api/modules` 默认 `true`，其余 `false`，`PAGE-090` States）。
  - `rateLimited?: boolean`（公开读端点为 `true`，渲染 `COMP-197` RateLimitNote，`FR-110`/`NFR-006`/`ASM-057`）。
- **Events / outputs**：
  - `onToggleExpand(anchorId, expanded)`：点行尾 `expand_more` 图标展开/收起 JSON 示例与字段表（`PAGE-090` Actions「展开/收起」）。
  - `onCopyAnchor(anchorId)`：点 `link` 图标复制端点页内深链（`PAGE-090` Actions「复制端点 URL/锚点」）。
  - 复制 JSON 代码块由内嵌共享 `COMP-024` CodeBlock 自身的 `onCopy` 负责（按钮文案临时变「已复制」2 秒，`PAGE-090` States「复制中/已复制」）。
  - 埋点（聚合，不含 PII，`INV-09`）：展开次数、复制次数按端点聚合上报（`PAGE-090` Telemetry）。
- **States**：`collapsed`（默认/首卡除外）、`expanded`（显示 `COMP-024` CodeBlock + `COMP-196` 字段表）、`copy-anchor-feedback`（深链复制 2 秒反馈）；**无登录态切换**——认证徽与文档内容不因登录与否改变（`PAGE-090` States「认证写说明态」）。
- **无障碍**：方法用文字+色双重区分（经 `COMP-023`，`NFR-007`、`PAGE-090` 验收 6）；展开/收起为 `<button aria-expanded>` 控制对应区域 `aria-controls`；`expand_more` 图标按钮有 `aria-label`（如「展开 GET /api/modules 示例」）；JSON 代码块经 `COMP-024` 键盘可聚焦+可复制；对比度 ≥ 4.5:1。
- **数据依赖**：端点清单与示例为**静态文档内容**（前端内置或轻后端文档配置，`PAGE-090` Data required），与 `docs/data-contract.md` 公共清单字段对齐并作下游 `API-*` 源材料；字段来源实体：`/api/modules(/{id})`→`ENT-004` Manifest 脱敏视图（剔除 `contact`，`ASM-055`）、`/api/exchanges`→`ENT-007` 公开视图、`/api/stats`→`ENT-019`、`/api/feedback`→`ENT-010`。**所有响应示例字段不得含** `contact`/私有 URL/原始内容/凭据（`INV-01/04` 内容不变量，阶段 12 前端验证「API 输出零私有内容」核验）。
- **测试**：① `GET` 卡标「公开读」、`POST` 卡标「需 GitHub 认证 + 同意门」，无「公开写」组合（`PAGE-090` 验收 3、`NFR-005/006`）；② 方法名文字始终渲染（不仅颜色，`NFR-007`）；③ 展开/收起切换 `aria-expanded` 与示例可见性；④ **响应示例 JSON 不含 `contact`/私有 URL 字符串**（内容不变量断言，`INV-04`、`PAGE-090` 验收 1/4）；⑤ 首卡 `defaultExpanded`，余卡收起（`PAGE-090` States）；⑥ 公开读卡渲染 `COMP-197` 速率限制说明（`FR-110`）。

---

## COMP-193 · AuthBadge（认证徽：公开读 / 需认证写）

- **组件名**：`AuthBadge`。落地端点卡上的认证徽，是共享 `COMP-011` StatusPill 的语义特化（`UI-003` StatusPill 药丸 + 文字 + 语义色）。
- **用途**：明确每个端点的认证语义——`GET`=「公开读」、`POST`=「需 GitHub 认证 + 同意门」（`PAGE-090` 验收 3、`NFR-005/006`、`DEC-006`）；杜绝「公开写」组合。
- **Props / inputs**：
  - `kind: 'public-read' | 'auth-write'`。
  - 派生文案：`public-read` → 「公开读」（中性/主色浅底）；`auth-write` → 「需 GitHub 认证 + 同意门」（`--color-info` 或中性浅底 + `lock` 图标，`PAGE-090` 归一项 2）。
- **Events / outputs**：无（纯展示徽章）。
- **States**：两枚固定语义态 `public-read` / `auth-write`；无切换、无 loading。
- **无障碍**：文字承载语义（非仅颜色，`NFR-007`）；`lock` 图标 `aria-hidden`，语义在文字「需 GitHub 认证 + 同意门」；对比度 ≥ 4.5:1；作为 `COMP-011` 特化，继承其药丸 a11y。
- **数据依赖**：由 `EndpointCard.auth` 直接映射，无外部数据；与端点方法语义绑定（`GET`=public-read、`POST`=auth-write），不出现「公开写」（`NFR-005/006` 约束）。
- **测试**：① `auth-write` 渲染「需 GitHub 认证 + 同意门」文字（`PAGE-090` 验收 3）；② 不存在「公开写」组合的可能（类型层限定 GET→read、POST→write）；③ 语义非仅颜色（文字断言，`NFR-007`）。

---

## COMP-194 · AuthNoteBlock（认证说明块）

- **组件名**：`AuthNoteBlock`。落地 `POST` 端点卡内或页内的认证与写约束说明块（Callout 形态 + `lock` 图标徽 `COMP-013` IconChip）。
- **用途**：以文字承接 `docs/data-contract.md` 校验原则与写约束：写操作需 GitHub 认证 + 同意门 + 经隐私门校验；细则在 `FR-030`/`HARD-01` 与阶段 15 服务契约定义，**本块只引用不重写**（`PAGE-090` Data required「校验原则继承」）。
- **Props / inputs**：
  - `title?: string`（默认「写操作要求」）。
  - `points: string[]`（如「需 GitHub 登录身份核查（`DEC-006`）」「需所有者同意门（`NFR-005`）」「经隐私门校验，不回显私有内容（`INV-04`）」「受唯一性约束与速率限制（`NFR-006`）」）。
  - `icon: 'lock'`（Material Symbols Outlined，经 `COMP-013` IconChip 着色方块容器，`DEC-012`/`UI-002`）。
- **Events / outputs**：无交互（纯说明）；本块**不渲染任何写表单/提交按钮**（避免越过 `NFR-005` 同意门，`PAGE-090` Actions「认证写仅文档」）。
- **States**：单一 `default`。
- **无障碍**：用 `<aside aria-label="写操作要求">` 或 `role="note"`；要点用 `<ul>` 语义列表；`lock` 图标装饰性 `aria-hidden`，语义在文字（`NFR-007`）；对比度 ≥ 4.5:1。
- **数据依赖**：静态文案（前端常量），引用上游约束 ID，不依赖运行时数据；不含任何凭据/私有内容（`INV-01`）。
- **测试**：① 渲染含「GitHub 认证」「同意门」要点（`NFR-005`、`DEC-006`）；② **不渲染任何提交/写按钮或输入框**（不越同意门断言，`PAGE-090` Actions）；③ a11y 语义列表 + 图标 `aria-hidden`。

---

## COMP-195 · DeveloperResourceCard（开发者资源卡）

- **组件名**：`DeveloperResourceCard`。落地 `PAGE-090` 左栏底部「开发者资源」卡（基于共享 `COMP-009` Card）。
- **用途**：指向仓库/帮助页（`IA-013`）的中性集成支持入口。**归一化已移除真源 HTML 的「申请企业级访问」付费/企业 CTA 与商业措辞**（`DEC-007` 无经济模型，`PAGE-090` 归一项 3）；文案改为中性「集成支持 / 查看仓库与示例」。
- **Props / inputs**：
  - `title: string`（默认「开发者资源」）。
  - `links: { label: string; href: string; external?: boolean }[]`（如「访问文档库」「查看仓库与示例」→ `IA-013`，`external` 项加 `open_in_new` 图标 + `target="_blank"` + `rel="noopener noreferrer"`，`PAGE-090` Actions「访问文档库/仓库」）。
- **Events / outputs**：`onResourceClick(href)`：外链点击聚合埋点（不含 PII，`INV-09`、`PAGE-090` Telemetry「外链点击数」）；外链在新标签页打开。
- **States**：`default`、`link-hover/focus`（主色焦点描边）。
- **无障碍**：外链有可辨识 link 文本 + `aria-label` 含「（新标签页打开）」提示；`open_in_new` 图标 `aria-hidden`；键盘可达；对比度 ≥ 4.5:1。
- **数据依赖**：静态链接配置指向 `IA-013` 仓库/帮助；**无任何付费/计费/企业级链接或措辞**（`DEC-007` 硬约束）。
- **测试**：① **不含**「企业级」「付费」「申请访问」「计费」等字样（`DEC-007` 回归，`PAGE-090` 验收 8）；② 外链带 `rel="noopener noreferrer"` + `target="_blank"`；③ a11y 新标签页提示。

---

## COMP-196 · EndpointFieldTable（端点字段说明表）

- **组件名**：`EndpointFieldTable`。落地 `EndpointCard` 展开区的字段说明紧凑表（行可复用共享 `COMP-016` ListRow 或轻量表格）。
- **用途**：逐字段列出端点响应/入参字段、类型、来源实体与追溯标注，使字段可追溯到 `docs/data-contract.md` 必需/推荐字段或标注为派生（`PAGE-090` 验收 4）。
- **Props / inputs**：
  - `rows: { field: string; type: string; source: string; trace: string; note?: string }[]`。示例：`/api/modules` → `id/title/summary/topics/tags/language/owner_handle/source_types/freshness/sensitivity/updated_at`（取自 data-contract 必需+推荐字段）+ `trust_level`（标注「派生 `ENT-011`」）；**显式排除 `contact`**（`ASM-055`/`INV-03`）。
  - `kind?: 'response' | 'request'`（`POST` 卡区分入参/响应）。
- **Events / outputs**：无（静态表）。
- **States**：`default`；窄屏 `card-rows`（`DataTable` 窄屏转卡片行原则，`ASM-016`/`ASM-056`）。
- **无障碍**：表格有 `<th scope="col">` 表头关联（`NFR-007`、`UI_RULES.md`）；窄屏卡片行保留字段-值语义配对；对比度 ≥ 4.5:1。
- **数据依赖**：字段定义对齐 `docs/data-contract.md`（必需/推荐字段）+ 领域模型（`ENT-004/007/010/019`）；`trust_level` 标「派生」（`ENT-011`）；**`contact` 不出现在任何公开读字段表**（`INV-03` 收紧，`ASM-055`、`PAGE-090` 验收 4）。
- **测试**：① `/api/modules` 字段表逐字段追溯 data-contract 或标「派生」（`PAGE-090` 验收 4）；② **字段表不含 `contact` 行**（`INV-03`/`ASM-055` 断言）；③ 表头 `scope` 关联（`NFR-007`）；④ 窄屏转卡片行保留语义。

---

## COMP-197 · RateLimitNote（速率限制说明）

- **组件名**：`RateLimitNote`。落地公开读端点卡内或页头的速率限制文字说明（行内中性提示）。
- **用途**：以**文字**说明公开读端点受速率限制（`FR-110`、`NFR-006`）；具体阈值延后到阶段 15 服务契约，本组件**只标注「受速率限制」不写死数值**（`ASM-057`）。
- **Props / inputs**：
  - `text?: string`（默认「公开读端点受速率限制（具体配额见服务契约）」）。
  - `showThreshold?: boolean`（默认 `false`；若后续 user 要求明示阈值再开，`ASM-057` 重审触发）。
- **Events / outputs**：无。
- **States**：`default`（不含阈值）；可选 `with-threshold`（后续扩展）。
- **无障碍**：中性文字提示，`role` 默认；对比度 ≥ 4.5:1（用 `--color-text-muted` 时仍达标）。
- **数据依赖**：静态文案；不依赖运行时配额数据（阈值在服务契约，本页不固化，`ASM-057`）。
- **测试**：① 渲染含「速率限制」文字（`FR-110`/`NFR-006`）；② 默认**不含**具体数字阈值（`ASM-057` 断言）。

---

## COMP-198 · StatsTeaser（可选真实聚合统计内联）

- **组件名**：`StatsTeaser`。落地承诺横幅旁或 `#stats` 区可选展示的真实 `/api/stats` 聚合数（与 `IA-013` 平台统计同源）。
- **用途**：可选把真实聚合统计（用户数/模块数/交换数/隐私门通过率）内联展示，强化「公开 API 只暴露聚合统计」的承诺（`ENT-019`、`FLOW-008`、`INV-09`）；**纯聚合、零 PII**。
- **Props / inputs**：
  - `metrics?: { usersCount; modulesCount; exchangesCount; privacyGatePassRate; window; asOf }`（`ENT-019` 聚合字段，`INV-09`）。
  - `fallbackText?: string`（默认「统计暂不可用」，失败时中性占位）。
  - `mock?: boolean`（不接后端时用拟真 MOCK，如真源示例值，`PAGE-090` Data 可选动态）。
- **Events / outputs**：可选 `onLoadStats()`（拉取 `/api/stats`，TanStack Query，`FRONTEND_SPEC §8`）。
- **States**：`loading`（共享 `COMP-033` Skeleton/占位）→ `success`（数字）→ `error`（回退「统计暂不可用」中性占位，**不阻断文档阅读**，`PAGE-090` States「统计加载」）；`mock`（拟真值）。
- **无障碍**：统计数字有文字标签（如「模块总数 1,842」，非仅大数字，`NFR-007`、`PAGE-090` 验收 6）；加载态 Skeleton 有 `aria-busy`；失败占位有可读文字。
- **数据依赖**：`ENT-019` UsageStat 聚合（用户数/模块数/交换数/隐私门通过率/window/as_of）；**仅聚合、不含 PII**（`INV-09`、`PAGE-090` 验收 5）；接口形状最终以阶段 15 `SERVICE_CONTRACT` 为准，先对接 MOCK（`ASM-067`）。
- **测试**：① 仅渲染聚合指标，**无任何 PII 字段**（`INV-09` 断言，`PAGE-090` 验收 5）；② 失败回退中性占位且不抛全局错误（降级不阻断，`PAGE-090` States）；③ 数字有文字标签（`NFR-007`）；④ loading 用 Skeleton + `aria-busy`。

---

## COMP-199 · ApiDocsEmptyState（文档加载失败空态）

- **组件名**：`ApiDocsEmptyState`。落地 `PAGE-090` 文档配置缺失（异常）时的居中空态，是共享 `COMP-021` EmptyState 的特化。
- **用途**：端点清单理论上为静态、几乎不为空；若文档配置缺失则居中空态 + 指向 `IA-013` 的 CTA（`PAGE-090` States「空状态」）。
- **Props / inputs**：
  - `icon: 'code_off' | 'description'`（Material Symbols Outlined，`DEC-012`）。
  - `message: string`（默认「文档加载失败，请稍后重试或访问仓库」）。
  - `cta: { label: string; href: string }`（指向 `IA-013` 仓库/帮助，经共享 `COMP-008` SecondaryButton）。
- **Events / outputs**：`onCtaClick(href)`：跳 `IA-013`。
- **States**：单一 `empty/error` 态（文档配置缺失）。
- **无障碍**：图标 `aria-hidden`，说明文字承载语义；CTA 键盘可达（继承 `COMP-021` a11y，`NFR-007`）；对比度 ≥ 4.5:1。
- **数据依赖**：触发于文档配置缺失（异常分支）；CTA 指向 `IA-013`，无私有数据。
- **测试**：① 文档配置缺失时渲染空态 + CTA（`PAGE-090` States）；② CTA 指向 `IA-013`；③ a11y 图标 `aria-hidden` + 文字语义。

---

## COMP-200~209 · 预留段位

- 预留给本模块下游可能扩展的特有组件（如 SDK/技能下载卡、端点关键字搜索框、深链复制反馈条等）。**本阶段不创建**，以避免引入无上游追溯的组件（遵循模板「禁止」第 2 条）。若 `PAGE-091~099` 段位（页面规格预留的「认证与速率限制说明页」「SDK/技能下载页」）在下游被启用，对应组件在此段编号。

---

## 共享组件引用清单（定义见 `_shared/COMPONENTS_SPEC.md`，本文件不重定义）

| 共享 COMP | 组件 | 本模块用法 |
| --- | --- | --- |
| `COMP-001` | `AppShell` | 整页外壳；顶栏「开发文档」当前项高亮（`PAGE-090` Surface） |
| `COMP-008` | `SecondaryButton` | 分类导航项 / 资源卡外链 / 空态 CTA |
| `COMP-009` | `Card` | `EndpointCard`/`DeveloperResourceCard` 的底座 |
| `COMP-011` | `StatusPill` | `COMP-193` AuthBadge 的基元 |
| `COMP-013` | `IconChip` | `COMP-194` AuthNoteBlock 的 `lock` 着色方块 |
| `COMP-016` | `ListRow` | `COMP-196` 字段表行的可选基元 |
| `COMP-021` | `EmptyState` | `COMP-199` ApiDocsEmptyState 的基元 |
| `COMP-023` | `MethodPill` | `EndpointCard` 的方法 Pill（GET/POST 文字+色） |
| `COMP-024` | `CodeBlock` | `EndpointCard` 展开区 JSON 请求/响应 + 复制 |
| `COMP-027` | `Tabs` | 窄屏分类导航折叠为顶部 Tab（`ASM-056`） |
| `COMP-033` | `Skeleton` | `COMP-198` StatsTeaser 加载占位 |

---

## 追溯矩阵

| COMP | 落地页面/IA | 核心追溯 |
| --- | --- | --- |
| `COMP-190` ZeroLeakBanner | `PAGE-090` 顶部 / `IA-012` | `INV-01`、`INV-04`、`FR-110`、`UI-001/002`、归一项 1 |
| `COMP-191` ApiCategoryNav | `PAGE-090` 左栏 / `IA-012` | `IA-012` 端点分组、`ASM-054`、`NFR-007` |
| `COMP-192` EndpointCard | `PAGE-090` 右栏 / `IA-012` | `FR-110`、`NFR-002`、`ENT-003/004/007/010/019`、`INV-01/04`、`NFR-005/006`、归一项 2 |
| `COMP-193` AuthBadge | `EndpointCard` 内 | `NFR-005/006`、`DEC-006`、`PAGE-090` 验收 3 |
| `COMP-194` AuthNoteBlock | `POST` 卡 / 页内 | `NFR-005`、`DEC-006`、`INV-04`、data-contract 校验原则 |
| `COMP-195` DeveloperResourceCard | `PAGE-090` 左栏底 | `DEC-007`（无经济模型）、`IA-013`、归一项 3 |
| `COMP-196` EndpointFieldTable | `EndpointCard` 展开区 | data-contract 字段、`ENT-004/007/010/019`、`ASM-055`/`INV-03`、`NFR-007` |
| `COMP-197` RateLimitNote | `EndpointCard` / 页头 | `FR-110`、`NFR-006`、`ASM-057` |
| `COMP-198` StatsTeaser | 横幅旁 / `#stats` | `ENT-019`、`FLOW-008`、`INV-09`、`DEC-011`、`ASM-067` |
| `COMP-199` ApiDocsEmptyState | `PAGE-090` 异常 | `UI-003` EmptyState、`IA-013`、`NFR-007` |

---

## 新增组件级假设（本产物登记，未改 DEFAULT_ASSUMPTIONS.md）

| 拟新增 ID | 假设 | 若有误的风险 | 确认负责人 | 重新审视触发 |
| --- | --- | --- | --- | --- |
| `ASM-103` | 端点清单与分类导航为前端静态文档配置（或轻后端文档配置），非运行时动态查询；故 `ApiCategoryNav`/`EndpointCard` 无独立 loading/error 态（仅可选统计有） | 若改为运行时拉取端点目录，需补加载/错误态 | agent | 阶段 15 服务契约 / 文档来源决策 |
| `ASM-104` | `EndpointCard` 展开/收起为客户端 UI 状态（`useState`），深链锚点用 URL hash；首卡默认展开 | 若需 SSR 默认全展开或服务端记忆展开态，需调 | 前端实现确认 | 阶段 11 实现 |
| `ASM-105` | `AuthBadge` 由 `COMP-011` StatusPill 特化、`AuthNoteBlock` 的 `lock` 由 `COMP-013` IconChip 承载，不新增图标族（`DEC-012`） | 若 `_shared` StatusPill/IconChip 契约不支持所需变体，需在 `_shared` 补（不在本文件改） | 组件规格交叉审核 | `_shared/COMPONENTS_SPEC.md` 定稿 |

---

## 质量门自检（对照 COMPONENTS_SPEC_TEMPLATE 完成标准 / 禁止项）

```text
Gate: 07-component-spec-gate（逻辑门，对照 product-to-code COMPONENTS_SPEC_TEMPLATE 完成标准/禁止项自检）
Status: pass（内容检查）— 待用户确认 + 跨模块交叉审核
Evidence: aies/02-design/open-api/COMPONENTS_SPEC.md 对照 FRONTEND_SPEC.md(COMP 段分配/共享库)、open-api/PAGE_SPEC.md(PAGE-090)、UI_RULES.md(UI-001/002/003、NFR-007)、IA_SPEC.md(IA-012)、LIGHT_DOMAIN_MODEL.md(ENT-019、INV-01/04/09)、docs/data-contract.md、ID_REGISTRY.md
Findings:
  - 10 个特有组件 COMP-190~199 均在分配段 COMP-190~209 内；COMP-200~209 预留不创建（无上游追溯不强造）。✅
  - 每个组件 8 字段全部有项目特定内容，无占位/无泛化填充。✅
  - 每条主张追溯到 PAGE-090/IA-012/FR-110/NFR-002/ENT-019/INV-01/04 或显式假设（ASM-054~057、ASM-103~105）。✅
  - 共享组件 COMP-001/008/009/011/013/016/021/023/024/027/033 仅引用 ID、不重定义（FRONTEND_SPEC §6/§7、ASM-065）。✅
  - 公开读不含 contact（ASM-055/INV-03）在 EndpointCard/EndpointFieldTable 以排除断言落地；响应示例零私有内容（INV-01/04）写成测试。✅
  - 方法用文字+色（非仅颜色，经 COMP-023）；认证徽语义文字化；代码块键盘可聚焦+复制（NFR-007）。✅
  - 无企业/付费 CTA（DEC-007）：DeveloperResourceCard 移除「申请企业级访问」并写回归测试。✅
  - 写操作仅文档说明、不渲染写表单/提交（不越 NFR-005 同意门）。✅
  - 锚定 shadcn+Tailwind+单一 Material Symbols Outlined 图标族（DEC-012/DEC-014）；未引第二图标/色族。✅
  - 未碰控制文件/他模块/共享 spec；只写本文件；新增假设登记于本文件未改 DEFAULT_ASSUMPTIONS.md；未跑 git。✅
Known risks: ASM-055（contact 语义待 user 确认，阶段 15）；ASM-103（端点为静态文档配置）；ASM-105（依赖 _shared StatusPill/IconChip 支持所需变体）。
Decision: 待用户确认 + 与 _shared/COMPONENTS_SPEC.md 及他模块交叉审核 → 转 passed → 下游阶段 10 MOCK_DATA_SPEC / 阶段 11 实现据此组件契约落地
```
