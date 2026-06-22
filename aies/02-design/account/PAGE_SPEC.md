# 页面规格 · account 集群（个人中心 / 通知 / 设置·联系方式）

## 摘要

本产物把登录后私域集群的三张高保真界面落成可实现的页面契约：个人中心 Dashboard（`IA-009`）、通知中心（`IA-010`）、设置·联系方式（`IA-014`）。每页按模板 9 字段细化，并锚定 `UI_RULES.md` 的令牌与组件（`UI-001/002/003`）、设计真源 `docs/design/generated/IA-009|010|014-*.html`。所有页面追溯到 `FR-060/070/120/130`、`FLOW-006/007`、`ENT-*`、`INV-03`、`DEC-010`、`ASM-014`。本集群的核心隐私约束：**联系方式默认私密，仅在交换进入 `Accepted` 后对该次对方披露，可编辑/撤回（撤回只影响未来，`ASM-013`）；状态不仅靠颜色传达（`NFR-007`）**。

### 产物元数据

- Stage: `08-page-spec`
- Status: `needs-user-confirmation`
- Source inputs: `aies/02-design/IA_SPEC.md`、`aies/02-design/UI_RULES.md`、`aies/01-product/PRODUCT_SPEC.md`、`aies/01-product/LIGHT_DOMAIN_MODEL.md`、`aies/01-product/BUSINESS_FLOW.md`、`aies/00-control/ID_REGISTRY.md`、`docs/design/generated/IA-009-dashboard.html`、`docs/design/generated/IA-010-notifications.html`、`docs/design/generated/IA-014-settings-contact.html`
- 覆盖界面: `IA-009`（个人中心 Dashboard）、`IA-010`（通知中心）、`IA-014`（设置·联系方式）
- PAGE ID 段: `PAGE-060` ~ `PAGE-079`（已用 `PAGE-060`~`PAGE-064`）
- Upstream IDs: `FR-060`、`FR-070`、`FR-120`、`FR-130`、`FR-140`、`NFR-005`、`NFR-006`、`NFR-007`、`FLOW-006`、`FLOW-007`、`FLOW-008`、`ENT-001/003/006/007/008/009/013/017/021`、`INV-03`、`INV-07`、`INV-08`、`INV-11`
- Decision IDs: `DEC-010`（联系方式默认私密、交换接受后披露）、`DEC-011`（轻后端聚合统计）、`DEC-012`（规范设计系统 + Material Symbols Outlined）
- 新增假设: `ASM-043`、`ASM-044`、`ASM-045`、`ASM-046`、`ASM-047`、`ASM-048`（见末尾「新增假设」；**未改 `DEFAULT_ASSUMPTIONS.md`**）
- Manifest status: stage `08-page-spec`（account 模块）= `needs-user-confirmation`

### PAGE 清单与路由

| PAGE ID | 页面 | route（建议） | 覆盖 IA | 主要上游 |
| --- | --- | --- | --- | --- |
| `PAGE-060` | 个人中心 Dashboard（外壳 + 概览 + 子导航容器） | `/me` | `IA-009` | `FR-060`、`FR-070`、`ASM-014`、`ENT-003/007/013` |
| `PAGE-061` | 个人中心·分区视图（我的模块/草稿/收到的交换/发起的交换/收藏） | `/me/:section`（`modules`\|`drafts`\|`received`\|`sent`\|`favorites`） | `IA-009` | `FR-060`、`FR-070`、`ENT-003/006/007/013`、`INV-07` |
| `PAGE-062` | 通知中心 | `/notifications` | `IA-010` | `FR-120`、`FLOW-006`、`ENT-017` |
| `PAGE-063` | 设置·联系方式 | `/settings/contact` | `IA-014` | `FR-130`、`DEC-010`、`ENT-008/009/021`、`INV-03` |
| `PAGE-064` | 设置·隐私与同意 / 账户 / 通知偏好（设置子导航其余分区） | `/settings/:section`（`privacy`\|`account`\|`notifications`） | `IA-014` | `FR-130`、`NFR-005`、`ENT-021`、`FLOW-007` |

> **拆分理由（gate 06「不无依据扩面」对应）**：`IA-009` 因含「子导航 + 多分区列表」两个独立可路由职责，拆为容器（`PAGE-060`）+ 分区视图（`PAGE-061`），与设计 HTML 左侧子导航的 6 项一一对应，未引入新功能。`IA-014` 因左侧设置子导航含「联系方式 / 隐私与同意 / 账户 / 通知偏好」4 项（见 `IA-014-settings-contact.html` line 139-156），核心隐私面（联系方式，`PAGE-063`）单独成页以承载 `FR-130/INV-03` 的全部控件；其余 3 项为设计已存在的导航目标，合并为 `PAGE-064`，仅细化设计已列出的分区，不新增能力。

---

## `PAGE-060` 个人中心 Dashboard（容器 + 概览）

### Artifact metadata

- Stage: `08-page-spec`
- Status: `needs-user-confirmation`
- Upstream IDs: `IA-009`、`FR-060`、`FR-070`、`ASM-014`、`ENT-001/003/007/011/013/017`、`FLOW-007`、`NFR-007`
- Decision IDs: `DEC-012`
- Manifest status: account 模块 `needs-user-confirmation`

### Page purpose

已登录用户的私域主入口与概览面。集中呈现关键 `StatBlock`（我的模块数 / 进行中交换数 / 信任分 / 未读通知数）与欢迎条，并作为左侧竖向子导航（我的模块 | 草稿 | 收到的交换 | 发起的交换 | 收藏 | 设置入口）的外壳容器，右侧渲染当前分区（`PAGE-061`）。对应 `ASM-014`「已登录用户的我的模块/草稿/收到的交换/联系方式设置收敛到一个个人中心 Dashboard」与设计真源 `IA-009-dashboard.html`（欢迎条 line 165-174、StatBlock 行 line 176-214、左侧子导航 line 218-258）。

### Upstream requirement links

- `IA-009`（个人中心 Dashboard，`IA_SPEC.md` line 33；私域面定位 line 53）。
- `FR-060`（用户信任档案：身份、声誉指标、已发布模块、交换历史——此处取「我的」视角的子集：信任分概览 + 我的模块入口）。
- `FR-070`（社交信号与社区操作：收藏分区入口）。
- `ASM-014`（个人中心收敛，`IA_SPEC.md` line 13/33）。
- `ENT-001` User（信任分派生于 `ENT-011` TrustProfile）、`ENT-003` KnowledgeModule（我的模块计数）、`ENT-007` Exchange（进行中交换计数）、`ENT-017` Notification（未读计数）。
- `FLOW-007`（需 GitHub 登录方可进入私域，`IA_SPEC.md` 权限面 line 43）。
- `NFR-007`（无障碍：子导航键盘可达、当前分区 `aria-current`）。

### Route or surface ID

- Route: `/me`（默认重定向到 `/me/modules`，即 `PAGE-061` 的 `modules` 分区）。
- Surface: `AppShell`（`UI-003`）顶栏 + 面包屑（主页 / 个人中心，见 HTML line 167-171）+ 欢迎条 + StatBlock 行 + 两栏（左 `w-64` 子导航 + 右主区插槽）。
- 进入点：`AppShell` 头像/用户名下拉、登录后跳转、通知「查看」深链回跳。

### Data required

- `currentUser`：`{ githubHandle: "@zyongzhu24", displayName, avatarUrl, githubVerified: bool }`（`ENT-001`）。
- `dashboardStats`：`{ myModulesCount: 6, activeExchangesCount: 3, trustScore: 824, unreadNotificationsCount: 5 }`（计数为派生值，`ENT-011/003/007/017`；信任分来自 `ENT-011` TrustProfile，`FR-060`）。
- `subNavBadges`：各子导航项的计数徽标，如「收到的交换」待处理数 `received: 2`（HTML line 237）。
- `welcomeSummary`：动态文案「今天有 N 个待处理的交换请求」（由 `activeExchangesCount`/`received` 派生）。
- 所有计数为**聚合/派生**，不含他人 PII，与 `INV-09` 一致（本页统计仅本人范围）。

### Actions

- 点击左侧子导航项 → 切换 route 至 `/me/:section`（渲染 `PAGE-061`），当前项加 `active-sidebar-item` 样式 + `aria-current="page"`。
- 点击「设置」子导航项 → 跳转 `/settings/contact`（`PAGE-063`）。
- 点击「未读通知」StatBlock → 跳转 `/notifications`（`PAGE-062`）。
- 点击顶栏「提交模块」CTA → 跳转提交向导（`IA-004`，模块外，仅链接）。
- 「需要帮助？」迷你卡「访问文档」外链（HTML line 261-267）→ `IA-013`/外部文档（仅链接）。

### States

- **loading**：StatBlock 与子导航显示 skeleton（4 个数字占位 + 6 行导航占位）。
- **default（已登录）**：完整渲染概览 + 子导航 + 默认分区（modules）。
- **未登录拦截**：未登录访问 `/me` → 重定向到 GitHub 登录（`FLOW-007`、`IA_SPEC.md` 权限面）；非本页内空态。
- **error**：统计加载失败时 StatBlock 区显示内联错误条「概览数据加载失败，重试」+ 重试按钮；子导航与分区仍可用（降级）。
- **未读通知=0**：未读 StatBlock 数字显示 0，去除右上红点（HTML line 207 的 `bg-error` 圆点条件渲染）。

### Validation and error behavior

- 进入校验：`requireAuth`——无有效 GitHub 会话则不渲染私域，跳登录（`NFR-005/006`、`FLOW-007`）。
- 统计为只读派生值，无表单校验。
- 网络错误：统计区局部错误 + 重试，不阻断导航；重试用指数退避，最多提示一次「稍后再试」。
- 计数与分区实际条数若不一致（缓存陈旧），以分区视图实时拉取为准（`PAGE-061` 覆盖）。

### Telemetry or analytics

- 事件：`dashboard_view`、`dashboard_subnav_click{section}`、`dashboard_stat_click{stat}`。
- 仅记录聚合行为，不含联系方式/他人 PII（`FR-140`、`FLOW-008`、`INV-09`）；本人 `githubHandle` 作为会话标识由后端关联，前端埋点不外发明文 PII。
- 对齐 `FLOW-008`（轻后端聚合统计）：dashboard 维度仅贡献「活跃用户」「会话」类聚合口径。

### Acceptance checks

- 已登录进入 `/me` 渲染欢迎条 + 4 个 StatBlock（数字与标签：我的模块/进行中交换/信任分/未读通知）且默认落在 `modules` 分区。
- 左侧子导航 6 项（含设置）键盘 Tab 可达、当前项有 `aria-current` 且视觉高亮（非仅颜色：含加粗 + 浅底）。
- 未读通知>0 时 StatBlock 显示数字 + 红点；点击跳 `/notifications`。
- 未登录访问被拦截并跳转登录。
- 主色命中 `#017A6E`、仅 Material Symbols Outlined 图标、卡片白底 `#E7EAEE` 描边（与 `UI_RULES.md` `UI-001/002/003` 一致）。

---

## `PAGE-061` 个人中心·分区视图

### Artifact metadata

- Stage: `08-page-spec`
- Status: `needs-user-confirmation`
- Upstream IDs: `IA-009`、`FR-060`、`FR-070`、`ENT-003/006/007/013`、`INV-07`、`FLOW-007`、`NFR-007`
- Decision IDs: `DEC-012`
- Manifest status: account 模块 `needs-user-confirmation`

### Page purpose

在 `PAGE-060` 容器右侧主区渲染选中分区的列表内容，共 5 个分区，复用 `ModuleCard`/`ListRow`/`StatusPill`/`EmptyState`（`UI-003`）：
- `modules`（我的模块）：已发布模块网格（`ModuleCard`，HTML line 282-368）。
- `drafts`（草稿）：草稿列表 + 空状态（HTML line 369-383「还没有草稿」引导提交向导）。
- `received`（收到的交换）：他人向我发起、待我处理的交换 `ListRow` + `StatusPill`。
- `sent`（发起的交换）：我发起的交换 `ListRow` + `StatusPill`。
- `favorites`（收藏）：我收藏的模块网格（`FR-070`、`INV-07`）。

### Upstream requirement links

- `IA-009`（私域分区，`IA_SPEC.md` line 33/53；Stitch 提示词 `UI_RULES.md` line 215-216「ModuleCard 网格 或 交换 ListRow + StatusPill」）。
- `FR-060`（我的已发布模块、我的交换历史）、`FR-070`（收藏=社交信号 `ENT-013`，`INV-07` 每 (User, Module) 至多一个有效 favorite）。
- `ENT-003` KnowledgeModule（模块/草稿，状态 `Draft|Published|Updated|Delisted`，`LIGHT_DOMAIN_MODEL.md` line 95）、`ENT-006` Submission（草稿=Submission `Draft` 态）、`ENT-007` Exchange（收到/发起，生命周期状态机 `FLOW-003`）、`ENT-013` SocialSignal（收藏）。
- `FLOW-006`（收到的交换列表是通知驱动后的工作面）。

### Route or surface ID

- Route: `/me/:section`，`section ∈ {modules, drafts, received, sent, favorites}`。
- Surface: `PAGE-060` 右侧 `<section class="flex-grow">`（HTML line 270），含分区标题 + 描述 + 右上「筛选」按钮（HTML line 271-280），下方列表/网格。

### Data required

- 公共：`section`（当前分区）。
- `modules`/`favorites`：`KnowledgeModule[]`，每项 `{ id, title, summary, topics[], visibility: "Public", status, favoriteCount, forkCount, trustLevel }`（`ENT-003/004/020`，HTML 卡片字段 line 287-309）。
- `drafts`：`Submission[]`（`Draft` 态），`{ id, moduleTitle, lastEditedAt, privacyScanStatus? }`（`ENT-006`）。
- `received`/`sent`：`Exchange[]`，`{ id, targetModule, offeredModule?, counterparty: {handle, trustBadge}, state, updatedAt }`（`ENT-007`；`offeredModule` 可空 `INV-05/DEC-009`）。
- 分区计数（与 `PAGE-060` 子导航徽标一致）。

### Actions

- `modules`：每张 `ModuleCard` 的 `more_horiz` 菜单（HTML line 289）→ 编辑 / 查看公开详情（`IA-003`，链接）/ 下架（破坏性，二次确认，`UI_RULES.md` 组件行为规则）。
- `drafts`：继续编辑（进提交向导 `IA-004`）/ 删除草稿（二次确认）；空态 CTA「去提交向导创建」（HTML line 378-381）。
- `received`：每行「查看交换」→ 交换详情（`IA-006`，exchange 模块，链接）；待处理项可直达接受/拒绝入口（决策在 `IA-006`，本页仅导航）。
- `sent`：每行「查看交换」→ `IA-006`。
- `favorites`：取消收藏（`ENT-013`，`INV-07`）；点卡片进 `IA-003`。
- 「筛选」按钮：按状态/主题筛选当前分区（HTML line 276-279）。

### States

- **loading**：列表 skeleton（网格 3 列卡片占位 / 列表行占位）。
- **default**：渲染当前分区内容。
- **empty**（每分区独立 `EmptyState`，`UI-003`，状态非仅颜色，含图标 + 文案 + CTA）：
  - `modules` 空：「还没有已发布模块」→ CTA 去提交向导（`IA-009 → IA-004`，`IA_SPEC.md` line 64）。
  - `drafts` 空：「还没有草稿」（HTML line 376）→ CTA 去提交向导。
  - `received` 空：「暂无收到的交换请求」→ 说明交换如何发起。
  - `sent` 空：「你还没有发起过交换」→ CTA 去发现页（`IA-002`）。
  - `favorites` 空：「还没有收藏」→ CTA 去发现页。
- **error**：分区加载失败显示内联错误 + 重试，不影响左导航。
- **交换状态可视**：`received`/`sent` 行用 `StatusPill` + **文字**呈现 `Requested/Accepted/PrivatePreparing/Delivered/Completed/WaitingForFeedback/Closed/Rejected/Cancelled/Expired/Flagged`（`FLOW-003` 状态机，`LIGHT_DOMAIN_MODEL.md` line 93），色映射见 `UI-001` 语义色，**不仅靠颜色**（`NFR-007`）。

### Validation and error behavior

- 破坏性操作（下架模块、删除草稿、取消收藏）需二次确认对话框（`UI_RULES.md` 组件行为规则）；确认后写 `AuditLog`（`INV-11`，下架/状态变更）。
- 收藏唯一性：取消/添加收藏遵守 `INV-07`（每 (User, Module) 至多一个有效 favorite）；重复收藏前端幂等。
- 非法 `section` 值 → 重定向到 `modules`。
- 交换行不在本页改状态（接受/拒绝在 `IA-006`），避免越权与状态机绕过。

### Telemetry or analytics

- 事件：`me_section_view{section}`、`me_module_action{action}`、`me_exchange_open{exchangeId}`、`me_favorite_toggle{on|off}`、`me_filter_apply{section, filters}`。
- 聚合口径贡献 `FR-140`/`FLOW-008`（如「活跃创建者」「收藏行为量」），无 PII（`INV-09`）。

### Acceptance checks

- 5 个分区均可经子导航切换并正确渲染对应列表/网格或其空状态。
- `modules`/`favorites` 用 `ModuleCard` 网格（桌面 3 列，`UI_RULES.md` 响应式规则）；`received`/`sent` 用 `ListRow` + `StatusPill`（含状态文字）。
- 空分区显示带图标 + 文案 + CTA 的 `EmptyState`，CTA 指向正确目标（提交向导/发现页）。
- 下架/删除/取消收藏均弹二次确认。
- 交换状态文字与色徽一致，键盘可达，状态非仅颜色区分。

---

## `PAGE-062` 通知中心

### Artifact metadata

- Stage: `08-page-spec`
- Status: `needs-user-confirmation`
- Upstream IDs: `IA-010`、`FR-120`、`FLOW-006`、`ENT-017`、`NFR-006`、`NFR-007`
- Decision IDs: `DEC-012`
- Manifest status: account 模块 `needs-user-confirmation`

### Page purpose

已登录用户查看并处理交换/评审/反馈/社区事件通知的单列信息流，驱动各方推进流程。对应 `IA-010` 与设计真源 `IA-010-notifications.html`：页头 + 「全部标记已读」动作（line 153-156）、筛选 Tab（全部/交换/评审/反馈/社区，line 159-165）、通知流（已读/未读两态，line 167-236）、空状态（line 237-242）。每条按类型用 `IconChip` 着色（`UI-003`，Material Symbols Outlined 字形）。

### Upstream requirement links

- `IA-010`（通知中心，`IA_SPEC.md` line 34；Stitch 提示词 `UI_RULES.md` line 228-240）。
- `FR-120`（通知：交换/评审/反馈/社区事件的站内通知；邮件/webhook 延后，`PRODUCT_SPEC.md` line 60）。
- `FLOW-006`（通知与事件闭环，`BUSINESS_FLOW.md` line 38；事件源：交换请求、接受/拒绝、交付状态、反馈到期、评审结果、收到反馈/认可）。
- `ENT-017` Notification（`{ User, 事件类型, 引用, 已读状态 }`，`LIGHT_DOMAIN_MODEL.md` line 63）。
- `NFR-007`（未读状态非仅靠颜色：含图标 + 文字 + 圆点；时间相对 + 绝对 title）。

### Route or surface ID

- Route: `/notifications`（可带查询 `?type=exchange|review|feedback|community`，默认 `all`）。
- Surface: `AppShell` + 单列主区（`max-w-[1280px]`，`UI_RULES.md` 布局原则）：页头（标题 + 「全部标记已读」）、筛选 Tab 行、`space-y-3` 通知流、底部空状态。

### Data required

- `notifications`：`Notification[]`，每项 `{ id, type: "exchange"|"review"|"feedback"|"community", read: bool, title(富文本: 含 @handle / 模块名), refLink, createdAt }`（`ENT-017`）。
- `filter`：当前 Tab（`all|exchange|review|feedback|community`，HTML line 159-165）。
- `unreadCount`：用于顶栏红点（与 `PAGE-060` 未读 StatBlock 一致）。
- 分页游标 `cursor`（加载更多）。
- 类型→IconChip 映射（设计真源）：交换 `swap_horiz`/主色浅底（line 172-173）、评审 `verified_user`/info 浅底（line 191-192）、反馈 `grade`/warning 浅底（line 209-210）、社区 `groups`/紫色浅底（line 224-225）。

### Actions

- 切换筛选 Tab → 过滤当前类型，激活 Tab 加主色下划线 + 加粗（HTML line 160）。
- 点击单条「查看交换/查看」链接 → 跳转引用目标（交换 `IA-006` / 模块详情 `IA-003` / 评审结果 / 信任档案 `IA-007`，均链接外部模块）；同时把该条标记已读。
- 点击未读条本体 → 标记已读（移除主色左条 + 圆点，HTML 脚本 line 261-272）。
- 「全部标记已读」→ 批量置已读，清顶栏红点（HTML line 153-156）。

### States

- **loading**：通知流 skeleton（4-6 行占位）。
- **default**：混合已读/未读列表。
  - **未读**：左侧主色竖条（`bg-[#017A6E]` line 170）+ 右侧主色圆点（line 183）+ 主文本正常色；**未读语义同时由图标存在、圆点、加粗主文本传达，非仅颜色**（`NFR-007`，HTML line 238 提示「未读状态非仅靠颜色」）。
  - **已读**：`opacity-80`、文本转 `on-surface-variant`、无左条无圆点（HTML line 207/222）。
- **empty**：`notifications_off` 图标 + 「暂无通知」+ 「交换/评审/反馈事件会在此提醒」（HTML line 237-242，`IA_SPEC.md` line 66）；按筛选 Tab 的空也复用此态并说明「该分类下暂无通知」。
- **加载更多 / 分页**：列表底部「加载更多」按钮或滚动加载（`UI_RULES.md` line 235「分页/加载更多」），加载中显示行级 spinner。
- **error**：加载失败显示内联错误条 + 重试。
- **标记已读进行中**：乐观更新（先视觉置已读），失败回滚 + toast 提示。

### Validation and error behavior

- 「全部标记已读」乐观更新；后端失败则回滚并提示「标记失败，请重试」。
- 单条标记已读幂等（重复点击不报错）。
- 通知操作受抗滥用约束（速率限制，`NFR-006`）；批量标记限频。
- 引用目标已失效（如交换被删/模块下架）→ 链接禁用并标注「该内容已不可用」，不跳 404。

### Telemetry or analytics

- 事件：`notifications_view`、`notifications_filter{type}`、`notification_open{type, notificationId}`、`notifications_mark_all_read`、`notification_mark_read{type}`、`notifications_load_more`。
- 聚合贡献 `FR-140`/`FLOW-008`（如「通知打开率」按类型聚合），不含 PII（`INV-09`）；通知正文中的 @handle / 模块名不进埋点明文。

### Acceptance checks

- 渲染页头 + 「全部标记已读」+ 5 个筛选 Tab + 通知流；默认 Tab「全部」高亮。
- 4 类通知各用对应 `IconChip`（仅 Material Symbols Outlined 字形）与语义浅底；未读有左条 + 圆点 + 加粗，已读降透明度。
- 切换 Tab 仅显示该类型；空分类显示空状态文案。
- 点未读条/「查看」→ 标记已读且跳转正确目标；「全部标记已读」清空未读与红点。
- 未读/已读区分不仅靠颜色（含图标/圆点/文字/透明度），键盘可达，时间含相对 + 绝对 title（`NFR-007`）。

---

## `PAGE-063` 设置·联系方式

### Artifact metadata

- Stage: `08-page-spec`
- Status: `needs-user-confirmation`
- Upstream IDs: `IA-014`、`FR-130`、`DEC-010`、`NFR-005`、`NFR-006`、`NFR-007`、`ENT-008/009/021`、`INV-03`、`INV-08`、`INV-11`、`ASM-013`、`FLOW-007`
- Decision IDs: `DEC-010`、`DEC-012`
- Manifest status: account 模块 `needs-user-confirmation`

### Page purpose

本人管理联系方式与可见性、查看同意（披露）记录的核心隐私面。承载 `FR-130`/`DEC-010`/`INV-03` 的全部控件：多通道联系方式（GitHub/邮箱/自定义如 Telegram）、每项默认私密 + 「设为公开」开关、披露策略 Callout、同意记录列表（可撤回，撤回只影响未来 `ASM-013`）、保存/取消 + 成功 toast。对应设计真源 `IA-014-settings-contact.html`：设置子导航（line 139-156）、披露策略 Callout（line 160-166）、联系渠道卡（line 167-243）、同意记录（line 244-278）、全局操作 + toast（line 279-308）。

### Upstream requirement links

- `IA-014`（设置·联系方式，`IA_SPEC.md` line 38；权限面 line 45「仅本人；默认私密」）。
- `FR-130`（联系方式与私下连接：绑定时收集、默认完全私密、仅交换接受后对该次对方披露、可选披露哪些、可编辑/撤回、可单独将某 handle 设为公开，`PRODUCT_SPEC.md` line 61/66）。
- `DEC-010`（联系方式默认私密、交换接受后披露）。
- `ENT-008` ContactInfo（`{ User, 方式类型, 值, 可见性: private|exchange-revealed|public, 可编辑/撤回 }`，生命周期 `Private(默认) → 交换接受生成 ContactDisclosure 快照；可改 Public 或 Revoked`，`LIGHT_DOMAIN_MODEL.md` line 24/96）。
- `ENT-009` ContactDisclosure（披露快照，`{ Exchange, 披露方/接收方, ContactInfo 快照, 时间 }`，line 43）= 同意记录列表数据源之一。
- `ENT-021` Consent（同意记录，`{ User, 动作类型, 时间, 范围 }`，line 66）。
- `INV-03`（默认私密；仅 `Accepted` 后对该次对方披露；公开须显式 opt-in，`LIGHT_DOMAIN_MODEL.md` line 105）。
- `INV-08`（联系/披露前必须存在 Consent 记录）、`INV-11`（披露/状态变更写 AuditLog）。
- `ASM-013`（撤回只影响未来披露，已披露快照不可收回）。
- `NFR-005`（人类同意门）、`NFR-006`（抗滥用：编辑联系方式受身份核查/速率限制/审计）、`NFR-007`（开关有状态文字、危险项有清晰说明）。

### Route or surface ID

- Route: `/settings/contact`（`/settings` 默认重定向到此）。
- Surface: `AppShell` + 两栏（左设置子导航 `w-64`：联系方式/隐私与同意/账户/通知偏好，HTML line 139-156；右主区 `max-w-[800px]`）。右主区自上而下：披露策略 Callout、主要联系渠道卡、同意记录区、底部「取消/保存设置」+ 成功 toast。

### Data required

- `contactMethods`：`ContactInfo[]`，每项 `{ id, type: "github"|"email"|"custom", label, value(可脱敏展示如 `z****@example.com` HTML line 208), visibility: "private"|"public", isSet: bool, icon }`（`ENT-008`）。默认渠道：GitHub（line 173-196）、邮箱（line 197-220）；自定义渠道（如 Telegram）可「立即关联」（未设态 line 221-241）。
- `disclosurePolicyText`：固定文案（HTML line 163-165）。
- `consentRecords`：`(Consent | ContactDisclosure)[]`，每项 `{ id, counterpartyHandle, disclosedMethods: ["GitHub","邮箱"], date, exchangeRef: "EX-2024-8842", source: "因交换自动授权", revocable: bool }`（`ENT-021`/`ENT-009`，HTML line 250-277）。
- `currentUser`（须为本人，`IA-014` 权限：仅本人）。

### Actions

- **「设为公开」开关**（每渠道，HTML line 191/215）：private ↔ public 切换。切到 public 是显式 opt-in（`INV-03`「公开须用户显式 opt-in」），需在保存时确认；默认态恒为 private。
- **编辑联系方式值**：编辑 GitHub/邮箱/自定义的 value（`FR-130` 可编辑）。
- **关联自定义渠道**：「立即关联」（HTML line 236-239）打开输入（类型 + 值），新增一条 `ContactInfo`（默认 private）。
- **撤回同意记录**：每条记录 hover 出现 `cancel` 按钮（HTML line 260/273）→ 撤回该披露；**二次确认 + 明确文案「撤回只影响未来披露，已披露给对方的快照无法收回」**（`ASM-013`、破坏性操作二次确认）。
- **保存设置**：校验后写入，触发成功 toast「设置已保存」（HTML line 300-308 `showToast()`）；写 `Consent` + `AuditLog`（`INV-08/11`）。
- **取消**：放弃未保存改动（有脏改动时二次确认）。

### States

- **loading**：渠道卡 + 同意记录 skeleton。
- **default**：默认私密态——GitHub/邮箱均 `Private` 徽（HTML line 182/206）+「（私密）」文字（line 188/212）+ 开关默认关（指向 private）。自定义渠道未设时显 `Not Set` 徽（line 230）+「立即关联」。
- **开关=public**：渠道徽变「Public」、文案变「（公开）」；保存前为待确认态。
- **同意记录空**：`EmptyState`「暂无披露记录」+ 说明「联系方式仅在交换被接受后才会披露」（`IA-014` 无对应空态时新增，呼应 `INV-03`）。
- **dirty（有未保存改动）**：「保存设置」启用 + 离开页面提示。
- **saving**：「保存设置」按钮 loading 态、禁用重复提交。
- **success**：底部居中成功 toast 3 秒（HTML line 301-319）。
- **error**：校验错误内联红字于对应字段；保存失败 toast「保存失败，请重试」。
- **撤回确认中 / 撤回完成**：记录行进入「已撤回（仅未来生效）」标注。

### Validation and error behavior

- **邮箱**：格式校验（`name@domain`），错误内联提示；展示时脱敏（`z****@example.com`）。
- **GitHub handle**：格式 `@handle`，与登录身份一致性校验（`DEC-006`，不可冒用他人 handle）。
- **自定义渠道**：类型必选 + 值非空；URL/handle 基本格式校验。
- **默认私密强约束**：任何新增/编辑渠道默认 `private`；切 public 必须显式开关 + 保存确认（`INV-03`），不存在「静默公开」路径。
- **撤回语义**：撤回仅对未来披露生效，UI 必须显式声明已披露快照不可收回（`ASM-013`）；执行后写 `AuditLog`（`INV-11`）。
- **同意前置**：联系方式被披露的前提是对应交换已 `Accepted` 并有 `Consent`（`INV-08`）；本页只管理「我愿意披露什么」，实际披露发生在交换接受时（`FLOW-003`/`IA-006`），本页不绕过该门。
- **抗滥用**：编辑/关联受速率限制与身份核查（`NFR-006`），改动写审计（`INV-11`）。
- 权限：非本人不可访问（仅本人，`IA-014`）。

### Telemetry or analytics

- 事件：`settings_contact_view`、`contact_visibility_toggle{channel, to: public|private}`、`contact_method_edit{channel}`、`contact_method_add{channel}`、`consent_revoke{exchangeRef}`、`settings_contact_save`。
- **严禁记录联系方式明文**（邮箱/handle 值、自定义渠道值均不进埋点，`NFR-001`/`INV-09`）；仅记录通道类型与动作的聚合，对齐 `FR-140`/`FLOW-008`。
- 可见性切换为隐私敏感事件，仅记「发生了一次切换 + 目标态」，不记具体值。

### Acceptance checks

- 顶部固定显示披露策略 Callout（默认私密 + 仅交换接受后对该次对方披露 + 可选/可编辑/可撤回，文案与 HTML line 163-165 一致）。
- GitHub/邮箱默认渲染 `Private` 徽 + 「（私密）」+ 开关默认关；切「设为公开」改为 public 且保存需确认（`INV-03`）。
- 邮箱以脱敏形式展示（`z****@example.com`）；非法邮箱/handle 内联报错阻止保存。
- 同意记录列表显示对方 handle + 披露的方式 + 日期 + 交换引用；撤回按钮弹二次确认并显式说明「只影响未来、已披露快照不可收回」（`ASM-013`）。
- 保存成功弹「设置已保存」toast；保存写 `Consent`/`AuditLog`（`INV-08/11`）。
- 状态（私密/公开/未设）非仅靠颜色（含 `Private/Public/Not Set` 文字徽 + 开关状态文字 + 「（私密）」副文，`NFR-007`）；表单 label 关联、键盘可达。
- 主色 `#017A6E`、仅 Material Symbols Outlined 图标、卡片描边一致（`UI-001/002/003`）。

---

## `PAGE-064` 设置·隐私与同意 / 账户 / 通知偏好

### Artifact metadata

- Stage: `08-page-spec`
- Status: `needs-user-confirmation`
- Upstream IDs: `IA-014`、`FR-130`、`FR-120`、`NFR-005`、`NFR-006`、`NFR-007`、`ENT-021`、`FLOW-007`、`INV-11`
- Decision IDs: `DEC-010`、`DEC-012`
- Manifest status: account 模块 `needs-user-confirmation`

### Page purpose

设置左侧子导航除「联系方式」外的其余 3 个分区，均为设计真源 `IA-014-settings-contact.html` 已列出的导航目标（line 144「隐私与同意」、line 148「账户」、line 152「通知偏好」），在此细化为最小可实现内容，不新增能力：
- `privacy`（隐私与同意）：集中查看跨边界动作的 `Consent` 记录（生成/提交/联系/交换），可读 + 可撤回（与 `PAGE-063` 同意记录互补，此处为全量同意轨迹视图）。
- `account`（账户）：GitHub 身份信息（只读，`DEC-006`）、GitHub Verified 状态、退出登录。
- `notifications`（通知偏好）：按通知类型（交换/评审/反馈/社区）开关站内通知接收偏好（`FR-120`；邮件/webhook 延后故此处仅站内）。

### Upstream requirement links

- `IA-014`（设置子导航 4 项，`IA-014-settings-contact.html` line 139-156；`IA_SPEC.md` line 38）。
- `privacy`：`FR-130`/`NFR-005`/`ENT-021` Consent（跨边界动作同意证明，`FLOW-007`）、`INV-08`/`INV-11`。
- `account`：`FR-001`/`DEC-006`（GitHub 规范身份）、`ENT-001` User。
- `notifications`（偏好）：`FR-120`（站内通知；邮件/webhook 延后，`PRODUCT_SPEC.md` line 60）、`ENT-017`。
- `NFR-006`（账户/会话操作抗滥用）、`NFR-007`（开关有状态文字、键盘可达）。

### Route or surface ID

- Route: `/settings/:section`，`section ∈ {privacy, account, notifications}`。
- Surface: 同 `PAGE-063` 的两栏布局；左设置子导航当前项高亮 + `aria-current`，右主区渲染对应分区。

### Data required

- `privacy`：`Consent[]`（全量，`{ id, actionType: "generate"|"submit"|"contact"|"exchange", scope, date, exchangeRef?, revocable }`，`ENT-021`）。
- `account`：`{ githubHandle, githubVerified, joinedAt, displayName, avatarUrl }`（`ENT-001`，只读身份；`DEC-006`）。
- `notificationPrefs`：`{ exchange: bool, review: bool, feedback: bool, community: bool }`（站内通知按类型开关，`FR-120`/`ENT-017`）。

### Actions

- `privacy`：撤回某条同意（破坏性，二次确认 + 说明仅影响未来，`ASM-013`/`INV-08`）；查看动作详情。
- `account`：退出登录（二次确认）；「重新校验 GitHub 身份」链接到 GitHub OAuth（`DEC-006`）。账户身份字段只读（不在平台改 GitHub handle）。
- `notifications`：切换各类型通知开关；保存偏好 + 成功 toast（复用 `PAGE-063` toast 模式）。

### States

- **loading / default / error**：同其余设置页模式。
- `privacy` 空：`EmptyState`「暂无同意记录」+ 说明同意在跨边界动作时产生（`FLOW-007`）。
- `account`：`githubVerified=true` 显示成功色 Verified 徽（`StatusPill`，`UI-001` success + 文字）；未验证显示提示 + 校验入口。
- `notifications`：各开关默认开（站内通知默认接收）；dirty/saving/success 同 `PAGE-063`。
- 非法 `section` → 重定向 `privacy`。

### Validation and error behavior

- 撤回同意：二次确认 + 「只影响未来」声明（`ASM-013`），写 `AuditLog`（`INV-11`）。
- 退出登录：二次确认；清会话。
- 通知偏好保存幂等；失败回滚 + toast。
- 账户身份只读，不提供改 GitHub handle 路径（避免冒用，`NFR-006`/`DEC-006`）。
- 权限：仅本人（`IA-014`）。

### Telemetry or analytics

- 事件：`settings_section_view{section}`、`consent_revoke{actionType}`、`account_signout`、`notification_pref_toggle{type, on|off}`、`settings_prefs_save`。
- 不记 PII 明文（`INV-09`/`NFR-001`）；贡献 `FR-140`/`FLOW-008` 聚合口径（如「通知偏好分布」）。

### Acceptance checks

- 设置子导航 4 项均可切换（联系方式=`PAGE-063`，其余 3 项=本页），当前项 `aria-current` + 高亮。
- `privacy` 列出全量 `Consent`，撤回弹二次确认 + 「只影响未来」说明，写审计。
- `account` 显示 GitHub 身份 + Verified 状态（成功色 + 文字），退出登录二次确认；身份字段只读。
- `notifications` 4 类开关可切换并保存（成功 toast）；默认开。
- 状态非仅靠颜色，键盘可达，开关有状态文字（`NFR-007`）。

---

## 集群级追溯小结

| PAGE | IA | FR | FLOW | ENT | INV / DEC / ASM |
| --- | --- | --- | --- | --- | --- |
| `PAGE-060` | `IA-009` | `FR-060`、`FR-070` | `FLOW-007` | `ENT-001/003/007/011/013/017` | `ASM-014`、`DEC-012` |
| `PAGE-061` | `IA-009` | `FR-060`、`FR-070` | `FLOW-003`（展示）、`FLOW-006` | `ENT-003/006/007/013` | `INV-05/07`、`DEC-009`、`ASM-014` |
| `PAGE-062` | `IA-010` | `FR-120` | `FLOW-006` | `ENT-017` | `NFR-006/007`、`DEC-012` |
| `PAGE-063` | `IA-014` | `FR-130` | `FLOW-007`、`FLOW-003`（披露发生处） | `ENT-008/009/021` | `INV-03/08/11`、`DEC-010`、`ASM-013` |
| `PAGE-064` | `IA-014` | `FR-130`、`FR-120`、`FR-001` | `FLOW-007` | `ENT-001/017/021` | `INV-08/11`、`DEC-010/006`、`ASM-013` |

- Telemetry 全集群对齐 `FR-140`/`FLOW-008`：仅聚合、无 PII（`INV-09`、`NFR-001`）；联系方式明文与他人 handle 不进埋点。
- 无障碍底线 `NFR-007` 全集群执行：状态非仅靠颜色（文字徽 + 图标 + 透明度 + 圆点）、键盘可达、`aria-current`、表单 label 关联、时间相对 + 绝对 title。
- 组件全部锚定 `UI-003`（`StatBlock`/`ModuleCard`/`ListRow`/`StatusPill`/`IconChip`/`EmptyState`/`AppShell`），图标仅 Material Symbols Outlined（`UI-002`/`DEC-012`），令牌 `UI-001`。

## 新增假设（本阶段提出，未改 `DEFAULT_ASSUMPTIONS.md`）

| ID | 假设 | 若有误的风险 | 确认负责人 |
| --- | --- | --- | --- |
| `ASM-043` | 个人中心分区路由为 `/me/:section`（modules/drafts/received/sent/favorites），`IA-009` 的子导航对应可路由分区 | 若产品希望单页 Tab 切换而非路由，导航与深链模型需调整 | user |
| `ASM-044` | 「草稿」= `Submission` 的 `Draft` 态（`ENT-006`），与「我的模块」（`ENT-003` Published）分列两分区 | 若草稿建模为模块的 Draft 态而非 Submission，分区数据源需改 | user |
| `ASM-045` | 通知支持分页/加载更多与按类型筛选；未读为乐观更新 | 若通知量小到无需分页或要求强一致已读，交互简化 | agent（服务契约阶段） |
| `ASM-046` | 设置·联系方式页的「同意记录」数据源融合 `ENT-021` Consent 与 `ENT-009` ContactDisclosure（披露=一次 contact 同意） | 若两者需严格分列展示，列表需拆分两区 | user |
| `ASM-047` | 设置子导航的「隐私与同意/账户/通知偏好」3 分区按设计已列项细化为最小内容（`PAGE-064`），不新增超出 `FR-120/130/001` 的能力 | 若用户要求更丰富的账户/隐私设置，需在产品规格扩面后再细化 | user |
| `ASM-048` | 通知偏好仅控制站内通知（`FR-120`；邮件/webhook 延后），默认全开 | 若需邮件/webhook 偏好，超出当前 `FR-120` 范围 | user |

## 质量门结果

```text
Gate: 06-page-spec-gate
Status: pass（内容自检）— 待用户确认
Evidence:
  - 产物：aies/02-design/account/PAGE_SPEC.md
  - 上游对照：IA_SPEC.md(IA-009/010/014、权限面、ASM-014)、UI_RULES.md(UI-001/002/003、组件行为规则、NFR-007 无障碍底线)、PRODUCT_SPEC.md(FR-060/070/120/130/140)、LIGHT_DOMAIN_MODEL.md(ENT-001/003/006/007/008/009/013/017/021、INV-03/05/07/08/09/11、ContactInfo 生命周期)、BUSINESS_FLOW.md(FLOW-006/007/008、FLOW-003 状态机)、ID_REGISTRY.md
  - 设计真源：docs/design/generated/IA-009-dashboard.html、IA-010-notifications.html、IA-014-settings-contact.html（逐元素引用行号）
Findings:
  - 5 个 PAGE（PAGE-060~064）均含 purpose/data/actions/states/validation/telemetry/acceptance 9 字段，全部追溯到 IA-009/010/014 与 FR/FLOW/ENT/INV。✅
  - 联系方式默认私密、仅 Accepted 后对该次对方披露、可编辑/撤回（撤回只影响未来 ASM-013）已在 PAGE-063 强约束（INV-03/08/11、DEC-010）。✅
  - 未读/已读、空状态、加载、错误在通知中心与各页全覆盖；状态非仅靠颜色（NFR-007）。✅
  - Telemetry 全集群对齐 FR-140/FLOW-008 聚合无 PII（INV-09/NFR-001）；联系方式明文不进埋点。✅
  - IA-009 拆容器+分区、IA-014 拆联系方式+其余分区，均对应设计已存在的子导航项，未无依据扩面（gate 06 第 3 条）。✅
  - 新增 6 条假设（ASM-043~048）已标注，未改 DEFAULT_ASSUMPTIONS.md。
Decision: 待用户确认分区路由模型(ASM-043)、草稿建模(ASM-044)、同意记录数据源融合(ASM-046)、设置其余分区范围(ASM-047/048) → 转 passed → 进入下游（组件规格/模拟数据）
```
