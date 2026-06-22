# AGENTS.md

## 语言约定（最高优先级）

- **本工程所有产物、文档、注释、提交说明、以及与用户的交流，一律使用简体中文。**
- 后续任何阶段、任何被派发的子 agent 生成或更新文件时，正文一律用简体中文撰写。
- 保持原样不译的内容：稳定 ID（FR-xxx、API-xxx、TEST-xxx 等）、文件名与路径、代码标识符、JSON/YAML 字段名、枚举/状态值、CLI 命令、schema 字段名、URL。
- 代码本身（变量名、函数名、类型名）按工程惯例用英文；面向人阅读的说明用中文。

## 产物目录布局

- 所有 orchestrator 产物统一放在 `aies/` 树下，按交付阶段分层、模块扇出。完整地图见 `aies/README.md`。
  - `aies/00-control/`：控制与追溯文件（manifest、ID 注册表、决策日志、可追溯矩阵、变更影响、默认假设）。
  - `aies/01-product/`：产品与领域规格（产品规格、功能大纲、业务流程、轻量领域模型）。
  - `aies/02-design/`：信息架构与 UI 规则；页面/组件/模拟数据规格按 `<模块>/` 子目录扇出。
  - `aies/03-frontend/<模块>/`：前端实现说明与浏览器验证报告。
  - `aies/04-backend/<模块>/`：后端规格、模块工作流、服务契约、测试计划。
  - `aies/05-release/`：集成报告与发布评审。
- `AGENTS.md`、`PROJECT_CONTEXT.md`、`README.md` 留在仓库根作为入口；`docs/`、`examples/` 为产品源材料；实现代码（如 `app/`、`server/`、`tests/`）落在仓库根而非 `aies/`。

## 工程背景

- 产品唯一可信来源：阶段 03 通过后以 `aies/01-product/PRODUCT_SPEC.md` 为准。在此之前，`README.md`、`docs/mvp.md`、`docs/privacy-model.md`、`docs/data-contract.md`、`docs/design/*.png` 和 `aies/01-product/FUNCTION_OUTLINE.md` 草稿仅作为输入参考。
- 当前实现上下文：`PROJECT_CONTEXT.md`。
- 产物清单：`aies/00-control/ARTIFACT_MANIFEST.yaml`。
- ID 注册表：`aies/00-control/ID_REGISTRY.md`。
- 决策日志：`aies/00-control/DECISION_LOG.md`。
- 变更影响日志：`aies/00-control/CHANGE_IMPACT.md`。
- 可追溯矩阵：`aies/00-control/TRACEABILITY_MATRIX.md`。
- 当前活动阶段在 `aies/00-control/ARTIFACT_MANIFEST.yaml` 中声明；不得抢先开展被阻塞或已失效的上游阶段工作。
- 不得实现任何无法追溯到已批准产物或已记录假设的行为。

## 产品边界

- Know-share 是一个隐私优先的知识模块交换与撮合平台，服务于个人 agent 及其背后的用户。
- 公共平台只存储用于发现的元数据和脱敏后的清单（manifest），不存储原始知识库。
- 私密的知识交换始终基于同意，且不进入公共注册表，除非后续有已批准的契约另行规定。
- `docs/design/` 中的 UI 图是源输入，不是可执行的页面契约。

## 开发环境提示

- 目前尚未搭建任何应用技术栈。
- 在开始实现前，Task Zero 必须先创建应用骨架、包管理器配置、测试运行器，以及一个可跑通的绿色基线。
- 技术栈建立后，运行命令前先进入拥有该功能的包或应用目录。

## 测试说明

- 有代码后，先对改动代码运行聚焦测试。
- 在声称完成前，运行所需的验证套件。
- 前端工作必须对发布关键路径包含浏览器验证。
- 后端行为在相应产物建立后须遵循 `aies/04-backend/SERVICE_CONTRACT.md`、`aies/04-backend/MODULE_WORKFLOW_SPEC.md` 和测试计划。
- 阶段质量门要求命令输出或其他可执行证据，而不仅是文字描述。

## 变更控制

- 在实现前，先记录对范围、信息架构、数据模型、服务契约、安全、数据归属或发布标准的变更。
- 当已批准的上游产物发生变化时，在 `aies/00-control/ARTIFACT_MANIFEST.yaml` 中将下游产物标记为已失效。
- 在做出破坏性契约变更或扩大公共数据采集范围前，先征求确认。
- 生成或导入的设计产物须服从于已批准的规格。

## 多 agent 规则

- 每个 agent 的工作包必须列明其上游产物、负责的文件、依赖、验证命令和验收标准。
- agent 应优先选择可独立构建与验证的垂直切片。
- 在并行实现开始前，共享契约、schema、导航、认证/会话假设和设计 token 必须先稳定下来。
- 若某个 agent 发现一个未被追溯的需求，应停止该项改动、记录缺口，并通过 orchestrator 产物把它路由回去。

## PR / 评审说明

- 概述变更的产物与实现证据。
- 链接验证报告和测试输出。
- 明确指出已接受的风险、被推迟的工作和开放的假设。
- 在 `aies/05-release/INTEGRATION_REPORT.md` 和 `aies/05-release/RELEASE_REVIEW.md` 通过各自质量门之前，不得声称已具备发布条件。
