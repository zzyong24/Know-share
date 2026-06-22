# 默认假设

| Assumption ID | 引入阶段 | 假设陈述 | 所选合理默认 | 若有误的风险 | 确认负责人 | 重新审视触发条件 | 当前状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ASM-001` | `00-intake` | 自此起，`/Users/zyongzhu/Workbase/Know-share` 为唯一可信来源的项目根目录。 | 已将先前的 Know-share 材料导入本工作区，并在此创建 orchestrator 文件。 | 如果用户原本期望旧路径仍为唯一可信来源，后续工作可能与旧工作区产生分歧。 | user | 用户表示要使用不同的项目根目录。 | needs-confirmation |
| `ASM-002` | `00-intake` | 当前的首要目标是分解，而非实现。 | 在编码前先产出分阶段产物，使后续多 agent 工作拥有清晰的契约。 | 如果用户原本想要立即搭建脚手架，短期进度会变慢。 | user | 用户要求在规格之前直接实现。 | active |
| `ASM-003` | `00-intake` | 现有的 UI 图像是设计输入，而非最终页面契约。 | 在实现前，将由图像衍生出的特性规整进 `FUNCTION_OUTLINE.md`、`IA_SPEC.md`、`PAGE_SPEC.md` 和 `FRONTEND_SPEC.md`。 | 如果对图像处理得过于宽松，可能遗漏某个视觉细节。 | agent | 阶段 07 UI 导入与阶段 08 页面规格。 | active |
| `ASM-004` | `00-intake` | MVP 应保持隐私优先和 agent 优先。 | 将原始内容排除在平台范围之外；聚焦于清单注册表、发现、交换请求/记录、反馈、信任以及 agent 辅助工具。 | 产品范围可能会显得比更丰富的 UI 探索要小。 | user | 产品规格确认。 | active |
| `ASM-005` | `00-intake` | 多 agent 并行化应在稳定的模块边界存在之后再进行。 | 在功能大纲、领域模型、页面规格和服务契约存在之前，延后并行实现。 | 并行 agent 可能启动得更晚，但返工更少。 | agent | 模块工作流与服务契约阶段。 | active |
| `ASM-006` | `02-product-brainstorming` | 实现可以稍后再排序，但设计产物应描述完整的目标产品，而非 V0.1/V0.2/V0.3 切片。 | 将所有以 UI 表达的能力都视为目标产品概念的一部分；用下游规格来定义依赖关系与构建顺序。 | 如果后续实现 agent 把排序误解为范围缩减，产品覆盖范围可能会收窄。 | agent | 产品规格与实现规划。 | active |
| `ASM-007` | `03-product-spec` | 私下交换的主交付通道为 GitHub 私有仓库，DM 与用户批准的协作链接为备选。 | 平台只跟踪交付状态、不持有内容；以 GitHub 私有仓库为主路径与 `DEC-006` 的 GitHub 身份骨干一致。 | 若所有者主要使用非 GitHub 通道，私下交付跟踪模型需调整。 | user | 业务流程 / 服务契约阶段。 | active |
| `ASM-008` | `03-product-spec` | 目标产品为动态平台（含后端 API、审核、反馈、通知）；首个实现可从静态注册表起步。 | 按 `DEC-005` 完整设计目标产品；实现排序在下游决定，但不缩小目标产品。 | 若实现 agent 把"静态起步"误读为目标范围，产品会被缩窄。 | agent | 后端规格 / 集成阶段。 | active |
| `ASM-009` | `04-business-flow` | 交换互惠可选：可互惠（配对自有模块）或单向（只索取），提供模块为可选项。 | 由 `DEC-009` 确认；降低交换门槛、扩大可达性，与非商业互惠精神不冲突。 | 若之后要求强制互惠，状态机与 UI 需调整。 | user | 已由 DEC-009 确认。 | active |
| `ASM-010` | `04-business-flow` | 交付完成需双方所有者各自确认（Delivered→Completed）。 | 避免单方误标完成造成信任信号失真。 | 若改为单方标记，需补对账/申诉机制。 | user | 领域模型 / 服务契约。 | active |
| `ASM-011` | `04-business-flow` | 反馈窗口到期后允许关闭交换（WaitingForFeedback→Closed）。 | 避免一方不反馈导致交换永久挂起。 | 窗口设置不当可能过早关闭或拖延。 | user | 领域模型 / 服务契约。 | active |
| `ASM-012` | `05-light-domain-model` | Agent 为与 User 关联的行动者角色，非独立持久实体。 | 保持模型轻量；身份以 User(GitHub) 为锚。 | 若认证写 API 需要签名的 agent 身份，需在服务契约阶段升格为实体。 | agent | 服务契约阶段。 | active |
| `ASM-013` | `05-light-domain-model` | 联系方式按交换披露快照，撤回只影响未来披露。 | 已披露内容无法技术性收回，快照可保留审计与交付一致性。 | 若需更强撤回/失效语义，需在服务契约阶段定义。 | agent | 服务契约阶段。 | active |
| `ASM-014` | `06-ia-spec` | 已登录用户的"我的模块/草稿/收到的交换/收藏"收敛到一个个人中心 Dashboard。 | 减少顶层界面数量、贴合用户私域管理心智。 | 若某面信息量过大可能需拆分为独立界面。 | agent | 页面规格阶段。 | active |
| `ASM-015` | `07-ui-generation-or-import` | UI_RULES.md 的设计令牌色值（主色 `#017A6E`、各语义色）由压缩 PNG 全分辨率采样近似得出。 | 在缺少原始色板时，采样值足以驱动一致生成与还原；登记为待核对。 | 与设计原意可能有微差，影响品牌一致性与生成保真。 | user | 用户像素级核对或提供原始色板。 | needs-confirmation |
| `ASM-016` | `07-ui-generation-or-import` | 视觉与生成以桌面 Web 为优先；移动/平板响应式细节延后到页面规格逐面细化。 | 7 张真源图均为桌面布局；本阶段只立响应式原则与断点。 | 若产品需移动优先，布局规范与 Stitch 生成设备类型要调整。 | user | 页面规格阶段 / 用户确认目标设备。 | active |
| `ASM-017` | `08-page-spec` | 发现页筛选维度={类型/主题/信任级别/Verified}、排序={相关度/最新/最热/信任分}。 | 据 FR-010/ENT 推断；真源图未标全集。 | 维度增减需调筛选行/URL 参数。 | agent | 页面确认 / 服务契约。 | active |
| `ASM-018` | `08-page-spec` | 全局搜索查询长度上限≈200 字符。 | 占位，待后端契约对齐。 | 与后端契约不一致需调整。 | agent | 服务契约阶段。 | active |
| `ASM-019` | `08-page-spec` | 后端不可用时外壳降级为匿名只读（导航/搜索可见，写动作禁用提示）。 | 守隐私优先、避免误导。 | 若需离线缓存/排队提交需升级。 | agent | 前端实现/服务契约。 | active |
| `ASM-020` | `08-page-spec` | 前端做"私有内容二次防线"+去标识化聚合分析；主防线仍在隐私门/服务契约。 | 守 INV-01/09；前端仅兜底。 | 归口需在服务契约阶段对齐。 | agent | 服务契约阶段。 | active |
| `ASM-021` | `08-page-spec` | 模块详情页"Contact Commitment"为占位/锁定态，不展示真实联系方式。 | 守 INV-03（联系方式仅 Accepted 后披露）。 | 若误展示真实联系方式将违反隐私边界。 | user | 页面确认 / 服务契约。 | needs-confirmation |
| `ASM-022` | `08-page-spec` | 详情页四个 StatBlock 标签映射（设计图 23/12/8/18.7k）。 | 据真源图位置推断标签语义。 | 标签语义错配需回填。 | agent | 页面确认。 | active |
| `ASM-023` | `08-page-spec` | Manifest 增 content-commitment 字段以支撑 HARD-07。 | 示例 JSON 暂无该字段，先登记。 | 字段最终形态需与数据契约对齐。 | agent | 服务契约 / 数据契约。 | active |
| `ASM-024` | `08-page-spec` | Manifest 预览屏蔽 contact 字段（PII）。 | 守 INV-03/04；预览只显示脱敏内容。 | 若预览泄露 contact 将违反隐私。 | agent | 页面确认。 | active |
| `ASM-025` | `08-page-spec` | 模块详情移动端单列 + 侧栏下沉，保证"请求交换"CTA 高可见。 | 承接 ASM-016 响应式原则。 | 若移动优先需重排。 | agent | 页面确认。 | active |
| `ASM-026` | `08-page-spec` | 提交向导为 5 步且与设计图 Stepper 一一对应。 | 依据 FLOW-001 五环节与真源图。 | 步数不同需重划 PAGE。 | user | 页面确认。 | active |
| `ASM-027` | `08-page-spec` | 向导子路由命名 /submit/{source,manifest,privacy-gate,preview,confirm}。 | 多步线性、可深链。 | 若单页分步需改路由契约。 | agent | 前端实现。 | active |
| `ASM-028` | `08-page-spec` | PrivacyScan 在本机由 Agent 技能执行，平台只收脱敏 findings。 | 守 INV-01（原始内容不离机）。 | 若需服务端扫描则与 INV-01 冲突，须重设扫描边界。 | user | 服务契约 / HARD-01。 | needs-confirmation |
| `ASM-029` | `08-page-spec` | 三个同意门各写一条 Consent，warn 以勾选复选框为显式同意载体。 | 守 NFR-005 显式同意。 | 粒度不同需调整 IA-014 同意记录展示。 | agent | 服务契约。 | active |
| `ASM-030` | `08-page-spec` | "准备私下交换包"在提交步仅作机制说明，实际打包在交换被接受后。 | 守 INV-01；提交期不建私有仓脚手架。 | 若要求提交时即建脚手架需加步骤。 | agent | 交换/服务契约。 | active |
| `ASM-031` | `08-page-spec` | 脱敏交换号（如 EX-2024-8842）作对外标识与路由参数。 | 不暴露内部主键。 | 若需别的标识方案需调整路由。 | agent | 服务契约。 | active |
| `ASM-032` | `08-page-spec` | Flagged/审核中交换在公开台账默认隐藏争议明细。 | 守隐私与公平；二选一（完全隐藏 vs 显示中性"审核中"）待定。 | 可见性策略需与审核模块对齐。 | user | 页面确认 / 审核对齐。 | needs-confirmation |
| `ASM-033` | `08-page-spec` | 交换详情"在线沟通(IM)"按钮锚定 FR-130/ASM-007 备选通道，仅对方披露 IM 后启用；平台不内置 IM。 | 守 INV-01（平台不承载通信内容）。 | 若要内置 IM 则边界需重设。 | user | 产品边界 / 服务契约。 | needs-confirmation |
| `ASM-034` | `08-page-spec` | 交换详情"自动验证状态"只引用身份/所有权/状态信号，不读取交付物内容。 | 守 INV-01。 | 若读取交付物内容将越界。 | agent | 服务契约。 | active |
| `ASM-035` | `08-page-spec` | 台账行信任级别为只读轻量信号，详细解释留在信任档案 IA-007。 | 避免台账信息过载。 | 若需就地解释需扩展行。 | agent | 页面确认。 | active |
| `ASM-036` | `08-page-spec` | 信任分解释与反馈提交以子 surface（抽屉/嵌入）+深链呈现。 | 减少顶层界面；贴合上下文。 | 若需独立全页则路由调整。 | agent | 页面确认。 | active |
| `ASM-037` | `08-page-spec` | 信任分满分基准 1000、等级按区间分档。 | 真源图圆环呈分值；量纲先占位。 | 若量纲不同（0–100/无上限）圆环与等级需重做。 | user | 服务契约阶段。 | active |
| `ASM-038` | `08-page-spec` | 公开档案路由以 GitHub login 为键 /u/:githubLogin；未注册显示中性"尚未加入"。 | 与 GitHub 身份骨干一致（DEC-006）。 | 若以内部 userId 为键或需隐藏存在性则调整。 | agent | 服务契约。 | active |
| `ASM-039` | `08-page-spec` | "社区/世界排名"与反馈草稿为可选增强；信任拆解固定四类来源+徽章加成；明确非付费、不可购买。 | 守 DEC-007（无经济模型）、HARD-03（可解释）。 | 排名口径不明可去除。 | user | 页面确认。 | active |
| `ASM-040` | `08-page-spec` | Agent 技能以 MCP server + 本地 CLI 双形态分发；包名 know-share-mcp、CLI 前缀 know-share 为占位。 | 贴合 agent 可读（NFR-002）。 | 命名/形态待 PKG-006 契约阶段定稿。 | agent | PKG-006 / 服务契约。 | active |
| `ASM-041` | `08-page-spec` | package-private-repo 技能仅生成仓库配置+邀请链接，不自动建协作/不自动 PR。 | 守"不自动越过人类同意"边界。 | 若自动化协作需新增同意决策。 | agent | 服务契约。 | active |
| `ASM-042` | `08-page-spec` | 技能详情为子 surface（抽屉+深链），非独立顶层 IA 界面。 | 减少顶层界面。 | 若需独立页则路由调整。 | agent | 页面确认。 | active |
| `ASM-043` | `08-page-spec` | 个人中心分区为 /me/:section 路由（非单页 Tab）。 | 可深链各分区。 | 若要 Tab 切换，深链模型需调整。 | agent | 前端实现。 | active |
| `ASM-044` | `08-page-spec` | 草稿=Submission 的 Draft 态（ENT-006），与已发布模块（ENT-003）分列。 | 与领域模型一致。 | 建模口径不同则数据源需改。 | agent | 服务契约。 | active |
| `ASM-045` | `08-page-spec` | 通知支持分页/筛选，未读乐观更新。 | 高密度列表体验。 | 若要求强一致已读，交互简化。 | agent | 前端实现 / 服务契约。 | active |
| `ASM-046` | `08-page-spec` | 同意记录融合 ENT-021 Consent 与 ENT-009 ContactDisclosure 展示。 | 用户视角统一的"我授权过什么"。 | 若需严格分列则拆两区。 | agent | 服务契约。 | active |
| `ASM-047` | `08-page-spec` | 设置其余 3 分区（隐私与同意/账户/通知偏好）按设计已列项细化为最小内容，不超出 FR-120/130/001。 | 避免越权扩面。 | 若需更多设置项需追溯新 FR。 | agent | 页面确认。 | active |
| `ASM-048` | `08-page-spec` | 通知偏好仅控制站内通知（邮件/webhook 延后），默认全开。 | 与 FR-120"站内优先"一致。 | 若上线邮件/webhook 需扩展。 | agent | 服务契约。 | active |
| `ASM-049` | `08-page-spec` | 审核台子界面同页分区/抽屉，而非独立路由。 | 高密度工作台。 | 若需深链分页则路由要调整。 | agent | 前端实现。 | active |
| `ASM-050` | `08-page-spec` | 保留"批量通过"，仅作用 pass 子集、逐项写审计。 | 真源 HTML 有此按钮；提效但留痕。 | 若产品不允许批量处置需移除。 | user | 页面确认。 | needs-confirmation |
| `ASM-051` | `08-page-spec` | 退回/下架/封禁的处置原因必填。 | 保 ENT-018 审计可追溯。 | 若允许无原因处置则放宽。 | agent | 页面确认。 | active |
| `ASM-052` | `08-page-spec` | 用户封禁/处罚为基本处罚（标记/限流），不含申诉/仲裁。 | 控制本阶段范围。 | 需完整处罚分级时扩展。 | agent | 后续治理设计。 | active |
| `ASM-053` | `08-page-spec` | 风险摘要"已处理"口径默认=当日已处置数。 | UsageStat 管理子集，聚合无 PII。 | 若应为累计/滚动窗口需调整口径。 | user | 服务契约。 | active |
| `ASM-054` | `08-page-spec` | 开放 API 文档页路由 /developers + 分类锚点。 | 开发者面常用路径。 | 路由命名可调。 | agent | 前端实现。 | active |
| `ASM-055` | `08-page-spec` | 公开读 API 不输出 contact 字段（即使 data-contract 含该字段）。 | 守 INV-03/FR-130（contact 默认私密）。 | 待确认是否保留"已批准公开 handle"子集。 | user | 服务契约 / 数据契约。 | needs-confirmation |
| `ASM-056` | `08-page-spec` | API 文档页桌面优先、窄屏折叠。 | 承接 ASM-016。 | 若移动优先需重排。 | agent | 页面确认。 | active |
| `ASM-057` | `08-page-spec` | API 速率限制仅文字标注，阈值延后到服务契约。 | 抗滥用（NFR-006）先声明。 | 阈值需后端定。 | agent | 服务契约。 | active |
| `ASM-058` | `08-page-spec` | 关于页访问/外链点击若统计，并入 ENT-019 聚合口径、不含 PII。 | 守 DEC-011/INV-09。 | 若需个体级分析将越界。 | agent | 服务契约。 | active |
| `ASM-059` | `08-page-spec` | 统计区"时间窗切换"仍走聚合接口、不返回个体明细。 | 守聚合无 PII。 | 若返回明细将违 INV-09。 | agent | 服务契约。 | active |
| `ASM-060` | `08-page-spec` | 关于页 Hero 装饰"活跃节点 512"须改引 ENT-019 真实口径或降为纯装饰。 | 避免硬编码数字冒充统计。 | 若保留须接真实聚合源。 | agent | 页面确认 / 前端实现。 | active |
