# 组件规格 — Agent 技能目录（agent-skills 模块）

## 摘要

本产物把 agent-skills 模块的两张页面契约（`PAGE-050` 技能目录 / `PAGE-051` 技能详情子 surface）落成可实现的**模块特有组件**（`COMP-130~149`）。这些组件承载 `ENT-016` AgentSkill 的完整属性、`mcp.json` 安装配置、本地 CLI 示例命令、适配来源类别与本地优先隐私流程，全部在 `FRONTEND_SPEC.md` 既定技术栈（Next.js + TS + Tailwind + shadcn/ui）与共享组件库（`COMP-001~040`）之上组合而成。共享组件只**引用** `COMP-*` ID、不重复定义；模块特有组件用本模块段 `COMP-130~149`。所有组件遵循单一图标族（`IconChip` 内 Material Symbols Outlined，实现期 `lucide-react` 1:1 等价替换）、代码块等宽（`JetBrains Mono`）、零私有内容（`INV-01`/`INV-04`）、不自动越过同意门（`NFR-005`/`ASM-041`）。

### 产物元数据（8 字段）

- **Stage**: `09-frontend-spec`（组件规格扇出）
- **Status**: `passed（2026-06-23 用户签字）`
- **Module**: `agent-skills`
- **COMP 段（模块特有）**: `COMP-130~149`（本文件拥有；`COMP-140~149` 段位预留）
- **Upstream IDs**: `PAGE-050`、`PAGE-051`、`IA-008`、`FR-080`（`CAP-009`）、`ENT-016`、`NFR-001`、`NFR-002`、`NFR-005`、`NFR-007`、`INV-01`、`INV-02`、`INV-04`、`INV-08`、`INV-09`、`FLOW-001`、`FLOW-004`、`FLOW-007`、`FR-140`/`FLOW-008`、`UI-001~004`、`DEC-006`、`DEC-012`
- **引用共享组件（不重定义）**: `COMP-009` Card、`COMP-013` IconChip、`COMP-024` CodeBlock、`COMP-026` Drawer、`COMP-008` SecondaryButton、`COMP-011` StatusPill、`COMP-022` TopicChip、`COMP-021` EmptyState、`COMP-027` Tabs、`COMP-029` Toast、`COMP-033` Skeleton
- **新增假设**: `ASM-091`~`ASM-094`（见文末；未写入 `DEFAULT_ASSUMPTIONS.md`，待编排者登记）
- **关联**: `MOCK_DATA_SPEC`（阶段 10，技能/来源目录 MOCK）、`SERVICE_CONTRACT`（阶段 15，`GET /api/skills` 形状）、`TEST_PLAN`（阶段 12 前端验证）

> 边界声明：本文件**只写本模块特有组件**，不修改控制文件、不碰其他模块或共享 `_shared/COMPONENTS_SPEC.md`、不固化后端契约。共享组件的完整契约由 `aies/02-design/_shared/COMPONENTS_SPEC.md` 拥有。

---

## 组件契约（每个组件 8 字段：用途 / 落地与组合 / Props / Events·Actions / States / 数据·Data / 无障碍·a11y / 测试·Tests）

### `COMP-130` — `SkillCard`（技能卡）

- **用途**：技能总览网格中的单张技能卡，展示一个 `AgentSkill`（`ENT-016`）的摘要：着色图标徽 + 中英名 + runLocation 标签 + 一句描述 + 输入/输出 + "查看文档 →"。点击卡片主体打开 `PAGE-051` 详情（`COMP-133`）。追溯 `PAGE-050` 技能总览、`ENT-016`、`FR-080`。
- **落地与组合**：基于共享 `COMP-009 Card`（白底 + `--color-border` 描边 + `--shadow-card` + `--radius-card`）；卡头用共享 `COMP-013 IconChip`（浅底圆角方块 + 内嵌 Material Symbols Outlined 字形，按技能着色：create-manifest 主色 `description`、redact-knowledge info 蓝 `shield`、validate-manifest warning 橙 `verified`、package-private-repo 紫 `inventory_2`、submit-feedback danger 红 `rate_review`）；runLocation 用本模块 `COMP-134 SupportedSourceBadge` 的姊妹标记或共享 `COMP-011 StatusPill`（文字+色，非仅颜色）；文档链接用共享 `COMP-008 SecondaryButton`/链接。
- **Props**：`skill: AgentSkill`（`id`/`name`/`zhName`/`iconChip{glyph,tone}`/`runLocation`/`summary`/`input`/`output`/`docsUrl`/`privacyLevel`/`flowRef`）、`onOpenDetail?: (skillId) => void`、`onDocsClick?: (skillId) => void`、`compact?: boolean`。
- **Events·Actions**：点击卡片主体（非文档链接区）→ `onOpenDetail(skillId)`（打开 `COMP-133`）；点击"查看文档 →" → `onDocsClick(skillId)` 导航到 `docsUrl`；hover 轻微抬升（`--shadow-card`）。**非动作**：不执行技能、不读取本地、不发起提交/交换（`NFR-005`、`PROJECT_CONTEXT` 非目标）。
- **States**：`default`（全字段已渲染）；`loading`（→ 用 `COMP-033 Skeleton` 占位）；`docsUrl` 缺失 → 文档链接 `disabled` 态 + `title` 说明，不导向死链；`runLocation` 两态：`本地运行`（多数，主色/中性）/ `平台运行`（submit-feedback，区分色 + 文字）；hover/focus（主色描边可见）。
- **数据·Data**：单个 `AgentSkill`（`ENT-016`），来自平台只读目录（`GET /api/skills` 风格，契约阶段定）。不含任何用户 PII 或本地内容（`NFR-001`/`INV-01`）；按字段白名单渲染，异常含敏感字段则丢弃并告警（`FRONTEND_SPEC §8`）。
- **无障碍·a11y**：卡片为可聚焦可激活（`role` 合理、`Enter`/`Space` 打开详情）；runLocation 含文字标签非仅颜色（`NFR-007`）；图标徽装饰性 `aria-hidden`，名称为可读标签；对比度 ≥ 4.5:1。
- **测试·Tests**：渲染 5 种技能的图标徽/着色/runLocation 标签正确；点击主体触发 `onOpenDetail`、点击文档链接触发 `onDocsClick` 且不触发打开详情；`docsUrl` 缺失时链接 disabled；键盘可达与焦点可见断言（`NFR-007`）。

### `COMP-131` — `SkillGrid`（技能网格）

- **用途**：技能总览区的响应式卡网格，数据驱动渲染 N 张 `COMP-130 SkillCard`（设计图固定 5 项，但不硬编码，支持扩展 — 对齐 `PAGE-050` RISK 处置）。追溯 `PAGE-050` 技能总览、`UI_RULES` 响应式规则。
- **落地与组合**：CSS Grid 容器；桌面 `≥1280px` 5/4 列、平板 `768–1279px` 2 列、移动 `<768px` 1 列（`UI_RULES` 响应式、`ASM-016`）；空/错误态委托共享组件。
- **Props**：`skills: AgentSkill[]`、`isLoading?: boolean`、`error?: Error | null`、`onOpenDetail`、`onDocsClick`、`onRetry?: () => void`。
- **Events·Actions**：透传 `SkillCard` 的 `onOpenDetail`/`onDocsClick`；错误态"重试" → `onRetry`。
- **States**：`default`（N 卡网格）；`loading`（多张 `COMP-033 Skeleton` 卡占位）；`empty`（目录为空/未配置 → 共享 `COMP-021 EmptyState`：Material Symbols 图标 + "技能目录加载中或暂不可用" + 指向 `IA-012` 文档 / 仓库 `IA-013` 的次级链接）；`error`（区块级内联错误卡 + 重试，**不阻塞整页**，安装/命令静态区保持可用 — `PAGE-050` 降级可读）。
- **数据·Data**：`AgentSkill[]`，平台只读目录（`NFR-002` agent 可读）；不含 PII/本地内容。
- **无障碍·a11y**：网格语义合理（`role="list"`/列表项），键盘 Tab 顺序自然；空/错误态文案可读、CTA 键盘可达。
- **测试·Tests**：N=5 渲染 5 卡；`isLoading` 渲染骨架；空数组渲染 EmptyState；`error` 渲染错误卡 + 重试触发 `onRetry`；响应式列数随断点变化（视觉/快照）。

### `COMP-132` — `InstallSnippet`（安装命令片段）

- **用途**：渲染单条可复制的安装/示例内容（本地 CLI 命令行或安装说明），右上"复制命令"。用于"示例命令"区 5 条 CLI（`know-share create-manifest --notes ./my-notes` 等）及 `Skill 安装` Tab 文本。追溯 `PAGE-050` 示例命令/安装方式、`UI-002` 等宽字、`FR-140` 复制遥测。
- **落地与组合**：基于共享 `COMP-024 CodeBlock`（等宽 `JetBrains Mono` + 复制按钮）；本组件加技能上下文（可选关联 `skillId` 供遥测聚合）与单行/多行命令排版。
- **Props**：`command: string`、`label?: string`、`skillId?: string`（仅供聚合遥测，非渲染 PII）、`copyable?: boolean`（默认 true）、`language?: 'bash' | 'text'`。
- **Events·Actions**：点击"复制命令" → 复制 `command` 到剪贴板 → 触发 `example_command_copied`（按 `skillId` 聚合）；复制成功短暂内联"已复制"（`aria-live`）。
- **States**：`default`；`copy-success`（短暂"已复制"反馈）；`copy-failed`（剪贴板 API 失败 → 回退为选中文本 + 提示手动复制，**不静默失败** — `PAGE-050` 校验）。
- **数据·Data**：静态命令字符串（占位路径如 `./my-notes`/`./notes`）。**硬规则**：不得注入真实路径、密钥、私有 URL 或任何动态用户数据（`INV-01`/`INV-04`/`NFR-001` — `PAGE-050` 一致性/隐私不变量）。
- **无障碍·a11y**：代码块可键盘聚焦 + 复制（`PAGE-050` 验收）；复制按钮有 `aria-label`；复制反馈走 `aria-live`；等宽对比度达标。
- **测试·Tests**：复制写入剪贴板正确内容并触发遥测事件；剪贴板失败时回退选中 + 内联错误（断言不静默）；命令字符串只含占位路径（隐私不变量断言）；键盘聚焦+复制可达。

### `COMP-133` — `SkillDetailDrawer`（技能详情抽屉）

- **用途**：`PAGE-051` 子 surface 的实现，承载单个 `AgentSkill`（`ENT-016`）的全字段：描述、输入/输出契约、对应 CLI 命令（等宽+复制）、MCP 工具名、隐私级别与本地优先说明、同意要求（`consentNote`）、所属流程链接、"查看完整文档"外链。默认目录内右侧抽屉，深链可达 `/skills/:skillId`。追溯 `PAGE-051`、`ENT-016` 全字段、`ASM-042`。
- **落地与组合**：基于共享 `COMP-026 Drawer`（shadcn Sheet，子 surface — `ASM-042`）；头部用 `COMP-013 IconChip` + 中英名 + runLocation `COMP-011 StatusPill`；CLI/MCP 片段用 `COMP-132 InstallSnippet`/`COMP-135 McpConfigBlock`；隐私级别/同意说明用文字 Callout；流程链接为内链。
- **Props**：`skill: AgentSkill`（含 `cliCommand`/`mcpToolName`/`privacyLevel`/`consentNote`/`flowRef`/`docsUrl`）、`open: boolean`、`onOpenChange: (open) => void`、`skillId?: string`（深链定位）。
- **Events·Actions**：复制 CLI 命令（`skill_cli_copied`）、复制 MCP 工具调用片段（`skill_mcp_copied`）、打开完整文档外链（`skill_full_docs_clicked`）、关闭/返回目录。**非动作**：不执行技能、不读取本地、不发起提交/交换/协作（`NFR-005`、`ASM-041`、`PROJECT_CONTEXT` 非目标）。
- **States**：`loading`（抽屉骨架 `COMP-033`）；`loaded`（全字段）；`error`（拉取失败 + 重试，命令/文档静态部分仍可见）；`unknown-skillId`（深链命中无效 id → 共享 `COMP-021 EmptyState` + 返回目录链接，**不崩溃**）；`copy-success`（`aria-live`）。
- **数据·Data**：单个 `AgentSkill` 全字段（`ENT-016`），平台只读目录、无 PII、无本地内容（`NFR-001`/`INV-01`）；CLI/MCP 片段不含真实路径或私有数据。
- **无障碍·a11y**：抽屉打开后焦点入抽屉、`Esc`/关闭键盘可达、`aria-modal`、焦点陷阱（`PAGE-051` 验收）；runLocation/隐私级别文字标签非仅颜色；对比度达标。
- **测试·Tests**：技能卡可打开对应 `skillId` 详情；`/skills/:skillId` 深链直达；无效 id 走 EmptyState；含全部 `ENT-016` 字段（runLocation/privacyLevel/consentNote/flowRef/mcpToolName/cliCommand）；CLI/MCP 可复制；焦点管理 + `Esc` 关闭 + `aria-modal` 断言；不触发执行/本地/越权（边界断言）。

### `COMP-134` — `SupportedSourceBadge`（来源支持标记）

- **用途**：表示一个适配的知识来源类别（Obsidian/Logseq/Notion/MarkDown/语雀/飞书文档/本地文件夹/其他自定义，共 8 类）的图标徽 + 名称，用于"适配的知识来源"网格；也复用为技能的 runLocation/来源支持标记。追溯 `PAGE-050` 适配来源（`LIGHT_DOMAIN_MODEL` 来源外部引用）。
- **落地与组合**：基于共享 `COMP-013 IconChip`（浅底圆角方块 + Material Symbols Outlined 字形）+ 名称文字；展示性为主，若某项可深链到对应技能/文档则降级为次级链接（`COMP-008 SecondaryButton`/链接），否则无动作。
- **Props**：`source: { id; name; iconChip{glyph,tone}; href? }`、`asLink?: boolean`、`onClick?: () => void`。
- **Events·Actions**：默认展示性无动作；`href` 存在时点击导航（次级链接）。**非动作**：不读取本地来源、不触发技能。
- **States**：`default`（图标徽 + 名称）；`linked`（可点击次级链接 + hover/focus 态）；`loading`（→ `COMP-033 Skeleton`）。
- **数据·Data**：来源类别为平台只读静态/半静态目录，无 PII；8 类与 `LIGHT_DOMAIN_MODEL` 外部引用一致。
- **无障碍·a11y**：图标装饰 `aria-hidden`，名称为可读标签；链接态键盘可达、焦点可见；对比度达标。
- **测试·Tests**：渲染 8 类来源名称与图标徽；`asLink`+`href` 时可点击导航、键盘可达；无 `href` 时无动作；快照核对单一图标族（无第二族/无 filled）。

### `COMP-135` — `McpConfigBlock`（MCP 配置块）

- **用途**：渲染 `安装方式` 区 `MCP 工具` Tab 的 `mcp.json` 配置片段（等宽 + 语法高亮 + 复制），并组织 `MCP 工具` ↔ `Skill 安装` 两 Tab 切换。追溯 `PAGE-050` 安装方式、`ASM-040` 分发形态、`NFR-002` agent 可读。
- **落地与组合**：Tab 切换用共享 `COMP-027 Tabs`（受控、`aria-selected`、键盘可达）；每个 Tab 内的 `mcp.json` 片段与说明文本用共享 `COMP-024 CodeBlock`（等宽 `JetBrains Mono`）+ "复制命令"按钮；`Skill 安装` Tab 用 `COMP-132 InstallSnippet` 渲染安装说明。
- **Props**：`mcpConfig: object | string`（如 `{"mcpServers":{"know-share":{"command":"npx","args":["-y","know-share-mcp"],"env":{"KNOW_SHARE_MODE":"local-first"}}}}`）、`skillInstallText: string`、`defaultTab?: 'mcp' | 'skill'`（默认 `mcp`）、`onCopy?: (tab) => void`。
- **Events·Actions**：切换 Tab（`MCP 工具` 默认激活 ↔ `Skill 安装`）；复制配置 → `install_config_copied`（按 `MCP`/`Skill` Tab 聚合）；复制成功 `aria-live` 反馈。
- **States**：`tab=mcp`（默认）/ `tab=skill`；`copy-success`/`copy-failed`（同 `COMP-132` 回退逻辑）；静态内容**始终可渲染**（不依赖网络，保证"如何接入"始终可读 — `PAGE-050` 降级可读）。
- **数据·Data**：静态文档内容（`mcp.json` 片段、安装说明），非用户数据。`mcp.json` 中的包名 `know-share-mcp`/CLI 前缀 `know-share` 为占位（`ASM-040`，待 `PKG-006` 定稿）；不含真实密钥/私有 URL（`INV-01`/`INV-04`）。
- **无障碍·a11y**：Tab `aria-selected` + 键盘可达（左右方向键）；代码块可聚焦+复制；复制反馈 `aria-live`；对比度达标。
- **测试·Tests**：默认 `MCP 工具` Tab 显示 `mcp.json` 片段；切到 `Skill 安装` 显示安装文本；复制写入正确内容并触发分 Tab 聚合遥测；Tab 键盘切换 + `aria-selected` 断言；配置不含真实密钥/私有 URL（隐私断言）。

### `COMP-136` — `LocalPrivacyFlow`（本地优先隐私流程条）

- **用途**：渲染"本地优先隐私流程"6 步水平流程条（选择知识库 → 本地脱敏 → 生成 Manifest → 人工确认 → 提交平台 → 私有仓库交换），清楚传达原始内容不离机、只交换 manifest。追溯 `PAGE-050` 区块 3、`NFR-001`/`INV-01`、`FLOW-001`。
- **落地与组合**：水平步骤条（非共享 `COMP-019 Stepper` 的向导竖向变体，此为展示性横向流程，故本模块特化）；每步用 `COMP-013 IconChip` + 短标签 + 序号；可与"核心原则"横幅（`--color-success` 浅底 Callout，用共享 `COMP-009 Card`）相邻呈现。
- **Props**：`steps: { id; label; glyph }[]`（默认 6 步）、`orientation?: 'horizontal' | 'vertical'`（窄屏折叠为竖向/单列 — `ASM-016`）。
- **Events·Actions**：展示性，无交互动作（不触发任何技能执行 — `PAGE-050` 边界）。
- **States**：`default`（6 步全显）；窄屏 `<768px` 折叠为竖向/堆叠（响应式）；`loading` 可选骨架。
- **数据·Data**：静态步骤文案（无 PII）；与设计图 6 步一致。
- **无障碍·a11y**：步骤为有序列表语义（`role="list"`/序号可读）；图标装饰 `aria-hidden`，标签可读；非仅颜色传达顺序；对比度达标。
- **测试·Tests**：渲染 6 步且顺序正确；窄屏折叠为竖向；无任何执行动作（边界断言）；单一图标族断言。

> `COMP-137`~`COMP-149`：本模块段位**预留**（如未来技能分类筛选条、技能对比、MCP 工具调用片段独立组件等，按需在本段编号扩展），当前未用。

---

## 追溯矩阵（组件 → 上游）

| COMP | 组件 | 主追溯 PAGE | 上游需求/实体 | 引用的共享 COMP |
| --- | --- | --- | --- | --- |
| `COMP-130` | `SkillCard` | `PAGE-050`（→`PAGE-051`） | `ENT-016`、`FR-080`、`IA-008`、`NFR-007` | `COMP-009`、`COMP-013`、`COMP-011`、`COMP-008` |
| `COMP-131` | `SkillGrid` | `PAGE-050` | `IA-008`、`NFR-002`、`UI_RULES` 响应式 | `COMP-021`、`COMP-033` |
| `COMP-132` | `InstallSnippet` | `PAGE-050`/`PAGE-051` | `FR-080`、`UI-002`、`FR-140`、`INV-01` | `COMP-024` |
| `COMP-133` | `SkillDetailDrawer` | `PAGE-051` | `ENT-016` 全字段、`NFR-005`、`INV-08`、`ASM-042` | `COMP-026`、`COMP-013`、`COMP-011`、`COMP-021`、`COMP-033` |
| `COMP-134` | `SupportedSourceBadge` | `PAGE-050` | `FR-080`、`LIGHT_DOMAIN_MODEL` 来源引用 | `COMP-013`、`COMP-008` |
| `COMP-135` | `McpConfigBlock` | `PAGE-050` | `FR-080`、`NFR-002`、`ASM-040`、`FR-140` | `COMP-027`、`COMP-024`、`COMP-132` |
| `COMP-136` | `LocalPrivacyFlow` | `PAGE-050` | `NFR-001`、`INV-01`、`FLOW-001` | `COMP-013`、`COMP-009` |

> 共享组件锚点：`COMP-013 IconChip`（单一图标族着色字形）、`COMP-009 Card`、`COMP-024 CodeBlock`（等宽）、`COMP-026 Drawer`（子 surface，`ASM-042`）—— 均不在本文件重定义，契约见 `_shared/COMPONENTS_SPEC.md`。

---

## 新增假设与风险

| ID | 类型 | 内容 | 风险 | 处置 |
| --- | --- | --- | --- | --- |
| `ASM-091` | 假设 | 技能详情以 `COMP-133 SkillDetailDrawer`（共享 `COMP-026 Drawer` 子 surface）实现，深链 `/skills/:skillId` 为辅（沿用 `ASM-042`） | 若需独立顶层页则路由/导航扩展 | 用户确认；不新增 IA-* |
| `ASM-092` | 假设 | `SkillGrid` 数据驱动渲染 N 张卡（不硬编码 5 张），来源类别 8 类同理 | 低；若后端不返回稳定 `iconChip.tone`/`glyph`，需前端补默认映射 | `MOCK_DATA_SPEC`/`SERVICE_CONTRACT` 定 `GET /api/skills` 形状 |
| `ASM-093` | 假设 | `McpConfigBlock` 的 `mcp.json` 包名 `know-share-mcp`、CLI 前缀 `know-share` 为占位（沿用 `ASM-040`） | 若分发形态/包名变更，安装区与示例命令需调整 | `PKG-006` Agent 技能契约阶段定稿 |
| `ASM-094` | 假设 | `LocalPrivacyFlow` 为展示性横向流程条（非共享 `COMP-019 Stepper` 向导态），故作模块特化组件而非复用 Stepper | 若团队希望复用 Stepper 的横向变体，可改为共享组件扩展 | 组件规格/前端实现确认 |
| `RISK-001` | 风险 | 技能卡固定 5 个与来源 8 类与设计图一一对应；技能增多时网格需支持分类/分页（沿用 `PAGE-050` RISK） | 低；扩展面 | 实现期数据驱动网格（已在 `COMP-131` 落地），非硬编码 |

> 以上仅在本文件列出，**未修改** `DEFAULT_ASSUMPTIONS.md` 或任何控制/其他模块/共享 spec 文件。

---

## 阻塞 / 待确认

- 无硬阻塞。待下游/用户确认：`ASM-093`（`ASM-040`）分发形态与包名/CLI 前缀（`PKG-006` 定稿）；`ASM-091`（`ASM-042`）技能详情抽屉 vs 独立页；`ASM-092` `GET /api/skills` 字段形状（含 `iconChip.tone/glyph`、`consentNote`、`mcpToolName`）以 `SERVICE_CONTRACT`（阶段 15）为准。均不阻塞本组件规格成形。

---

## 质量门自检

```text
Gate: 07-frontend-spec-gate（agent-skills 组件规格切片）
Status: pending（待跨 spec 交叉审核 + COMP-* 登记 + 用户确认）
Evidence: 本文件 aies/02-design/agent-skills/COMPONENTS_SPEC.md 对照 PAGE-050/051、FRONTEND_SPEC §6/§7、UI_RULES(UI-001~004/DEC-012)、IA_SPEC(IA-008)、LIGHT_DOMAIN_MODEL(ENT-016/INV-01)、ID_REGISTRY
Findings:
  - 7 个模块特有组件（COMP-130~136），编号落在分配段 COMP-130~149，无越段、无与共享 COMP-001~040 或他模块段碰撞。✅
  - 每个组件含 8 字段契约（用途/落地与组合/Props/Events·Actions/States/数据/无障碍/测试）。✅
  - 全部追溯 PAGE-050/051 → IA-008 → FR-080(CAP-009) → ENT-016；并贯穿 NFR-001/002/005/007、INV-01/04/08/09、FLOW-001/004。✅
  - 共享组件只引用 COMP-* ID（Card/IconChip/CodeBlock/Drawer/...），不重复定义。✅
  - 单一图标族（IconChip 内 Material Symbols Outlined，lucide-react 1:1 替换）；代码块等宽 JetBrains Mono（DEC-012/UI-002）。✅
  - 不触发技能执行/不读本地/不越同意门（NFR-005、ASM-041）；package-private-repo 仅生成配置；命令/配置不含真实路径/密钥/私有 URL（INV-01/04）。✅
  - 遥测聚合无 PII（FR-140/INV-09）：skill_card_opened/install_config_copied/example_command_copied/skill_detail_viewed 等。✅
  - 只写本文件，未碰控制/他模块/共享 spec；新增假设 ASM-091~094 + RISK-001 仅在本文件标注，未改 DEFAULT_ASSUMPTIONS.md。✅
Decision: 内容自检通过 → 待跨 spec 交叉审核 + 编排者登记 COMP-130~136 + 用户确认 → 转 passed
```
