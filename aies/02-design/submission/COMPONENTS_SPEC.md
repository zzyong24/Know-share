# 组件规格 — 提交模块向导（submission / IA-004）

## 摘要

本产物定义提交模块向导（`IA-004`，5 步向导 `PAGE-020~024`）的**模块特有组件**，ID 段 `COMP-070~089`。共享组件（`COMP-001~040`，由 `aies/02-design/_shared/COMPONENTS_SPEC.md` 拥有）只**引用其 ID，不在此重定义**：本模块大量复用 `COMP-019 Stepper`、`COMP-020 ConsentGate`、`COMP-024 CodeBlock`、`COMP-009 Card`、`COMP-010 ModuleCard`、`COMP-011 StatusPill`、`COMP-013 IconChip`、`COMP-007/008 Primary/SecondaryButton`、`COMP-021 EmptyState`、`COMP-022 TopicChip`、`COMP-025 ConfirmDialog`、`COMP-029 Toast`、`COMP-030 FormField`、`COMP-033 Skeleton`。

向导的核心硬约束在 UI 层物理落地于本模块组件：隐私门 `block` 不可绕过（`INV-02`）、`warn` 须显式同意（`NFR-005`）、三个同意门各写一条 `Consent`（`INV-08`/`ASM-029`）、全程不采集/不上传原始内容、隐私扫描在本机执行（`INV-01`/`NFR-001`/`ASM-028`）。

### 产物元数据

- Stage: `09-frontend-spec`（模块组件规格扇出）
- Status: `passed（2026-06-23 用户签字）`
- 模块: submission（提交模块向导 + 隐私门），覆盖界面 `IA-004`、页面 `PAGE-020~024`
- COMP 段（模块特有）: `COMP-070~089`（依 `FRONTEND_SPEC.md` §7 分配；本批用 `COMP-070~078`，`COMP-079~089` 预留）
- 引用的共享组件: `COMP-007`、`COMP-008`、`COMP-009`、`COMP-010`、`COMP-011`、`COMP-013`、`COMP-019`、`COMP-020`、`COMP-021`、`COMP-022`、`COMP-024`、`COMP-025`、`COMP-029`、`COMP-030`、`COMP-033`
- Upstream IDs: `PAGE-020`~`PAGE-024`、`IA-004`、`FR-030`、`FR-080`、`FR-090`、`FR-100`、`FLOW-001`、`FLOW-005`、`FLOW-007`、`ENT-003`、`ENT-004`、`ENT-005`、`ENT-006`、`ENT-016`、`ENT-018`、`ENT-021`、`NFR-001`、`NFR-005`、`NFR-006`、`NFR-007`、`INV-01`、`INV-02`、`INV-03`、`INV-08`、`INV-11`、`HARD-01`、`UI-001`、`UI-002`、`UI-003`
- Decision IDs: `DEC-010`（联系方式默认私密）、`DEC-012`（Material Symbols Outlined 规范图标族）、`DEC-014`（Next.js + TS + Tailwind + shadcn/ui）
- 锚定栈（`DEC-014`/`FRONTEND_SPEC`）: shadcn/ui + Tailwind（令牌见 `UI-001`）、表单 react-hook-form + zod、单一图标族 Material Symbols Outlined（实现以 `lucide-react` 1:1 等价替换，`UI-002`/`ASM-066`）、JetBrains Mono 等宽代码块
- 本模块沿用页面阶段假设: `ASM-026`（5 步）、`ASM-027`（子路由）、`ASM-028`（本机扫描）、`ASM-029`（三同意门）、`ASM-030`（私下交换包仅说明）；新增组件级假设 `ASM-081`~`ASM-084`（见文末，未写入 `DEFAULT_ASSUMPTIONS.md`，待编排者登记）

### 组件契约字段（每个 COMP 均含 8 字段）

1. **职责与边界**（responsibility/boundary）
2. **Props**（输入属性）
3. **Events**（向上回调 / 触发的副作用）
4. **States**（可视/交互状态，对齐所属 PAGE 的 States）
5. **数据形状**（data，对齐 `ENT-*`，MOCK 期望；阶段 10 `MOCK_DATA_SPEC` 细化）
6. **依赖**（dependencies：引用的共享 `COMP-*` 与模块内 `COMP-*`）
7. **无障碍**（a11y，落地 `NFR-007`）
8. **测试要点**（tests，断言不变量；阶段 9/12 落到 Vitest/Playwright）

### COMP 索引

| COMP ID | 组件 | 落于 PAGE | 一句话职责 |
| --- | --- | --- | --- |
| `COMP-070` | `SubmitWizard` | PAGE-020~024（外壳） | 向导外壳：组合 `COMP-019 Stepper` + 步骤内容区 + `COMP-078 WizardNav`，持有跨步状态与线性/强约束守卫 |
| `COMP-071` | `SourceTypePicker` | PAGE-020（第 1 步） | 选模块类型（单选）+ 来源类别（多选）+ 标题/一句话用途采集 |
| `COMP-072` | `ManifestBuilder` | PAGE-021（第 2 步） | 本地生成 / 导入 JSON 双路径 + 等宽 Manifest 编辑器（用 `COMP-024 CodeBlock`）+ 结构校验 |
| `COMP-073` | `AgentSkillCard` | PAGE-021（第 2 步右栏） | 展示可用本机 Agent 技能 / MCP（`ENT-016`），跳 `IA-008` 安装；只读 |
| `COMP-074` | `PrivacyGatePanel` | PAGE-022（第 3 步） | 隐私门强约束容器：左脱敏 Manifest 预览 + 右 `COMP-075` + 底 `COMP-020 ConsentGate`（pass/warn/block） |
| `COMP-075` | `PrivacyFindingList` | PAGE-022（第 3 步右栏） | 按 pass/warn/block 分组渲染 `PrivacyScan.findings`，每项定位+泛化建议，不回显原始私有值 |
| `COMP-076` | `SubmitPreviewCard` | PAGE-023（第 4 步） | 公开卡片 / 详情双视图预览（用 `COMP-010 ModuleCard`），显式分隔"公开可见 / 不公开" |
| `COMP-077` | `SubmitConfirmPanel` | PAGE-024（第 5 步） | 提交摘要 + 私下交换机制说明 + 公开提交 `COMP-020 ConsentGate` + 二次确认 `COMP-025` |
| `COMP-078` | `WizardNav` | PAGE-020~024（外壳底部） | 统一「上一步 / 保存草稿 / 下一步（或提交）」导航条，承载按步禁用规则 |
| `COMP-079`~`COMP-089` | 预留 | — | 按需（如脱敏 diff 视图、扫描进度条特化等） |

---

## `COMP-070` `SubmitWizard`（向导外壳）

### Artifact metadata

- Upstream IDs: `PAGE-020`（外壳约束）、`PAGE-021`~`PAGE-024`、`IA-004`、`FR-030`、`FLOW-001`、`FLOW-007`、`ENT-006`、`INV-02`、`INV-08`、`NFR-005`、`NFR-007`、`UI-003`
- 引用共享组件: `COMP-001 AppShell`（由外层布局提供）、`COMP-019 Stepper`、`COMP-029 Toast`、`COMP-033 Skeleton`

### 1. 职责与边界

提交向导的**外壳与状态编排者**。组合左侧 `COMP-019 Stepper`（5 步竖向）+ 右侧当前步内容区（按 `currentStep` 渲染 `COMP-071`/`COMP-072`+`COMP-073`/`COMP-074`/`COMP-076`/`COMP-077`）+ 底部 `COMP-078 WizardNav`。持有跨步草稿状态（关联一条 `Submission`/`ENT-006`）与**步进守卫**：线性推进、未来步不可跳入、隐私门后任意 Manifest 改动使隐私同意失效需重跑。**边界**：只编排导航与跨步状态/守卫，不渲染具体步内字段（交给各步组件），不做隐私扫描本身（交 `COMP-074`/本机技能），不直接发提交请求（提交动作在 `COMP-077`）。不碰其他模块、不重定义共享组件。

### 2. Props

| prop | 类型 | 说明 |
| --- | --- | --- |
| `submissionId` | `string \| null` | 草稿恢复时传入（深链 `/submit/{submissionId}/...`，`ASM-027`）；null=新建 |
| `initialStep` | `1\|2\|3\|4\|5` | 路由解析的初始步（规范化自子路由 source/manifest/privacy-gate/preview/confirm） |
| `steps` | `WizardStepMeta[]` | 5 步标题/索引/子路由常量（前端常量） |
| `submissionDraft` | `SubmissionDraft \| null` | 已加载草稿（含 module 字段、manifest、privacyScan、各 consent 状态） |
| `currentUser` | `UserSummary` | GitHub 登录态（外壳右上角，受保护路由保证已登录） |

### 3. Events

- `onStepChange(step)`：步进变更（更新 URL searchParams/子路由深链）。
- `onSaveDraft(payload)`：保存草稿（持久化 `Submission(Draft)` + `step`）。
- `onExit()`：退出向导（保存后去 `IA-009`）。
- 副作用：进入向导即创建/恢复 `Submission(Draft)`；遥测 `submit_wizard_started`。

### 4. States

- `loading`（创建/恢复 Submission 中 → `COMP-033 Skeleton`）；`ready`；`restored-draft`（回填）；`error`（会话过期 → 重新登录回跳；保存失败）。
- 派生步态传给 `COMP-019 Stepper`：当前步=主色高亮、已完成步=打勾可回退、未来步=置灰不可跳入。
- `gate-stale`（隐私门通过后 Manifest 被改 → 标记需回 `PAGE-022` 重跑，向下传给 `COMP-076`/`COMP-077`/`COMP-078` 以禁用前进）。

### 5. 数据形状（data）

```ts
type SubmissionDraft = {
  id: string;
  status: 'Draft';                      // ENT-006 状态机起点
  step: 1|2|3|4|5;                       // 可恢复进度
  module: {                             // ENT-003 草稿字段（第1步）
    title: string; oneLineIntent: string;
    moduleType: string; sourceTypes: SourceType[];
  };
  manifest: ManifestDraft | null;        // ENT-004（第2步）
  privacyScan: PrivacyScanResult | null; // ENT-005（第3步）
  consents: {                            // ENT-021，三同意门（ASM-029）
    generateScope?: ConsentRef;          // 第1步：生成触及范围
    privacy?: ConsentRef;                // 第3步：隐私同意
    publicSubmit?: ConsentRef;           // 第5步：公开提交
  };
  manifestHashAtScan?: string;           // 用于 gate-stale 检测（改动失效）
  updatedAt: string;
};
```
- **不含**任何原始内容/私有路径/凭据（`NFR-001`/`INV-01`）。MOCK 由阶段 10 提供恢复草稿、新建两场景。

### 6. 依赖

- 共享：`COMP-019 Stepper`、`COMP-029 Toast`、`COMP-033 Skeleton`（`COMP-001 AppShell` 由 `(auth)/submit` 段布局提供）。
- 模块内：`COMP-071`~`COMP-077`（按步渲染）、`COMP-078 WizardNav`。

### 7. 无障碍（NFR-007）

- `Stepper` 键盘可达，当前步 `aria-current="step"`；已完成步可聚焦回退。
- 步内容区有 `role`/标题层级；步切换后焦点移到新步标题。
- 状态非仅颜色（步态含图标/文字）；错误用 `COMP-029 Toast` + 就近字段错误。

### 8. 测试要点（tests）

- 未完成当前步时 `Stepper` 未来步不可跳入（线性，`IA-004`）。
- 隐私门通过后改 Manifest → `gate-stale` 置位且前进被禁（`INV-02` 不被绕过）。
- 草稿保存后以 `submissionId` 深链恢复到对应步并回填（`restored-draft`）。
- 会话过期 → `error` 且不丢草稿。

---

## `COMP-071` `SourceTypePicker`（第 1 步：类型 / 来源选择）

### Artifact metadata

- Upstream IDs: `PAGE-020`、`IA-004`、`FR-030`、`FLOW-001`、`FLOW-007`、`ENT-003`、`ENT-006`、`ENT-021`、`NFR-001`、`NFR-005`、`NFR-007`、`INV-01`、`INV-08`、`UI-003`
- 引用共享组件: `COMP-030 FormField`、`COMP-022 TopicChip`（来源类别多选呈现）、`COMP-013 IconChip`（来源图标）、`COMP-007/008 Primary/SecondaryButton`（导航在 `COMP-078`，本组件不含）

### 1. 职责与边界

第 1 步表单：采集 `title`、`oneLineIntent`、`moduleType`（单选）与 `sourceTypes[]`（多选）。来源类别枚举对齐 `LIGHT_DOMAIN_MODEL` 外部引用（Obsidian / Logseq / Notion / Markdown / 语雀 / 飞书文档 / 本地文件夹 / 自定义）。在「下一步」被点时**向上请求出示生成范围同意门**（实际 Consent 写入由外壳/导航协调，`INV-08`）。**边界**：只采集分类信息，**绝不采集任何原始知识内容/私有路径/凭据**（`NFR-001`/`INV-01`）；不发请求、不渲染导航按钮。

### 2. Props

| prop | 类型 | 说明 |
| --- | --- | --- |
| `value` | `{ title; oneLineIntent; moduleType; sourceTypes }` | 受控值（rhf 表单状态） |
| `moduleTypeOptions` | `Option[]` | 类型枚举（常量/MOCK） |
| `sourceTypeOptions` | `SourceTypeOption[]` | 来源类别枚举 + 各自 `IconChip` 图标名 |
| `errors` | `FieldErrors` | rhf+zod 字段级错误 |
| `disabled` | `boolean` | loading 时禁用 |

### 3. Events

- `onChange(patch)`：任一字段变更回传外壳草稿。
- `onValidityChange(isValid)`：必填齐备性变更（驱动 `COMP-078` 的「下一步」禁用）。

### 4. States

- `empty` / `editing` / `restored-draft`（回填已选）。
- 字段级 `error`（`title` 空/超限、未选 `moduleType`、`sourceTypes` 为空）。

### 5. 数据形状（data）

```ts
type SourceType = 'obsidian'|'logseq'|'notion'|'markdown'|'yuque'|'feishu-doc'|'local-folder'|'custom';
type Step1Value = { title: string; oneLineIntent: string; moduleType: string; sourceTypes: SourceType[]; };
```
- 对齐 `ENT-003` 草稿字段与 `examples/knowledge-module.manifest.json` 的 `source_types`。

### 6. 依赖

- 共享：`COMP-030 FormField`、`COMP-022 TopicChip`、`COMP-013 IconChip`。
- 校验：zod schema（`title` 非空+长度上限、`moduleType` 必填、`sourceTypes` ≥1）。

### 7. 无障碍（NFR-007）

- 每个输入用 `COMP-030 FormField` 关联 label；多选用复选组（`role=group`+组标签）。
- 错误以文字+图标呈现（非仅颜色）；来源 `IconChip` 含可读文字标签。

### 8. 测试要点（tests）

- 必填未满足时 `onValidityChange(false)`（「下一步」被禁，`PAGE-020` 验收）。
- 表单不存在任何"原始内容/路径/凭据"输入项（`NFR-001`/`INV-01` 结构断言）。
- 回填草稿后已选类型/来源正确显示（`restored-draft`）。

---

## `COMP-072` `ManifestBuilder`（第 2 步：生成 / 导入 Manifest）

### Artifact metadata

- Upstream IDs: `PAGE-021`、`IA-004`、`FR-030`、`FR-080`、`FLOW-001`、`ENT-004`、`ENT-006`、`ENT-016`、`NFR-001`、`INV-01`、`INV-08`、`UI-001`（JetBrains Mono）、`UI-003`
- 引用共享组件: `COMP-024 CodeBlock`（等宽 Manifest 编辑器）、`COMP-027 Tabs`/分段控件（本地生成 | 导入 JSON）、`COMP-021 EmptyState`（skill-missing）、`COMP-008 SecondaryButton`（校验结构）、`COMP-011 StatusPill`（结构校验结果）
- Decision IDs: `DEC-010`（contact 默认私密提示）

### 1. 职责与边界

第 2 步核心：产出**脱敏公开摘要** `Manifest`（`ENT-004`）。两条路径：①**本地生成**（触发本机 Agent 技能 / MCP，前端只接收技能产出的脱敏 JSON 回填，**平台不执行、不接收原始内容**）；②**导入 JSON**（粘贴/上传 `.json` 解析回填）。中部为 `COMP-024 CodeBlock` 改造的可编辑等宽编辑器（行号、语法高亮、JetBrains Mono）。提供「校验清单结构」（client schema，**不等同隐私门**）。**边界**：结构校验只保证"可被隐私门处理"，隐私分级在 `COMP-074`/`PAGE-022`；本组件不上传原始内容、不做隐私判定。

### 2. Props

| prop | 类型 | 说明 |
| --- | --- | --- |
| `mode` | `'generate'\|'import'` | 当前路径 |
| `manifestDraft` | `ManifestDraft \| null` | 当前编辑值 |
| `step1Context` | `{ moduleType; sourceTypes }` | 作为本地生成提示输入 |
| `availableSkills` | `AgentSkill[]` | 本机可用技能（驱动 generate 与 skill-missing），渲染交给 `COMP-073` |
| `structureResult` | `{ valid: boolean; fieldErrors? } \| null` | 结构校验结果 |
| `isGenerating` | `boolean` | 本地技能生成中 |

### 3. Events

- `onModeChange(mode)`；`onGenerate()`（触发本机技能；**不传原始内容**）；`onImport(file\|text)`（解析回填）。
- `onManifestEdit(json)`；`onValidateStructure()`；`onValidityChange(canProceed)`（结构有效驱动「下一步」）。
- `onOpenSkillCatalog()`（跳 `IA-008`）。

### 4. States

- `empty`（两路径引导 + 技能卡）/ `generating`（loading，文案"在你本机生成，不上传原始内容"）/ `imported` / `editing`（未保存标记）/ `structure-valid` / `structure-invalid` / `skill-missing`（`COMP-021 EmptyState` 引导 `IA-008` 或改导入）/ `error`（解析失败/会话过期）。

### 5. 数据形状（data）

```ts
type ManifestDraft = {                  // 对齐 examples/knowledge-module.manifest.json + ENT-004
  id: string; title: string; summary: string;     // 脱敏摘要
  topics: string[]; tags?: string[];               // → ENT-020
  language?: string; owner_handle?: string;
  contact?: { type: string; value: string };       // DEC-010：默认私密，校验时标注
  exchange_intent?: string; sensitivity: string;    // 敏感度声明
  covered_questions?: string[];
  source_types: string[]; freshness?: string;       // 来源统计/新鲜度
  redaction_notes: string;                           // 内容承诺/脱敏说明
  private_exchange_options?: string[]; license?: string;
  updated_at: string; version?: string;
};
// 结构必填（client schema）：id,title,summary,topics,source_types,sensitivity,redaction_notes,updated_at
```

### 6. 依赖

- 共享：`COMP-024 CodeBlock`、`COMP-027 Tabs`、`COMP-021 EmptyState`、`COMP-011 StatusPill`、`COMP-008 SecondaryButton`。
- 模块内：`COMP-073 AgentSkillCard`（右栏）。

### 7. 无障碍（NFR-007）

- 编辑器可键盘聚焦；JSON 行内错误有文字定位（行/字段）非仅颜色。
- 分段控件 `role=tablist`；结构校验结果用 `COMP-011 StatusPill` 文字+色。

### 8. 测试要点（tests）

- 两路径均回填可编辑脱敏 Manifest；非法 JSON / 缺必填 → 结构无效且「下一步」禁用（`PAGE-021` 验收）。
- 无技能 → `skill-missing` 且可跳 `IA-008`（`FR-080`）。
- 含 `contact.value` → 出现"默认私密"提示（`DEC-010`/`INV-03`），不阻断结构校验。
- 编辑器用 JetBrains Mono（`UI-001`）；UI 明示"在本机生成"，无任何上传原始内容入口（`NFR-001`/`INV-01`）。

---

## `COMP-073` `AgentSkillCard`（第 2 步右栏：Agent 技能 / MCP）

### Artifact metadata

- Upstream IDs: `PAGE-021`、`FR-080`、`ENT-016`、`IA-008`、`UI-003`、`UI-002`、`NFR-001`
- 引用共享组件: `COMP-009 Card`、`COMP-013 IconChip`、`COMP-008 SecondaryButton`、`COMP-011 StatusPill`（隐私级别）

### 1. 职责与边界

只读展示本机可用的 Agent 技能 / MCP 工具条目（`ENT-016`：建清单/脱敏/验证/打包/提交反馈），含名称、隐私级别、支持来源类别、安装/文档链接（跳 `IA-008`）。对齐设计图右侧「Agent 技能 / MCP」卡。**边界**：纯展示 + 跳转，不执行技能（执行由 `COMP-072` 的 `onGenerate` 触发本机工具）、不接收原始内容。

### 2. Props

| prop | 类型 | 说明 |
| --- | --- | --- |
| `skills` | `AgentSkill[]` | 可用技能列表 |
| `selectedSkillId?` | `string` | 用于生成的技能 |

### 3. Events

- `onSelectSkill(id)`；`onOpenDoc(id)` / `onInstall(id)`（跳 `IA-008`，不在向导内安装）。

### 4. States

- `has-skills`（列表）/ `empty`（无可用技能，与 `COMP-072` 的 `skill-missing` 协同）/ `loading`。

### 5. 数据形状（data）

```ts
type AgentSkill = {                     // ENT-016
  id: string; name: string;             // 建清单/脱敏/验证/打包/提交反馈
  install?: string; docUrl?: string;
  privacyLevel: 'local-only'|'...';      // 隐私级别
  supportedSourceTypes: SourceType[];
};
```

### 6. 依赖

- 共享：`COMP-009 Card`、`COMP-013 IconChip`（Material Symbols Outlined 字形，`UI-002`）、`COMP-008 SecondaryButton`、`COMP-011 StatusPill`。

### 7. 无障碍（NFR-007）

- `IconChip` 含文字标签；外链按钮有 `aria-label`；隐私级别用文字+色。

### 8. 测试要点（tests）

- 安装/文档动作跳 `IA-008`，不在向导内执行安装。
- 无技能时呈现空态并与 `COMP-072` 联动。

---

## `COMP-074` `PrivacyGatePanel`（第 3 步：隐私 Gate 校验，强约束容器）

### Artifact metadata

- Upstream IDs: `PAGE-022`、`IA-004`、`FR-030`、`FR-090`、`FLOW-001`、`ENT-005`、`ENT-004`、`ENT-006`、`ENT-021`、`NFR-001`、`NFR-005`、`NFR-007`、`INV-01`、`INV-02`、`INV-08`、`HARD-01`、`UI-001`（语义色/等宽）、`UI-003`
- 引用共享组件: `COMP-020 ConsentGate`（pass/warn/block 三态，**强约束核心**）、`COMP-024 CodeBlock`（左侧脱敏 Manifest 预览）、`COMP-011 StatusPill`（总体级别）、`COMP-007 PrimaryButton`/`COMP-008 SecondaryButton`（运行/重跑）
- 模块内: `COMP-075 PrivacyFindingList`

### 1. 职责与边界

向导**强约束节点容器**。布局：左 = 脱敏 `Manifest` 预览（`COMP-024 CodeBlock`，等宽、带"跳回第 2 步编辑"）；右 = `COMP-075 PrivacyFindingList`（pass/warn/block 分组）；底 = `COMP-020 ConsentGate`。触发**本机** `PrivacyScan`（`ENT-005`，经 Agent 技能/MCP，`ASM-028`），平台仅接收/展示脱敏 `findings`，**不接收命中的原始私有值**（`INV-01`）。落地三态规则到 `ConsentGate`：

- `block`：「下一步」**永远禁用**，无任何旁路；仅「去修订（回第 2 步）」与「重跑」（`INV-02`，核心硬规则）。
- `warn`：须勾选显式同意复选框（"我已审阅并同意在保留这些警告项的情况下提交"），勾选后写一条隐私 `Consent` 才启用「下一步」（`NFR-005`/`INV-08`/`ASM-029`）。
- `pass`：仍须勾选同意（证明审阅过）并写 `Consent` 后可继续。

**边界**：不执行扫描算法本身（本机技能负责），不渲染发现项明细（交 `COMP-075`），不渲染步导航的「上一步/保存草稿」（在 `COMP-078`，但「下一步」启用条件由本面板的 gate 状态决定并上报）。

### 2. Props

| prop | 类型 | 说明 |
| --- | --- | --- |
| `manifest` | `ManifestDraft` | 脱敏 Manifest（左侧预览） |
| `scanResult` | `PrivacyScanResult \| null` | 扫描结果（null=未扫描） |
| `isScanning` | `boolean` | 扫描中 |
| `consentGiven` | `boolean` | 隐私同意是否已写 |
| `manifestChangedSinceScan` | `boolean` | 改动→旧结果失效，强制重跑 |

### 3. Events

- `onRunScan()`（本机重跑 `PrivacyScan`）；`onConsentToggle(checked)`（warn/pass 勾选 → 写隐私 `Consent`/`ENT-021`）。
- `onRevise()`（回 `PAGE-021` 定位字段修订）；`onGateStatusChange({ overallStatus, canProceed })`（上报给 `COMP-078`/外壳）。

### 4. States

- `idle`（未扫描）/ `scanning`（loading）。
- `result-pass`（绿）/ `result-warn`（橙）/ `result-block`（红，继续被禁）。
- `consent-required`（warn/pass 待勾选）/ `consent-given`（可继续）。
- `revising`（修订后返回需重跑 → 回 `idle/scanning`）/ `error`（扫描失败/技能不可用，引导 `IA-008`；**不默认放行**）。

### 5. 数据形状（data）

```ts
type FindingSeverity = 'pass'|'warn'|'block';
type RuleCategory = 'secret/credential'|'email'|'path'|'private-url'
  |'long-excerpt'|'third-party-pii'|'contact-exposure';     // HARD-01 / FR-090
type PrivacyFinding = {
  ruleCategory: RuleCategory; severity: FindingSeverity;
  locationRef: string;        // 指向 Manifest 字段/位置，非原始私有值全文（INV-01/INV-04）
  suggestion: string;         // 泛化/脱敏建议
  explanation: string;
};
type PrivacyScanResult = {     // ENT-005
  findings: PrivacyFinding[];
  sensitivityDeclaration: string;
  overallStatus: FindingSeverity;   // 取最严重级别
  scannedAt: string; scannerVersion: string;
};
```

### 6. 依赖

- 共享：`COMP-020 ConsentGate`、`COMP-024 CodeBlock`、`COMP-011 StatusPill`、`COMP-007/008`。
- 模块内：`COMP-075 PrivacyFindingList`。
- 语义色（`UI-001`）：pass `--color-success #16A34A` / warn `--color-warning #D97706` / block `--color-danger #DC2626`。

### 7. 无障碍（NFR-007）

- 三态用 `StatusPill` + 语义色 + **文字**（非仅颜色）；同意复选框 label 关联、键盘可达。
- `block` 禁用的「下一步」有 `aria-disabled` + 文字说明"存在 N 项必须解决的阻断项"。
- 扫描中有 `aria-busy`/`aria-live` 播报结果级别。

### 8. 测试要点（tests）

- 含 ≥1 `block` → 「下一步」禁用且无旁路，仅可「去修订/重跑」（`INV-02`，核心验收）。
- 仅 `warn` → 必须勾选才启用「下一步」且勾选写一条隐私 `Consent`（`NFR-005`/`INV-08`）。
- 全 `pass` → 同意后可继续（仍写 `Consent`）。
- Manifest 改动后 `manifestChangedSinceScan` → 强制重跑方可继续（无陈旧同意）。
- 扫描失败 → 「下一步」保持禁用（不默认放行）。
- `locationRef` 不回显原始私有值全文（`INV-01`/`INV-04`）；预览用等宽 JSON（`UI-001`）。

---

## `COMP-075` `PrivacyFindingList`（第 3 步右栏：扫描发现列表）

### Artifact metadata

- Upstream IDs: `PAGE-022`、`FR-090`、`ENT-005`、`HARD-01`、`INV-01`、`INV-04`、`NFR-007`、`UI-001`、`UI-003`
- 引用共享组件: `COMP-011 StatusPill`、`COMP-013 IconChip`（规则类别图标）、`COMP-008 SecondaryButton`（"应用建议/去修订"）、`COMP-016 ListRow`

### 1. 职责与边界

按 `severity`（block→warn→pass 优先级）分组渲染 `PrivacyScan.findings`，每项显示：规则类别（`IconChip` + 文字）、命中位置（`locationRef` 指向 Manifest 字段，**不显示原始私有值全文**）、泛化/脱敏建议、说明，以及对 warn/block 项的「应用建议/去修订」动作（跳回 `PAGE-021` 定位字段）。**边界**：纯展示 + 逐项动作回调，不决定 gate 是否可继续（由 `COMP-074` 综合 `overallStatus` + consent 决定）。

### 2. Props

| prop | 类型 | 说明 |
| --- | --- | --- |
| `findings` | `PrivacyFinding[]` | 扫描发现项 |
| `sensitivityDeclaration` | `string` | 敏感度声明 |
| `counts` | `{ pass; warn; block }` | 分级计数 |

### 3. Events

- `onApplySuggestion(finding)` / `onReviseField(locationRef)`（跳回第 2 步定位字段）。

### 4. States

- `grouped`（按级分组）/ `empty`（无发现=全 pass 文案）。

### 5. 数据形状（data）

- 复用 `COMP-074` 的 `PrivacyFinding` / `PrivacyScanResult`（同一 `ENT-005` 契约）。

### 6. 依赖

- 共享：`COMP-011 StatusPill`、`COMP-013 IconChip`、`COMP-008 SecondaryButton`、`COMP-016 ListRow`。

### 7. 无障碍（NFR-007）

- 每组有标题与计数（文字）；级别非仅颜色（图标+文字+色）；动作按钮键盘可达 + `aria-label`。

### 8. 测试要点（tests）

- block 组排在最前并标注必须解决；每项展示泛化建议（`HARD-01`）。
- 任意项均不渲染原始私有值全文（`INV-01`/`INV-04` 断言）。

---

## `COMP-076` `SubmitPreviewCard`（第 4 步：卡片预览）

### Artifact metadata

- Upstream IDs: `PAGE-023`、`IA-004`、`FR-030`、`FR-010`、`FR-020`、`FLOW-001`、`ENT-004`、`ENT-003`、`NFR-001`、`INV-01`、`INV-04`、`UI-003`
- 引用共享组件: `COMP-010 ModuleCard`（卡片视图，与 `IA-002` 口径一致）、`COMP-009 Card`、`COMP-022 TopicChip`、`COMP-011 StatusPill`、`COMP-027 Tabs`（卡片/详情切换）、`COMP-024 CodeBlock`（Manifest 公开视图）
- Decision IDs: `DEC-010`（联系方式不公开）

### 1. 职责与边界

让所有者预览**离开本机后别人看到什么**：①卡片视图（`COMP-010 ModuleCard`，与发现页 `IA-002` 完全同口径）②详情公开面（脱敏摘要、来源统计、主题标签、隐私边界、Manifest 公开视图，与 `IA-003` 公开部分一致）。**严格只渲染脱敏 Manifest 的公开字段**，并显式分隔"公开可见 / 不公开"两区——`contact` 等私有项进"不公开"区并标注"默认私密，仅交换被接受后对对方披露"（`DEC-010`/`INV-03`）。**边界**：只读预览，不编辑（编辑跳回 `COMP-072`）；信任/交换/收藏计数为新模块占位（=0/未建立）。若检测到 Manifest 在隐私门后被改 → `stale`，前进被禁需回 `PAGE-022`（`INV-02` 不被绕过）。

### 2. Props

| prop | 类型 | 说明 |
| --- | --- | --- |
| `manifest` | `ManifestDraft` | 脱敏 Manifest（仅公开字段被渲染） |
| `view` | `'card'\|'detail'` | 当前视图 |
| `isStale` | `boolean` | 隐私门后是否被改动（需重过门） |

### 3. Events

- `onViewChange(view)`；`onEditManifest()`（跳 `PAGE-021`）；`onBackToGate()`（`stale` 时回 `PAGE-022`）。

### 4. States

- `preview-ready` / `stale`（提示回第 3 步重跑，禁止前进）/ `loading` / `error`。

### 5. 数据形状（data）

- 公开字段白名单：`title`、`summary`、`topics`/`tags`、`source_types`、`freshness`、`sensitivity`、`redaction_notes`、`license`、`updated_at`、`version`。
- 明示"不公开"：`contact`（`DEC-010`）、任何被移除的 block 项、原始内容（从不存在，`INV-01`）。

### 6. 依赖

- 共享：`COMP-010 ModuleCard`、`COMP-009 Card`、`COMP-022 TopicChip`、`COMP-011 StatusPill`、`COMP-027 Tabs`、`COMP-024 CodeBlock`。

### 7. 无障碍（NFR-007）

- 视图切换 `role=tablist`；"公开/不公开"分区有清晰标题与说明；联系方式区文字说明默认私密。

### 8. 测试要点（tests）

- 预览只显示公开字段且与 `IA-002`/`IA-003` 公开口径一致（`FR-010`/`FR-020`）。
- `contact` 不出现在公开区且有"默认私密"说明（`DEC-010`/`INV-03`）。
- 回改 Manifest → `stale` → 无法直接到提交，必须回 `PAGE-022`（`INV-02`）。
- 预览中无任何私有 URL / 原始内容（`INV-01`/`INV-04`）。

---

## `COMP-077` `SubmitConfirmPanel`（第 5 步：提交确认）

### Artifact metadata

- Upstream IDs: `PAGE-024`、`IA-004`、`FR-030`、`FR-090`、`FR-100`、`FLOW-001`、`FLOW-005`、`FLOW-007`、`ENT-006`、`ENT-021`、`ENT-018`、`NFR-005`、`NFR-006`、`NFR-007`、`INV-02`、`INV-08`、`INV-11`、`UI-003`
- 引用共享组件: `COMP-020 ConsentGate`（公开提交同意门）、`COMP-025 ConfirmDialog`（提交二次确认）、`COMP-009 Card`、`COMP-011 StatusPill`（隐私门结果回顾）、`COMP-007 PrimaryButton`、`COMP-029 Toast`
- Decision IDs: `DEC-012`

### 1. 职责与边界

最终提交确认。汇总提交摘要（模块标题、来源类别、隐私门 `StatusPill` 结果、Manifest 版本）+ 隐私边界/内容承诺回顾 + **私下交换机制说明卡**（GitHub 私有仓库，`ASM-007`；**仅说明机制，本步不上传任何内容**，`ASM-030`/`INV-01`）+ 底部**公开提交** `COMP-020 ConsentGate`（区别于第 1、3 步同意门，`ASM-029`）+ 「提交」`PrimaryButton`（经 `COMP-025 ConfirmDialog` 二次确认）。提交成功：写 `Consent`（动作=提交）+ `AuditLog`，`Submission Draft → Submitted`，入评审队列（`FLOW-005`/`IA-011`）。**边界**：防御态 `block-guard`——若 `overallStatus=block` 则禁止提交并指回 `PAGE-022`（前后端一致，`INV-02`）；限流由后端返回，组件呈现 `rate-limited`（`NFR-006`）。

### 2. Props

| prop | 类型 | 说明 |
| --- | --- | --- |
| `summary` | `{ title; sourceTypes; privacyOverall: 'pass'\|'warn'; manifestVersion }` | 提交摘要 |
| `privateExchangeNote` | `string` | 私下交换机制静态说明（`ASM-007`） |
| `consentGiven` | `boolean` | 公开提交同意是否勾选 |
| `submitState` | `'idle'\|'submitting'\|'submitted'\|'rate-limited'\|'block-guard'\|'error'` | 提交状态 |

### 3. Events

- `onConsentToggle(checked)`（写公开提交 `Consent`/`ENT-021`）；`onSubmit()`（经 `COMP-025` 二次确认后写 `Consent`+`AuditLog`，状态机 `Draft→Submitted`）。
- `onGoDashboard()` / `onViewProgress()`（提交后跳 `IA-009`）。

### 4. States

- `review-summary` / `consent-required`（未勾选 → 「提交」禁用）。
- `submitting`（loading）/ `submitted-success`（显示 `Submitted/InReview` + 后续说明）。
- `rate-limited`（`NFR-006` 提示稍后再试，非静默失败）/ `block-guard`（禁止提交指回 `PAGE-022`，`INV-02`）/ `error`。

### 5. 数据形状（data）

```ts
type ConsentRef = {                     // ENT-021
  id?: string; actionType: 'generate'|'submit'|'contact'|'exchange';
  scope: string;                        // 该 Submission/Manifest 版本
  at?: string;
};
```
- 提交成功写 `Consent(actionType:'submit')` + `AuditLog`（`INV-08`/`INV-11`）。

### 6. 依赖

- 共享：`COMP-020 ConsentGate`、`COMP-025 ConfirmDialog`、`COMP-009 Card`、`COMP-011 StatusPill`、`COMP-007 PrimaryButton`、`COMP-029 Toast`。

### 7. 无障碍（NFR-007）

- 同意复选框 label 关联、键盘可达；`COMP-025` 二次确认对话框焦点陷阱 + Esc 取消。
- 隐私门结果/提交状态用 `StatusPill` + 文字；`rate-limited` 有可读提示。

### 8. 测试要点（tests）

- 未勾选公开提交同意 → 「提交」禁用；勾选后可提交（`NFR-005`/`INV-08`）。
- 提交成功 → `Submission` 变 `Submitted/InReview` 入评审队列（`FLOW-005`/`IA-011`）；写 `Consent`(提交)+`AuditLog`（`INV-08`/`INV-11`）。
- `overallStatus=block` → `block-guard` 禁止提交并指回 `PAGE-022`（`INV-02`）。
- 限流 → `rate-limited` 提示而非静默失败（`NFR-006`）。
- 「提交」这一对外动作出现 `COMP-025` 二次确认（`UI_RULES` 组件行为规则）。
- 私下交换机制仅说明、本步不上传内容（`ASM-007`/`ASM-030`/`INV-01`）。

---

## `COMP-078` `WizardNav`（向导底部导航条）

### Artifact metadata

- Upstream IDs: `PAGE-020`~`PAGE-024`、`IA-004`、`FR-030`、`FLOW-001`、`INV-02`、`INV-08`、`NFR-005`、`NFR-007`、`UI-003`
- 引用共享组件: `COMP-007 PrimaryButton`（下一步/提交）、`COMP-008 SecondaryButton`（上一步/保存草稿/退出）

### 1. 职责与边界

向导 5 步统一的底部导航条：「上一步 / 保存草稿 / 下一步（末步=提交）」。**承载按步禁用规则**——「下一步」的可用性由当前步上报的有效性决定：第 1 步必填齐备、第 2 步结构校验通过、第 3 步非 block 且隐私同意已写、第 4 步非 stale、第 5 步公开提交同意已勾选。**边界**：纯导航控件，不持有业务校验逻辑（由各步组件/外壳计算并以 `canProceed` 传入），不渲染步内容。这是 `INV-02`（block 不可绕过）在导航层的强制点之一。

### 2. Props

| prop | 类型 | 说明 |
| --- | --- | --- |
| `step` | `1\|2\|3\|4\|5` | 当前步 |
| `canProceed` | `boolean` | 综合当前步守卫（外壳计算） |
| `canGoBack` | `boolean` | 是否可上一步（第 1 步无） |
| `isLastStep` | `boolean` | 末步则主按钮为「提交」 |
| `busy` | `boolean` | 保存/提交进行中 |

### 3. Events

- `onNext()` / `onBack()` / `onSaveDraft()` / `onExit()`（末步 `onNext` 语义即提交，由 `COMP-077` 处理实际提交）。

### 4. States

- `default` / `next-disabled`（`canProceed=false`，含 block 守卫）/ `busy`（loading）。

### 5. 数据形状（data）

- 无独立数据；仅消费外壳传入的步进/守卫布尔。

### 6. 依赖

- 共享：`COMP-007 PrimaryButton`、`COMP-008 SecondaryButton`。

### 7. 无障碍（NFR-007）

- 主 CTA 唯一主色（同屏不双主 CTA）；禁用态 `aria-disabled` + 文字说明禁用原因（如"存在阻断项"）；全部按钮键盘可达 + 焦点态主色描边。

### 8. 测试要点（tests）

- `canProceed=false`（含第 3 步 block）时「下一步/提交」禁用且无旁路（`INV-02`）。
- 第 1 步无「上一步」；末步主按钮文案为「提交」并触发 `COMP-077` 流程。
- 「保存草稿」在任一步可用并触发持久化。

---

## 跨组件约束（模块级，适用 COMP-070~078）

- **线性 + 强约束物理落地**：步进与未来步禁跳由 `COMP-070`/`COMP-019` 守卫；隐私门 block 不可绕过由 `COMP-074`（gate 态）+ `COMP-078`（禁用「下一步」）+ `COMP-077`（`block-guard`）三处共同强制（`INV-02`/`FR-090`）。隐私门后任意 Manifest 改动 → `COMP-076` `stale` + `COMP-077` `block-guard` + 强制重跑。
- **三个同意门各写一条 `Consent`**（`ENT-021`/`INV-08`/`NFR-005`/`ASM-029`）：①第 1 步生成范围（`COMP-071` 触发、外壳协调写入）②第 3 步隐私（`COMP-074` 勾选写入，warn 必须）③第 5 步公开提交（`COMP-077` 勾选写入）。
- **数据最小化**：所有组件 props/data **不含**原始知识内容、私有路径、凭据、私有嵌入向量、未脱敏第三方个人数据（`NFR-001`/`INV-01`）；隐私扫描在本机由 Agent 技能执行，平台仅收脱敏 `findings`（`ASM-028`/`FR-080`）。
- **联系方式默认私密**（`DEC-010`/`INV-03`）：`COMP-072` 提示、`COMP-076` 归入"不公开"区，公开面从不展示 `contact`。
- **遥测仅聚合无 PII**（`INV-09`）：组件触发的事件仅含步骤索引、模式/级别枚举、分级计数，不上报任何 Manifest 内容/标题/contact/locationRef 具体值（`NFR-001`）。
- **设计系统锚定**（`UI-001`/`UI-002`/`UI-003`/`DEC-012`/`DEC-014`）：shadcn/ui + Tailwind 令牌；单一图标族 Material Symbols Outlined（实现 `lucide-react` 1:1 替换，`ASM-066`）；Manifest/JSON 用 JetBrains Mono；主色 `#017A6E`；语义色 success/warning/danger 对应 pass/warn/block。
- **无障碍底线**（`NFR-007`）：状态非仅颜色（`StatusPill`+文字+图标）、键盘可达、表单 label 关联、对比度 ≥4.5:1、焦点态主色描边、扫描结果 `aria-live` 播报。

---

## 新增假设（未写入 `DEFAULT_ASSUMPTIONS.md`，待编排者登记）

| ASM ID（拟） | 假设 | 若有误的风险 | 确认负责人 | 重新审视触发 |
| --- | --- | --- | --- | --- |
| `ASM-081` | 模块组件契约采用 8 字段（职责/边界、props、events、states、data、依赖、a11y、tests），覆盖 `FRONTEND_SPEC` 的 props/events/states/a11y/data/tests 6 项并补"职责"与"依赖" | 若编排者要求别的字段集（如分离 events/副作用、加 i18n 字段），各 COMP 需补字段 | agent / 编排者 | 组件规格交叉审核 |
| `ASM-082` | 第 1 步生成范围 `Consent` 由 `COMP-071` 触发、外壳（`COMP-070`）协调写入，而非在 `COMP-071` 内直接写；`COMP-072 ManifestBuilder` 的本地生成动作受该已写 Consent 覆盖（`INV-08`） | 若产品要求生成动作在 `COMP-072` 内独立再次确认，则同意门位置与 Consent 条数需调整 | user / 业务流程 | `FLOW-007` 细化 / 服务契约阶段 |
| `ASM-083` | `gate-stale`/`stale` 通过对 Manifest 取哈希（`manifestHashAtScan`）在前端检测改动以失效隐私同意；后端在 `COMP-077` 提交时二次校验 `overallStatus≠block` | 若改动检测需更强（字段级 diff / 版本号绑定 Consent），需在服务契约定义失效语义 | agent | 服务契约阶段（`PKG-003`） |
| `ASM-084` | `COMP-072` 的等宽 Manifest 编辑器在 `COMP-024 CodeBlock`（只读+复制）基础上扩展为可编辑（行号/语法高亮/行内错误），属共享组件的受控扩展而非新共享组件 | 若 `CodeBlock` 不宜承载编辑态，需在 `_shared` 增一个 `CodeEditor` 共享组件或本模块新增 COMP | agent / 共享组件归属 | 共享组件规格确认（`ASM-065`） |

---

## 质量门自检（gates/07-frontend-spec-gate.md — submission 组件分项）

```text
Gate: 07-frontend-spec-gate（submission COMPONENTS_SPEC 分项）
Status: pass（内容自检）— 待交叉审核 + 用户确认
Evidence:
  - aies/02-design/submission/COMPONENTS_SPEC.md 对照 FRONTEND_SPEC.md(§6 共享 COMP-001~040、§7 段分配 COMP-070~089、栈 DEC-014)、
    submission/PAGE_SPEC.md(PAGE-020~024 的 purpose/data/actions/states/validation/telemetry/acceptance)、
    UI_RULES.md(UI-001 语义色与 JetBrains Mono、UI-003 Stepper/ConsentGate/Card/ModuleCard/StatusPill/IconChip、组件行为规则)、
    IA_SPEC.md(IA-004 强约束节点、权限敏感界面、内容层级"流程面")、
    LIGHT_DOMAIN_MODEL.md(ENT-003/004/005/006/016/018/021、INV-01/02/03/08/11)、
    BUSINESS_FLOW.md(FLOW-001 状态机/决策点/失败路径、FLOW-005、FLOW-007 三同意门)、
    ID_REGISTRY.md(COMP 前缀、各 ENT/INV/FR/IA/PAGE ID)
Findings:
  - 模块特有组件用本模块段 COMP-070~078，089 内预留；共享组件仅引用 ID 不重定义。✅
  - 每个 COMP 含 8 字段(职责/props/events/states/data/依赖/a11y/tests)。✅
  - 追溯 PAGE-020~024 / IA-004 / FR-030/090 / FLOW-001 / ENT-* / INV-01/02 / NFR-005；无无法追溯组件。✅
  - 隐私门强约束三处物理落地:COMP-074 gate 态 + COMP-078 禁用 + COMP-077 block-guard;block 不可绕过(INV-02)、warn 显式同意(NFR-005)。✅
  - 隐私扫描在本机(ASM-028);组件 props/data 不含原始内容/路径/凭据(NFR-001/INV-01)。✅
  - 锚定 shadcn/ui+Tailwind+单一图标族 Material Symbols Outlined(UI-002/DEC-012/DEC-014);Manifest 用 JetBrains Mono(UI-001)。✅
  - 三个同意门各写一条 Consent(ASM-029/INV-08);联系方式默认私密(DEC-010/INV-03)。✅
  - 遥测仅聚合无 PII(INV-09);无障碍底线 NFR-007 逐组件落地。✅
  - 未碰控制产物/他模块/共享 spec;仅写本文件;新增假设 ASM-081~084 已标注集中列出、未改 DEFAULT_ASSUMPTIONS.md。✅
Hard-limit note: 9 个 COMP(070~078) 对应单一多步向导(IA-004)的外壳+5 步特有职责+导航，无组件膨胀;广度由 FLOW-001 五环节与 PAGE-020~024 支撑。
Decision: continue（内容自检通过）→ 待 spec 交叉审核与编排者登记 COMP-070~078/ASM-081~084 → 用户确认
```
