# 工程上下文

## 语言约定

- 本工程所有产物与交流一律使用简体中文（详见 `AGENTS.md` 的"语言约定"）。后续所有阶段和子 agent 须遵守。

## 工程名称与产物根目录

- 工程：Know-share。
- 活动根目录：`/Users/zyongzhu/Workbase/Know-share`。
- 来源导入：先前材料从 `/Users/zyongzhu/Documents/Codex/2026-06-22/new-chat/Know-share` 导入。
- 当前产品状态：产品设计搭建阶段，已有 README、MVP、隐私模型、公共清单契约、示例清单和 UI 设计图。

## 现有材料

- `README.md`：核心产品意图与轻量 MVP。
- `docs/mvp.md`：以静态公共注册表加清单 schema 形式呈现的最小可用版本。
- `docs/privacy-model.md`：隐私边界、同意节点、脱敏检查清单和本地优先的撮合。
- `docs/data-contract.md`：公共知识模块清单字段与校验原则。
- `examples/knowledge-module.manifest.json`：示例清单。
- `docs/design/`：用于发现、模块详情、交换记录、信任档案、agent 技能和提交模块流程的 UI 图输入。

## 技术栈与版本

- **前端技术栈已批准（DEC-014，2026-06-23）**：`Next.js + TypeScript + Tailwind CSS + shadcn/ui`。Tailwind 承载 UI_RULES 设计令牌（UI-001）；shadcn/ui 为规范组件（UI-003）实现底座；图标规范族 Material Symbols Outlined（DEC-012），lucide-react 为已登记的 1:1 等价替换路径。脚手架仍由阶段 11 前的 Task Zero 建立（含绿色基线）。
- 含轻度后端服务（DEC-011，FR-140）：动态行为 + 聚合使用统计（不含 PII）；后端栈在阶段 13 后端规格确定。
- 现有文档的"静态注册表 + JSON 清单 schema + agent 侧工具"是首个实现可起步的形态，但不缩小目标产品（ASM-008）。

## 关键实现规则

- 在阶段化产品产物定义出需求、页面契约、数据契约和验收检查之前，不得开始实现。
- 把 UI 图视为需要规范化的输入，而非本身即是实现契约。
- 保持从每个需求到流程、实体、页面、API、测试和验证证据的可追溯。
- 让实现工作可拆分以便未来多 agent 执行：每个工作包都需要明确的输入、输出、依赖、文件和验证命令。

## 测试命令与预期证据

- 目前尚无测试运行器。
- 在阶段 11 前端实现之前，Task Zero 必须建立一个可运行的工程和绿色基线。
- 预期的未来证据：install/build/lint/test 命令、主要页面的浏览器验证、后端/API 行为的契约测试，以及集成发布评审。

## 代码组织约定

- 当前仓库组织：
  - `aies/` 存放所有 orchestrator 产物，按交付阶段分层、模块扇出（详见 `aies/README.md`）：`00-control` 控制/追溯、`01-product` 产品、`02-design` 设计、`03-frontend` 前端、`04-backend` 后端、`05-release` 发布。
  - `docs/` 存放产品、隐私、数据、设计的源材料。
  - `examples/` 存放公共清单示例。
  - `orchestrator/process/` 存放 reconcile 校验脚本及其配置。
  - `AGENTS.md`、`PROJECT_CONTEXT.md`、`README.md` 留在仓库根作为入口。
- 未来的实现代码目录（如 `app/`、`server/`、`tests/`）落在仓库根而非 `aies/`，其名称须在已批准的前端/后端规格中确定。

## 安全、数据与隐私约束

- 公共注册表不得存储原始笔记、完整文档全文、私有路径、凭据、私有 embeddings 或未脱敏的第三方个人数据。
- 清单发布前需用户在本地审阅，任何内容离开用户机器之前都要经过本地审查。
- 私密交换需要所有者明确批准，且在 MVP 中应发生在公共注册表之外。
- 撮合应主要在消费方 agent 侧运行，使用户兴趣和排序逻辑得以保留在本地。

## 已知非目标与禁止的捷径

- 不要构建一个托管原始知识库的平台。
- 不要把私有仓库、embeddings 或完整笔记导出上传到公共注册表。
- 在没有后续安全/权限决策之前，首个实现中不要把 GitHub 私有仓库协作做成自动化。
- 不要让 UI 原型在产品规格之外悄悄扩大范围。
- 实现过程中不要创建未被追踪的页面、API、数据字段或测试。
