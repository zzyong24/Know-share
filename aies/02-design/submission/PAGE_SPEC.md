# 页面规格 — 提交模块向导（submission / IA-004）

## 摘要

本产物把信息架构界面 `IA-004`（提交模块向导）落成可构建的页面契约。提交是一个**线性多步向导**，把 `FLOW-001`（清单发布与隐私门）与 `FLOW-007`（身份与同意）落到 5 个步骤，每步一个 `PAGE` 小节（`PAGE-020` ~ `PAGE-024`），共用一个向导外壳（`PAGE-020` 描述外壳约束）。其中**第 3 步隐私 Gate 校验为强约束节点**：`PrivacyScan` 含 `block` 时禁止继续（`INV-02`），`warn` 须显式同意（`NFR-005`）。所有页面/数据/动作追溯到 `IA-004`/`FR-030`/`FR-090`/`FLOW-001`/`FLOW-007`/`ENT-*`/`NFR-005`，并锚定 `UI_RULES.md` 的 `UI-001`/`UI-002`/`UI-003` 与组件 `Stepper`/`ConsentGate`/`Card`。视觉真源为 `docs/design/know-share-submit-module.png`（含"第 3 步：隐私 Gate 校验"等多步）。

### 产物元数据

- Stage: `08-page-spec`
- Status: `passed（2026-06-23 用户签字）`
- 模块: submission（提交模块向导 + 隐私门），覆盖界面 `IA-004`
- 上游 IDs: `FR-030`、`FR-090`、`FLOW-001`、`FLOW-007`、`IA-004`、`ENT-006`、`ENT-005`、`ENT-004`、`ENT-003`、`ENT-021`、`NFR-001`、`NFR-005`、`NFR-006`、`NFR-007`、`INV-01`、`INV-02`、`INV-08`、`INV-11`、`UI-001`、`UI-002`、`UI-003`
- Decision IDs: `DEC-010`（联系方式默认私密，影响 Manifest 的 contact 处理）、`DEC-011`（轻后端聚合统计，影响 Telemetry）、`DEC-012`（规范设计系统 / Material Symbols Outlined）
- Source inputs: `aies/01-product/PRODUCT_SPEC.md`、`aies/02-design/IA_SPEC.md`、`aies/02-design/UI_RULES.md`、`aies/01-product/LIGHT_DOMAIN_MODEL.md`、`aies/01-product/BUSINESS_FLOW.md`、`docs/design/know-share-submit-module.png`、`examples/knowledge-module.manifest.json`
- Manifest status: stage `08-page-spec` = `passed（2026-06-23 用户签字）`
- 本模块新增假设: `ASM-026`、`ASM-027`、`ASM-028`、`ASM-029`、`ASM-030`（详见末尾「拟新增假设」；**未写入 `DEFAULT_ASSUMPTIONS.md`**，待编排者登记）

### PAGE 索引

| PAGE ID | 步骤 | 子路由 | 真源（设计图区域） |
| --- | --- | --- | --- |
| `PAGE-020` | 向导外壳 + 第 1 步：选择类型 / 来源 | `/submit`（= `/submit/source`） | 左侧 `Stepper` + 顶栏；步骤 1 |
| `PAGE-021` | 第 2 步：生成或导入 Manifest 清单 | `/submit/manifest` | 中部 Manifest 代码编辑器 + Agent 技能(MCP)卡 |
| `PAGE-022` | 第 3 步：隐私 Gate 校验（强约束） | `/submit/privacy-gate` | 设计图主屏：Manifest 预览 + 隐私扫描结果(pass/warn/block) + 同意 |
| `PAGE-023` | 第 4 步：卡片预览 | `/submit/preview` | 公开 `ModuleCard` 预览 |
| `PAGE-024` | 第 5 步：提交确认 | `/submit/confirm` | 提交确认 + 准备私下交换包 |

> 步骤顺序与编号锚定 `FLOW-001`（选类型→生成/导入清单→隐私门→预览公开卡片→提交）与设计图左侧 `Stepper`；设计图当前定格在「第 3 步：隐私 Gate 校验」，与 `PAGE-022` 对应。

---

## `PAGE-020` 向导外壳 + 第 1 步：选择类型 / 来源

### Artifact metadata

- Stage: `08-page-spec`
- Status: `passed（2026-06-23 用户签字）`
- Upstream IDs: `IA-004`、`FR-030`、`FLOW-001`、`FLOW-007`、`ENT-006`、`ENT-003`、`ENT-021`、`NFR-005`、`UI-003`（`AppShell`/`Stepper`/`Card`/`PrimaryButton`/`SecondaryButton`）
- Decision IDs: 无（沿用 `DEC-012` 设计系统）
- Manifest status: `passed（2026-06-23 用户签字）`

### Page purpose

提交向导的入口与共用外壳，承载第 1 步：让已登录的发布方所有者**选择要发布的知识模块类型与来源类别**，作为后续本地生成/导入 `Manifest` 的输入。外壳在所有 5 步固定呈现：顶部 `AppShell`（含"提交模块"为当前激活态）+ 左侧竖向 `Stepper`（5 步，当前步主色高亮，已完成步打勾，未来步置灰，对应设计图左栏「提交流程：选择来源类型 / 生成本地清单 / 隐私 Gate 校验 / 卡片预览 / 提交确认」）+ 右侧步骤内容区 + 底部统一「上一步 / 下一步」导航。第 1 步内容：模块标题与一句话用途、模块类型/分类选择、来源类别多选（对齐 `LIGHT_DOMAIN_MODEL.md` 外部引用：Obsidian、Logseq、Notion、Markdown、语雀、飞书文档、本地文件夹、自定义）。进入向导即创建/恢复一条 `Submission`（`ENT-006`，状态 `Draft`）。

### Upstream requirement links

- `IA-004`（提交模块向导：多步线性流程，隐私门为强约束节点）、内容层级「流程面 = 提交向导，线性多步」
- `FR-030`（多步提交：选类型→…）、`FLOW-001` 首环节「在本地选模块类型」、`FLOW-007`（发起提交需 GitHub 登录 + 同意门；权限敏感界面 `IA-004` 需登录 + 各步同意门）
- `ENT-006` `Submission`（状态机 `Draft → Submitted → …`）、`ENT-003` `KnowledgeModule`（类型、关联 owner）
- `ENT-021` `Consent`、`INV-08`（生成触及范围/提交/联系/交换前必须存在对应 `Consent`）— 第 1 步在触发本地生成前出示"生成触及范围"同意门
- `NFR-005`（人类同意门）、`UI-003` 组件 `Stepper`/`AppShell`/`Card`/`PrimaryButton`/`SecondaryButton`；布局原则「流程面用左侧 `Stepper` 线性推进」

### Route or surface ID

- 路由：`/submit`（规范化为 `/submit/source`，第 1 步）。向导根 `/submit` 重定向至当前可恢复步骤；草稿可深链 `/submit/{submissionId}/source`（`submissionId` 关联 `ENT-006`）。
- 入口：`AppShell` 右侧主色「提交模块」CTA（`IA-001`）、个人中心 `IA-009` 空状态「引导走提交向导」、发现页 `IA-002` 空注册表引导。
- 权限：需 GitHub 登录（`FLOW-007`、IA 权限敏感界面表）；未登录则路由到 GitHub 登录并回跳。

### Data required

- 当前 `User`（`ENT-001`）：GitHub 身份、登录态（外壳右上角显示）。
- `Submission` 草稿（`ENT-006`）：`id`、`status=Draft`、关联 `moduleId`、`step` 进度、`updatedAt`。
- `KnowledgeModule` 草稿字段（`ENT-003`，本步采集）：`title`（模块标题）、`oneLineIntent`（一句话用途/`exchange_intent` 雏形）、`moduleType`（类型/分类）、`sourceTypes[]`（来源类别多选，枚举见 `LIGHT_DOMAIN_MODEL` 外部引用「知识来源类型」+ `examples/knowledge-module.manifest.json` 的 `source_types`）。
- 向导步骤元数据（前端常量）：5 步标题与索引；当前步、可达步集合。
- 不需要：任何原始知识内容、私有路径、凭据（`NFR-001`、`INV-01`）— 本步只采集分类信息。

### Actions

- 选择模块类型（单选）、勾选来源类别（多选）、填写标题与一句话用途。
- 「保存草稿」（`SecondaryButton`）：持久化 `Submission`(`Draft`)，对应备选流程「草稿保存」。
- 「下一步」（`PrimaryButton`）：校验必填 → 进入 `PAGE-021`；首次进入本地生成前出示并要求确认「生成触及范围同意门」（写入 `Consent`，动作类型 `生成`，`INV-08`/`NFR-005`）。
- 「退出向导」（`SecondaryButton`/链接）：保存草稿后离开（去往 `IA-009`）。

### States

- `empty`（新建：无草稿，表单空）。
- `editing`（填写中）。
- `restored-draft`（从草稿恢复，回填已选类型/来源）。
- `consent-pending`（点「下一步」时弹出生成范围同意门，未确认）。
- `loading`（保存草稿 / 创建 Submission 中）。
- `error`（保存失败 / 会话过期需重新登录）。
- `Stepper` 步态：当前步=主色高亮、未来步=置灰不可跳入（线性约束）、已完成步=打勾可回退查看。

### Validation and error behavior

- 必填：`title`（非空、长度上限，超限提示）、至少 1 个 `sourceType`、`moduleType`。未满足时「下一步」禁用并就近显示字段级错误（文字 + 图标，非仅颜色，`NFR-007`）。
- 未登录或会话过期：拦截到 GitHub 登录（`FLOW-007`），回跳保留草稿。
- 不允许跳步：未完成本步不得通过 `Stepper` 直达后续步（线性流程，`IA-004`）。
- 同意门未确认：不创建生成动作、不进入第 2 步（`INV-08`）。

### Telemetry or analytics

- 仅聚合、无 PII（`FR-140`/`FLOW-008`/`INV-09`/`DEC-011`）。事件：`submit_wizard_started`、`submit_step_completed{step:1}`、`submit_draft_saved`。维度仅含步骤索引、来源类别枚举值（非具体内容）、是否恢复草稿。
- 不上报标题、用途文本或任何用户输入正文（`NFR-001`）。

### Acceptance checks

- 未登录访问 `/submit` 被路由到 GitHub 登录并可回跳（`FLOW-007`）。
- 必填校验未过时「下一步」禁用；满足后可进入第 2 步。
- 「保存草稿」后刷新/重进可从 `PAGE-020` 恢复已选类型与来源（`restored-draft`）。
- 进入第 2 步前出示生成范围同意门，确认后写入一条 `Consent`（动作=生成）（`INV-08`、可由 `IA-014` 同意记录侧验证）。
- `Stepper` 当前步主色高亮、未来步不可跳入；视觉锚定 `UI-001` 主色 `#017A6E` 与 `UI-003` `Stepper`。
- 全程不采集任何原始内容/路径/凭据字段（`NFR-001`/`INV-01`）。

---

## `PAGE-021` 第 2 步：生成或导入 Manifest 清单

### Artifact metadata

- Stage: `08-page-spec`
- Status: `passed（2026-06-23 用户签字）`
- Upstream IDs: `IA-004`、`FR-030`、`FR-080`、`FLOW-001`、`ENT-004`、`ENT-006`、`ENT-016`、`NFR-001`、`NFR-005`、`INV-01`、`INV-08`、`UI-003`（`Stepper`/`Card`/`IconChip`/`PrimaryButton`）、`UI-001`（`JetBrains Mono` 代码块）
- Decision IDs: `DEC-010`（联系方式字段默认私密处理）、`DEC-012`
- Manifest status: `passed（2026-06-23 用户签字）`

### Page purpose

第 2 步：产出本步的核心产物 `Manifest`（`ENT-004`）——模块的**脱敏公开摘要**。提供两条路径（对齐 `FLOW-001` 与备选流程「导入而非生成清单」）：①**本地生成**（通过 Agent 技能 / MCP 工具在本机生成清单，对应设计图右侧「Agent 技能 / MCP 工具」卡，`ENT-016`/`FR-080`）；②**导入 JSON**（粘贴/上传已有清单 JSON）。中部为等宽字（`JetBrains Mono`）的 `Manifest` 代码编辑器，字段对齐 `examples/knowledge-module.manifest.json` 与 `ENT-004` 概念属性（脱敏摘要、主题、新鲜度、来源统计、内容承诺、隐私边界、版本）。本步不离开本机、不上传原始内容（`INV-01`），生成动作受第 1 步「生成范围同意」覆盖（`INV-08`）。

### Upstream requirement links

- `FR-030`（生成/导入清单）、`FLOW-001`「生成/导入清单」、备选流程「导入而非生成清单」「草稿保存」
- `FR-080`/`ENT-016` `AgentSkill`（建清单/脱敏/验证/打包/提交反馈的本地工具与 MCP；设计图右侧 MCP 卡）、`IA-008` 技能目录为安装来源
- `ENT-004` `Manifest`（脱敏摘要、主题、新鲜度、来源统计、内容承诺、隐私边界、版本）、`ENT-006` `Submission`（持有当前 Manifest 草稿）
- `NFR-001`/`INV-01`（不上传原始内容；清单为脱敏摘要）、`docs/data-contract.md`（Manifest 为公开摘要的数据契约来源，经 `ENT-004` 引用）
- `UI-001`（代码/Manifest 用 `JetBrains Mono` 等宽字）、`UI-003`（`IconChip` 用于 MCP/技能卡的 Material Symbols 字形）

### Route or surface ID

- 路由：`/submit/manifest`（草稿态 `/submit/{submissionId}/manifest`）。
- 由 `PAGE-020` 「下一步」进入；可经 `Stepper` 回退到第 1 步。
- 表面：中部 `Manifest` 代码编辑器（等宽、行号、语法高亮）；右侧 `Card` = 「Agent 技能 / MCP」生成入口（含可用技能、安装/文档链接到 `IA-008`、隐私级别、支持来源类别）；顶部分段控件「本地生成 | 导入 JSON」。

### Data required

- 当前 `Submission` 草稿与第 1 步采集的 `moduleType`/`sourceTypes`（作为生成提示输入）。
- `Manifest` 草稿（`ENT-004`），脱敏 JSON，字段集（依 `examples/knowledge-module.manifest.json`）：`id`、`title`、`summary`（脱敏摘要）、`topics[]`/`tags[]`（→ `ENT-020`）、`language`、`owner_handle`、`contact{type,value}`（联系方式：默认私密，见下校验/`DEC-010`）、`exchange_intent`、`sensitivity`（敏感度声明）、`covered_questions[]`、`source_types[]`（来源统计来源）、`freshness`（新鲜度）、`redaction_notes`（脱敏说明 / 内容承诺）、`private_exchange_options[]`、`license`、`updated_at`、`version`。
- 可用 `AgentSkill` 列表（`ENT-016`）：名称（建清单/脱敏/验证/打包/提交反馈）、安装/文档、隐私级别、支持来源类别 — 只读展示，安装动作跳转 `IA-008`。
- 不需要：原始笔记、私有路径、凭据、私有嵌入向量、未脱敏第三方个人数据（`NFR-001`）。

### Actions

- 切换「本地生成 / 导入 JSON」。
- 本地生成：触发本机 Agent 技能 / MCP 工具生成清单（平台不执行、不接收原始内容；前端接收技能产出的脱敏 JSON 回填编辑器）。
- 导入 JSON：粘贴或上传 `.json`，解析后回填编辑器（解析失败给字段级错误）。
- 在等宽编辑器内手动编辑 Manifest 字段。
- 「校验清单结构」（`SecondaryButton`）：对 schema 做客户端结构校验（不等同隐私门）。
- 「保存草稿」（`SecondaryButton`）。
- 「下一步」（`PrimaryButton`）：结构校验通过 → 进入 `PAGE-022` 隐私 Gate。
- 跳转「Agent 技能目录」（`IA-008`）安装/查看技能文档。

### States

- `empty`（尚无 Manifest：展示两条路径引导 + MCP 技能卡）。
- `generating`（本地技能生成中 — 进度/loading；明确文案"在你本机生成，不上传原始内容"）。
- `imported`（导入成功，已回填）。
- `editing`（编辑中，未保存标记）。
- `structure-valid` / `structure-invalid`（结构校验结果）。
- `skill-missing`（无可用本地技能：`EmptyState` 引导去 `IA-008` 安装，或改用导入）。
- `loading` / `error`（保存或解析失败、会话过期）。

### Validation and error behavior

- JSON 解析：非法 JSON → 行内错误 + 定位；不可进入下一步。
- 结构校验（client schema，对齐 `ENT-004`/示例）：必填 `id`、`title`、`summary`、`topics`、`source_types`、`sensitivity`、`redaction_notes`、`updated_at`；缺失/类型错给字段级错误。
- 联系方式 `contact`：默认私密处理（`DEC-010`/`INV-03`）；若清单含 `contact.value`，提示"联系方式默认私密，仅在交换被接受后对对方披露，不随公开清单展示"，不阻断结构校验但标注（隐私语义在 `PAGE-022` 复核）。
- 结构校验只保证"可被隐私门处理"，**不替代隐私门**；隐私分级在 `PAGE-022` 进行（`FR-090`）。
- 平台侧不接收原始内容：若检测到疑似原始大段正文/路径，提示这是隐私门职责，引导继续到 `PAGE-022`（最终判定在那里，`INV-01`/`FR-090`）。

### Telemetry or analytics

- 聚合、无 PII（`INV-09`）。事件：`submit_step_completed{step:2}`、`manifest_source{mode: generate|import}`、`manifest_structure_validated{result: valid|invalid}`、`agent_skill_opened`。
- 维度仅含模式枚举、校验结果布尔、来源类别枚举；**不上报** Manifest 字段内容、summary、contact、covered_questions 等正文（`NFR-001`）。

### Acceptance checks

- 两条路径均可产出可编辑的脱敏 `Manifest`：本地生成回填、导入 JSON 回填（`FLOW-001` + 备选流程）。
- 非法 JSON / 结构缺失字段时「下一步」禁用并给字段级错误。
- 无本地技能时出现 `skill-missing` 空状态并可跳转 `IA-008`（`FR-080`）。
- 代码编辑器使用 `JetBrains Mono` 等宽字（`UI-001`）。
- 含 `contact` 值时出现"默认私密"提示（`DEC-010`/`INV-03`）。
- 全流程无任何上传原始内容的入口；UI 明确声明"在本机生成"（`NFR-001`/`INV-01`）。

---

## `PAGE-022` 第 3 步：隐私 Gate 校验（强约束节点）

### Artifact metadata

- Stage: `08-page-spec`
- Status: `passed（2026-06-23 用户签字）`
- Upstream IDs: `IA-004`、`FR-030`、`FR-090`、`FLOW-001`、`FLOW-007`、`ENT-005`、`ENT-004`、`ENT-006`、`ENT-021`、`NFR-001`、`NFR-005`、`INV-01`、`INV-02`、`INV-08`、`HARD-01`、`UI-003`（`ConsentGate` pass/warn/block、`StatusPill`、`Stepper`、`Card`）、`UI-001`（语义色 success/warning/danger、等宽 Manifest）
- Decision IDs: `DEC-010`（联系方式语义）、`DEC-012`
- Manifest status: `passed（2026-06-23 用户签字）`

### Page purpose

向导的**强约束节点**，对应设计图主屏「第 3 步：隐私 Gate 校验」。在本机对 `Manifest` 运行隐私扫描（`ENT-005` `PrivacyScan`，解 `HARD-01`），把发现分为 **pass / warn / block** 三级并给出**脱敏（泛化）建议**，再要求所有者**显式同意**后方可继续（`NFR-005`）。左侧（设计图）为脱敏 `Manifest` 预览（等宽 `JetBrains Mono`）；右侧为「隐私风险扫描结果」面板（pass/warn/block 分组 + 每项定位与泛化建议）；底部为 `ConsentGate`：**block 态禁止继续、warn 态需勾选显式同意、pass 态方可推进**。本页是 `INV-01`（脱敏后才离开本机；平台不托管原始内容）在 UI 层的强制点。

### Upstream requirement links

- `FR-090`（隐私门：同意节点、扫描规则、敏感度声明、内容承诺）、`FR-030`（隐私门步骤）、`HARD-01`（扫描密钥/邮箱/路径/私有 URL/长摘录/第三方数据；泛化建议；pass/warn/block 分级）
- `FLOW-001`「运行隐私门 → 通过/警告/阻断分级与脱敏建议 → 所有者同意」、决策点「隐私门发现是否阻断发布」、失败路径「隐私门阻断 → 提示具体阻断项与脱敏建议 → 修订后重跑」
- `ENT-005` `PrivacyScan`（发现项 pass/warn/block、泛化建议、敏感度声明）、`ENT-004` `Manifest`、`ENT-021` `Consent`（动作=提交前的隐私同意）
- `INV-02`（含 block 级发现不得发布）、`INV-01`（平台永不存储原始内容）、`INV-08`（动作前须有 Consent）、`NFR-005`（人类同意门）、`NFR-001`
- `UI_RULES` 组件行为规则「`ConsentGate` 为强约束：block 禁止继续、warn 需显式确认、pass 方可推进」；`UI-003` `ConsentGate`/`StatusPill`；`UI-001` 语义色 `--color-success/#16A34A`、`--color-warning/#D97706`、`--color-danger/#DC2626`

### Route or surface ID

- 路由：`/submit/privacy-gate`（草稿态 `/submit/{submissionId}/privacy-gate`）。
- 由 `PAGE-021` 「下一步」进入；可经 `Stepper` 回退到第 2 步修订 Manifest（失败路径「修订后重跑」）。
- 表面（对齐设计图）：左 = 脱敏 Manifest 预览（等宽 JSON，只读或带跳回编辑）；右 = `PrivacyScan` 结果面板，按 pass（success 色）/ warn（warning 色）/ block（danger 色）分组，每项含规则类别、命中位置（指向 Manifest 字段，不显示原始私有值全文）、泛化/脱敏建议、敏感度声明；底部 = `ConsentGate`（三态）。

### Data required

- `Manifest`（`ENT-004`）脱敏 JSON（左侧预览）。
- `PrivacyScan` 结果（`ENT-005`）：`findings[]`，每项 `{ ruleCategory, severity: pass|warn|block, locationRef(字段/位置引用), suggestion(泛化建议), explanation }`；`sensitivityDeclaration`（敏感度声明，对齐 Manifest `sensitivity`）；`overallStatus = pass|warn|block`（取最严重级别）；`scannedAt`、`scannerVersion`。
- 规则类别枚举（依 `HARD-01`/`FR-090`）：`secret/credential`（密钥/凭据）、`email`、`path`（本地/私有路径）、`private-url`（私有 URL）、`long-excerpt`（长摘录/疑似原文）、`third-party-pii`（未脱敏第三方个人数据）、`contact-exposure`（联系方式公开暴露，关联 `DEC-010`/`INV-03`）。
- `Consent` 待写记录（`ENT-021`）：动作类型=提交前隐私同意，范围=该 Submission/Manifest 版本。
- 扫描在本机执行（由 Agent 技能 / MCP，`FR-080`）：平台只接收/展示脱敏后的 `findings` 与脱敏 Manifest，不接收命中的原始私有值（`INV-01`）。

### Actions

- 「运行/重跑隐私扫描」：在本机对当前 Manifest 跑 `PrivacyScan`，回填三级结果。
- 逐项查看发现与泛化建议；对 warn/block 项「应用建议」可跳回 `PAGE-021` 定位字段修订（或就地编辑后重跑）。
- `ConsentGate` 行为：
  - `block`：「下一步」**禁用**，展示「存在 N 项必须解决的阻断项」与逐项修复指引；唯一可行动作为「去修订（回第 2 步）」与「重跑」（`INV-02`）。
  - `warn`：「下一步」需先勾选显式同意复选框（"我已审阅并同意在保留这些警告项的情况下提交"），勾选后写 `Consent` 才启用「下一步」（`NFR-005`）。
  - `pass`：可直接勾选同意并「下一步」（仍写 `Consent`，证明所有者审阅过）。
- 「保存草稿」、「上一步」（回 `PAGE-021`）。
- 「下一步」（`PrimaryButton`）：仅在非 block 且已写隐私同意 `Consent` 时启用 → 进入 `PAGE-023`。

### States

- `idle`（进入未扫描）/ `scanning`（扫描中 loading）。
- `result-pass`（全部 pass，绿）/ `result-warn`（含 warn 无 block，橙）/ `result-block`（含 block，红，继续被禁）。
- `consent-required`（warn/pass 待勾选同意）/ `consent-given`（已同意，可继续）。
- `revising`（用户跳回第 2 步修订后返回，需重跑 → 回 `idle/scanning`）。
- `error`（扫描失败 / 技能不可用 → 提示重试或检查本机技能，引导 `IA-008`）。
- `Stepper`：当前步=第 3 步主色高亮。

### Validation and error behavior

- **block 不可绕过**（核心硬规则）：只要 `overallStatus=block`，「下一步」永远禁用，前端不提供任何旁路；UI 文案明确"阻断项必须解决后才能继续/发布"（`INV-02`/`FR-090`）。
- **warn 需显式同意**：未勾选同意复选框时「下一步」禁用；勾选即生成一条 `Consent`（`NFR-005`/`INV-08`）。
- Manifest 在第 3 步被修改 → 旧扫描结果失效，强制「重跑」后才能再继续（避免对过期结果同意）。
- 状态一律用 `StatusPill` + 语义色 + **文字**（不仅靠颜色，`NFR-007`）：pass=success、warn=warning、block=danger。
- 发现项定位只引用 Manifest 字段/位置，不在公开面回显命中的原始私有值全文（`INV-01`/`INV-04`）。
- 扫描失败：不得默认放行；保持「下一步」禁用直至成功扫描。

### Telemetry or analytics

- 聚合、无 PII（`INV-09`/`FLOW-008`）。事件：`privacy_scan_run`、`privacy_scan_result{overall: pass|warn|block, counts:{pass,warn,block}}`、`privacy_consent_given{overall}`、`privacy_block_revise_clicked`、`submit_step_completed{step:3}`。
- 维度仅含分级计数与规则类别枚举计数（如 `block.path=1`），**不上报**任何命中的原始值、Manifest 内容或 locationRef 的具体值（`NFR-001`/`INV-01`）。该聚合服务 `FR-090` 的"隐私门通过率"统计（见 `IA-013` 平台统计）。

### Acceptance checks

- 含至少一个 `block` 发现时，「下一步」禁用且无任何旁路；仅能「去修订」或「重跑」（`INV-02`，核心验收）。
- 仅含 `warn` 时，必须勾选显式同意复选框后「下一步」才启用，且勾选写入一条隐私 `Consent`（`NFR-005`/`INV-08`）。
- 全 `pass` 时同意后可继续（仍写 `Consent`）。
- 三级结果用 `StatusPill` + 语义色 + 文字呈现，pass/warn/block 分别为 `#16A34A`/`#D97706`/`#DC2626`（`UI-001`/`NFR-007`）。
- 在第 3 步修订或跳回第 2 步改动 Manifest 后，必须重跑扫描方可继续（无陈旧同意）。
- 扫描失败时「下一步」保持禁用（不默认放行）。
- 发现项展示泛化/脱敏建议且不回显原始私有值全文（`HARD-01`/`INV-01`）。
- Manifest 预览为等宽脱敏 JSON（`UI-001`）。

---

## `PAGE-023` 第 4 步：卡片预览

### Artifact metadata

- Stage: `08-page-spec`
- Status: `passed（2026-06-23 用户签字）`
- Upstream IDs: `IA-004`、`FR-030`、`FR-010`、`FR-020`、`FLOW-001`、`ENT-004`、`ENT-003`、`NFR-001`、`INV-01`、`INV-04`、`UI-003`（`ModuleCard`/`Card`/`StatusPill`/`Stepper`）
- Decision IDs: `DEC-010`、`DEC-012`
- Manifest status: `passed（2026-06-23 用户签字）`

### Page purpose

第 4 步：让所有者**预览将公开展示的卡片**（`ModuleCard`）与模块详情公开面，确认"离开本机后别人看到什么"，对齐 `FLOW-001`「预览公开卡片」。预览严格只渲染脱敏 `Manifest`（`ENT-004`）中将公开的字段，与 `IA-002`（发现卡片）/`IA-003`（模块详情公开部分）所见一致，确保发布前所见即所得、零意外（产品成功信号"所有者对离开本机的内容零意外"）。联系方式默认不出现在公开预览（`DEC-010`/`INV-03`）。

### Upstream requirement links

- `FR-030`「预览公开卡片」、`FLOW-001` 同环节、产品成功信号"所有者对离开本机的内容零意外"
- `FR-010`/`FR-020`（卡片与详情的公开字段口径，确保预览=未来公开所见）、`ENT-004` `Manifest`、`ENT-003` `KnowledgeModule`
- `INV-01`/`INV-04`（公开面不含私有内容/私有 URL）、`DEC-010`/`INV-03`（联系方式默认不公开）、`NFR-001`
- `UI-003` `ModuleCard`（标题、脱敏摘要、来源统计、主题标签、信任信号、CTA）；本步信任信号区为"新模块/待发布"占位

### Route or surface ID

- 路由：`/submit/preview`（草稿态 `/submit/{submissionId}/preview`）。
- 由 `PAGE-022`（通过隐私门）进入；可经 `Stepper` 回退。
- 表面：上=发现页风格的 `ModuleCard` 预览；下=模块详情公开面预览（脱敏摘要、来源统计、主题标签、隐私边界、Manifest 公开视图）；明确分隔"公开可见 / 不公开"两区。

### Data required

- 脱敏 `Manifest`（`ENT-004`）公开字段：`title`、`summary`、`topics`/`tags`、`source_types`（→来源统计）、`freshness`、`sensitivity`、`redaction_notes`（内容承诺/隐私边界）、`license`、`updated_at`、`version`。
- `KnowledgeModule` 派生占位：信任级别（新模块=未建立）、交换/收藏/反馈计数（=0，新模块）。
- 明示"不公开"清单：`contact`（联系方式，`DEC-010`）、任何 block 已被移除项、原始内容（从不存在，`INV-01`）。

### Actions

- 切换「卡片视图 / 详情视图」。
- 「上一步」（回 `PAGE-022`）、「保存草稿」。
- 「编辑清单」：跳回 `PAGE-021`（改动后需经 `PAGE-022` 重跑隐私门，强约束不可跳过）。
- 「下一步」（`PrimaryButton`）：进入 `PAGE-024` 提交确认。

### States

- `preview-ready`（渲染公开卡片与详情）。
- `stale`（若回改 Manifest 未重过隐私门：提示需回第 3 步重跑，禁止前进——保持强约束一致性）。
- `loading` / `error`。

### Validation and error behavior

- 一致性约束：进入本步前提是 `PAGE-022` 已 pass/warn 并同意；若检测到 Manifest 在隐私门之后被改动，置 `stale` 并要求回 `PAGE-022` 重跑（`INV-02` 不被绕过）。
- 公开预览渲染器与 `IA-002`/`IA-003` 公开字段口径一致；不渲染任何标记为私有的字段（`INV-04`）。
- 联系方式区显式标注"默认私密，仅交换被接受后对对方披露"（`DEC-010`/`INV-03`）。

### Telemetry or analytics

- 聚合、无 PII（`INV-09`）。事件：`submit_step_completed{step:4}`、`submit_preview_viewed{view: card|detail}`、`submit_back_to_edit_clicked`。不上报预览内容（`NFR-001`）。

### Acceptance checks

- 预览只显示脱敏公开字段，且与 `IA-002`/`IA-003` 公开口径一致（`FR-010`/`FR-020`）。
- 联系方式不出现在公开预览，并有"默认私密"说明（`DEC-010`/`INV-03`）。
- 回改 Manifest 后无法直接到提交，必须重过隐私门（`stale` → 回 `PAGE-022`，`INV-02`）。
- 预览中不出现任何私有 URL / 原始内容（`INV-01`/`INV-04`）。

---

## `PAGE-024` 第 5 步：提交确认

### Artifact metadata

- Stage: `08-page-spec`
- Status: `passed（2026-06-23 用户签字）`
- Upstream IDs: `IA-004`、`FR-030`、`FR-090`、`FR-100`、`FLOW-001`、`FLOW-005`、`FLOW-007`、`ENT-006`、`ENT-021`、`ENT-018`、`NFR-005`、`NFR-006`、`INV-08`、`INV-11`、`UI-003`（`ConsentGate`/`PrimaryButton`/`StatusPill`/`Card`/`Stepper`）
- Decision IDs: `DEC-012`
- Manifest status: `passed（2026-06-23 用户签字）`

### Page purpose

第 5 步：最终**提交确认**。汇总将提交的内容（脱敏 Manifest 摘要、隐私门结果、来源类别），出示**公开提交同意门**（`NFR-005`，区别于第 1 步的生成同意与第 3 步的隐私同意），所有者确认后将 `Submission`（`ENT-006`）由 `Draft → Submitted`，进入评审队列（`FLOW-005`/`IA-011`）。本步还说明后续将**准备私下交换包**（依 `FR-030` 末环节与 `ASM-007`：默认 GitHub 私有仓库；该准备发生在被交换接受后，本步仅告知机制，不在此上传内容，`INV-01`）。提交写入 `Consent`（动作=提交）与 `AuditLog`（`INV-08`/`INV-11`）。

### Upstream requirement links

- `FR-030`「提交→准备私下交换包」、`FLOW-001` 末环节「所有者同意 → 提交平台进入评审」、`FLOW-007`「公开提交需同意门"、`FLOW-005`（提交进入评审队列，`IA-011`）
- `FR-090`（提交记录隐私门结论）、`FR-100`（提交进入评审）、`NFR-005`（公开提交前同意）、`NFR-006`（抗滥用：身份核查、唯一性、速率限制、审计）
- `ENT-006` `Submission`（`Draft → Submitted`）、`ENT-021` `Consent`（动作=提交）、`ENT-018` `AuditLog`、`INV-08`/`INV-11`
- `ASM-007`（私下交付主通道 GitHub 私有仓库；准备发生在被接受后，平台不持有内容，`INV-01`）

### Route or surface ID

- 路由：`/submit/confirm`（草稿态 `/submit/{submissionId}/confirm`）。
- 由 `PAGE-023` 进入；可经 `Stepper` 回退。
- 提交成功后路由到结果态（同页 success 区或个人中心 `IA-009` 「我的模块/草稿」并以 `StatusPill` 显示 `Submitted/InReview`）。
- 表面：提交摘要 `Card`（模块标题、来源类别、隐私门 `StatusPill` 结果）+ 隐私边界/内容承诺回顾 + 私下交换机制说明 `Card`（GitHub 私有仓库，`ASM-007`）+ 底部公开提交 `ConsentGate` + 「提交」`PrimaryButton`。

### Data required

- `Submission`（`ENT-006`）：当前草稿、关联 Manifest 版本、`PrivacyScan` 结论（`overallStatus`、计数）。
- 提交摘要：模块标题、来源类别、隐私门结果（pass/warn）、Manifest 版本号。
- 私下交换机制说明（静态文案，引用 `ASM-007`/`private_exchange_options`）。
- `Consent` 待写（动作=提交、范围=该 Submission/Manifest 版本）、`AuditLog` 待写（提交动作）。
- 速率限制/唯一性校验所需上下文（`NFR-006`）：当前用户近期提交次数（用于限流提示，仅状态不含内容）。

### Actions

- 勾选公开提交同意（`ConsentGate`：明确"我确认在所有者同意下公开提交此脱敏清单"）。
- 「提交」（`PrimaryButton`，二次确认——破坏性/对外动作需确认，`UI_RULES` 组件行为规则）：写 `Consent`+`AuditLog`，`Submission Draft → Submitted`，入评审队列。
- 「上一步」（回 `PAGE-023`）、「保存草稿」。
- 提交后：「去个人中心查看状态」（`IA-009`）、「查看提交进度」。

### States

- `review-summary`（待确认）/ `consent-required`（未勾选公开提交同意，「提交」禁用）。
- `submitting`（loading）/ `submitted-success`（成功，显示 `Submitted/InReview` 状态与后续说明）。
- `rate-limited`（触发速率限制：提示稍后再试，`NFR-006`）。
- `block-guard`（防御态：若因任何原因 `overallStatus=block`，禁止提交并指回 `PAGE-022`，`INV-02`）。
- `error`（提交失败 / 会话过期）。

### Validation and error behavior

- 服务端二次确认隐私门结论非 `block` 方接受提交（前后端一致，`INV-02` 不被绕过）。
- 未勾选公开提交同意 → 「提交」禁用（`NFR-005`/`INV-08`）。
- 抗滥用（`NFR-006`）：身份核查（GitHub 登录）、提交唯一性/重复提交防护、速率限制（超限 `rate-limited`）。
- 提交成功必须写入 `Consent`（动作=提交）与 `AuditLog`（`INV-08`/`INV-11`）。
- 私下交换包不在本步上传任何内容（仅说明机制，`INV-01`）。

### Telemetry or analytics

- 聚合、无 PII（`INV-09`/`FLOW-008`）。事件：`submit_confirm_consent_given`、`submission_submitted{privacyOverall: pass|warn}`、`submit_wizard_completed`、`submit_rate_limited`。
- 维度仅含隐私门分级、是否限流；**不上报** Manifest 内容、标题、来源具体值（`NFR-001`）。该事件计入 `IA-013` 平台统计的"模块/提交"聚合（`FR-140`）。

### Acceptance checks

- 未勾选公开提交同意时「提交」禁用；勾选后可提交（`NFR-005`）。
- 提交成功后 `Submission` 变为 `Submitted/InReview` 并进入评审队列 `IA-011`（`FLOW-005`）。
- 提交写入 `Consent`（动作=提交）与 `AuditLog`（`INV-08`/`INV-11`，可由 `IA-014` 同意记录与 `IA-011` 审计侧验证）。
- 若隐私门结论为 block，本步前后端均禁止提交（`block-guard`，`INV-02`）。
- 触发速率限制时给出 `rate-limited` 提示而非静默失败（`NFR-006`）。
- 私下交换机制仅以说明呈现，不在本步上传内容（`ASM-007`/`INV-01`）。
- 二次确认对话框出现于「提交」这一对外动作（`UI_RULES` 组件行为规则）。

---

## 跨步骤约束（向导级，适用于全部 PAGE-020~024）

- **线性 + 强约束**：步骤线性推进，`Stepper` 未来步不可跳入；隐私门（`PAGE-022`）block 态是不可绕过的硬墙（`INV-02`/`FR-090`），且其后任意 Manifest 改动都使隐私同意失效、需重跑（`PAGE-023` `stale`、`PAGE-024` `block-guard`）。
- **三个同意门**（均写 `Consent`/`ENT-021`，满足 `INV-08`/`NFR-005`）：①第 1 步生成范围同意 ②第 3 步隐私同意（warn 需勾选）③第 5 步公开提交同意。三者动作类型不同，分别证明"生成触及范围""保留警告下提交""公开提交"经所有者批准。
- **数据最小化**：全程不采集/不上传原始知识内容、私有路径、凭据、私有嵌入向量、未脱敏第三方个人数据（`NFR-001`/`INV-01`）；扫描在本机由 Agent 技能执行（`FR-080`）。
- **草稿可恢复**：任一步「保存草稿」，可深链恢复到对应步（`ENT-006` `step`）。
- **无障碍底线**（`NFR-007`）：状态非仅颜色（`StatusPill`+文字+图标）、键盘可达 `Stepper` 与同意门、表单 label 关联、对比度 ≥4.5:1、焦点态主色描边。
- **设计系统锚定**（`UI-001`/`UI-002`/`UI-003`/`DEC-012`）：`Stepper`/`ConsentGate`/`Card`/`ModuleCard`/`StatusPill`/`IconChip`；图标仅 Material Symbols Outlined；Manifest/JSON 用 `JetBrains Mono`；主色 `#017A6E`；语义色 success/warning/danger 对应 pass/warn/block。

---

## 拟新增假设（未写入 `DEFAULT_ASSUMPTIONS.md`，待编排者登记）

| ASM ID（拟） | 假设 | 若有误的风险 | 确认负责人 | 重新审视触发 |
| --- | --- | --- | --- | --- |
| `ASM-026` | 提交向导为 **5 步**（选类型/来源 → 生成/导入清单 → 隐私门 → 卡片预览 → 提交确认），与设计图左侧 `Stepper` 及 `FLOW-001` 环节一一对应；设计图定格的"第 3 步：隐私 Gate 校验"即第 3 步 | 若设计图实际意图为更细/更粗的步数（如把"生成"与"导入"拆成两步），PAGE 划分需调整 | user / 设计 | 设计像素级核对或用户确认步数 |
| `ASM-027` | 向导子路由采用 `/submit/{source,manifest,privacy-gate,preview,confirm}`，草稿态加 `{submissionId}` 段 | 若实现采用单页分步（无子路由）或不同命名，路由契约需改 | agent | 前端路由 / 服务契约阶段 |
| `ASM-028` | `PrivacyScan` 在**本机**由 Agent 技能 / MCP 执行，平台仅接收/展示脱敏后的 `findings` 与脱敏 Manifest，不接收命中的原始私有值 | 若隐私扫描需在服务端执行，则与 `INV-01`（不托管原始内容）冲突，需重新设计扫描边界 | user / 隐私 | 服务契约 / Agent 技能契约阶段（`HARD-01`/`PKG-003`/`PKG-006`） |
| `ASM-029` | 向导设三个同意门（生成范围 / 隐私 / 公开提交），各写一条 `Consent`；其中隐私门 warn 态以"勾选复选框"作为显式同意载体 | 若产品只需单一提交同意或不同粒度，`Consent` 记录条数与 `IA-014` 同意记录展示需调整 | user | 业务流程复核 / `FLOW-007` 细化 |
| `ASM-030` | 「准备私下交换包」（GitHub 私有仓库，`ASM-007`）在提交确认步**仅作机制说明**，实际打包发生在交换被接受后（交换模块负责），本向导不上传任何内容 | 若产品要求提交时即创建私有仓库脚手架，则需在本向导加入打包步骤并复核 `INV-01` 边界 | user | 交换模块 / Agent 技能契约阶段 |

---

## 质量门自检（gates/06-page-spec-gate.md）

```text
Gate: 06-page-spec-gate
Status: pass（内容自检）— 待用户确认（Status: passed（2026-06-23 用户签字））
Evidence:
  - aies/02-design/submission/PAGE_SPEC.md 对照 PRODUCT_SPEC.md(FR-030/FR-090/NFR-005/NFR-001)、
    IA_SPEC.md(IA-004 定义、权限敏感界面、内容层级"流程面")、UI_RULES.md(UI-003 Stepper/ConsentGate/Card、
    UI-001 语义色与 JetBrains Mono)、LIGHT_DOMAIN_MODEL.md(ENT-006/005/004/003/021、INV-01/02/08/11)、
    BUSINESS_FLOW.md(FLOW-001 状态机与决策点/失败路径、FLOW-007 同意门)、
    docs/design/know-share-submit-module.png(第 3 步隐私 Gate 校验主屏 + 左侧 Stepper)、
    examples/knowledge-module.manifest.json(Manifest 字段集)
Findings:
  - 每个 PAGE(020~024) 均含模板 9 字段(purpose/upstream/route/data/actions/states/validation/telemetry/acceptance)。✅
  - 每页/数据/动作追溯 IA-004/FR-030/FR-090/FLOW-001/FLOW-007/ENT-*/NFR-005，无无法追溯内容。✅
  - 隐私门(PAGE-022)为强约束:block 禁止继续(INV-02)、warn 需显式同意(NFR-005);本地审阅、脱敏后才离开本机(INV-01)。✅
  - ConsentGate 三态用语义色 success/warning/danger(UI-001);状态非仅颜色(NFR-007)。✅
  - Manifest 预览用脱敏 JSON + JetBrains Mono 等宽字(UI-001)。✅
  - Telemetry 仅聚合、无 PII，对齐 FR-140/FLOW-008/INV-09。✅
  - 锚定 UI-001/UI-002/UI-003 组件与令牌。✅
  - 无仅因设计图包含而存在的页面(5 步均映射 FLOW-001 环节 + IA-004)。✅
  - 拟新增假设 ASM-026~030 已标注并集中列出,未改 DEFAULT_ASSUMPTIONS.md。✅
Hard-limit note: 5 个 PAGE 对应单一多步向导(IA-004),非界面膨胀;广度由 FLOW-001 的 5 环节与设计图 Stepper 支撑。
Decision: continue（内容自检通过）→ 待用户确认 IA-004 步骤划分与新增假设 → 转 passed
```
