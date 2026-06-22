# 页面规格 · open-api（开放 API / agent 集成）

## 摘要

本产物定义 `IA-012` 开放 API / agent 集成界面的**可构建页面契约**。这是一个**面向开发者与 agent 的 API 文档展示页**——它展示公开读取 API 的端点清单、认证写说明、零私有泄露承诺与可复制的请求/响应示例；它**不是服务契约本身**（真正的 `SERVICE_CONTRACT` / `API-*` 操作在阶段 15 产出）。本页所列端点清单与 `docs/data-contract.md` 的公共清单字段对齐，作为下游 `API-*` 的源材料。所有内容追溯到 `IA-012`、`FR-110`、`NFR-002`、`ENT-019`、`INV-01`、`INV-04`、`FLOW-008` 与 `docs/data-contract.md`，不引入无法追溯的内容。

### 产物元数据

- Stage: `08-page-spec`
- Status: `passed（2026-06-23 用户签字）`
- 模块: `open-api`（覆盖 `IA-012`；PAGE-* 段 `PAGE-090`~`PAGE-099`）
- Upstream IDs: `IA-012`、`FR-110`、`NFR-002`、`NFR-006`、`NFR-005`、`NFR-007`、`ENT-019`、`ENT-003`、`ENT-004`、`ENT-007`、`ENT-010`、`INV-01`、`INV-04`、`INV-09`、`FLOW-008`、`FLOW-003`、`UI-001`、`UI-002`、`UI-003`
- Decision IDs: `DEC-006`（GitHub 规范身份）、`DEC-007`（无经济模型）、`DEC-011`（轻后端 + 聚合统计）、`DEC-012`（规范图标族）
- Source inputs: `docs/design/generated/IA-012-open-api.html`、`docs/data-contract.md`、`aies/02-design/IA_SPEC.md`、`aies/02-design/UI_RULES.md`、`aies/01-product/PRODUCT_SPEC.md`、`aies/01-product/BUSINESS_FLOW.md`、`aies/01-product/LIGHT_DOMAIN_MODEL.md`
- 新增假设: `ASM-054`、`ASM-055`、`ASM-056`、`ASM-057`（见文末「新增假设」；本产物**不修改** `DEFAULT_ASSUMPTIONS.md`，仅在此登记并在返回中列出）
- Manifest status: 模块产物，阶段 `08-page-spec` = `passed（2026-06-23 用户签字）`
- 与真源 HTML 的归一化说明: 见文末「真源 HTML 漂移与归一化」——HTML 中存在 3 处无法追溯上游的内容（"加密网关认证"文案、`POST` 用 tertiary 橙色、"申请企业级访问"企业 CTA），本规格将其归一/移除，以符合 `INV-01`/`DEC-007`/`UI-003`。

---

## PAGE 索引（本模块）

| PAGE ID | 页面名 | Route / Surface | 覆盖 IA | 核心追溯 |
| --- | --- | --- | --- | --- |
| `PAGE-090` | 开放 API 文档页 | `/developers` | `IA-012` | `FR-110`、`NFR-002`、`ENT-019`、`INV-01`、`INV-04`、`FLOW-008` |

> 说明：`IA-012` 在 IA 规格中是**单一顶层界面**（API 文档 + 认证写说明 + 零私有泄露承诺），真源 HTML 也是单页布局（左侧分类导航 + 右侧端点文档流 + 顶部承诺横幅）。因此本模块当前只需 `PAGE-090` 一页即可完整承载 `IA-012`，不强行拆页。`PAGE-091`~`PAGE-099` 段位预留给下游可能的扩展（如独立"认证与速率限制说明页""SDK/技能下载页"），本阶段不创建以避免引入无上游追溯的页面（遵循模板「禁止」第 2 条）。

---

## PAGE-090 · 开放 API 文档页（IA-012）

### Page purpose

面向**第三方开发者与 agent 运行时**的开放 API 文档与集成入口（对应 `IA_SPEC.md` 进入点「`IA-012` API（agent 集成）」）。页面让 agent / 开发者**无需抓取页面**即可理解如何用结构化、脱敏的 API 集成 Know-share（`NFR-002` 设计上即 agent 可读）。页面同时承担一个产品级承诺的可见化：**公开读 API 只暴露脱敏清单与聚合统计，绝不返回原始知识内容或私有 URL**（`INV-01`、`INV-04`、`FR-110`）。写操作在文档中明确标注需 GitHub 认证 + 同意门（`NFR-005`、`NFR-006`、`DEC-006`）。

页面结构（据真源 `docs/design/generated/IA-012-open-api.html`）：
- **顶部承诺横幅**：success/primary-subtle 浅底 + `shield` 图标 + 标题「零私有内容泄露」+ 一句说明（`INV-01`）。
- **左侧 API 分类导航**（`width:256px` 侧栏）：按端点分类锚点跳转——发现 / 模块 / 交换 / 反馈 / 统计（对应 `IA_SPEC.md` IA-012「端点分组」）；底部「开发者资源」卡指向仓库/帮助页（`IA-013`）。
- **右侧端点文档流**：每个端点一张文档卡（`Card`）——方法 Pill + 路径 + 一句说明 + 认证徽 + 可展开的 JSON 请求/响应代码块 + 复制按钮。
- 页面挂在全局 `AppShell`（`UI-003`，顶栏导航当前项「开发文档」高亮）下。

> 重要边界：本页是**文档展示**，端点的权威字段/校验/错误码等在阶段 15 服务契约（`API-*`）定稿。本页展示的字段是 `docs/data-contract.md` 公共清单字段的**只读、脱敏子集**，用于让 agent 评估"是否值得请求交换"（`JOB-001`、`FLOW-002`）。

### Upstream requirement links

- `IA-012` 开放 API / agent 集成（`IA_SPEC.md` 顶层界面表 + Stitch 提示词「`IA-012` 开放 API / agent 集成」）。
- `FR-110` 开放 API 与 agent 可读注册表：公开读取 API + 契约获批后的认证写操作；输出绝不含私有内容；速率限制（`PRODUCT_SPEC.md` 功能需求表）。
- `NFR-002` 设计上即 agent 可读：公共注册表与契约可通过结构化清单及 API 供 agent 使用。
- `NFR-006` 抗滥用：写操作需身份核查、唯一性约束、速率限制（页面用文字标注速率限制与认证要求）。
- `NFR-005` 人类同意门：写操作（发起交换/提交/反馈）需所有者同意门（页面 `POST` 端点标注「需 GitHub 认证 + 同意门」）。
- `NFR-007` 可访问的公共网站：方法色非唯一区分（含文字）、代码块键盘可聚焦+复制、目录键盘可导航。
- `ENT-019` UsageStat（聚合、不含 PII）：`/api/stats` 端点的响应来源（`INV-09`）。
- `ENT-003` KnowledgeModule / `ENT-004` Manifest 的**公开脱敏视图**：`/api/modules`、`/api/modules/{id}` 端点的响应来源（脱敏清单 = `Manifest`）。
- `ENT-007` Exchange 的**公开脱敏视图**：`/api/exchanges` 公开台账（不含内容/私有 URL，`INV-04`）。
- `ENT-010` Feedback：`POST /api/feedback` 端点对应（结构化反馈，`FLOW-004`）。
- `INV-01` 平台永不存储原始知识内容；只存清单与公开关系 → 承诺横幅与所有读端点的脱敏约束。
- `INV-04` 公开记录与 API 输出不含私有内容或私有 URL → 所有响应示例字段约束。
- `INV-09` UsageStat 为聚合指标、不含 PII → `/api/stats` 响应约束。
- `FLOW-008` 平台使用统计（轻后端，聚合）→ `/api/stats` 数据来源（`DEC-011`、`FR-140`）。
- `FLOW-003` 交换请求生命周期 → `POST /api/exchanges` 的语义（发起请求触发 `Requested` 态）。
- `DEC-006` GitHub 规范身份 → 写操作认证 = GitHub。
- `DEC-007` 无经济模型 → 页面不得出现付费/企业付费/计费 CTA（见归一化：移除「申请企业级访问」）。
- `UI-001/002/003` 设计令牌 / 规范图标族（Material Symbols Outlined）/ 规范组件（`AppShell`、`Card`、`StatusPill`/方法 Pill、`ListRow`、`EmptyState`）。
- `docs/data-contract.md`：公共清单字段（`id`/`title`/`summary`/`topics`/`tags`/`language`/`owner_handle`/`source_types`/`freshness`/`sensitivity`/`updated_at`/`license` 等）与校验原则——是端点响应字段的源材料。

### Route or surface ID

- **Route**：`/developers`（开发文档；真源 HTML 顶栏当前项文案为「开发文档」，故路由命名取 `/developers`）。`ASM-054` 登记此路由命名为页面规格假设，最终路由在阶段 09/11 前端确认。
- **分类锚点**（左侧导航 → 页内 `id`）：`#discovery`（发现）、`#modules`（模块）、`#exchanges`（交换）、`#feedback`（反馈）、`#stats`（统计）。
- **Surface**：全局 `AppShell`（`IA-001`）内的主内容容器，桌面 `max-width 1280px` 居中（`UI-001`）；两栏（左侧 256px 分类导航 + 右侧端点流）。
- **进入点**：主导航「开发文档」项；`IA_SPEC.md` 进入点「`IA-012` API（agent 集成）」；`IA-013` 仓库/帮助页的「开放 API」链接。
- **公开可见**：无需登录即可浏览（`IA_SPEC.md` 权限敏感界面表「公开但匿名可看」含 API 文档）；写操作的认证仅是**文档说明**，本页不执行写。

### Data required

本页主要为**静态文档内容**（端点清单与示例），可由前端内置或由轻后端的文档配置提供；唯一可选的动态数据是承诺横幅旁或统计端点示例处展示的**真实聚合统计**（`ENT-019`，可选）。

**展示的端点清单（与 `docs/data-contract.md` 对齐，作为下游 `API-*` 源材料）**：

| 端点 | 方法 | 认证徽 | 说明（页面文案） | 响应/请求来源实体 | 字段来源（data-contract / 领域模型） | 追溯 |
| --- | --- | --- | --- | --- | --- | --- |
| `/api/modules` | `GET` | 公开读 | 列出公开知识模块（脱敏清单），支持分页/筛选 | `ENT-004` Manifest 列表 | `id`、`title`、`summary`、`topics`、`tags`、`language`、`owner_handle`、`source_types`、`freshness`、`sensitivity`、`updated_at`、`trust_level`(派生) | `FR-110`、`FR-010`、`INV-01/04`、data-contract 必需+推荐字段 |
| `/api/modules/{id}` | `GET` | 公开读 | 获取单个模块的完整脱敏清单 | `ENT-004` Manifest（单条） | 同上 + `covered_questions`、`redaction_notes`、`content_commitment`、`private_exchange_options`、`exchange_intent` | `FR-110`、`FR-020`、`INV-01/04`、data-contract |
| `/api/exchanges` | `GET` | 公开读 | 列出公开交换记录（脱敏台账，不含内容/私有 URL） | `ENT-007` Exchange 公开视图 | `exchange_id`、`status`、`target_module_id`、`offered_module_id`(可空)、`requested_at`、`completed_at`；**不含**联系方式/私有仓库引用/内容 | `FR-110`、`FR-040`、`INV-04`、`INV-05` |
| `/api/stats` | `GET` | 公开读 | 获取平台聚合使用统计（不含 PII） | `ENT-019` UsageStat | `users_count`、`modules_count`、`exchanges_count`、`privacy_gate_pass_rate`、`window`、`as_of`；**仅聚合** | `FR-110`、`FR-140`、`FLOW-008`、`INV-09` |
| `/api/exchanges` | `POST` | 需认证写（GitHub + 同意门） | 发起交换请求（触发 `Requested` 态） | 入参引用 `ENT-007` | 入参 `target_module_id`、`offered_module_id`(可选)、`message`；**响应不回显任何私有内容** | `FR-110`、`FR-040`、`FLOW-003`、`NFR-005/006`、`DEC-006`、`INV-04/05` |
| `/api/feedback` | `POST` | 需认证写（GitHub） | 提交结构化反馈 | 入参引用 `ENT-010` | 入参 `exchange_id`、维度评分（清单一致性/隐私边界/结构清晰度/有用性/再次交换意愿）、`comment`(可选公开文本) | `FR-110`、`FR-050`、`FLOW-004`、`NFR-006`、`DEC-006` |

> 与 data-contract 的对齐情况：
> - **完全对齐**：`/api/modules`、`/api/modules/{id}` 的字段直接取自 `docs/data-contract.md` 的必需+推荐字段，但**剔除 `contact` 字段**——`contact` 是 PII，默认私密（`INV-03`、`FR-130`、`ENT-008`），公开读 API 绝不输出（这是页面对 data-contract 的隐私收紧，见 `ASM-055`）。
> - **派生扩充**：`trust_level`（模块信任级别）为派生值（`ENT-011`），非 data-contract 原字段，但属公开脱敏视图合理展示项；标注为派生。
> - **新增（非 data-contract，源自领域模型/业务流程）**：`/api/exchanges`、`/api/stats` 与两个 `POST` 端点不在 data-contract（data-contract 只描述清单字段），其响应/入参字段取自 `ENT-007`/`ENT-019`/`ENT-010` 与 `FLOW-003/004/008`，已逐字段标注来源。
> - **校验原则继承**：data-contract 的「拒绝机密/凭据、拒绝长摘录、对姓名/邮箱/URL/电话告警、要求敏感度声明、联系方式须用户明确提供」在写端点的文档说明中以「经隐私门校验 + 同意门」一句承接（细则在 `FR-030`/`HARD-01` 与阶段 15 服务契约定义，本页只引用不重写）。

**每个端点文档卡需展示的数据**：方法（文字）、路径、一句中文说明、认证徽（`公开读` / `需认证写`）、可展开的 JSON 请求示例（仅 `POST`）与响应示例代码块、复制按钮目标文本。

**可选动态**：承诺横幅/统计区可内联真实 `/api/stats` 聚合数（与 `IA-013` 平台统计同源）；若不接后端则用拟真 MOCK（如真源 HTML 的示例值）。

### Actions

- **分类锚点跳转**：点左侧导航项（发现/模块/交换/反馈/统计）→ 平滑滚动到对应端点分组，当前项高亮（`aria-current`）。
- **展开/收起端点卡**：点端点行尾 `expand_more` 图标 → 展开显示该端点的 JSON 请求/响应代码块与字段说明（真源 HTML：端点 1 默认展开，2–5 默认收起）。
- **复制代码块**：点代码块内「复制」按钮 → 复制 JSON 到剪贴板，按钮文案临时变「已复制」2 秒（真源 HTML `copyCode()` 行为）。
- **复制端点 URL/锚点**：点端点行的 `link` 图标 → 复制该端点的页内深链。
- **访问文档库 / 仓库**：左侧「开发者资源」卡的「访问文档库」外链 → 跳 `IA-013` 仓库/帮助（`open_in_new`，新标签页）。
- **（认证写仅文档）**：`POST` 端点**不在本页执行**真实写操作；只展示认证与同意门要求文案，避免本页越过 `NFR-005` 同意门。

> 移除项（归一化，见文末）：真源 HTML 底部「申请企业级访问」按钮触及付费/企业层级，违反 `DEC-007`（无经济模型），**本规格移除该 CTA 与对应 Info 卡的商业措辞**；如保留信息卡，文案改为中性「集成支持」并指向仓库/帮助，无任何付费暗示。

### States

- **默认（loaded）**：承诺横幅 + 左侧分类导航 + 右侧端点流；首个端点（`GET /api/modules`）默认展开示例，其余收起。
- **端点展开 / 收起**：两态，展开态显示代码块与字段说明。
- **复制中 / 已复制**：按钮 2 秒反馈态。
- **统计加载（仅当接真实 `/api/stats`）**：`loading`（骨架/占位）→ 成功（数字）→ 失败（回退到「统计暂不可用」中性占位，不报错阻断文档阅读）。
- **空状态（`EmptyState`，`UI-003`）**：理论上端点清单为静态、几乎不为空；若文档配置缺失（异常）→ 居中 `EmptyState`（Material Symbols `code_off` 或 `description`）+「文档加载失败，请稍后重试或访问仓库」+ 指向 `IA-013` 的 CTA。
- **移动/窄屏（`ASM-016`/`ASM-056`）**：左侧分类导航折叠为顶部横向 Tab 或抽屉；端点卡单列；代码块横向滚动（`overflow-x-auto`）。
- **认证写说明态**：`POST` 端点的认证徽恒显示「需 GitHub 认证 + 同意门」，无登录态切换（本页不因登录与否改变文档内容）。

### Validation and error behavior

- **本页无表单写入**，故无传统输入校验；主要错误面是「可选统计拉取失败」与「文档配置缺失」，均**降级而非阻断**（文档可读性优先）。
- **代码块复制失败**（剪贴板权限被拒）：按钮文案改「复制失败」并提示手动选择复制，不抛全局错误。
- **承诺一致性约束（产品级硬校验，非运行时校验）**：所有展示的响应示例字段**不得包含** `contact`、私有仓库 URL、原始内容、私有路径、凭据（`INV-01`、`INV-04`）。这是页面内容必须满足的不变量，在阶段 15 服务契约 + 阶段 12 前端验证以「API 输出零私有内容」检查项核验（`PRODUCT_SPEC.md` 验收标准「agent 可读且安全」）。
- **方法可辨识校验**（无障碍）：`GET`/`POST` 不得仅靠颜色区分，必须含方法文字（`UI_RULES.md` 组件行为规则 + `NFR-007`）。
- **认证徽语义校验**：`POST` 端点必须带「需认证写」徽 + 同意门说明；`GET` 端点带「公开读」徽；不得出现"公开写"组合（违反 `NFR-005/006`）。
- **速率限制说明**：页面须以文字说明公开读端点受速率限制（`FR-110`、`NFR-006`）；具体阈值在服务契约定（本页标注「受速率限制」即可，`ASM-057`）。

### Telemetry or analytics

- 与本产品**聚合优先、不含 PII** 的统计立场一致（`ENT-019`、`INV-09`、`DEC-011`）。本页埋点仅记录**聚合行为**，用于改进文档：
  - 端点卡展开次数（按端点聚合）、复制按钮点击次数（按端点聚合）、分类导航跳转次数、「访问文档库/仓库」外链点击数。
  - 可选：页面访问量计入 `FLOW-008` 的平台使用统计源（聚合）。
- **禁止**：不采集可定位个人的标识（不记录访客身份/IP 关联到 User）；埋点遵守 `INV-09`「聚合、不含 PII」。
- 真实 API 调用量的遥测属**后端 API 服务**职责（速率限制/滥用监控，`NFR-006`），不在本文档页范围；本页只对"文档浏览行为"埋点。

### Acceptance checks

1. **承诺可见且准确**：页面顶部承诺横幅明确声明「零私有内容泄露 / 公开 API 只暴露脱敏清单与聚合统计」，且页内所有响应示例均无 `contact`/私有 URL/原始内容/凭据（`INV-01`、`INV-04`、`FR-110`）。
2. **端点清单完整且分类**：至少展示 `GET /api/modules`、`GET /api/modules/{id}`、`GET /api/exchanges`、`GET /api/stats`、`POST /api/exchanges`、`POST /api/feedback`，并归入发现/模块/交换/反馈/统计分类导航（`IA-012`、`FR-110`）。
3. **认证语义正确**：所有 `POST` 标「需 GitHub 认证 + 同意门」，所有 `GET` 标「公开读」；无「公开写」（`NFR-005`、`NFR-006`、`DEC-006`）。
4. **字段可追溯**：`/api/modules` 响应字段可逐一追溯到 `docs/data-contract.md` 必需/推荐字段或标注为派生（`trust_level`）；`contact` 不出现在任何公开读响应（`INV-03` 收紧）。
5. **统计仅聚合**：`/api/stats` 响应字段为聚合指标（用户数/模块数/交换数/隐私门通过率），无任何 PII（`INV-09`、`FLOW-008`）。
6. **无障碍达标**：方法用文字+颜色双重区分；代码块键盘可聚焦并可复制；左侧分类导航键盘可达且当前项 `aria-current`；对比度 ≥ 4.5:1（`NFR-007`、`UI_RULES.md` 无障碍底线）。
7. **设计系统一致**：主色 `#017A6E`、仅 Material Symbols Outlined 图标、`Card`/方法 Pill/`AppShell` 与规范一致；代码块用 JetBrains Mono 等宽字（`UI-001/002/003`、`DEC-012`）。
8. **无经济模型**：页面不含任何付费/企业付费/计费 CTA 或措辞（`DEC-007`）——「申请企业级访问」已移除。
9. **复制可用**：每个含示例的端点卡有复制按钮，点击复制对应 JSON 并给 2 秒反馈。
10. **去 agent 抓取**：agent 可仅凭本页文档 + API 集成 Know-share，无需抓取任何页面（`NFR-002`、`PRODUCT_SPEC.md` 成功信号「第三方 agent 通过 API 集成，无需抓取页面」）。

---

## 真源 HTML 漂移与归一化（写给下游）

真源 `docs/design/generated/IA-012-open-api.html` 整体结构（承诺横幅 / 左侧分类导航 / 右侧端点卡 / 方法 Pill / JSON 代码块 / 复制）与本规格一致并被采纳。以下 3 处为**无法追溯上游**的生成漂移，本规格归一化处理：

1. **「所有交换均经过加密网关认证」文案**（承诺横幅 line 166）：无上游依据（产品从不声明"加密网关"这类未定义基础设施）。归一为可追溯文案：「公开 API 只暴露脱敏清单与聚合统计，绝不返回原始知识内容或私有 URL」（`INV-01/04`）。
2. **`POST` 用 tertiary 橙色 Pill**（line 268、282）：`UI_RULES.md` 语义色未定义 tertiary/橙色用于方法；为保持"方法靠文字+主色/中性区分、不引第二图标/色族"（`UI-002` 冲突归一、`NFR-007`），归一为：`GET` = 主色浅底 Pill（`bg-primary/10 text-primary`），`POST` = 中性/`--color-info` 浅底 Pill + `lock` 图标 + 文字「需认证写」。关键是**方法名文字始终在场**，颜色仅辅助。
3. **「申请企业级访问」CTA + 企业级措辞**（line 293–301）：触及付费/企业分层，违反 `DEC-007`（无经济模型）。**移除**该按钮与商业措辞；如需保留信息卡，改为中性「集成支持 / 查看仓库与示例」指向 `IA-013`，无任何付费暗示。

此外，真源 HTML 的 Tailwind 配置把主色记为 `#005f55`（Material 派生）而正文 body 用 `#FBFCFD`、`primary-container` 用 `#017a6e`——属 `ASM-015` 已登记的"设计系统 v2 派生色板"偏差，实现期以 `UI-001` 规范令牌（主色 `#017A6E`）为准。

---

## 新增假设（本产物登记，未改 DEFAULT_ASSUMPTIONS.md）

| 拟新增 ID | 假设 | 若有误的风险 | 确认负责人 | 重新审视触发 |
| --- | --- | --- | --- | --- |
| `ASM-054` | 开放 API 文档页路由为 `/developers`（真源顶栏「开发文档」）；分类锚点为 `#discovery/#modules/#exchanges/#feedback/#stats` | 若产品偏好 `/api` 或 `/docs/api`，路由与深链需调整 | agent | 阶段 09/11 前端路由确认 |
| `ASM-055` | 公开读 API 响应**不含 `contact` 字段**（对 `docs/data-contract.md` 清单字段的隐私收紧），因 `contact` 为 PII、默认私密（`INV-03`/`FR-130`） | 若 data-contract 的 `contact` 原意是"已批准的公开 handle 才放入清单"，则可有条件保留公开 handle 子集 | user | 阶段 15 服务契约（`API-*`）定稿 |
| `ASM-056` | 桌面优先；窄屏左侧分类导航折叠为顶部 Tab/抽屉、端点单列、代码块横向滚动（承接 `ASM-016`） | 若需移动优先的 API 文档体验，布局需重排 | user | 阶段 12 前端验证 / 用户确认目标设备 |
| `ASM-057` | 公开读端点"受速率限制"以文字标注即可，具体阈值延后到服务契约 | 若需在文档页明示阈值，需补具体数值与配额说明 | agent | 阶段 15 服务契约 |

---

## 质量门自检（对照 PAGE_SPEC_TEMPLATE 完成标准）

```text
Gate: 06-page-spec-gate（逻辑门，对照 product-to-code PAGE_SPEC_TEMPLATE 完成标准/禁止项自检）
Status: pass（内容检查）— 待用户确认
Evidence: aies/02-design/open-api/PAGE_SPEC.md 对照 docs/design/generated/IA-012-open-api.html、docs/data-contract.md、IA_SPEC.md(IA-012)、UI_RULES.md、PRODUCT_SPEC.md(FR-110/NFR-002/FR-140)、BUSINESS_FLOW.md(FLOW-008)、LIGHT_DOMAIN_MODEL.md(ENT-019/INV-01/04/09)
Findings:
  - 9 字段全部有项目特定内容，无占位/无泛化填充。✅
  - 每条主张均追溯到上游 ID 或显式假设（ASM-054~057）。✅
  - 端点清单与 data-contract 对齐并逐字段标注来源；contact 字段按 INV-03 收紧排除。✅
  - 公开读仅脱敏清单+聚合统计；写操作标 GitHub 认证+同意门（INV-01/04、NFR-005/006、DEC-006）。✅
  - 方法用文字+颜色双重区分；代码块等宽字（NFR-007、UI-001/002）。✅
  - 锚定 UI_RULES（UI-001/002/003、DEC-012）；未引第二图标/色族。✅
  - 真源 HTML 3 处无上游漂移已归一/移除（加密网关文案、POST 橙色、企业付费 CTA / DEC-007）。✅
  - 未引入无法追溯的页面/端点/实体；PAGE-091~099 预留不创建。✅
  - 新增假设登记于本文件，未改 DEFAULT_ASSUMPTIONS.md 或任何控制文件。✅
Known risks: ASM-055（contact 字段语义待 user 确认）；ASM-015（真源 HTML 主色派生色板偏差，以 UI-001 为准）。
Decision: 待用户确认端点清单与隐私收紧 → 转 passed → 下游阶段 15 据此产出 SERVICE_CONTRACT(API-*)
```
