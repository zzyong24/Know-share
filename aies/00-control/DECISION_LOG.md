# 决策日志

## 目的

记录确认事项、假设、权衡、已接受风险以及跳过的阶段，使未来的 agent 无需查阅聊天记录。

## 条目

```text
ID: DEC-001
Date: 2026-06-22
Stage: 00-intake
Type: default-assumption
Decision: 将现有的 Know-share 材料从 /Users/zyongzhu/Documents/Codex/2026-06-22/new-chat/Know-share 导入到 /Users/zyongzhu/Workbase/Know-share，并将此工作区视为当前活跃的项目根目录。
Rationale: 当前工作区为空，而先前的工作区包含当前产品讨论中引用的 README、文档、清单示例、设计图和 git 历史。
Source: 用户要求在当前项目中继续先前的 Codex 线程工作；文件系统证据显示当前根目录为空，而先前的 Know-share 已填充内容。
Affected Artifacts: README.md, docs/, examples/, ARTIFACT_MANIFEST.yaml, PROJECT_CONTEXT.md
Invalidates: none
Owner: agent
Revisit Trigger: 如果用户表示应改为以旧工作区作为唯一可信来源。
Status: active
```

```text
ID: DEC-002
Date: 2026-06-22
Stage: 00-intake
Type: user-confirmation
Decision: 采用 product-to-code-orchestrator 作为交付工作流，并将产品拆分为适合后续多 agent 并行实现的产物。
Rationale: 用户明确调用了该 skill，并表示下一步目标是为多 agent 实现而彻底拆解带 UI 的产品范围。
Source: 用户于 2026-06-22 的消息。
Affected Artifacts: ARTIFACT_MANIFEST.yaml, FUNCTION_OUTLINE.md, 下游规格
Invalidates: none
Owner: user
Revisit Trigger: 如果用户要求放弃分阶段产物并直接实现。
Status: active
```

```text
ID: DEC-003
Date: 2026-06-22
Stage: 01-project-kickoff
Type: user-confirmation
Decision: 以 `Know-share` 作为项目名称，以 `/Users/zyongzhu/Workbase/Know-share` 作为活跃产物根目录，并以个人 agent 及其人类所有者作为目标受众。
Rationale: 代码仓库的 README 将产品命名为 Know-share 并定义了 agent/用户受众；用户要求使用 product-to-code 工作流在当前项目中继续此产品。
Source: README.md；PROJECT_CONTEXT.md；用户于 2026-06-22 的消息。
Affected Artifacts: AGENTS.md, ARTIFACT_MANIFEST.yaml, PROJECT_CONTEXT.md
Invalidates: none
Owner: user
Revisit Trigger: 如果项目被重命名、迁移或重新定向到不同的主要受众。
Status: active
```

```text
ID: DEC-004
Date: 2026-06-22
Stage: 02-product-brainstorming
Type: tradeoff
Decision: 采用垂直切片混合方式拆解 Know-share：先稳定共享契约，然后并行推进 Discovery、Module Detail、Submission、Exchange、Trust Profile、Agent Skills、Admin 和 API 工作包。
Rationale: 纯粹的页面优先拆分在视觉上推进快，但有在各 agent 之间造成 schema、信任、隐私和交换状态漂移的风险。纯粹的领域优先拆分更安全，但会延迟可见的产品验证。混合方式既保持共享契约稳定，又仍能在后续支持并行的 UI/后端切片。
Source: FUNCTION_OUTLINE.md；用户要求为多 agent 实现做准备。
Affected Artifacts: FUNCTION_OUTLINE.md, TRACEABILITY_MATRIX.md, 未来的 PRODUCT_SPEC.md, BUSINESS_FLOW.md, LIGHT_DOMAIN_MODEL.md, IA_SPEC.md, PAGE_SPEC.md, SERVICE_CONTRACT.md
Invalidates: none
Owner: agent
Revisit Trigger: 如果用户选择不同的 MVP 切片或实现策略。
Status: active
```

```text
ID: DEC-005
Date: 2026-06-22
Stage: 02-product-brainstorming
Type: user-confirmation
Decision: 在当前的产品/规格阶段设计完整的 Know-share 目标产品，而不是将产品范围划分为 V0.1、V0.2 和 V0.3。
Rationale: 用户希望设计阶段先完整构想产品。实现排期仍可在之后进行以协调工程，但不应约束或重新定义产品概念。
Source: 用户于 2026-06-22 的消息："我其实是不想分这个v0.1 0.2的，我们在这个设计阶段就是要把这个全部都构想好。"
Affected Artifacts: FUNCTION_OUTLINE.md, DEFAULT_ASSUMPTIONS.md, ARTIFACT_MANIFEST.yaml, 未来的 PRODUCT_SPEC.md
Invalidates: none
Owner: user
Revisit Trigger: 如果用户之后要求提供针对特定发布的 MVP 规格。
Status: active
```

```text
ID: DEC-006
Date: 2026-06-22
Stage: 03-product-spec
Type: user-confirmation
Decision: 目标产品以 GitHub 作为规范的身份与验证来源（GitHub Verified 为信任骨干），架构上预留未来接入其他身份提供方的扩展位，但本版产品规格以 GitHub 为准。
Rationale: 功能大纲与 UI 反复以 GitHub 登录/GitHub Verified 作为身份与信任信号；用户确认以 GitHub 为规范并预留扩展，避免过早抽象通用身份层带来的信任/验证复杂度。
Source: 用户于 2026-06-22 对 03-product-spec A 级问题的回答；FUNCTION_OUTLINE.md（CAP-001、CAP-006、CAP-007）。
Affected Artifacts: PRODUCT_SPEC.md, ID_REGISTRY.md, 未来的 BUSINESS_FLOW.md、LIGHT_DOMAIN_MODEL.md、IA_SPEC.md、SERVICE_CONTRACT.md
Invalidates: none
Owner: user
Revisit Trigger: 如果用户要求从一开始就支持多身份提供方。
Status: active
```

```text
ID: DEC-007
Date: 2026-06-22
Stage: 03-product-spec
Type: user-confirmation
Decision: 目标产品不包含任何经济模型——交换为非商业、基于同意的互惠；付费、计费、佣金、咨询或交易形态均不在产品范围内。
Rationale: 用户明确表示"产品里面没有说要经济模型，没有经济模型"。据此将一切货币化形态列为非目标，使隐私、信任与同意成为产品核心，而非交易撮合。
Source: 用户于 2026-06-22 对 03-product-spec A 级问题的回答。
Affected Artifacts: PRODUCT_SPEC.md, 未来的 BUSINESS_FLOW.md、LIGHT_DOMAIN_MODEL.md
Invalidates: none
Owner: user
Revisit Trigger: 如果用户之后要求引入付费/咨询型交换。
Status: active
```

```text
ID: DEC-008
Date: 2026-06-22
Stage: 03-product-spec
Type: user-confirmation
Decision: 产品规格承诺完整目标产品（CAP-001~013，无版本切分），不使用"推迟项"式弱化范围；仅保留三条真实产品边界（不托管原始内容、无经济模型、不自动越过人类同意）。其余原"推迟项"重新定性为必须在设计路径上解决的关键难点（HARD-01~09），逐项映射到解决阶段与并行工作包，再拆成具体小任务供并行 agent 执行。
Rationale: 用户指出大量"推迟项"与"设计完整产品、并行开发"的目标矛盾——目标是先把卡点/难点解决、给 agent 一条可拆分为并行小任务的路径，而非缩小产品。
Source: 用户于 2026-06-22 的消息："为什么写这文档，这里面这么多推迟项啊？……我们就是要把这些卡点、这些难点都解决再去做……给agent一个路径，然后拆分成具体的小任务，并行去跑。"
Affected Artifacts: PRODUCT_SPEC.md, FUNCTION_OUTLINE.md（"推迟项"改读为优先级/扩展面）, 未来的 BUSINESS_FLOW.md、LIGHT_DOMAIN_MODEL.md、SERVICE_CONTRACT.md、MODULE_WORKFLOW_SPEC.md
Invalidates: none
Owner: user
Revisit Trigger: 如果用户之后要求按发布版本切分范围。
Status: active
```

```text
ID: DEC-009
Date: 2026-06-22
Stage: 04-business-flow
Type: user-confirmation
Decision: 交换支持单向请求——互惠为可选而非强制；请求方可只索取不提供模块。提供自有模块为可选项（可能提高被接受概率）。
Rationale: 用户要求"也支持那种单向请求吧，可以只索取"。降低交换门槛、扩大可达性，同时与无经济模型的非商业互惠精神不冲突。
Source: 用户于 2026-06-22 的消息。
Affected Artifacts: BUSINESS_FLOW.md（FLOW-003、业务规则、决策点、状态机）, ASM-009, 未来的 LIGHT_DOMAIN_MODEL.md、SERVICE_CONTRACT.md
Invalidates: 取代了 ASM-009 早前"强制互惠"的设定
Owner: user
Revisit Trigger: 如果用户之后要求恢复强制互惠。
Status: active
```

```text
ID: DEC-010
Date: 2026-06-22
Stage: 04-business-flow
Type: user-confirmation
Decision: 绑定平台时收集用户自选的联系方式，用于 agent 背后的人之间的一对一深度连接；联系方式默认完全私密，仅在一次交换被接受后对该次对方披露，用户可选披露哪些、可编辑/撤回，可单独把某 handle 设为公开。
Rationale: 用户提出绑定时提供联系方式以方便私下深度链接；这正中产品核心目标（以知识交换为桥促成人际深连接）。但联系方式是 PII，必须默认私密、同意后披露，以守住 NFR-001/NFR-005/NFR-006。
Source: 用户于 2026-06-22 的消息 + 对"联系方式可见性"问题选择"默认私密、交换接受后披露"。
Affected Artifacts: PRODUCT_SPEC.md（新增 FR-130）, BUSINESS_FLOW.md（FLOW-003/007、业务规则、决策点）, 未来的领域模型/页面/服务契约
Invalidates: none
Owner: user
Revisit Trigger: 如果用户要求改变联系方式可见性模型。
Status: active
```

```text
ID: DEC-011
Date: 2026-06-22
Stage: 04-business-flow
Type: user-confirmation
Decision: 目标产品包含一个轻度后端服务（非纯静态），承载动态行为并支撑平台使用统计（用户数、模块数、交换数等聚合指标）；统计只做聚合、不含 PII。
Rationale: 用户说明"我们有一个轻度后端服务，方便统计平台使用人数之类"。据此将 ASM-008 的静态/动态之争定为"含轻后端"，并新增 FR-140；以聚合、不含 PII 守住隐私优先。
Source: 用户于 2026-06-22 的消息。
Affected Artifacts: PRODUCT_SPEC.md（新增 FR-140）, BUSINESS_FLOW.md（FLOW-008）, ASM-008, 未来的后端规格/服务契约
Invalidates: none
Owner: user
Revisit Trigger: 如果用户改变后端范围或统计口径。
Status: active
```

```text
ID: DEC-012
Date: 2026-06-22
Stage: 07-ui-generation-or-import
Type: user-confirmation
Decision: 确立 Know-share 唯一一套规范设计系统：设计令牌 UI-001（主色深青绿 #017A6E、近白底、12/8px 圆角、Inter+等宽、语义状态色），规范图标族 UI-002 = Material Symbols Outlined（Google，outline、FILL 0），规范组件 UI-003。7 张已有图中的"彩色圆角方块图标徽"降级为组件 IconChip（容器着色、内部字形仍为 Material Symbols Outlined），不作为第二图标族。Lucide 降为实现期可选 1:1 等价替换（按图标名映射）。
Rationale: 用户硬规则要求"先立 ONE 规范设计系统、七张图图标不一致须挑一族作规范、不把冲突变体带入新界面"。初版选 Lucide，但读 Stitch 生成的样板 HTML（IA-006）发现其实际产出的是 Material Symbols Outlined（search/verified/check_circle 等 32 处），且已有 7 图同属一条 Stitch 流水线、极可能也用 Material Symbols。强行换 Lucide 等于与生成器对抗并制造跨屏漂移；改以 Material Symbols Outlined 为规范，消除"规范 vs 工具产出"的冲突、保证真实还原与跨屏一致。
Source: 用户于 2026-06-22 关于阶段 07 一致性硬规则的指令 + 对"图标族"问题选择"改用 Material Symbols（修订 DEC-012）"；docs/design/*.png 采样（主色 H≈174°）；生成 HTML docs/design/generated/IA-006-exchange-detail.html 的图标实现证据。
Affected Artifacts: aies/02-design/UI_RULES.md, ID_REGISTRY.md, Stitch 设计系统 assets/4528660503651777687, 未来的 COMPONENTS_SPEC.md、PAGE_SPEC.md、前端实现
Invalidates: 取代初版 DEC-012 中"规范图标族=Lucide"的设定
Owner: user
Revisit Trigger: 用户像素级核对后要调整主色/语义色（ASM-015），或最终前端栈坚持以 Lucide 为规范（则需在阶段 09/11 做图标名映射替换）。
Status: active
```

```text
ID: DEC-013
Date: 2026-06-23
Stage: 08-page-spec
Type: user-confirmation
Decision: 用户签字确认阶段 08 页面规格（10 模块 ~32 页 PAGE-001~105）通过，并接受 7 条 needs-confirmation 假设的推荐默认：ASM-021（模块详情联系方式仅占位/锁定）、ASM-028（隐私扫描在用户本机执行、平台只收脱敏结果）、ASM-032（审核中交换在公开台账显中性「审核中」）、ASM-033（不内置 IM、仅对方披露后启用在线沟通）、ASM-050（审核台保留批量通过、仅 pass 子集+逐项审计）、ASM-055（公开读 API 不输出 contact 字段）、ASM-061（单设 /trust 信任网络着陆页 PAGE-043）。该 7 条假设状态转 active。
Rationale: 页面规格已并行产出、经 spec 交叉审核（修正路由/笔误不一致、确认跨模块连贯、补齐信任网络导航着陆缺口），用户对剩余决策项接受推荐默认。阶段 08 转 passed，解锁阶段 09 起的多 agent 推进。
Source: 用户于 2026-06-23 的消息「接受」（对 7 条 needs-confirmation 假设的确认）。
Affected Artifacts: aies/02-design/*/PAGE_SPEC.md（10 份）, DEFAULT_ASSUMPTIONS.md（ASM-021/028/032/033/050/055/061 → active）, ARTIFACT_MANIFEST.yaml（stage 08 → passed）, 下游 09 前端规格/组件规格
Invalidates: none
Owner: user
Revisit Trigger: 若服务契约或前端实现阶段发现某条假设不成立（尤以 ASM-028 隐私扫描边界、ASM-055 contact 字段为重）。
Status: active
```

```text
ID: DEC-014
Date: 2026-06-23
Stage: 09-frontend-spec
Type: user-confirmation
Decision: 前端技术栈采用 Next.js + TypeScript + Tailwind CSS + shadcn/ui。Tailwind 承载 UI_RULES 的设计令牌（UI-001，主色 #017A6E 等）；shadcn/ui 作为规范组件（UI-003）的实现底座。图标：规范族仍为 Material Symbols Outlined（DEC-012），shadcn/ui 默认的 lucide-react 作为 DEC-012 已登记的 1:1 等价替换路径（按图标名映射），最终图标库在前端实现阶段定稿。
Rationale: 与已生成的高保真 HTML（Tailwind + 我们的令牌命中）无缝衔接；Next.js 适合公开发现/注册表的 SSR/SEO 与 agent 可读（NFR-002）；shadcn/ui 提供可拥有源码的无样式组件、便于落地规范组件与无障碍底线（NFR-007）。取代 PROJECT_CONTEXT 中"早期讨论但未批准"的状态。
Source: 用户于 2026-06-23 对 09-frontend-spec A 级问题的选择「Next.js + TS + Tailwind + shadcn/ui（推荐）」。
Affected Artifacts: PROJECT_CONTEXT.md（技术栈转已批准）, aies/03-frontend/FRONTEND_SPEC.md, 各 02-design/<模块>/COMPONENTS_SPEC.md, 未来 app/ 实现
Invalidates: none（确认了此前未批准的早期讨论）
Owner: user
Revisit Trigger: 若团队改选别的框架/组件库，或决定以 Material Symbols 而非 Lucide 作为实现图标库。
Status: active
```

## 完成标准

- 记录任何 A 级问题的回答。
- 记录任何影响产品行为、数据、成本、安全、用户信任、契约或发布范围的默认假设。
- 任何已接受风险都包含用户的明确接受以及重新审视触发条件。
- 任何跳过的阶段都包含原因、风险和下游影响。
