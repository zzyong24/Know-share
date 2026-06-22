# 组件规格 · account 集群（个人中心 / 通知 / 设置·联系方式）

## 摘要

本产物把 account 集群页面规格（`PAGE-060`~`PAGE-064`）中**本模块特有**的复合组件落成可实现的组件契约，COMP 段 `COMP-150`~`COMP-169`。共享组件（`COMP-001`~`COMP-040`，由 `aies/02-design/_shared/COMPONENTS_SPEC.md` 拥有）一律**只引用 ID、不重定义**。每个特有组件按 8 字段契约展开：name/落地、purpose、props、events、states、a11y、data、tests，并附 metadata 与追溯。

本集群核心隐私约束在组件层固化：**联系方式默认私密（`INV-03`），切「公开」是显式 opt-in 且保存须确认；撤回披露只影响未来、已披露快照不可收回（`ASM-013`）；所有状态非仅靠颜色（`NFR-007`）**。

### 产物元数据

- Stage: `09-frontend-spec`（模块组件规格扇出）
- Status: `needs-user-confirmation`
- 模块: account（私域：个人中心 / 通知 / 设置·联系方式）
- COMP ID 段（本模块特有）: `COMP-150`~`COMP-169`（已用 `COMP-150`~`COMP-157`；`COMP-158`~`COMP-169` 预留）
- Source inputs: `aies/03-frontend/FRONTEND_SPEC.md`、`aies/02-design/account/PAGE_SPEC.md`（`PAGE-060`~`064`）、`aies/02-design/UI_RULES.md`（`UI-001/002/003`、组件行为规则、`NFR-007`）、`aies/02-design/IA_SPEC.md`（`IA-009/010/014`）、`aies/01-product/LIGHT_DOMAIN_MODEL.md`（`ENT-003/006/007/008/009/013/017/021`、`INV-03/07/08/11`）、`aies/01-product/BUSINESS_FLOW.md`（`FLOW-006/007`）、`aies/00-control/ID_REGISTRY.md`、`docs/design/generated/IA-009-dashboard.html`、`IA-010-notifications.html`、`IA-014-settings-contact.html`
- Decision IDs: `DEC-010`（联系方式默认私密、交换接受后披露）、`DEC-012`（规范图标族 Material Symbols Outlined）、`DEC-014`（Next.js + TS + Tailwind + shadcn/ui）
- 新增假设: `ASM-095`~`ASM-099`（见文末；未改 `DEFAULT_ASSUMPTIONS.md`）

### COMP 清单（本模块特有）与所属 PAGE

| COMP ID | 组件 | 落地基座 | 主要使用 PAGE | 复用的共享组件 |
| --- | --- | --- | --- | --- |
| `COMP-150` | `DashboardOverview`（个人中心概览） | `COMP-014 StatBlock` ×4 + 欢迎条 | `PAGE-060` | `COMP-014`、`COMP-033` |
| `COMP-151` | `AccountSubNav`（私域子导航） | `<nav>` + `aria-current` | `PAGE-060`、`PAGE-061` | `COMP-011`（计数徽用 Badge 风格） |
| `COMP-152` | `MySectionList`（分区列表容器） | grid / 列表 + 共享卡/行 | `PAGE-061` | `COMP-010`、`COMP-016`、`COMP-011`、`COMP-021`、`COMP-025`、`COMP-032`、`COMP-033` |
| `COMP-153` | `NotificationFeed`（通知流） | `COMP-027 Tabs` + 通知项 | `PAGE-062` | `COMP-027`、`COMP-013`、`COMP-016`、`COMP-021`、`COMP-029`、`COMP-032`、`COMP-033` |
| `COMP-154` | `NotificationItem`（单条通知，未读/已读两态） | `COMP-016 ListRow` 特化 | `PAGE-062` | `COMP-013`、`COMP-016` |
| `COMP-155` | `ContactMethodsForm`（联系方式表单） | `COMP-030 FormField` + `COMP-031 VisibilityToggle` | `PAGE-063` | `COMP-030`、`COMP-031`、`COMP-011`、`COMP-029`、`COMP-007/008` |
| `COMP-156` | `DisclosurePolicyCallout`（披露策略说明） | 信息 Callout（info 浅底） | `PAGE-063` | `COMP-013`（可选图标） |
| `COMP-157` | `ConsentRecordList`（同意/披露记录列表） | `COMP-016 ListRow` + `COMP-025 ConfirmDialog` | `PAGE-063`、`PAGE-064` | `COMP-016`、`COMP-025`、`COMP-011`、`COMP-021`、`COMP-029` |
| `COMP-158`~`COMP-169` | 预留（账户身份卡 / 通知偏好开关组 / 退出登录卡等，如后续 `PAGE-064` 需独立复合组件再登记） | — | — | — |

> 边界说明：`PAGE-064`（隐私与同意 / 账户 / 通知偏好）的三个分区在当前页面规格下主要由共享组件直接组合（`COMP-031 VisibilityToggle` 开关组、`COMP-011 StatusPill` Verified 徽、`COMP-025 ConfirmDialog` 退出确认、`COMP-029 Toast`）+ `COMP-157 ConsentRecordList`（隐私分区全量同意轨迹复用同一组件）构成，**未无依据新增特有组件**；若实现期发现「通知偏好开关组」「账户身份只读卡」需要独立可测组件，再启用 `COMP-158`/`COMP-159`（`ASM-099`）。

---

## `COMP-150` DashboardOverview（个人中心概览）

### Artifact metadata
- COMP ID: `COMP-150`
- 落地: 欢迎条 + 4 × `COMP-014 StatBlock`（响应式行/网格）；`COMP-033 Skeleton` 加载态
- Upstream: `PAGE-060`、`IA-009`、`FR-060`、`FR-070`、`ASM-014`、`ENT-001/003/007/011/017`、`NFR-007`、`DEC-012`
- 设计真源: `IA-009-dashboard.html`（欢迎条 line 165-174、StatBlock 行 line 176-214、未读红点条件 line 207）

### Purpose
个人中心顶部概览面：欢迎条（动态文案）+ 4 个关键统计（我的模块数 / 进行中交换数 / 信任分 / 未读通知数）。统计为派生只读值，是私域价值橱窗与快捷入口。

### Props
| prop | 类型 | 说明 |
| --- | --- | --- |
| `currentUser` | `{ displayName: string; githubHandle: string; avatarUrl?: string; githubVerified: boolean }` | 欢迎条主体（`ENT-001`） |
| `stats` | `{ myModulesCount: number; activeExchangesCount: number; trustScore: number; unreadNotificationsCount: number }` | 4 个 StatBlock 数值（派生，`ENT-011/003/007/017`） |
| `welcomeSummary` | `string` | 动态文案（如「今天有 2 个待处理的交换请求」），由上游派生传入 |
| `loading` | `boolean` | true 时整体渲染 skeleton |
| `error` | `boolean` | true 时 StatBlock 区显示内联错误条 |

### Events
| event | 触发 | 载荷 |
| --- | --- | --- |
| `onStatClick(stat)` | 点击某个可点 StatBlock（当前仅「未读通知」可跳 `/notifications`） | `stat: "modules"\|"exchanges"\|"trust"\|"unread"` |
| `onRetry()` | error 态点「重试」 | — |

### States
- **loading**：4 个数字占位 + 欢迎条占位（`COMP-033`）。
- **default**：欢迎条 + 4 StatBlock 完整渲染。
- **未读=0**：未读 StatBlock 数字显示 `0`，**去除右上红点**（红点为条件渲染，非仅颜色——同时由「有无圆点 + 数字」传达）。
- **error**：StatBlock 区显示内联错误条「概览数据加载失败，重试」+ 重试按钮；不阻断其余区域（降级，对应 `PAGE-060` States）。

### A11y（`NFR-007`）
- 每个 StatBlock 含大数字 + 文字标签（不靠颜色单独传达）；可点 StatBlock 为 `<button>`/`<a>`，键盘可达、焦点态主色描边。
- 未读红点旁有文字数字与 `aria-label`（如「未读通知 5 条」），红点非唯一信息载体。
- 统计大数字用 `--text-stat`，与标签语义关联（`aria-describedby` 或同容器）。

### Data
派生只读：均来自后端聚合（`ENT-011` 信任分 / `ENT-003` 模块计数 / `ENT-007` 进行中交换 / `ENT-017` 未读）；不含他人 PII（`INV-09`）。计数与分区实时条数若不一致以分区视图为准。

### Tests
- loading→default→error 三态快照；未读=0 时无红点、未读>0 有红点 + 数字。
- 点未读 StatBlock 触发 `onStatClick("unread")`；error 态点重试触发 `onRetry`。
- a11y：StatBlock 标签可读、可点项键盘可聚焦、未读 `aria-label` 含数字。

---

## `COMP-151` AccountSubNav（私域子导航）

### Artifact metadata
- COMP ID: `COMP-151`
- 落地: 竖向 `<nav>`（桌面 `w-64`）+ 项 `aria-current="page"`；计数徽用 `COMP-011` 风格小 Badge
- Upstream: `PAGE-060`、`PAGE-061`、`IA-009`、`ASM-014`、`NFR-007`
- 设计真源: `IA-009-dashboard.html`（左侧子导航 line 218-258、待处理徽标 line 237）

### Purpose
个人中心左侧竖向子导航，6 项：我的模块 | 草稿 | 收到的交换 | 发起的交换 | 收藏 | 设置入口。当前项 `aria-current` + 视觉高亮（加粗 + 浅底，非仅颜色）；项可带计数徽（如「收到的交换 2」）。

### Props
| prop | 类型 | 说明 |
| --- | --- | --- |
| `items` | `Array<{ key: string; label: string; href: string; icon: string; badge?: number }>` | 6 项导航；`icon` 为 Material Symbols Outlined 名 |
| `activeKey` | `string` | 当前激活项 key（与 route `:section` 对应；「设置」指向 `/settings/contact`） |

### Events
| event | 触发 | 载荷 |
| --- | --- | --- |
| `onNavigate(item)` | 点击/键盘激活某项（实现可直接用 `<Link>`） | `item` |

### States
- **default**：6 项渲染；激活项 `active-sidebar-item`（加粗 + `--color-primary-subtle` 浅底）+ `aria-current="page"`。
- **loading**：6 行导航占位（`COMP-033`，由父容器控制）。
- **徽标态**：`badge>0` 显示计数小徽（如收到的交换待处理数）；`badge` 为 0 或缺省不显示。

### A11y（`NFR-007`）
- `<nav aria-label="个人中心导航">`；项为链接，Tab 可达、焦点态主色描边。
- 激活态由 `aria-current="page"` + 视觉加粗 + 浅底三重传达，**非仅颜色**。
- 计数徽有 `aria-label`（如「收到的交换，待处理 2 项」），图标含 `aria-hidden` 由文字标签承载语义。

### Data
导航项静态配置 + 各项计数（与 `COMP-150` StatBlock / 后端徽标一致，派生）。

### Tests
- 渲染 6 项；`activeKey` 项有 `aria-current="page"` 且类名含高亮。
- 点项触发 `onNavigate` 且 key 正确；「设置」项 href = `/settings/contact`。
- `badge` 渲染规则（>0 显示、=0 隐藏）；键盘 Tab 顺序覆盖全部项。

---

## `COMP-152` MySectionList（分区列表容器）

### Artifact metadata
- COMP ID: `COMP-152`
- 落地: 按 `section` 渲染 `COMP-010 ModuleCard` 网格 或 `COMP-016 ListRow` + `COMP-011 StatusPill` 列表；空态 `COMP-021 EmptyState`；破坏性操作 `COMP-025 ConfirmDialog`；分页 `COMP-032`；加载 `COMP-033`
- Upstream: `PAGE-061`、`IA-009`、`FR-060`、`FR-070`、`ENT-003/006/007/013`、`INV-07`、`FLOW-003`（状态展示）、`FLOW-006`、`NFR-007`
- 设计真源: `IA-009-dashboard.html`（ModuleCard 网格 line 282-368、草稿空态 line 369-383）

### Purpose
个人中心右侧主区，按当前分区渲染 5 类内容：`modules`（已发布模块网格）、`drafts`（草稿列表 + 空态）、`received`（收到的交换 行 + 状态）、`sent`（发起的交换 行 + 状态）、`favorites`（收藏网格）。统一承载列表/空/加载/错误态与分区内破坏性操作（仅导航与本地动作，**不在此改交换状态机**）。

### Props
| prop | 类型 | 说明 |
| --- | --- | --- |
| `section` | `"modules"\|"drafts"\|"received"\|"sent"\|"favorites"` | 当前分区；非法值由父级重定向到 `modules` |
| `items` | `ModuleCardData[] \| DraftData[] \| ExchangeRowData[]` | 当前分区数据（按 section 多态，见 Data） |
| `loading` / `error` | `boolean` | 列表级加载/错误 |
| `hasMore` | `boolean` | 是否显示「加载更多」（`COMP-032`） |
| `onFilter?` | `(filters) => void` | 「筛选」按钮回调（按状态/主题） |

### Events
| event | 触发 | 载荷 |
| --- | --- | --- |
| `onModuleAction(id, action)` | `modules` 卡 `more_horiz` 菜单 | `action: "edit"\|"viewPublic"\|"delist"`（delist 破坏性→ConfirmDialog） |
| `onDraftAction(id, action)` | `drafts` 行 | `action: "continue"\|"delete"`（delete 破坏性） |
| `onExchangeOpen(id)` | `received`/`sent` 行「查看交换」→ `IA-006`（导航出模块） | `id` |
| `onFavoriteToggle(moduleId, on)` | `favorites` 取消收藏（遵守 `INV-07` 幂等） | `moduleId, on:boolean` |
| `onLoadMore()` | 加载更多 | — |
| `onRetry()` | error 重试 | — |

### States
- **loading**：网格 3 列卡片占位 / 列表行占位（`COMP-033`）。
- **default**：`modules`/`favorites` → `COMP-010` 网格（桌面 3 列）；`received`/`sent` → `COMP-016` + `COMP-011`（状态含**文字**）；`drafts` → 列表行。
- **empty**（每分区独立 `COMP-021`，含图标 + 文案 + CTA）：modules 空→去提交向导；drafts 空→去提交向导；received 空→说明交换如何发起；sent 空→去发现页；favorites 空→去发现页。
- **error**：内联错误 + 重试，不影响左导航。
- **交换状态可视**：`received`/`sent` 用 `COMP-011 StatusPill` + 文字呈现 `Requested/Accepted/PrivatePreparing/Delivered/Completed/WaitingForFeedback/Closed/Rejected/Cancelled/Expired/Flagged`（`FLOW-003`），色映射 `UI-001` 语义色，**非仅颜色**（`NFR-007`）。
- **破坏性确认**：下架模块/删除草稿/取消收藏均经 `COMP-025 ConfirmDialog`；确认后由父级写 `AuditLog`（`INV-11`）。

### A11y（`NFR-007`）
- 网格/列表项键盘可达；卡片菜单 `more_horiz` 为可聚焦按钮 + `aria-label`。
- 交换状态 Pill 含文字标签（非仅颜色）；空态图标 `aria-hidden`，语义由文案承载。
- 「筛选」按钮有 `aria-label`，筛选结果数变化对屏幕阅读器可感知（`aria-live` 礼貌区域，可选）。

### Data（按 section 多态）
- `modules`/`favorites`：`{ id, title, summary, topics[], visibility:"Public", status, favoriteCount, forkCount, trustLevel }`（`ENT-003/004/020`）。
- `drafts`：`{ id, moduleTitle, lastEditedAt, privacyScanStatus? }`（`ENT-006` Draft 态）。
- `received`/`sent`：`{ id, targetModule, offeredModule?, counterparty:{handle,trustBadge}, state, updatedAt }`（`ENT-007`；`offeredModule` 可空 `INV-05`）。

### Tests
- 5 个 section 各渲染正确容器（网格 vs 行）与对应空态 CTA 目标。
- `received`/`sent` 行渲染 StatusPill 文字 + 语义色一致；状态非仅颜色断言。
- 下架/删除/取消收藏均弹 `COMP-025` 确认；取消收藏对 `INV-07` 幂等（重复点击不重复请求）。
- 交换行点击触发 `onExchangeOpen`（导航出模块，不在本组件改状态）。
- 非法 section 由父级重定向（本组件收到合法 union 值）。

---

## `COMP-153` NotificationFeed（通知流）

### Artifact metadata
- COMP ID: `COMP-153`
- 落地: `COMP-027 Tabs`（筛选）+ `COMP-154 NotificationItem` 列表 + `COMP-021 EmptyState` + `COMP-032 LoadMore` + `COMP-029 Toast`（标记失败回滚提示）
- Upstream: `PAGE-062`、`IA-010`、`FR-120`、`FLOW-006`、`ENT-017`、`NFR-006/007`、`DEC-012`
- 设计真源: `IA-010-notifications.html`（页头 + 全部标记已读 line 153-156、筛选 Tab line 159-165、通知流 line 167-236、空态 line 237-242）

### Purpose
单列通知信息流：页头（标题 + 「全部标记已读」）+ 5 个筛选 Tab（全部/交换/评审/反馈/社区）+ 通知项列表（已读/未读两态）+ 空态 + 加载更多。驱动各方推进交换/评审/反馈/社区流程（`FLOW-006`）。

### Props
| prop | 类型 | 说明 |
| --- | --- | --- |
| `notifications` | `NotificationData[]` | 当前列表（见 `COMP-154` Data 形状） |
| `filter` | `"all"\|"exchange"\|"review"\|"feedback"\|"community"` | 当前筛选 Tab（与 `?type=` 同步） |
| `unreadCount` | `number` | 未读数（同步顶栏红点 / `COMP-150` 未读 StatBlock） |
| `loading` / `error` | `boolean` | 列表加载/错误 |
| `hasMore` | `boolean` | 加载更多 |

### Events
| event | 触发 | 载荷 |
| --- | --- | --- |
| `onFilterChange(type)` | 切 Tab | `type` |
| `onOpen(notification)` | 点单条「查看」或本体 → 跳引用目标 + 标记已读 | `notification`（含 `refLink`） |
| `onMarkRead(id)` | 点未读条本体 → 单条标记已读（乐观，幂等） | `id` |
| `onMarkAllRead()` | 「全部标记已读」（乐观，失败回滚 + Toast） | — |
| `onLoadMore()` / `onRetry()` | 加载更多 / 错误重试 | — |

### States
- **loading**：4–6 行占位（`COMP-033`）。
- **default**：混合已读/未读列表（项态见 `COMP-154`）。
- **empty**：`notifications_off` 图标 + 「暂无通知」+ 说明；按 Tab 的空复用此态并说明「该分类下暂无通知」。
- **加载更多**：底部按钮 / 滚动加载，加载中行级 spinner。
- **error**：内联错误条 + 重试。
- **标记中**：乐观更新（先视觉置已读），失败回滚 + `COMP-029 Toast`「标记失败，请重试」。
- **激活 Tab**：主色下划线 + 加粗（非仅颜色）。

### A11y（`NFR-007`）
- Tab 用 `COMP-027`（Radix Tabs，`role=tablist/tab/tabpanel`，键盘左右切换）；激活 Tab 由 `aria-selected` + 下划线 + 加粗传达。
- 「全部标记已读」为按钮 + `aria-label`；列表项键盘可达。
- 未读语义见 `COMP-154`（图标 + 圆点 + 加粗 + 文字，非仅颜色）。
- 抗滥用：批量标记限频（`NFR-006`），前端防连点。

### Data
`unreadCount` 与父级/顶栏一致；分页游标 `cursor` 由父级管理。类型→IconChip 映射在 `COMP-154`。引用目标失效时该条链接禁用（见 `COMP-154`）。

### Tests
- 渲染页头 + 全部标记已读 + 5 Tab + 列表；默认 Tab「全部」`aria-selected`。
- 切 Tab 触发 `onFilterChange` 且仅显示该类型；空分类显示空态文案。
- 「全部标记已读」乐观清零 unread；模拟失败→回滚 + Toast。
- 加载更多触发 `onLoadMore`；error 重试触发 `onRetry`。

---

## `COMP-154` NotificationItem（单条通知 · 未读/已读两态）

### Artifact metadata
- COMP ID: `COMP-154`
- 落地: `COMP-016 ListRow` 特化 + `COMP-013 IconChip`（按类型着色，Material Symbols Outlined 字形）
- Upstream: `PAGE-062`、`IA-010`、`FR-120`、`ENT-017`、`NFR-007`
- 设计真源: `IA-010-notifications.html`（未读左条 line 170 / 圆点 line 183、IconChip 映射 line 172/191/209/224、已读降透明 line 207/222、未读非仅颜色提示 line 238）

### Purpose
通知流单项：类型 IconChip + 富文本主文本（含 @handle / 模块名）+ 相对时间（带绝对 title）+ 「查看」动作链接；区分未读/已读两态，未读语义**非仅靠颜色**。

### Props
| prop | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 通知 ID |
| `type` | `"exchange"\|"review"\|"feedback"\|"community"` | 决定 IconChip 字形与浅底色 |
| `read` | `boolean` | 已读/未读 |
| `title` | `RichText`（含 @handle / 模块名 token） | 主文本（明文 @handle 不进埋点） |
| `createdAt` | `ISODateString` | 渲染相对时间 + 绝对 title |
| `refLink` | `{ href: string; disabled?: boolean; reason?: string }` | 引用目标；失效时 `disabled` + 「该内容已不可用」 |

### Events
| event | 触发 | 载荷 |
| --- | --- | --- |
| `onOpen(id, refLink)` | 点「查看」或本体 | `id, refLink` |
| `onMarkRead(id)` | 未读本体点击 → 标记已读 | `id` |

### States
- **未读**：左侧主色竖条（`--color-primary`）+ 右侧主色圆点 + 加粗主文本 + IconChip——**未读由图标存在 + 圆点 + 加粗 + （可加）「未读」aria 同时传达，非仅颜色**（`NFR-007`，HTML line 238）。
- **已读**：`opacity-80`、文本转 `--color-text-muted`、无左条无圆点。
- **类型映射（IconChip，`COMP-013`）**：exchange `swap_horiz`/主色浅底；review `verified_user`/info 浅底；feedback `grade`/warning 浅底；community `groups`/紫色浅底。
- **引用失效**：「查看」链接禁用 + 标注「该内容已不可用」，不跳 404。

### A11y（`NFR-007`）
- 整项可聚焦（`role=listitem` 内含可操作链接/按钮）；未读状态含可读文本（如 `aria-label` 前缀「未读：」），不依赖颜色/圆点单独传达。
- IconChip 字形 `aria-hidden`，语义由主文本承载；时间 `<time datetime>` + 相对文本 + `title` 绝对时间。
- 链接禁用时 `aria-disabled="true"` + 可读理由。

### Data
`ENT-017` Notification：`{ id, type, read, title(富文本), refLink, createdAt }`。富文本中的 @handle / 模块名仅展示，不进埋点明文（`INV-09`/`NFR-001`）。

### Tests
- 未读：渲染左条 + 圆点 + 加粗；已读：降透明 + muted + 无左条。
- 4 种 type 渲染对应 IconChip 字形与浅底色。
- 点未读本体触发 `onMarkRead` + `onOpen`；点已读仅 `onOpen`。
- `refLink.disabled` 时链接不可点 + 渲染失效文案；未读 a11y 文本存在断言（非仅颜色）。
- 时间渲染相对 + `title` 绝对。

---

## `COMP-155` ContactMethodsForm（联系方式表单）

### Artifact metadata
- COMP ID: `COMP-155`
- 落地: `COMP-030 FormField`（label 关联 + 校验）+ `COMP-031 VisibilityToggle`（私密/公开 + 状态文字，**默认私密**）+ `COMP-011 StatusPill`（Private/Public/Not Set 文字徽）+ `COMP-007/008` 保存/取消 + `COMP-029 Toast`
- Upstream: `PAGE-063`、`IA-014`、`FR-130`、`DEC-010`、`ENT-008`、`INV-03/08/11`、`ASM-013`、`NFR-005/006/007`
- 设计真源: `IA-014-settings-contact.html`（联系渠道卡 line 167-243、Private 徽 line 182/206、「设为公开」开关 line 191/215、邮箱脱敏 line 208、未设态 line 221-241、全局操作 + toast line 279-308）

### Purpose
本人管理多通道联系方式（GitHub / 邮箱 / 自定义如 Telegram）与每项可见性。**默认私密强约束（`INV-03`）**：任何新增/编辑渠道默认 `private`，切「公开」是显式 opt-in 且保存须确认，无「静默公开」路径。保存写 `Consent` + `AuditLog`（`INV-08/11`）。

### Props
| prop | 类型 | 说明 |
| --- | --- | --- |
| `contactMethods` | `ContactInfo[]` | 见 Data；含未设态（`isSet:false`） |
| `dirty` | `boolean` | 有未保存改动（控制保存启用 + 离开提示） |
| `saving` | `boolean` | 保存中（按钮 loading、禁重复提交） |
| `errors?` | `Record<methodId, string>` | 字段级校验错误（内联红字） |

### Events
| event | 触发 | 载荷 |
| --- | --- | --- |
| `onEditValue(id, value)` | 编辑某渠道值 | `id, value` |
| `onToggleVisibility(id, to)` | `COMP-031` 切换（private↔public）；切 public 标记待确认 | `id, to:"private"\|"public"` |
| `onAddCustom(type, value)` | 「立即关联」新增自定义渠道（默认 private） | `type, value` |
| `onSave()` | 保存（含 public 切换二次确认后） | — |
| `onCancel()` | 取消（脏改动时二次确认） | — |

### States
- **loading**：渠道卡 skeleton（`COMP-033`）。
- **default（默认私密）**：GitHub / 邮箱 `Private` 徽（`COMP-011`）+「（私密）」副文 + `VisibilityToggle` 默认关（指向 private）。自定义未设 → `Not Set` 徽 +「立即关联」。
- **开关=public（待确认）**：徽变 `Public`、副文「（公开）」；保存前为待确认态，保存时弹确认（显式 opt-in，`INV-03`）。
- **dirty**：保存启用 + 离开页面提示。
- **saving**：保存按钮 loading、禁用重复提交。
- **success**：`COMP-029 Toast`「设置已保存」。
- **error**：字段内联红字（邮箱格式 / handle 格式）；保存失败 Toast「保存失败，请重试」。

### Validation（`PAGE-063`）
- 邮箱：`name@domain` 格式校验，**展示脱敏**（`z****@example.com`）。
- GitHub handle：`@handle` 格式 + 与登录身份一致性（`DEC-006`，不可冒用他人 handle）。
- 自定义渠道：类型必选 + 值非空 + URL/handle 基本格式。
- 默认私密强约束：新增/编辑默认 `private`；切 public 必须显式开关 + 保存确认（`INV-03`）。
- 抗滥用：编辑/关联受速率限制与身份核查（`NFR-006`），改动写审计（`INV-11`，由父级/服务执行）。

### A11y（`NFR-007`）
- `COMP-030` FormField label 与控件 `htmlFor`/`id` 关联；错误用 `aria-describedby` + 红字（非仅颜色）。
- `COMP-031` VisibilityToggle 有状态文字（「私密」/「公开」），开关 `role=switch` + `aria-checked`，非仅颜色/位置传达。
- Private/Public/Not Set 用文字徽 + 图标，键盘可达。

### Data
`ENT-008` ContactInfo：`{ id, type:"github"\|"email"\|"custom", label, value(脱敏展示), visibility:"private"\|"public", isSet:boolean, icon }`。**严禁记录联系方式明文**（值不进埋点，`NFR-001`/`INV-09`）；可见性切换仅记「发生切换 + 目标态」，不记具体值。

### Tests
- GitHub/邮箱默认渲染 `Private` 徽 + 「（私密）」+ 开关默认关。
- 切「设为公开」→ 徽变 Public 且**保存时弹确认**（`INV-03` opt-in 断言：无静默公开路径）。
- 邮箱脱敏展示；非法邮箱/handle 内联报错且阻止保存。
- 「立即关联」新增自定义渠道默认 visibility=private。
- 保存成功触发 Toast；脏态取消弹二次确认。
- a11y：label 关联、switch `aria-checked`、状态文字存在（非仅颜色）。

---

## `COMP-156` DisclosurePolicyCallout（披露策略说明）

### Artifact metadata
- COMP ID: `COMP-156`
- 落地: 信息 Callout（info / 主色浅底 + 可选 `COMP-013 IconChip`）；固定文案、非交互
- Upstream: `PAGE-063`、`IA-014`、`FR-130`、`DEC-010`、`INV-03`、`ASM-013`、`NFR-007`
- 设计真源: `IA-014-settings-contact.html`（披露策略 Callout line 160-166）

### Purpose
设置·联系方式页顶部固定说明：**默认私密 + 仅交换接受（`Accepted`）后对该次对方披露 + 可选披露哪些 + 可编辑/可撤回（撤回只影响未来）**。把 `INV-03`/`DEC-010`/`ASM-013` 在 UI 显式声明，建立用户心智。

### Props
| prop | 类型 | 说明 |
| --- | --- | --- |
| `text?` | `string` | 默认用固定文案（HTML line 163-165）；允许覆盖以便本地化 |
| `tone?` | `"info"\|"primary-subtle"` | 浅底语气，默认 info |

### Events
无（纯展示）。

### States
- **default**：图标 + 标题 +「默认私密 / 仅接受后披露 / 可选可编辑可撤回」要点文案。
- 无 loading/error/empty（静态内容）。

### A11y（`NFR-007`）
- `role=note`（或语义化 region）+ 可读标题；图标 `aria-hidden`，语义由文字承载，对比度达标。

### Data
固定策略文案（呼应 `INV-03`/`ASM-013`），不含动态/PII。

### Tests
- 渲染含「默认私密」「仅交换接受后披露」「可编辑/可撤回」「撤回只影响未来」关键语义文案。
- 图标 `aria-hidden`，文案对比度与角色断言。

---

## `COMP-157` ConsentRecordList（同意 / 披露记录列表）

### Artifact metadata
- COMP ID: `COMP-157`
- 落地: `COMP-016 ListRow` + 撤回 `COMP-025 ConfirmDialog`（破坏性二次确认）+ `COMP-011 StatusPill`（「已撤回（仅未来生效）」标注）+ `COMP-021 EmptyState` + `COMP-029 Toast`
- Upstream: `PAGE-063`、`PAGE-064`、`IA-014`、`FR-130`、`ENT-021/009`、`INV-03/08/11`、`ASM-013/046`、`NFR-006/007`、`FLOW-007`
- 设计真源: `IA-014-settings-contact.html`（同意记录区 line 244-278、hover 撤回按钮 line 260/273）

### Purpose
展示融合 `ENT-021 Consent` 与 `ENT-009 ContactDisclosure` 的记录（披露=一次 contact 同意，`ASM-046`）：对方 handle + 披露的方式 + 日期 + 交换引用 + 来源。每条可撤回——**撤回只影响未来披露，已披露快照不可收回（`ASM-013`）**，撤回前二次确认并显式声明，执行后写 `AuditLog`（`INV-11`）。`PAGE-064` 隐私分区复用本组件展示全量同意轨迹（可按 `actionType` 扩展列）。

### Props
| prop | 类型 | 说明 |
| --- | --- | --- |
| `records` | `ConsentRecord[]` | 见 Data（融合 Consent / ContactDisclosure） |
| `loading` / `error` | `boolean` | 列表态 |
| `mode?` | `"disclosure"\|"all-consent"` | `disclosure`=PAGE-063 披露记录；`all-consent`=PAGE-064 全量同意轨迹（多 actionType） |

### Events
| event | 触发 | 载荷 |
| --- | --- | --- |
| `onRevoke(id)` | 行 hover 出现 `cancel` → 撤回（经 `COMP-025` 确认，文案显式「只影响未来、已披露快照不可收回」） | `id` |
| `onViewDetail?(id)` | 查看动作详情（all-consent 模式） | `id` |
| `onRetry()` | error 重试 | — |

### States
- **loading**：记录行 skeleton（`COMP-033`）。
- **default**：每行对方 handle + 披露方式（如 GitHub/邮箱）+ 日期 + 交换引用（`EX-2024-8842`）+ 来源（「因交换自动授权」）；`revocable` 项 hover 出现撤回按钮。
- **empty**：`COMP-021`「暂无披露记录」+ 说明「联系方式仅在交换被接受后才会披露」（呼应 `INV-03`）；all-consent 空→「暂无同意记录」+ 说明同意在跨边界动作时产生（`FLOW-007`）。
- **撤回确认中**：`COMP-025 ConfirmDialog`，确认文案显式 `ASM-013`。
- **撤回完成**：该行标注「已撤回（仅未来生效）」（`COMP-011` 文字徽，非仅颜色）；`COMP-029 Toast` 反馈。
- **error**：内联错误 + 重试。

### A11y（`NFR-007`）
- 列表行键盘可达；撤回按钮即使 hover 出现也须键盘可聚焦（不依赖鼠标 hover），含 `aria-label`「撤回对 @X 的披露」。
- 撤回确认对话框 `role=alertdialog`，焦点陷阱 + 默认聚焦取消（破坏性默认非确认）。
- 「已撤回」状态用文字徽传达（非仅颜色）；交换引用为可读文本。

### Data
融合（`ASM-046`）：`{ id, counterpartyHandle, disclosedMethods:["GitHub","邮箱"], date, exchangeRef:"EX-2024-8842", source:"因交换自动授权", revocable:boolean, actionType?:"generate"\|"submit"\|"contact"\|"exchange" }`（`ENT-021`/`ENT-009`）。明文 handle 不进埋点（`INV-09`）；撤回事件仅记 `consent_revoke{exchangeRef|actionType}`，不记联系方式值。

### Tests
- 渲染每行 handle + 方式 + 日期 + 交换引用 + 来源。
- 撤回弹 `COMP-025` 且确认文案含「只影响未来」「已披露快照不可收回」（`ASM-013` 断言）。
- 撤回后行标注「已撤回（仅未来生效）」+ Toast；撤回按钮键盘可聚焦（非仅 hover）。
- `mode="all-consent"` 渲染 actionType；空态文案随 mode 切换。
- 确认对话框默认聚焦取消（破坏性安全默认）。

---

## 集群级追溯小结

| COMP | PAGE | IA | FR | FLOW | ENT | INV / DEC / ASM | 共享复用 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `COMP-150` | `PAGE-060` | `IA-009` | `FR-060`、`FR-070` | — | `ENT-001/003/007/011/017` | `NFR-007`、`DEC-012` | `COMP-014/033` |
| `COMP-151` | `PAGE-060/061` | `IA-009` | `FR-060/070` | — | — | `ASM-014`、`NFR-007` | `COMP-011` |
| `COMP-152` | `PAGE-061` | `IA-009` | `FR-060/070` | `FLOW-003`（展示）、`FLOW-006` | `ENT-003/006/007/013` | `INV-05/07/11`、`NFR-007` | `COMP-010/016/011/021/025/032/033` |
| `COMP-153` | `PAGE-062` | `IA-010` | `FR-120` | `FLOW-006` | `ENT-017` | `NFR-006/007`、`DEC-012` | `COMP-027/013/016/021/029/032/033` |
| `COMP-154` | `PAGE-062` | `IA-010` | `FR-120` | `FLOW-006` | `ENT-017` | `NFR-007` | `COMP-016/013` |
| `COMP-155` | `PAGE-063` | `IA-014` | `FR-130` | `FLOW-007`、`FLOW-003`（披露处） | `ENT-008` | `INV-03/08/11`、`DEC-010`、`ASM-013`、`NFR-005/006/007` | `COMP-030/031/011/029/007/008` |
| `COMP-156` | `PAGE-063` | `IA-014` | `FR-130` | — | — | `INV-03`、`DEC-010`、`ASM-013`、`NFR-007` | `COMP-013` |
| `COMP-157` | `PAGE-063/064` | `IA-014` | `FR-130` | `FLOW-007` | `ENT-021/009` | `INV-03/08/11`、`DEC-010`、`ASM-013/046`、`NFR-006/007` | `COMP-016/025/011/021/029` |

- 全集群只引用共享 `COMP-001~040`，不重定义（`ASM-065`）。
- 无障碍底线 `NFR-007` 全集群执行：状态非仅颜色（文字徽 + 图标 + 圆点 + 透明度 + aria 文本）、键盘可达（含 hover 出现的撤回按钮）、`aria-current`、`role=switch/alertdialog/tablist`、表单 label 关联、时间相对 + 绝对 title。
- 隐私硬约束在组件层固化：`COMP-155` 默认私密 + public 显式 opt-in 确认（`INV-03`）；`COMP-157` 撤回只影响未来 + 二次确认（`ASM-013`）；联系方式明文与他人 handle 不进埋点（`INV-09`/`NFR-001`）。
- 图标全族 Material Symbols Outlined（`DEC-012`），实现以 lucide-react 1:1 替换（`ASM-066`）。

## 新增假设（本阶段提出，未改 `DEFAULT_ASSUMPTIONS.md`）

| ID | 假设 | 若有误的风险 | 确认负责人 |
| --- | --- | --- | --- |
| `ASM-095` | 组件契约采用 8 字段（name/落地、purpose、props、events、states、a11y、data、tests）+ metadata + 追溯，与 `FRONTEND_SPEC` §6「props/events/states/a11y/data/tests」对齐并补 metadata 与 purpose | 若编排者要求固定别的字段模板，需统一各模块格式 | agent（组件规格交叉审核阶段） |
| `ASM-096` | `NotificationItem`（`COMP-154`）独立成可测组件，从 `COMP-153 NotificationFeed` 拆出 | 若团队偏好单组件不拆，合并即可，不影响契约语义 | 前端实现确认 |
| `ASM-097` | 通知富文本 `title` 含 @handle / 模块名 token，由后端提供结构化片段，前端按白名单渲染（明文不进埋点） | 若后端只给纯文本，富文本高亮需前端解析或降级 | 服务契约阶段 |
| `ASM-098` | `ConsentRecordList`（`COMP-157`）同一组件经 `mode` 同时服务 `PAGE-063` 披露记录与 `PAGE-064` 全量同意轨迹（融合 `ENT-021/009`，`ASM-046`） | 若两者需严格分列为两个组件，需拆分 | user（沿用 `ASM-046`） |
| `ASM-099` | `PAGE-064` 账户身份卡 / 通知偏好开关组主要由共享组件组合，未新增特有组件；如实现期需独立可测组件再启用 `COMP-158/159` | 若审核要求 PAGE-064 也有命名特有组件，补登记预留段即可 | 前端实现确认 |

## 质量门结果

```text
Gate: 09-frontend-spec-gate（account 模块组件规格分片）
Status: pass（内容自检）— 待交叉审核 + 用户确认
Evidence:
  - 产物：aies/02-design/account/COMPONENTS_SPEC.md（COMP-150~157，COMP-158~169 预留）
  - 上游对照：FRONTEND_SPEC.md(COMP 段分配 COMP-150~169、共享 COMP-001~040 边界、DEC-014 栈、§6 契约字段)、PAGE_SPEC.md(PAGE-060~064 九字段)、UI_RULES.md(UI-001/002/003、组件行为规则、NFR-007)、IA_SPEC.md(IA-009/010/014、权限面、ASM-014)、LIGHT_DOMAIN_MODEL.md(ENT-003/006/007/008/009/013/017/021、INV-03/07/08/11、ContactInfo 生命周期)、BUSINESS_FLOW.md(FLOW-006/007、FLOW-003 状态展示)、ID_REGISTRY.md
  - 设计真源：docs/design/generated/IA-009/010/014-*.html（逐元素引用行号）
Findings:
  - 8 个特有组件（COMP-150~157）均含 metadata + 8 字段契约（purpose/props/events/states/a11y/data/tests）+ 追溯，全部锚定 PAGE-060~064 与 FR/FLOW/ENT/INV。✅
  - 共享组件仅引用 COMP-001~040 不重定义（DashboardOverview 用 StatBlock、子导航/列表/通知/表单/记录均复用共享卡/行/Pill/Tabs/Toggle/ConfirmDialog/EmptyState/Toast/Skeleton）。✅
  - 联系方式默认私密 + public 显式 opt-in 保存确认（INV-03）、撤回只影响未来 + 二次确认（ASM-013）、明文不进埋点（INV-09/NFR-001）在组件层固化。✅
  - 状态非仅颜色（NFR-007）全组件覆盖：未读=图标+圆点+加粗+aria；状态=文字徽；开关=状态文字+aria-checked；hover 撤回按钮键盘可达。✅
  - 未越权扩面：交换状态机不在 MySectionList 改（仅导航出模块至 IA-006）；PAGE-064 未无依据新增特有组件（COMP-158~169 预留）。✅
  - 仅写本文件，未触碰控制/他模块/共享 spec；新增 5 条假设（ASM-095~099）已标注，未改 DEFAULT_ASSUMPTIONS.md。
Decision: 待 spec 交叉审核（COMP-* 登记入 ID_REGISTRY、确认共享组件边界）+ 用户确认 8 字段模板(ASM-095)、NotificationItem 拆分(ASM-096)、ConsentRecordList 融合 mode(ASM-098)，新增假设 ASM-095~099 → 转 passed → 进入 10-mock-data-spec
```
