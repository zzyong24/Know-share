# ID 注册表

## 目的

使用稳定 ID，使下游产物能够追溯到上游意图，并使变更能够精确地使受影响的工作失效。

## ID 前缀

| 前缀 | 含义 | 示例 |
| --- | --- | --- |
| `ASM` | 假设 | `ASM-001` |
| `DEC` | 决策 | `DEC-001` |
| `FR` | 功能需求 | `FR-001` |
| `NFR` | 非功能需求 | `NFR-001` |
| `FLOW` | 业务或用户流程 | `FLOW-001` |
| `ENT` | 领域实体 | `ENT-001` |
| `IA` | 信息架构界面 | `IA-001` |
| `PAGE` | 页面或屏幕契约 | `PAGE-001` |
| `COMP` | 前端组件 | `COMP-001` |
| `MOCK` | 模拟数据场景 | `MOCK-001` |
| `API` | 服务契约操作 | `API-001` |
| `TEST` | 测试或验证场景 | `TEST-001` |
| `RISK` | 已接受或开放的风险 | `RISK-001` |
| `UI` | UI 规则 / 规范设计系统条目 | `UI-001` |

## 注册表

| ID | 类型 | 名称 | 定义于 | 来源 ID | 状态 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| `DEC-001` | 决策 | 导入先前的 Know-share 项目材料 | `DECISION_LOG.md` | 用户请求、先前工作区文件 | active | 当前工作区为空；先前项目文件已复制到此根目录。 |
| `DEC-002` | 决策 | 采用 product-to-code 分阶段工作流 | `DECISION_LOG.md` | 用户请求 | active | 用户明确调用了 product-to-code orchestrator 进行拆解。 |
| `DEC-006` | 决策 | 身份与验证以 GitHub 为规范、预留多提供方扩展 | `DECISION_LOG.md` | 用户回答、`FUNCTION_OUTLINE.md` | active | 本版以 GitHub 为准；GitHub Verified 为信任骨干。 |
| `DEC-007` | 决策 | 目标产品无经济模型（非商业互惠交换） | `DECISION_LOG.md` | 用户回答 | active | 付费/计费/咨询均为非目标。 |
| `DEC-008` | 决策 | 完整目标产品、不用"推迟项"弱化；难点显式登记并拆为并行任务 | `DECISION_LOG.md` | 用户反馈 | active | 仅留 3 条真实边界；HARD-01~09 映射到阶段与工作包。 |
| `DEC-009` | 决策 | 交换支持单向请求，互惠改为可选 | `DECISION_LOG.md` | 用户请求 | active | 取代 ASM-009 早前"强制互惠"。 |
| `DEC-010` | 决策 | 联系方式默认私密、交换接受后披露 | `DECISION_LOG.md` | 用户请求与选择 | active | 绑定时收集；服务一对一深连接。 |
| `DEC-011` | 决策 | 含轻度后端服务 + 聚合使用统计 | `DECISION_LOG.md` | 用户说明 | active | 统计不含 PII。 |
| `ASM-001` | 假设 | 当前根目录为后续唯一可信来源 | `DEFAULT_ASSUMPTIONS.md` | `DEC-001` | needs-confirmation | 未来的 agent 应在 `/Users/zyongzhu/Workbase/Know-share` 中操作。 |
| `ASM-002` | 假设 | 拆解先于实现 | `DEFAULT_ASSUMPTIONS.md` | 用户请求 | active | 本轮创建规划产物；实现仅在规格和质量门之后开始。 |
| `ASM-003` | 假设 | 现有 UI 图为设计输入，而非最终契约 | `DEFAULT_ASSUMPTIONS.md` | `docs/design/*.png` | active | 页面规格将在之后把它们规范化为可实现的需求。 |
| `ASM-007` | 假设 | 私下交付主通道为 GitHub 私有仓库，DM/批准链接为备选 | `DEFAULT_ASSUMPTIONS.md` | `README.md`, `PRODUCT_SPEC.md` | active | 平台只跟踪状态不持有内容。 |
| `ASM-008` | 假设 | 目标产品为动态平台，首个实现可从静态注册表起步 | `DEFAULT_ASSUMPTIONS.md` | `docs/mvp.md`, `FUNCTION_OUTLINE.md`, `DEC-005` | active | 排序不缩小目标产品。 |
| `ASM-009` | 假设 | 交换互惠可选，支持单向请求 | `DEFAULT_ASSUMPTIONS.md` | `FR-040`, `DEC-009` | active | 由 DEC-009 确认；提供模块为可选项。 |
| `ASM-010` | 假设 | 交付完成需双方所有者各自确认 | `DEFAULT_ASSUMPTIONS.md` | `FLOW-003` | active | 避免单方误标完成。 |
| `ASM-011` | 假设 | 反馈窗口到期后允许关闭交换 | `DEFAULT_ASSUMPTIONS.md` | `FLOW-003`, `FLOW-004` | active | 避免一方不反馈致永久挂起。 |
| `ASM-012` | 假设 | Agent 为 User 的行动者角色，非独立持久实体 | `DEFAULT_ASSUMPTIONS.md` | `ENT-002` | active | 若认证写 API 需签名身份则升格。 |
| `ASM-013` | 假设 | 联系方式按交换披露快照，撤回只影响未来 | `DEFAULT_ASSUMPTIONS.md` | `ENT-009`, `DEC-010` | active | 已披露快照不可收回。 |
| `FR-001` | 功能需求 | 公开站点外壳与导航 | `FUNCTION_OUTLINE.md` | `README.md`, `docs/design/*.png` | draft | 包括全局导航、GitHub 登录界面、搜索入口和提交入口。 |
| `FR-010` | 功能需求 | 发现注册表模块卡片 | `FUNCTION_OUTLINE.md` | `docs/mvp.md`, 发现 UI | draft | 搜索/筛选/排序以及公开卡片元数据。 |
| `FR-020` | 功能需求 | 知识模块详情 | `FUNCTION_OUTLINE.md` | 模块详情 UI | draft | 清单预览、来源统计、隐私边界、请求操作。 |
| `FR-030` | 功能需求 | 清单提交与隐私质量门 | `FUNCTION_OUTLINE.md` | 提交模块 UI、隐私模型 | draft | 向导、扫描发现、脱敏建议、预览。 |
| `FR-040` | 功能需求 | 交换请求与公开记录 | `FUNCTION_OUTLINE.md` | 交换记录 UI | draft | 请求生命周期、公开记录、私下交接跟踪。 |
| `FR-050` | 功能需求 | 结构化反馈与信任 | `FUNCTION_OUTLINE.md` | 信任画像 UI、交换记录 UI | draft | 反馈维度、信任等级、徽章。 |
| `FR-060` | 功能需求 | 用户信任画像 | `FUNCTION_OUTLINE.md` | 信任画像 UI | draft | GitHub 身份、声誉指标、模块、交换历史。 |
| `FR-070` | 功能需求 | 社交信号与社区操作 | `FUNCTION_OUTLINE.md` | 发现/详情/交换 UI | draft | 收藏、认可、基础评论/举报。 |
| `FR-080` | 功能需求 | Agent Skill 与 MCP 工具界面 | `FUNCTION_OUTLINE.md` | agent skills UI | draft | Skill 目录、命令、安装/文档、支持的来源。 |
| `FR-090` | 功能需求 | 隐私、安全与同意控制 | `FUNCTION_OUTLINE.md` | 隐私模型、提交 UI | draft | 同意点、扫描规则、内容承诺、下架路径。 |
| `FR-100` | 功能需求 | 管理与审核 | `FUNCTION_OUTLINE.md` | UI 概览管理面板 | draft | 审核队列、风险摘要、操作、审计轨迹。 |
| `FR-110` | 功能需求 | 开放 API 与 agent 可读注册表 | `FUNCTION_OUTLINE.md` | README、数据契约 | draft | 公开读取 API，以及后续经认证的提交/反馈契约。 |
| `FR-120` | 功能需求 | 通知 | `FUNCTION_OUTLINE.md` | 交换工作流推断 | draft | 优先站内通知；邮件/webhook 延后。 |
| `FR-130` | 功能需求 | 联系方式与私下连接 | `PRODUCT_SPEC.md` | `DEC-010`, 用户请求 | draft | 绑定时收集；默认私密；交换接受后披露。 |
| `FR-140` | 功能需求 | 轻度后端服务与使用统计 | `PRODUCT_SPEC.md` | `DEC-011`, 用户请求 | draft | 含轻后端；统计聚合、不含 PII。 |
| `NFR-001` | 非功能需求 | 隐私优先的数据最小化 | `FUNCTION_OUTLINE.md` | 隐私模型 | draft | 公开平台不得存储原始的私有知识内容。 |
| `NFR-002` | 非功能需求 | 设计上即 agent 可读 | `FUNCTION_OUTLINE.md` | README、数据契约 | draft | 结构化清单以及后续的 API。 |
| `NFR-003` | 非功能需求 | 可追溯的实现 | `FUNCTION_OUTLINE.md` | product-to-code 工作流 | draft | 所有工作都必须追溯到已批准的 ID。 |
| `NFR-004` | 非功能需求 | 开源可审计性 | `FUNCTION_OUTLINE.md` | README | draft | 规则和信任解释可供检查。 |
| `NFR-005` | 非功能需求 | 人类同意质量门 | `FUNCTION_OUTLINE.md` | 隐私模型 | draft | 在生成、提交、联系、交换之前需经同意。 |
| `NFR-006` | 非功能需求 | 抗滥用 | `FUNCTION_OUTLINE.md` | 信任/审核 UI | draft | 身份核查、速率限制、审计轨迹。 |
| `NFR-007` | 非功能需求 | 无障碍的公开网站 | `FUNCTION_OUTLINE.md` | 公开站点需求 | draft | 必须在前端验证阶段予以核验。 |
| `FLOW-001` | 流程 | 清单发布与隐私门 | `BUSINESS_FLOW.md` | `FR-030`, `FR-090`, `HARD-01` | draft | 本地生成/脱敏/同意/预览/提交。 |
| `FLOW-002` | 流程 | 发现与评估 | `BUSINESS_FLOW.md` | `FR-010`, `FR-020` | draft | 浏览→详情→判断价值。 |
| `FLOW-003` | 流程 | 交换请求生命周期 | `BUSINESS_FLOW.md` | `FR-040`, `HARD-02` | draft | 见状态机；平台只记录关系。 |
| `FLOW-004` | 流程 | 反馈与信任更新 | `BUSINESS_FLOW.md` | `FR-050`, `FR-060`, `HARD-03` | draft | 结构化反馈→信任级别/信用。 |
| `FLOW-005` | 流程 | 审核与举报治理 | `BUSINESS_FLOW.md` | `FR-100`, `HARD-08` | draft | 评审队列、举报、处罚、审计。 |
| `FLOW-006` | 流程 | 通知与事件闭环 | `BUSINESS_FLOW.md` | `FR-120`, `HARD-09` | draft | 站内事件驱动各方推进。 |
| `FLOW-007` | 流程 | 身份与同意（贯穿） | `BUSINESS_FLOW.md` | `FR-001`, `FR-070`, `NFR-005`, `HARD-04` | draft | GitHub 身份 + 同意门。 |
| `FLOW-008` | 流程 | 平台使用统计（轻后端） | `BUSINESS_FLOW.md` | `FR-140` | draft | 聚合指标、不含 PII。 |
| `ENT-001` | 实体 | User（人类所有者/账户） | `LIGHT_DOMAIN_MODEL.md` | `FR-001`, `FR-060`, `DEC-006` | draft | 主体与同意方。 |
| `ENT-002` | 实体 | Agent（个人 agent） | `LIGHT_DOMAIN_MODEL.md` | `JOB-001`, `JOB-002`, `ASM-012` | draft | 默认作 User 的行动者角色。 |
| `ENT-003` | 实体 | KnowledgeModule（知识模块） | `LIGHT_DOMAIN_MODEL.md` | `FR-010`, `FR-020` | draft | 公开目录卡片背后的一块知识。 |
| `ENT-004` | 实体 | Manifest（清单） | `LIGHT_DOMAIN_MODEL.md` | `FR-020`, `FR-090` | draft | 脱敏公开摘要。 |
| `ENT-005` | 实体 | PrivacyScan（隐私扫描结果） | `LIGHT_DOMAIN_MODEL.md` | `FR-090`, `HARD-01` | draft | pass/warn/block 分级。 |
| `ENT-006` | 实体 | Submission（提交） | `LIGHT_DOMAIN_MODEL.md` | `FR-030`, `FLOW-001` | draft | 进入评审的一次提交。 |
| `ENT-007` | 实体 | Exchange（交换） | `LIGHT_DOMAIN_MODEL.md` | `FR-040`, `FLOW-003`, `DEC-009` | draft | 互惠可选；不含内容。 |
| `ENT-008` | 实体 | ContactInfo（联系方式） | `LIGHT_DOMAIN_MODEL.md` | `FR-130`, `DEC-010` | draft | 默认私密。 |
| `ENT-009` | 实体 | ContactDisclosure（联系方式披露） | `LIGHT_DOMAIN_MODEL.md` | `FR-130`, `ASM-013` | draft | 交换接受后披露快照。 |
| `ENT-010` | 实体 | Feedback（反馈） | `LIGHT_DOMAIN_MODEL.md` | `FR-050`, `FLOW-004` | draft | 结构化维度 + 权重。 |
| `ENT-011` | 实体 | TrustProfile（信任档案，派生） | `LIGHT_DOMAIN_MODEL.md` | `FR-050`, `FR-060`, `HARD-03` | draft | 可解释聚合。 |
| `ENT-012` | 实体 | Badge（徽章） | `LIGHT_DOMAIN_MODEL.md` | `FR-050` | draft | 信任/贡献标记。 |
| `ENT-013` | 实体 | SocialSignal（社交信号） | `LIGHT_DOMAIN_MODEL.md` | `FR-070` | draft | 收藏/认可/评论。 |
| `ENT-014` | 实体 | Report（举报） | `LIGHT_DOMAIN_MODEL.md` | `FR-070`, `FR-100` | draft | 目标=模块/用户/交换。 |
| `ENT-015` | 实体 | ReviewItem（评审/审核项） | `LIGHT_DOMAIN_MODEL.md` | `FR-100`, `FLOW-005` | draft | 裁决与风险摘要。 |
| `ENT-016` | 实体 | AgentSkill（Agent 技能条目） | `LIGHT_DOMAIN_MODEL.md` | `FR-080`, `CAP-009` | draft | MCP/本地工具目录。 |
| `ENT-017` | 实体 | Notification（通知） | `LIGHT_DOMAIN_MODEL.md` | `FR-120`, `FLOW-006` | draft | 事件驱动。 |
| `ENT-018` | 实体 | AuditLog（审计记录） | `LIGHT_DOMAIN_MODEL.md` | `NFR-006`, `FLOW-005` | draft | 合规可追溯。 |
| `ENT-019` | 实体 | UsageStat（使用统计，聚合） | `LIGHT_DOMAIN_MODEL.md` | `FR-140`, `DEC-011` | draft | 不含 PII。 |
| `ENT-020` | 实体 | Topic/Tag（主题标签） | `LIGHT_DOMAIN_MODEL.md` | `FR-010` | draft | 发现的筛选维度。 |
| `ENT-021` | 实体 | Consent（同意记录） | `LIGHT_DOMAIN_MODEL.md` | `NFR-005`, `FLOW-007` | draft | 跨边界动作的同意证明。 |
| `IA-001` | 信息架构界面 | 全局站点外壳 | `IA_SPEC.md` | `FR-001` | draft | 导航/搜索/登录/提交入口。 |
| `IA-002` | 信息架构界面 | 发现 / 注册表 | `IA_SPEC.md` | `FR-010` | draft | 公共主入口（首屏）。 |
| `IA-003` | 信息架构界面 | 知识模块详情 | `IA_SPEC.md` | `FR-020` | draft | 决策面。 |
| `IA-004` | 信息架构界面 | 提交模块向导 | `IA_SPEC.md` | `FR-030`, `FR-090` | draft | 含隐私门强约束。 |
| `IA-005` | 信息架构界面 | 交换记录（公开台账） | `IA_SPEC.md` | `FR-040` | draft | 不暴露私有内容。 |
| `IA-006` | 信息架构界面 | 交换详情 | `IA_SPEC.md` | `FR-040`, `FR-130` | draft | 含联系方式披露入口。 |
| `IA-007` | 信息架构界面 | 信任网络 / 用户档案 | `IA_SPEC.md` | `FR-060`, `FR-050` | draft | 声誉面。 |
| `IA-008` | 信息架构界面 | Agent 技能目录 | `IA_SPEC.md` | `FR-080` | draft | MCP/工具。 |
| `IA-009` | 信息架构界面 | 个人中心 Dashboard | `IA_SPEC.md` | `FR-060`, `FR-070`, `ASM-014` | draft | 私域管理面。 |
| `IA-010` | 信息架构界面 | 通知中心 | `IA_SPEC.md` | `FR-120` | draft | 事件驱动。 |
| `IA-011` | 信息架构界面 | 管理 / 审核控制台 | `IA_SPEC.md` | `FR-100` | draft | 仅管理员。 |
| `IA-012` | 信息架构界面 | 开放 API / agent 集成 | `IA_SPEC.md` | `FR-110` | draft | 零私有泄露承诺。 |
| `IA-013` | 信息架构界面 | 仓库 / 帮助 / 关于 | `IA_SPEC.md` | `NFR-004`, `FR-140` | draft | 含平台统计展示。 |
| `IA-014` | 信息架构界面 | 设置 | `IA_SPEC.md` | `FR-130`, `NFR-005` | draft | 联系方式可见性/同意。 |
| `PKG-001` | 工作包 | 注册表发现垂直切片 | `FUNCTION_OUTLINE.md` | `FR-001`, `FR-010` | draft | 页面规格之后的并行候选项。 |
| `PKG-002` | 工作包 | 模块详情垂直切片 | `FUNCTION_OUTLINE.md` | `FR-020`, `FR-090` | draft | 页面规格和模拟数据之后的并行候选项。 |
| `PKG-003` | 工作包 | 提交与隐私质量门垂直切片 | `FUNCTION_OUTLINE.md` | `FR-030`, `FR-090` | draft | 高风险；等待隐私和契约就绪。 |
| `PKG-004` | 工作包 | 交换生命周期垂直切片 | `FUNCTION_OUTLINE.md` | `FR-040`, `FR-050` | draft | 需要状态机。 |
| `PKG-005` | 工作包 | 信任与反馈垂直切片 | `FUNCTION_OUTLINE.md` | `FR-050`, `FR-060` | draft | 早期用模拟数据，后续接入真实评分。 |
| `PKG-006` | 工作包 | Agent skills 文档/工具垂直切片 | `FUNCTION_OUTLINE.md` | `FR-080`, `FR-110` | draft | CLI/MCP 可与网站分离。 |
| `PKG-007` | 工作包 | 管理审核垂直切片 | `FUNCTION_OUTLINE.md` | `FR-100` | draft | 跟随提交流水线。 |
| `PKG-008` | 工作包 | 公开 API 垂直切片 | `FUNCTION_OUTLINE.md` | `FR-110` | draft | 契约优先。 |
| `DEC-012` | 决策 | 唯一规范设计系统 + Material Symbols Outlined 为规范图标族 | `DECISION_LOG.md` | 用户确认、生成 HTML 证据、`docs/design/*.png` 采样 | active | 据 Stitch 产出修订（原选 Lucide）；彩色图标徽降级为 IconChip；Lucide 为实现期可选替换。 |
| `ASM-015` | 假设 | 令牌色值由压缩 PNG 采样近似 | `DEFAULT_ASSUMPTIONS.md` | `docs/design/*.png` | needs-confirmation | 待像素级核对主色/语义色。 |
| `ASM-016` | 假设 | 桌面 Web 优先、移动响应式延后到页面规格 | `DEFAULT_ASSUMPTIONS.md` | `docs/design/*.png` | active | 本阶段只立响应式原则。 |
| `UI-001` | UI 规则 | 规范设计令牌（色/字/间距/圆角/阴影） | `UI_RULES.md` | `docs/design/*.png`, `DEC-012` | draft | 主色 `#017A6E`；色值待 ASM-015 核对。 |
| `UI-002` | UI 规则 | 规范图标族 = Material Symbols Outlined | `UI_RULES.md` | `DEC-012`, 生成 HTML 证据 | draft | Lucide 为实现期可选 1:1 替换；GitHub Octocat 为品牌例外。 |
| `UI-003` | UI 规则 | 规范组件集（AppShell/Card/StatusPill/IconChip 等） | `UI_RULES.md` | `docs/design/*.png`, `IA_SPEC.md` | draft | 字段级细节在 09 组件规格 `COMP-*` 细化。 |
| `UI-004` | UI 规则 | 生成/还原一致性规则（含 image2 漂移防控） | `UI_RULES.md` | `gates/05-ui-gate.md`, `DEC-012` | draft | 每条 Stitch 提示词钉死同一系统 + 生成后检查。 |
| `PAGE-001~003` | 页面 | shell-discovery：全局外壳/发现/搜索结果 | `02-design/shell-discovery/PAGE_SPEC.md` | `IA-001`, `IA-002`, `FR-001`, `FR-010` | draft | PAGE-003 搜索结果为 FR-001 推导的 surface。 |
| `PAGE-010~015` | 页面 | module-detail：模块详情及子区 | `02-design/module-detail/PAGE_SPEC.md` | `IA-003`, `FR-020`, `FR-090` | draft | 子区同一路由，非新增界面。 |
| `PAGE-020~024` | 页面 | submission：5 步提交向导 | `02-design/submission/PAGE_SPEC.md` | `IA-004`, `FR-030`, `FR-090`, `FLOW-001` | draft | 隐私门为强约束步（PAGE-022）。 |
| `PAGE-030~031` | 页面 | exchange：公开记录 + 交换详情 | `02-design/exchange/PAGE_SPEC.md` | `IA-005`, `IA-006`, `FR-040`, `FR-130` | draft | 联系方式仅 Accepted 后披露。 |
| `PAGE-040~043` | 页面 | trust-feedback：信任档案/解释/反馈/信任网络着陆页 | `02-design/trust-feedback/PAGE_SPEC.md` | `IA-007`, `FR-050`, `FR-060`, `FR-001` | draft | 信任分可解释（HARD-03）；PAGE-043 补「信任网络」导航着陆缺口（审核）。 |
| `PAGE-050~051` | 页面 | agent-skills：技能目录 + 详情 | `02-design/agent-skills/PAGE_SPEC.md` | `IA-008`, `FR-080` | draft | 图标徽=IconChip；不自动越过同意。 |
| `PAGE-060~064` | 页面 | account：个人中心/分区/通知/设置 | `02-design/account/PAGE_SPEC.md` | `IA-009`, `IA-010`, `IA-014`, `FR-060`, `FR-120`, `FR-130` | draft | 联系方式默认私密（INV-03）。 |
| `PAGE-080~085` | 页面 | admin：审核台/队列/详情/审计/举报/确认 | `02-design/admin/PAGE_SPEC.md` | `IA-011`, `FR-100`, `FLOW-005` | draft | 仅管理员；破坏性操作二次确认。 |
| `PAGE-090` | 页面 | open-api：API 文档页 | `02-design/open-api/PAGE_SPEC.md` | `IA-012`, `FR-110`, `NFR-002` | draft | 单页；公开读不含 contact（ASM-055）。 |
| `PAGE-100~105` | 页面 | about：关于/仓库/统计/隐私/FAQ/审计链接 | `02-design/about/PAGE_SPEC.md` | `IA-013`, `NFR-004`, `FR-140` | draft | 统计仅聚合无 PII；文案漂移已归正。 |
| `ASM-017~061` | 假设 | 阶段08各模块页面级假设（45 项） | `DEFAULT_ASSUMPTIONS.md` + 各 `02-design/<模块>/PAGE_SPEC.md` | `08-page-spec` | active | 详见 DEFAULT_ASSUMPTIONS.md；ASM-021/028/032/033/050/055/061 已由 DEC-013 用户确认转 active。 |

## 完成标准

- 下游引用的每个需求、流程、实体、页面、API 和测试在此处都有 ID。
- ID 在用户确认后保持稳定；不要因排序变化而重新编号。
- 已弃用的 ID 仍保留在注册表中，状态为 `deprecated`，并在适用时附上替代项。
