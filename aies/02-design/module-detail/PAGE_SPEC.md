# 页面规格 · 知识模块详情（module-detail）

## 产物元数据

- Stage: `08-page-spec`
- Status: `needs-user-confirmation`
- 模块: `module-detail`（覆盖界面 `IA-003` 知识模块详情）
- 设计真源: `docs/design/know-share-module-detail.png`（最高风格基线 `docs/design/know-share-website-style-v1.png`）
- Upstream IDs（产物级汇总）:
  - IA: `IA-003`（决策面，信息密度最高）；外壳 `IA-001`；交换详情下游 `IA-006`；档案 `IA-007`
  - FR: `FR-020`（知识模块详情）、`FR-001`（站点外壳/搜索/登录）、`FR-040`（交换请求入口）、`FR-130`（联系方式入口仅占位/不在本页披露）、`FR-070`（收藏/认可/举报）、`FR-050`/`FR-060`（信任信号、贡献者档案链接）、`FR-090`（隐私边界/内容承诺/举报与下架路径）、`FR-140`（聚合 telemetry）、`FR-110`（详情数据来自零私有泄露 API）
  - NFR: `NFR-001`（数据最小化）、`NFR-002`（agent 可读）、`NFR-003`（可追溯）、`NFR-004`（开源可审计）、`NFR-005`（同意门）、`NFR-006`（抗滥用：举报需身份核查+速率限制）、`NFR-007`（无障碍）
  - FLOW: `FLOW-002`（发现与评估，本页是其终点决策面）、`FLOW-003`（交换请求生命周期入口）、`FLOW-007`（身份与同意）、`FLOW-008`（聚合统计）、`FLOW-006`（举报/收藏触发通知）
  - ENT: `ENT-003` KnowledgeModule、`ENT-004` Manifest、`ENT-005` PrivacyScan（仅展示分级摘要）、`ENT-011` TrustProfile、`ENT-001` User（owner）、`ENT-020` Topic/Tag、`ENT-013` SocialSignal、`ENT-014` Report、`ENT-007` Exchange（创建入口）、`ENT-012` Badge
  - UI: 令牌 `UI-001`、图标族 `UI-002`（Material Symbols Outlined）、组件 `UI-003`（`ModuleCard`/`StatusPill`/`DonutChart`/`IconChip`/`StatBlock`/`AppShell`/`Card`/`PrimaryButton`/`SecondaryButton`/`TrustBadge`/`EmptyState`）
- Decision IDs: `DEC-006`（GitHub 规范身份/Verified）、`DEC-009`（交换互惠可选/单向请求）、`DEC-010`（联系方式默认私密、仅交换接受后披露）、`DEC-011`（轻后端聚合统计）、`DEC-012`（规范设计系统/Material Symbols Outlined）
- 不变量约束: `INV-01`（不托管原始内容）、`INV-02`（block 级不得发布——本页只展示已发布且 pass/warn 的模块）、`INV-03`（联系方式仅 Accepted 后披露，本页不披露）、`INV-04`（公开面/详情数据零私有内容与私有 URL）、`INV-08`（发起交换前写 Consent）、`INV-10`（参与方反馈权重高于社交信号）、`INV-11`（举报写 AuditLog）
- 新增假设（本模块，未改 `DEFAULT_ASSUMPTIONS.md`）: `ASM-021`、`ASM-022`、`ASM-023`、`ASM-024`、`ASM-025`（见文末「新增假设」）
- Manifest status: `pending`（待用户确认本模块页面规格后转 `passed`）

---

## 页面清单（PAGE-010 ~ PAGE-019）

| PAGE ID | 页面/区 | route / surface | 关系 | 主要 IA/FR/FLOW/ENT |
| --- | --- | --- | --- | --- |
| `PAGE-010` | 知识模块详情（容器/概览） | `/modules/:moduleId` | 顶层页面 | `IA-003` · `FR-020` · `FLOW-002` · `ENT-003/004/011` |
| `PAGE-011` | 来源统计与覆盖度区（Source Stats） | `/modules/:moduleId#stats`（页内区） | `PAGE-010` 子区 | `IA-003` · `FR-020` · `ENT-004` · `FR-140` |
| `PAGE-012` | 隐私边界与内容承诺区（Privacy Boundary） | `/modules/:moduleId#privacy`（页内区） | `PAGE-010` 子区 | `IA-003` · `FR-090` · `ENT-005/004` · `INV-01/04` |
| `PAGE-013` | 清单/Manifest 预览（脱敏 JSON） | `/modules/:moduleId#manifest`（页内区） | `PAGE-010` 子区 | `IA-003` · `FR-020` · `NFR-002` · `ENT-004` · `INV-04` |
| `PAGE-014` | 信任信号与贡献者侧栏（Trust & Owner） | `/modules/:moduleId`（右侧栏） | `PAGE-010` 子区 | `IA-003` · `FR-050/060` · `ENT-011/001/012` · `DEC-006` |
| `PAGE-015` | 「请求交换」入口（Exchange CTA） | `/modules/:moduleId` → `/exchanges/new?target=:moduleId` | `PAGE-010` 动作入口 | `IA-003→IA-006` · `FR-040` · `FLOW-003` · `ENT-007` · `DEC-009` |

> 拆分理由（gate 06 Hard-Limit Policy）：本页是 IA 明确的"信息密度最高的决策面"，单页承载来源统计 / 隐私边界 / Manifest 预览 / 信任侧栏 / 交换 CTA 五类异质信息。为让下游组件规格、模拟数据与测试能按区独立追溯，按 IA_RULES 的"概览/清单预览/来源统计"建议把高密度区拆为 `PAGE-011~015` 子区；它们同属一个 route（`PAGE-010`），不是独立可导航页面，因此不违反"无法追溯的新界面"约束。`PAGE-016~019` 暂未使用，保留给本模块后续扩展（如 Manifest 版本 diff 视图，属领域模型登记的扩展面，非本阶段范围）。

---

## PAGE-010 · 知识模块详情（容器 / 概览）

### Page purpose
- 消费方 agent / 人类在此对单个 `ENT-003` KnowledgeModule 做出「是否请求交换」的判断——这是 `FLOW-002`（发现与评估）的终点决策面，也是 `FLOW-003`（交换请求生命周期）的入口（`IA_SPEC` 内容层级：决策面 = `IA-003`）。
- 设计真源 `know-share-module-detail.png`：示例模块「Agent 记忆系统设计模式」，owner `@knowledge-trader`（GitHub Verified），主题标签、脱敏摘要、来源统计、脱敏 Manifest 预览、右侧贡献者+信任+「请求交换」CTA。
- 页面只展示 `ENT-004` Manifest 的脱敏字段，绝不展示原始知识内容（`INV-01`/`INV-04`、`NFR-001`）。

### Upstream requirement links
- `IA-003`（`FR-020`/`CAP-003`）、`FR-001`（外壳/搜索/登录态）、`FLOW-002`/`FLOW-003`、`ENT-003`/`ENT-004`/`ENT-011`、`NFR-001`/`NFR-003`/`NFR-007`、`INV-01`/`INV-04`、`UI-001/002/003`。

### Route or surface ID
- Route: `/modules/:moduleId`（`moduleId` = `ENT-004.id`，如 `agent-memory-design-patterns`）。匿名可访问（`IA_SPEC` 权限表：模块详情公开部分匿名可看，`INV-04`/`FR-001`）。
- 进入点：发现页 `IA-002` 卡片、全局搜索、信任档案 `IA-007` 的「已发布模块」、深链接、`IA-012` API（agent）。
- 布局（`UI_RULES` 桌面优先，`1280px` 居中两栏）：`AppShell` 顶栏；主区左 ~2/3 = 模块头（标题/Verified/owner/主题标签/操作行）+ 脱敏摘要（`PAGE-010`）+ 来源统计区（`PAGE-011`）+ Manifest 预览（`PAGE-013`）；左下含隐私边界区（`PAGE-012`）；右 ~1/3 侧栏 = 贡献者+信任+「请求交换」CTA（`PAGE-014`/`PAGE-015`）。`<768px` 转单列（`ASM-016`，移动断点细节本模块登记为 `ASM-025`）。

### Data required
- 模块头：`ENT-003`{ `moduleId`、`title`、`status`(=Published；Draft/Delisted 见状态)、`type`、`updated_at`、派生 `trustLevel`、派生计数 `exchangeCount`/`favoriteCount`/`feedbackCount`/`viewCount` }。
- `ENT-004` Manifest 脱敏字段（来自 `examples/knowledge-module.manifest.json`）：`summary`（脱敏摘要）、`topics`/`tags`（→ `ENT-020`，主题标签 chips）、`language`、`covered_questions`、`source_types`、`freshness`、`sensitivity`、`redaction_notes`、`exchange_intent`、`license`、`updated_at`、`version`。
- owner：`ENT-001`{ `owner_handle`、`githubVerified`、`avatar`、派生 `creditScore`、`badges`(`ENT-012`) } —— 用于侧栏与档案链接（`PAGE-014`）。
- `ENT-011` TrustProfile（派生）：模块 `trustLevel` + 形成解释（`INV-10`：参与方反馈权重高于社交信号）。
- `ENT-005` PrivacyScan：仅取**分级摘要**（pass/warn 与 `redaction_notes`/`sensitivity`），不取原始发现明细（`PAGE-012`，`INV-01`）。
- 数据来源：`IA-012` 公开读 API（如 `GET /api/modules/:id`，`FR-110`），输出零私有内容（`INV-04`）。当前实现阶段用 `MOCK_DATA_SPEC`（下游 10 阶段）填充；本规格仅声明形状。
- 登录态/角色：是否登录决定「请求交换」「收藏/认可/举报」可用性（`FLOW-007`）。

### Actions
- **请求交换（主 CTA）** → 见 `PAGE-015`（`FR-040`/`FLOW-003`）。
- 收藏 / 取消收藏（`ENT-013` SocialSignal，`FR-070`；唯一性 `INV-07`）。
- 认可 / Endorse（`ENT-013`，`FR-070`）。
- 举报模块（`ENT-014` Report，`FR-070`/`FR-090`/`FLOW-005`；写 `AuditLog` `INV-11`，受速率限制 `NFR-006`）。
- 查看贡献者档案 → 跳 `IA-007`（`FR-060`）。
- 复制 Manifest JSON / 复制深链接（`PAGE-013`）。
- 点击主题标签 → 回发现页带筛选（`IA-002`，`FR-010`）。

### States
- **加载**：骨架屏（模块头 + 统计 + Manifest 占位），不闪烁原始内容。
- **就绪（Published）**：完整渲染（设计真源默认态）。
- **空/缺字段**：Manifest 某可选字段缺失（如无 `license`）则隐藏该行而非显示空值；无收藏/反馈时计数显 `0`。
- **无权限/未登录**：页面公开可读；交换/收藏/认可/举报按钮显示但点击触发登录引导（GitHub 登录，`FLOW-007`/`DEC-006`）。
- **下架/移除（Delisted/Removed，`ENT-003` 生命周期）**：显示「该模块已下架」占位 + 不渲染 Manifest/CTA（`FR-090` 下架路径）。
- **草稿（Draft）**：仅 owner 本人可见预览态，标注「草稿·未公开」，无公开操作。
- **错误**：模块不存在（404 占位 + 返回发现页）、加载失败（重试 `EmptyState`）。

### Validation and error behavior
- `moduleId` 不存在 → 404 态（`EmptyState` + 「返回发现」CTA）。
- API 返回任何疑似私有字段（私有 URL/路径/邮箱）→ **前端不渲染**该字段并按 `INV-04` 视为契约违例（下游 `FR-110` 输出检查兜底）。
- 操作类按钮在未登录时不静默失败：弹登录引导（`NFR-005` 同意/身份前置）。
- 举报、收藏受速率限制：超限时禁用并提示（`NFR-006`）。

### Telemetry or analytics
- 仅聚合、无 PII（`FR-140`/`FLOW-008`/`INV-09`/`NFR-001`）。事件：`module_detail_view`（计入 `viewCount`/`ENT-019`）、`module_manifest_previewed`、`exchange_cta_clicked`、`favorite_toggled`、`report_submitted`（聚合计数）。不记录浏览者身份明细，不上报 Manifest 内容。

### Acceptance checks
- 页面仅靠 `ENT-004` 脱敏字段即可让用户判断「是否请求交换」，全程不出现原始知识内容或私有 URL（`FR-020`/`INV-01/04`）。
- 未登录可读全部公开信息；交换/社交操作触发登录引导而非报错（`FLOW-007`）。
- 主色 `#017A6E`、仅 Material Symbols Outlined 图标、卡片 `12px` 圆角 + `#E7EAEE` 描边、键盘可达、状态非仅靠颜色（`UI-001/002`、`NFR-007`）。
- 同屏唯一主 CTA = 「请求交换」（`UI_RULES` 组件行为规则）。

---

## PAGE-011 · 来源统计与覆盖度区（Source Stats）

### Page purpose
- 展示模块的「来源构成 + 覆盖度 + 活跃信号」，让消费方在不看原始内容时估算价值密度。对应设计图中部的 `DonutChart` + 四个 `StatBlock`（图中示例数字 `23 / 12 / 8 / 18.7k`）。

### Upstream requirement links
- `IA-003`/`FR-020`、`ENT-004`（`source_types`/`covered_questions`/`freshness`）、`ENT-003`（派生计数）、`FR-140`（聚合计数）、`UI-003`（`DonutChart`/`StatBlock`/`IconChip`）。

### Route or surface ID
- 页内区 `#stats`，位于摘要下方主区（`PAGE-010` 左栏）。

### Data required
- `DonutChart`：`source_types` 分布（如 personal notes / project notes / public articles，主色 + 语义色分段，`UI-003`）。
- `StatBlock` × 4（映射设计图四数字，登记为 `ASM-022` 的标签约定）：覆盖问题数（`covered_questions.length`）、主题数（`topics.length`）、交换次数（`ENT-003.exchangeCount`）、浏览/收藏聚合（`viewCount` 或 `favoriteCount`，`FR-140`）。
- `freshness`（如「actively maintained」）以 `StatusPill`/`IconChip` 呈现。

### Actions
- 悬停 `DonutChart` 分段显示来源类别与占比（无障碍：同时有文字图例，`NFR-007`）。
- 点主题标签 → 发现页筛选（`IA-002`）。

### States
- 加载（图表骨架）、就绪、空（无 `source_types` → 隐藏环形图，仅显计数）、错误。

### Validation and error behavior
- 占比和 ≠ 100% 时按归一化渲染并以图例兜底；缺失计数显 `0` 不显空白。

### Telemetry or analytics
- 复用 `module_detail_view`；不单独采集（聚合，`INV-09`）。

### Acceptance checks
- 环形图分段用主色 + 语义色（非第二图标族/非 filled，`UI-002`）；每个 `StatBlock` 有 Material Symbols Outlined 图标 + 文字标签 + 大数字（`UI-001` `--text-stat`）。
- 数字均为聚合派生、无 PII（`INV-09`）。

---

## PAGE-012 · 隐私边界与内容承诺区（Privacy Boundary）

### Page purpose
- 显式展示「平台不托管原始内容」的隐私边界、本模块的敏感度声明、脱敏说明与内容承诺，并提供举报/下架路径入口——这是 Know-share 信任叙事的可见化（`README` 核心理念、`FR-090`、`INV-01`）。

### Upstream requirement links
- `IA-003`/`FR-090`、`ENT-005` PrivacyScan（仅分级摘要）、`ENT-004`（`sensitivity`/`redaction_notes`）、`INV-01`/`INV-04`、`NFR-001`/`NFR-004`、`FLOW-005`（举报）。

### Route or surface ID
- 页内区 `#privacy`，主区左栏（建议紧邻 Manifest 预览，强化「公开的只是脱敏清单」）。

### Data required
- `sensitivity`（low/medium/high → `StatusPill` 语义色）。
- `redaction_notes`（脱敏说明文本，如「Removed names, private repositories, internal project details, and verbatim note excerpts.」）。
- 隐私门分级摘要：本模块为已发布态，故为 `pass`/`warn`（含 `block` 不可发布，`INV-02`）；展示等级 + 一句话解释，不展示原始扫描发现明细（`INV-01`）。
- 内容承诺（`content commitment`，`HARD-07`）：声明公开清单与私下交付包一致的承诺文案（`ASM-023` 字段约定）。
- 可审计规则链接 → `IA-013` 仓库/规则（`NFR-004`）。

### Actions
- 举报该模块（`ENT-014`，同 `PAGE-010` 举报动作，二次确认 `NFR-006`）。
- 查看隐私规则/可审计来源（外链 `IA-013`）。

### States
- 就绪（pass/warn 两态语义色）、字段缺失（无 `redaction_notes` 时显默认承诺文案）、未登录（举报触发登录）。

### Validation and error behavior
- 永不渲染原始扫描命中详情或私有路径样例（`INV-01`）。举报受速率限制（`NFR-006`）。

### Telemetry or analytics
- `privacy_section_viewed`、`report_submitted`（聚合，`INV-09`）。

### Acceptance checks
- 敏感度/隐私门等级用 `StatusPill` + 文字（非仅颜色，`NFR-007`）。
- 区内不出现任何原始内容、私有 URL 或扫描原始命中（`INV-01/04`）。

---

## PAGE-013 · 清单 / Manifest 预览（脱敏 JSON）

### Page purpose
- 以等宽字体（`JetBrains Mono`，`UI-001`）展示模块的脱敏 `ENT-004` Manifest JSON，让 agent / 开发者直接读取结构化清单（`NFR-002` agent 可读），对应设计图右中部的 JSON 代码面板（图中标题「Manifest」）。

### Upstream requirement links
- `IA-003`/`FR-020`、`ENT-004`、`NFR-002`、`FR-110`（与 API 输出同源/同形）、`INV-04`、`UI-001`（代码块等宽字）。

### Route or surface ID
- 页内区 `#manifest`，主区（设计图中为右中代码面板）。

### Data required
- 完整脱敏 Manifest（即 `examples/knowledge-module.manifest.json` 形状）：`id`/`title`/`summary`/`topics`/`tags`/`language`/`owner_handle`/`exchange_intent`/`sensitivity`/`covered_questions`/`source_types`/`freshness`/`redaction_notes`/`private_exchange_options`/`license`/`updated_at`。
- **不渲染**任何会泄露 PII 的字段：`contact`（联系方式）即便在示例 JSON 中出现，本页也**屏蔽/省略**——联系方式默认私密、仅交换接受后披露（`INV-03`/`DEC-010`/`FR-130`）。登记为 `ASM-024`。

### Actions
- 复制 JSON（`SecondaryButton` + Material Symbols `content_copy`）。
- 切换「预览（紧凑）/ 完整」视图（`FR-020`「清单预览/完整视图」）。

### States
- 加载（代码骨架）、就绪、长内容滚动、复制成功 toast、错误（无法加载 Manifest → `EmptyState`）。

### Validation and error behavior
- 渲染前过滤 `contact` 及任何私有字段（`INV-04`）；若 API 返回含私有字段视为契约违例并隐藏（`FR-110` 兜底）。

### Telemetry or analytics
- `manifest_copied`、`manifest_view_toggled`（聚合，`INV-09`）。

### Acceptance checks
- JSON 用等宽字、可键盘聚焦 + 复制（`NFR-007`）。
- 预览内**绝不含** `contact`/私有 URL/原始内容（`INV-03/04`、`NFR-001`）。

---

## PAGE-014 · 信任信号与贡献者侧栏（Trust & Owner）

### Page purpose
- 右侧栏聚合「贡献者身份 + 信任信号」，让用户在发起交换前评估对方可信度。对应设计图右上的 GitHub 身份卡（`@knowledge-trader`）+ 信任指标。

### Upstream requirement links
- `IA-003`/`FR-050`/`FR-060`、`ENT-011` TrustProfile、`ENT-001` User、`ENT-012` Badge、`DEC-006`（GitHub Verified）、`INV-10`（参与方反馈权重高于社交信号）、`UI-003`（`TrustBadge`/`IconChip`/`StatBlock`）。

### Route or surface ID
- 右侧栏（`PAGE-010` 右 ~1/3），位于「请求交换」CTA（`PAGE-015`）上方。

### Data required
- owner `ENT-001`：`owner_handle`、`githubVerified`（→ `StatusPill` success「GitHub Verified」+ Octocat 品牌例外图标）、`avatar`、加入日期、派生 `creditScore`、`badges`（`ENT-012`）。
- 模块 `ENT-011`：`trustLevel` + 一句话「信任如何形成」解释（基于交换历史/反馈质量/验证/举报，`FR-050`；参与方反馈权重高于社交信号 `INV-10`）。
- 模块社交计数：收藏数/认可数（`ENT-013`，权重低于参与方反馈，`INV-10`）。

### Actions
- 跳贡献者信任档案 `IA-007`（`FR-060`）。
- 「信任如何形成」展开解释（`FR-050` 页面层解释）。

### States
- 就绪、无信任历史（显「信任随交换积累」说明，`IA_SPEC` 空状态）、未验证（无 Verified 徽，显普通身份）、加载、错误。

### Validation and error behavior
- 信任分/级别为派生只读；无数据时显引导文案而非 `0` 误导。

### Telemetry or analytics
- `trust_explainer_opened`、`owner_profile_clicked`（聚合，`INV-09`）。

### Acceptance checks
- Verified 用 success 色 + 文字 + Octocat（唯一品牌例外，`UI-002`）。
- 页面可解释信任形成，且体现「参与方反馈权重 > 社交信号」（`INV-10`/`FR-050`）。

---

## PAGE-015 · 「请求交换」入口（Exchange CTA）

### Page purpose
- 详情页的核心转化动作：把「可发现」变成「发起交换请求」，进入 `FLOW-003` 交换生命周期。对应设计图右侧栏主色「请求交换」按钮 + 「Request Commitment / Contact Commitment」区。

### Upstream requirement links
- `IA-003 → IA-006`、`FR-040`、`FLOW-003`、`FLOW-007`（同意门）、`ENT-007` Exchange（创建）、`ENT-021` Consent、`DEC-009`（互惠可选/单向）、`DEC-010`（联系方式**不在本页披露**）、`INV-03`/`INV-05`/`INV-08`、`UI-003`（`PrimaryButton`）。

### Route or surface ID
- 入口在 `/modules/:moduleId` 右侧栏；点击 → 发起交换流（`/exchanges/new?target=:moduleId`，落地于 `IA-006` 交换详情/请求创建，由 exchange 模块的页面规格细化）。
- 唯一主 CTA（同屏不出现第二个等权主 CTA，`UI_RULES`）。

### Data required
- 目标模块 `moduleId`（预填请求目标，`ENT-007.targetModule`）。
- 当前用户可提供的模块列表（**可选**，单向请求允许为空，`DEC-009`/`INV-05`）——列表本身在交换创建流加载，本页只传 `target`。
- `exchange_intent`（来自 Manifest，提示对方期望的交换方向，辅助决策）。

### Actions
- 「请求交换」→ 未登录则登录引导（`DEC-006`/`FLOW-007`）；已登录则进入交换创建流，途中经同意门写 `Consent`（`INV-08`/`NFR-005`），可选附自有模块（`DEC-009`）。
- 边界：本页**不**披露任何联系方式；联系方式仅在交换进入 `Accepted` 后于 `IA-006` 披露（`INV-03`/`DEC-010`）。设计图中的「Contact Commitment」在本页仅为**说明性占位/锁定态**，不显示真实联系方式（登记为 `ASM-021`）。

### States
- 未登录（CTA 可见，点击转登录）、已登录（CTA 可用）、owner 本人查看自己的模块（隐藏/禁用「请求交换」，`ASM-021`）、已对该模块有进行中交换（显「查看进行中的交换」改为跳 `IA-006`，`ASM-021`）、加载、错误。

### Validation and error behavior
- 对自己的模块禁止发起交换（owner == 当前用户 → 禁用 + 说明）。
- 重复对同一目标的活动交换 → 引导至已存在交换而非新建（`FLOW-003` 状态机，`ASM-021`）。
- 发起前必须经同意门（无 `Consent` 不得创建 `ENT-007`，`INV-08`）。

### Telemetry or analytics
- `exchange_cta_clicked`、`exchange_request_started`（聚合、无对手方 PII，`INV-09`/`NFR-001`）。

### Acceptance checks
- CTA 为唯一主色实心 `PrimaryButton`（`UI-003`）。
- 本页绝不披露联系方式（`INV-03`）；发起交换前有同意门（`INV-08`/`NFR-005`）；支持单向请求（可不附自有模块，`DEC-009`/`INV-05`）。

---

## 新增假设（本模块，未修改 `DEFAULT_ASSUMPTIONS.md`）

| ID | 假设 | 依据 | 若有误的风险 | 确认 |
| --- | --- | --- | --- | --- |
| `ASM-021` | 详情页右侧「Contact Commitment / Request Commitment」区在本页为**说明性占位/锁定态**，不展示真实联系方式；真实披露发生在 `IA-006`（交换 Accepted 后） | `INV-03`、`DEC-010`、`FR-130`、设计图 | 若设计原意是在详情页就展示某种联系方式，会与 `INV-03` 冲突，需重新核对设计图语义 | user / 设计 |
| `ASM-022` | 来源统计区四个 `StatBlock` 的标签映射为「覆盖问题数 / 主题数 / 交换次数 / 浏览或收藏」（对应设计图 `23/12/8/18.7k`） | 设计图数字 + `ENT-003/004` 派生 | 若设计图四数字本意为其他指标，标签需调整（不影响布局/组件） | user / 设计 |
| `ASM-023` | Manifest 含 `content commitment`（内容承诺）字段以支撑 `HARD-07`「公开清单与私下交付包一致」的可见化；当前示例 JSON 未含该字段 | `FR-090`、`HARD-07`、`docs/data-contract.md`（待核） | 若数据契约不设该字段，隐私边界区改为仅展示 `redaction_notes` | 服务契约阶段 |
| `ASM-024` | Manifest 预览渲染时屏蔽 `contact` 字段（示例 JSON 含 `contact`，但属 PII） | `INV-03/04`、`DEC-010`、`NFR-001` | 若 API 已在输出端剥离 `contact`，前端屏蔽为冗余兜底（无害） | 服务契约阶段（`FR-110` 输出检查） |
| `ASM-025` | 移动端（`<768px`）详情页转单列，侧栏（信任 + 交换 CTA）下沉至摘要/统计之后、Manifest 之前，保证「请求交换」在移动端仍高可见 | `ASM-016`、`UI_RULES` 响应式原则 | 若移动端要求 CTA 吸底，需补 sticky 行为规范 | 用户确认目标设备 / 前端验证阶段 |

---

## 阻塞 / 待确认项

- `ASM-021`（联系方式占位语义）与 `ASM-023`（内容承诺字段）需用户/设计与服务契约阶段确认；前者关乎 `INV-03` 合规，建议优先确认。
- `data-contract.md` 未在本模块上游清单中提供，Manifest 字段以 `examples/knowledge-module.manifest.json` 为准；若数据契约有额外/不同字段，`PAGE-012/013` 需回填（非阻塞，标记追踪）。

---

## 质量门结果（gate 06 自检）

```text
Gate: 06-page-spec-gate
Status: pass（内容自检）— 待用户确认
Evidence: aies/02-design/module-detail/PAGE_SPEC.md 对照 IA_SPEC.md(IA-003)、PRODUCT_SPEC.md(FR-020 等)、
  LIGHT_DOMAIN_MODEL.md(ENT-003/004/005/011 与 INV-01/03/04/08/10/11)、BUSINESS_FLOW.md(FLOW-002/003/007/008)、
  UI_RULES.md(UI-001/002/003)、docs/design/know-share-module-detail.png、examples/knowledge-module.manifest.json
Findings:
  - 每个 PAGE 均含 purpose/data/actions/states/validation/telemetry/acceptance（模板 9 字段）。✅
  - 每页与数据/动作可追溯 IA-003 / FR-020 等 / FLOW-002/003 / ENT-003/004/005/011；无无法追溯内容。✅
  - 仅展示脱敏 Manifest，不托管/不渲染原始内容（INV-01/04）；Manifest 预览屏蔽 contact（INV-03/ASM-024）。✅
  - 「请求交换」连 FLOW-003、支持单向（DEC-009/INV-05）、发起前同意门（INV-08）；本页不披露联系方式（INV-03/DEC-010）。✅
  - Telemetry 仅聚合无 PII（FR-140/FLOW-008/INV-09）。✅
  - 锚定 UI_RULES 组件/令牌（ModuleCard/StatusPill/DonutChart/IconChip/StatBlock、主色 #017A6E、Material Symbols Outlined、等宽 JSON）。✅
  - 子区拆分（PAGE-011~015）有 Hard-Limit Policy 理由说明，同属一个 route，非新增可导航界面。✅
  - 新增 5 条假设(ASM-021~021)就地标注，未改 DEFAULT_ASSUMPTIONS.md。✅
Known risks: ASM-021(联系方式占位语义需确认，关乎 INV-03)、ASM-023(内容承诺字段待数据契约确认)、data-contract.md 未直接核对。
Decision: 内容自检通过 → 待用户确认本模块页面规格 → Manifest pending→passed
```
