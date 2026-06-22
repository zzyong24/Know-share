# 页面规格 — Agent 技能目录（agent-skills 模块）

## 摘要

本产物把 `IA-008`（Agent 技能目录）落成可构建的页面契约：技能卡网格、安装片段、MCP 配置、本地与 MCP 来源支持、文档入口。设计真源为 `docs/design/know-share-agent-skills.png`（已覆盖界面，无需重生成；据 `UI_RULES.md` 归一化：彩色图标徽 → `IconChip`，内嵌 Material Symbols Outlined 字形；代码块用等宽字 `JetBrains Mono`）。所有页面追溯 `IA-008` → `FR-080`（`CAP-009`）→ `ENT-016` AgentSkill；并贯穿 `NFR-001/002/005`、`FLOW-001/004/007`、`FR-140/FLOW-008`（聚合无 PII 遥测）。

### 产物元数据

- Stage: `08-page-spec`
- Status: `needs-user-confirmation`
- Upstream IDs: `IA-008`、`FR-080`、`CAP-009`、`ENT-016`、`FR-030`、`FR-090`、`FR-110`、`NFR-001`、`NFR-002`、`NFR-005`、`NFR-007`、`FLOW-001`、`FLOW-004`、`FLOW-007`、`FR-140`、`FLOW-008`、`INV-01`、`INV-02`、`INV-08`、`UI-001`、`UI-002`、`UI-003`、`UI-004`
- Decision IDs: `DEC-006`、`DEC-008`、`DEC-012`
- Manifest status: stage `08-page-spec` = `needs-user-confirmation`（本模块切片；待用户确认后转 `passed`）

### 本模块 PAGE 清单

| PAGE ID | 页面名 | Route / Surface | 类型 | 追溯 |
| --- | --- | --- | --- | --- |
| `PAGE-050` | Agent 技能目录 | `/skills` | 顶层页面（`IA-008`） | `IA-008`、`FR-080`、`ENT-016` |
| `PAGE-051` | 技能详情子 surface | `/skills/:skillId`（或目录内抽屉/锚点展开） | `PAGE-050` 内子 surface | `IA-008`、`FR-080`、`ENT-016` |

> 拆分理由：`IA-008` 在 IA 阶段是单一界面；设计图把"技能总览（卡网格）+ 安装方式 + 示例命令 + 来源支持"集中在一页，故 `PAGE-050` 承载全部主内容。每张技能卡都带"查看文档 →"链接，且 `ENT-016` 含名称/安装/文档/隐私级别/来源类别等属性——这些细节超出卡片摘要密度，故抽出 `PAGE-051` 作技能详情子 surface（默认实现为目录内抽屉/展开，深链接可路由到 `/skills/:skillId`）。这是为承载 `ENT-016` 完整属性的必要细化，未引入新功能或新 IA 界面（符合 `gates/06` 与 `UI-004` 第 6 条）。`PAGE-052`~`PAGE-059` 段位预留，本模块未用。

---

## PAGE-050 — Agent 技能目录

### Page purpose

- 字段指引：用具体名称、示例与来源引用描述页面用途。
- 当前内容：面向**发布方/消费方 agent 及其所有者**展示 Know-share 的 agent 侧工具目录（`ENT-016` AgentSkill）。这是 `IA-008` 的顶层公共页（匿名可看，见 `IA_SPEC.md` 权限敏感界面表"公开但匿名可看"行），承担四件事：(1) 用技能卡网格列出 5 个规范技能；(2) 给出在支持 MCP 的 agent 中接入 Know-share 的安装配置（`mcp.json` 片段）与本地 CLI 示例命令；(3) 说明 MCP 配置与"本地优先隐私流程"，强调原始内容不离开本机（`NFR-001`、`INV-01`）；(4) 列出适配的知识来源类别。页面是 `FLOW-001`（清单发布与隐私门）与 `FLOW-004`（反馈与信任）在 agent 侧的工具入口，但**本页只做发现/安装/文档，不执行任何会触及本地内容或越过同意的动作**（`NFR-005`）。设计真源 `docs/design/know-share-agent-skills.png`：顶部"Agent 技能"标题 + 副标题"让你的 Agent 本地生成、脱敏并安全交换知识"，右上绿色原则横幅"Know-share 的核心原则——只交换 manifest，不上传原始笔记；脱敏与生成全在本地运行，隐私由你掌控"。

### Upstream requirement links

- 字段指引：链接到稳定 `FR`/`NFR`/`FLOW`/`IA`/`DEC` ID。
- 当前内容：
  - `IA-008`（Agent 技能目录：技能列表、安装/文档、MCP 配置、支持来源）。
  - `FR-080`（`CAP-009`）：技能目录（建清单、脱敏、验证、打包私有仓库、提交反馈）、安装/文档、来源类别。
  - `ENT-016` AgentSkill：名称、安装/文档、隐私级别、支持来源类别——本页每张卡的字段来源。
  - `NFR-002`：设计上即 agent 可读——本页内容（技能元数据、安装片段、来源类别）应可被 agent 结构化消费，关联 `FR-110`/`IA-012` 开放 API。
  - `NFR-001`、`INV-01`：本地优先、原始内容不离机；横幅与"本地优先隐私流程"区呈现此承诺。
  - `NFR-005`、`INV-08`、`FLOW-007`：技能执行触及本地范围/提交/联系/交换前需所有者同意；本页文案明确技能是 agent 侧工具，但同意门在技能实际运行时（本地/提交向导 `IA-004`/交换 `IA-006`）触发，**不在此页自动越过**（`PROJECT_CONTEXT` 非目标：不自动越过同意）。
  - `FLOW-001`：create-manifest / redact / validate / package-private-repo 对应清单发布与隐私门链路；`FLOW-004`：submit-feedback 对应反馈与信任更新。
  - `UI-001/002/003/004`、`DEC-012`：令牌、单一图标族 Material Symbols Outlined、`Card`/`IconChip`/`SecondaryButton` 等组件、生成/还原一致性。
  - `FR-140`/`FLOW-008`：本页遥测进入聚合使用统计（无 PII）。

### Route or surface ID

- 字段指引：用具体名称/示例描述 route/surface。
- 当前内容：公共主导航项"Agent 技能"，route `/skills`（`AppShell` 顶栏导航激活态用 `--color-primary`，见设计图顶栏"Agent 技能"高亮）。匿名可访问，无需登录。页面在 `AppShell`（`UI-003`）内、`1280px` 居中容器。区块顺序（自上而下，对齐设计图）：
  1. 页头：标题"Agent 技能" + 副标题；右上"核心原则"横幅卡（`--color-success` 浅底）。
  2. `技能总览`：5 列技能卡网格（`Card` + `IconChip`），桌面 5/4 列、平板 2 列、移动 1 列（`UI_RULES` 响应式）。
  3. `本地优先隐私流程`：6 步水平流程条（选择知识库页面 → 本地脱敏 → 生成 Manifest → 人工确认 → 提交平台 → 私有仓库交换）。
  4. 三栏区：`安装方式`（左，含 `MCP 工具` / `Skill 安装` 两 Tab + 代码块）、`示例命令`（中，等宽命令列表 + 复制）、`适配的知识来源`（右，`IconChip` 来源网格）。

### Data required

- 字段指引：用具体名称/示例描述所需数据。
- 当前内容：
  - **技能列表 `AgentSkill[]`（`ENT-016`）**——每项：`id`、`name`（英文标识，如 `create-manifest`）、`displayName`/`zhName`（如 "Create Manifest / 创建脱敏清单"）、`iconChip`（Material Symbols Outlined 字形名 + 语义/主题色调，见下映射）、`runLocation`（`local` 本地运行 | `platform` 平台运行）、`summary`（一句描述）、`input`（输入说明）、`output`（输出说明）、`docsUrl`（"查看文档"目标）、`privacyLevel`（隐私级别，关联 `NFR-001`）、`flowRef`（关联 `FLOW-001`/`FLOW-004`）。设计图固定 5 项（拟真 MOCK，10 阶段 `MOCK_DATA_SPEC` 细化）：
    | id | 名称 | IconChip 色/字形 | runLocation | 输入 → 输出 | flowRef |
    | --- | --- | --- | --- | --- | --- |
    | `create-manifest` | Create Manifest / 创建脱敏清单 | 主色 · `description` | 本地运行 | 本地知识库路径 → `manifest.json` + 关系图 | `FLOW-001` |
    | `redact-knowledge` | Redact Knowledge / 内容脱敏处理 | info 蓝 · `shield` | 本地运行 | 原始笔记/文档 → 脱敏摘要、隐私边界、关键词 | `FLOW-001`、`HARD-01` |
    | `validate-manifest` | Validate Manifest / 验证清单合规 | warning 橙 · `verified` | 本地运行 | `manifest.json` → 验证报告、问题清单 | `FLOW-001`、`INV-02` |
    | `package-private-repo` | Package Private Repo / 打包私有仓库 | 紫 · `inventory_2` | 本地运行 | 本地项目目录 → 私有仓库配置、邀请链接 | `FLOW-003`、`ASM-007` |
    | `submit-feedback` | Submit Feedback / 提交反馈信用 | danger 红 · `rate_review` | 平台运行 | 交换记录/模块 ID → 反馈记录、信用分提升 | `FLOW-004` |
  - **安装配置**——`mcp.json` 片段（静态文档内容，非用户数据）：`{"mcpServers":{"know-share":{"command":"npx","args":["-y","know-share-mcp"],"env":{"KNOW_SHARE_MODE":"local-first"}}}}`；`Skill 安装` Tab 的安装说明文本。
  - **示例命令列表**——本地 CLI 命令（静态）：`know-share create-manifest --notes ./my-notes`、`know-share redact-knowledge --input ./notes --level medium`、`know-share validate-manifest ./manifest.json`、`know-share package-private-repo --init-repo`、`know-share submit-feedback --exchange-id EX123 --rating 5`。
  - **适配来源类别 `sources[]`**（来自 `LIGHT_DOMAIN_MODEL.md`「知识来源类型」外部引用）：Obsidian、Logseq、Notion、MarkDown、语雀、飞书文档、本地文件夹、其他自定义格式——每项 `IconChip` + 名称。
  - **核心原则横幅文案**（静态）：标题 + 两条要点（只交换 manifest 不上传原始笔记；脱敏与生成全在本地，隐私由你掌控）。
  - 数据来源：技能/来源目录为平台只读静态/半静态内容，可经 `IA-012` 开放 API（`GET /api/skills` 风格，契约阶段定）供 agent 读取（`NFR-002`）。本页不读取任何用户 PII 或本地内容（`NFR-001`、`INV-01`）。

### Actions

- 字段指引：用具体名称/示例描述动作。
- 当前内容：
  - **查看技能文档**：每张技能卡的"查看文档 →"（`SecondaryButton`/链接），导航到该技能文档（`docsUrl`）或打开 `PAGE-051` 技能详情子 surface。
  - **复制安装配置**：`安装方式` 代码块右上"复制命令"按钮，复制 `mcp.json` 片段到剪贴板。
  - **切换安装 Tab**：`MCP 工具` ↔ `Skill 安装`（受控 Tab，键盘可达，`aria-selected`）。
  - **复制示例命令**：每条示例命令行右侧"复制命令"按钮。
  - **打开技能详情**：点击技能卡主体（非文档链接区）打开 `PAGE-051`。
  - **来源类别（展示性）**：`适配的知识来源` 网格默认为展示项；如某项可深链到对应技能/文档则为次级链接，否则无动作。
  - 明确**非动作（边界）**：本页不触发任何技能的实际执行、不读取本地路径、不发起提交或交换、不发起 GitHub 私有仓库协作——这些都在技能本地运行或 `IA-004`/`IA-006` 中经同意门发生（`NFR-005`、`PROJECT_CONTEXT` 非目标）。复制配置/命令是把"如何运行"交给用户/agent，不代为运行。

### States

- 字段指引：用具体名称/示例描述状态。
- 当前内容：
  - **默认（已加载）**：5 张技能卡 + 流程条 + 三栏（安装/命令/来源）全部呈现，与设计图一致。
  - **加载中**：技能卡与来源网格用骨架占位（`Card` skeleton）；安装/命令区为静态可直接渲染。
  - **空状态**：技能目录为空（极端/未配置）→ `EmptyState`（Material Symbols Outlined 图标 + "技能目录加载中或暂不可用" + 指向 `IA-012` 文档或仓库 `IA-013` 的次级链接）。设计图无空态，此为 `UI_RULES`/`IA_SPEC` 空状态原则补全。
  - **错误**：技能/来源数据拉取失败 → 内联错误卡 + 重试（`SecondaryButton`）；安装片段与示例命令因是静态内容仍可见，保证"如何接入"始终可读。
  - **复制成功**：复制按钮触发后短暂 toast/内联"已复制"反馈（`aria-live`）。
  - **安装 Tab 两态**：`MCP 工具`（默认激活）/ `Skill 安装`。
  - **技能卡 runLocation 两态**：`本地运行`（多数，主色/中性 Pill）/ `平台运行`（submit-feedback，`StatusPill` 区分），且**非仅靠颜色**——带文字标签（`NFR-007`）。
  - **hover/focus**：技能卡 hover 轻微抬升（`--shadow-card`）；所有交互元素焦点态主色描边可见（`NFR-007`）。

### Validation and error behavior

- 字段指引：用具体名称/示例描述校验与错误行为。
- 当前内容：
  - 本页为只读发现/文档页，无表单提交，故无字段级输入校验。
  - **复制操作**：剪贴板 API 失败时回退为选中文本 + 提示手动复制，并报内联错误（不静默失败）。
  - **数据拉取错误**：技能/来源目录请求失败 → 区块级错误态 + 重试；不阻塞整页，安装/命令静态区保持可用（降级可读，支撑 `NFR-002` agent 可读）。
  - **文档链接失效**：`docsUrl` 缺失时"查看文档"降级为 disabled 态并附 `title` 说明，不导向死链。
  - **一致性/隐私不变量保护**：本页展示的示例命令与配置不得包含任何真实路径、密钥、私有 URL（示例统一用 `./my-notes`、`./notes` 等占位），对齐 `INV-01`/`INV-04`/`NFR-001`；任何动态注入用户数据到示例的行为均禁止。
  - **无障碍校验**（`NFR-007`，前端验证阶段核验）：代码块可键盘聚焦+复制；Tab/卡片/链接键盘可达；runLocation 与来源类别含文字标签非仅颜色；对比度 ≥ 4.5:1。

### Telemetry or analytics

- 字段指引：用具体名称/示例描述遥测/分析。
- 当前内容：对齐 `FR-140`/`FLOW-008`，仅采集**聚合、无 PII** 事件（`INV-09`、`NFR-001`）：
  - `skills_page_viewed`（页面浏览计数）。
  - `skill_card_opened`（按 `skillId` 聚合，了解哪些技能最受关注）。
  - `install_config_copied`（按 `MCP`/`Skill` Tab 聚合）。
  - `example_command_copied`（按命令 `skillId` 聚合）。
  - `skill_docs_clicked`（按 `skillId` 聚合）。
  - 严禁记录本地路径、用户身份明文、剪贴板内容或任何原始知识数据；事件只进聚合使用统计供 `IA-013` 展示。匿名访问亦可计数（不绑定 PII）。

### Acceptance checks

- 字段指引：用具体名称/示例描述验收检查。
- 当前内容：
  1. 页面在 `/skills` 匿名可访问，`AppShell` 顶栏"Agent 技能"为激活态；与设计图区块顺序/版式一致。
  2. 技能总览呈现 5 张卡（create-manifest / redact-knowledge / validate-manifest / package-private-repo / submit-feedback），每卡含中英名、`IconChip`、runLocation 标签（文字+色）、一句描述、输入/输出、"查看文档"——字段全部追溯 `ENT-016`。
  3. 仅使用 Material Symbols Outlined 单一图标族；彩色图标徽为 `IconChip`（浅底圆角方块 + 内嵌字形），无第二图标族/无 filled 变体（`UI-002`/`DEC-012`/`UI-004` 第 2、5 条）。
  4. 安装区呈现 `MCP 工具` Tab 的 `mcp.json` 片段（等宽 `JetBrains Mono`）+ 复制按钮；`Skill 安装` Tab 可切换；示例命令区 5 条命令均等宽字 + 复制。
  5. "本地优先隐私流程"6 步与"核心原则"横幅清楚传达原始内容不离机、只交换 manifest（`NFR-001`、`INV-01`）。
  6. 本页不触发任何技能执行、不读取本地内容、不越过同意门（`NFR-005`、`PROJECT_CONTEXT` 非目标）——验收时确认所有动作仅为导航/复制/切换 Tab。
  7. 遥测仅聚合无 PII（`FR-140`、`INV-09`）。
  8. 无障碍：键盘可达、焦点可见、状态非仅靠颜色、代码块可聚焦复制、对比度达标（`NFR-007`，前端验证阶段以浏览器证据核验）。
  9. 适配来源网格含 8 类（Obsidian/Logseq/Notion/MarkDown/语雀/飞书文档/本地文件夹/其他自定义），追溯 `LIGHT_DOMAIN_MODEL` 来源外部引用。

---

## PAGE-051 — 技能详情子 surface

### Page purpose

- 字段指引：用具体名称、示例与来源引用描述页面用途。
- 当前内容：承载单个 `AgentSkill`（`ENT-016`）的完整属性，超出 `PAGE-050` 卡片摘要密度的部分。默认实现为 `PAGE-050` 目录内的**抽屉/展开面板**；深链接可路由到 `/skills/:skillId`（如 `/skills/create-manifest`）。用途：让 agent 与所有者在接入前完整了解某技能的运行位置、隐私级别、输入/输出契约、对应 CLI 命令与 MCP 工具名、所属流程（`FLOW-001`/`FLOW-004`）、以及该技能的同意要求说明。这是为完整表达 `ENT-016` 属性而做的必要细化，不引入新功能。

### Upstream requirement links

- 字段指引：链接到稳定 ID。
- 当前内容：`IA-008`、`FR-080`、`ENT-016`（名称/安装/文档/隐私级别/来源类别全字段）、`NFR-001`/`INV-01`（隐私级别与本地优先说明）、`NFR-005`/`INV-08`/`FLOW-007`（同意要求说明，非自动执行）、`NFR-002`（详情可经 API 结构化读取）、`FLOW-001`/`FLOW-004`（flowRef）、`UI-001/002/003`。

### Route or surface ID

- 字段指引：用具体名称/示例描述 route/surface。
- 当前内容：子 surface 默认在 `PAGE-050` 内右侧抽屉/卡片展开；深链接 route `/skills/:skillId`。抽屉头部含技能 `IconChip` + 中英名 + runLocation `StatusPill`；正文分区：描述、输入/输出契约、对应 CLI 命令（等宽 + 复制）、MCP 工具名、隐私级别与本地优先说明、同意要求、所属流程链接、"查看完整文档"外链。

### Data required

- 字段指引：用具体名称/示例描述所需数据。
- 当前内容：单个 `AgentSkill`（`ENT-016`）全字段：`id`/`name`/`zhName`/`iconChip`/`runLocation`/`summary`/`input`/`output`/`cliCommand`（示例命令）/`mcpToolName`/`privacyLevel`/`consentNote`（同意要求说明文本）/`flowRef`/`docsUrl`。均为平台只读目录数据，无用户 PII，无本地内容（`NFR-001`、`INV-01`）。

### Actions

- 字段指引：用具体名称/示例描述动作。
- 当前内容：复制该技能 CLI 命令、复制其 MCP 工具调用片段、打开完整文档外链、关闭抽屉/返回目录。**非动作**：不执行技能、不读取本地、不发起提交/交换/协作（`NFR-005`、`PROJECT_CONTEXT` 非目标）。

### States

- 字段指引：用具体名称/示例描述状态。
- 当前内容：加载中（抽屉骨架）；已加载（全字段）；错误（拉取失败 + 重试，命令/文档静态部分仍可见）；未知 `skillId`（深链命中无效 id → `EmptyState` + 返回目录链接）；复制成功反馈（`aria-live`）。

### Validation and error behavior

- 字段指引：用具体名称/示例描述校验与错误行为。
- 当前内容：只读，无表单校验。无效 `skillId` 深链 → 友好空态而非崩溃。复制失败回退为手动复制提示。示例命令/工具片段不含真实路径或私有数据（`INV-01`）。无障碍：抽屉打开后焦点入抽屉、`Esc`/关闭键盘可达、`aria-modal`、焦点陷阱、对比度达标（`NFR-007`）。

### Telemetry or analytics

- 字段指引：用具体名称/示例描述遥测/分析。
- 当前内容：聚合无 PII（`FR-140`/`INV-09`）：`skill_detail_viewed`（按 `skillId`）、`skill_cli_copied`、`skill_mcp_copied`、`skill_full_docs_clicked`。不记录路径/身份明文/剪贴板内容。

### Acceptance checks

- 字段指引：用具体名称/示例描述验收检查。
- 当前内容：
  1. 由技能卡可打开对应 `skillId` 详情；`/skills/:skillId` 深链可直达；无效 id 走空态。
  2. 详情含 `ENT-016` 全字段（含 runLocation、privacyLevel、consentNote、flowRef、mcpToolName、cliCommand）。
  3. CLI 命令/MCP 片段等宽字 + 可复制；隐私级别与本地优先、同意要求说明清晰呈现（`NFR-001`/`NFR-005`）。
  4. 子 surface 不触发执行、不读取本地、不越过同意。
  5. 抽屉无障碍（焦点管理、`Esc` 关闭、`aria-modal`）；遥测聚合无 PII。

---

## 拟新增假设与风险

| ID（拟） | 类型 | 内容 | 风险 | 处置 |
| --- | --- | --- | --- | --- |
| `ASM-040`（拟） | 假设 | Agent 技能以 **MCP server + 本地 CLI** 双形态分发（设计图同列 `MCP 工具`/`Skill 安装` Tab 与 `know-share` CLI 命令推断）；包名 `know-share-mcp`、CLI 前缀 `know-share` 为占位，待实现期定稿 | 若最终只发其一或包名不同，安装区与示例命令需调整 | 服务契约/Agent 技能契约阶段（`PKG-006`）确认；**未改 `DEFAULT_ASSUMPTIONS.md`** |
| `ASM-041`（拟） | 假设 | `package-private-repo` 技能仅**生成/配置**私有仓库与邀请链接（产出"配置 + 邀请链接"），实际接受邀请、建立协作、提交内容均由人类所有者在同意后手动完成（对齐 `PROJECT_CONTEXT` 非目标"不自动越过同意"、`NFR-005`） | 若被实现为自动建协作/自动 PR，将违反产品边界 | 在 Agent 技能契约阶段明确该技能输出边界；**未改控制文件** |
| `ASM-042`（拟） | 假设 | 技能详情作为 `PAGE-051` 子 surface（抽屉为主、`/skills/:skillId` 深链为辅），而非独立顶层 IA 界面 | 若需独立页则路由/导航需扩展 | 用户确认；不新增 IA-* |
| `RISK`（开放） | 风险 | 设计图技能卡固定 5 个，与 `FR-080`/`ENT-016` 列举的"建清单/脱敏/验证/打包/提交反馈"5 项一一对应；若未来技能增多，网格需支持 N 项与分类 | 低；扩展面 | 实现期用数据驱动网格，非硬编码 |

> 以上为本模块拟新增、**仅在此列出**，未修改 `DEFAULT_ASSUMPTIONS.md` 或任何控制/其他模块文件。

## 阻塞 / 待确认

- 无硬阻塞。待用户/下游确认：`ASM-040` 分发形态与包名/CLI 前缀；`ASM-042` 技能详情形态（抽屉 vs 独立页）。这些不阻塞本页面规格成形，可在 `PKG-006`（Agent skills 工具垂直切片）服务/技能契约阶段定稿。

## 质量门结果

```text
Gate: 06-page-spec-gate
Status: pass（内容检查）— 待用户确认
Evidence:
  - 本文件 aies/02-design/agent-skills/PAGE_SPEC.md
  - 上游对照：IA_SPEC.md(IA-008)、PRODUCT_SPEC.md(FR-080/NFR-001/002/005)、LIGHT_DOMAIN_MODEL.md(ENT-016/INV-01/02/08/09)、BUSINESS_FLOW.md(FLOW-001/004/007/008)、UI_RULES.md(UI-001~004/DEC-012)、ID_REGISTRY.md
  - 设计真源：docs/design/know-share-agent-skills.png（全分辨率裁切核读：5 技能卡、本地优先流程 6 步、安装 mcp.json 片段、5 条示例命令、8 类来源、核心原则横幅）
Findings:
  - 每个 PAGE 含 purpose/data/actions/states/validation/telemetry/acceptance（9 字段齐全）。✅
  - PAGE-050/051 均追溯 IA-008 → FR-080(CAP-009) → ENT-016；无无法追溯内容。✅
  - 图标徽归一为 IconChip（Material Symbols Outlined 字形）；代码片段等宽字（UI-002/UI-003/DEC-012）。✅
  - 技能为 agent 侧工具且 agent 可读（NFR-002）；本页不执行技能、不读本地、不越过同意（NFR-005、PROJECT_CONTEXT 非目标）；package-private-repo 仅生成配置不自动协作（ASM-041 拟）。✅
  - 遥测对齐 FR-140/FLOW-008，聚合无 PII（INV-09）。✅
  - PAGE-051 子 surface 为承载 ENT-016 全字段的必要细化，未引入新 IA 界面（gate 第 3 条）。✅
  - 拟新增假设 ASM-040/018/019 + 一条开放风险已标注，未改 DEFAULT_ASSUMPTIONS.md 或控制/其他模块文件。✅
Decision: 内容检查通过 → 待用户确认 → 转 passed
```
