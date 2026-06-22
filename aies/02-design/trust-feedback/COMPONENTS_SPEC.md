# 组件规格 — 信任反馈模块（trust-feedback）

## 摘要

本产物把 `trust-feedback` 模块四个页面（`PAGE-040` 信任档案 / `PAGE-041` 信任分解释 / `PAGE-042` 结构化反馈提交 / `PAGE-043` 信任网络着陆）落成可实现的**模块特有组件契约**，编号段 `COMP-110~129`（由 `FRONTEND_SPEC.md` §7 分配，防并行碰撞）。共享组件（`COMP-001~040`，定义于 `aies/02-design/_shared/COMPONENTS_SPEC.md`）**只引用其 ID、不重复定义**。

本模块的硬核是 `HARD-03`「信任可解释」：信任分必须能展开为「交换历史 / 反馈质量 / GitHub 验证 / 举报」四类来源；并在界面三处（档案反馈质量区、解释面文案、反馈表单提示）兑现 `INV-10`「实际交换参与方反馈的权重高于社交信号」。全程无任何经济元素（`DEC-007`），锚定规范设计系统 shadcn/ui + Tailwind + 单一图标族 Material Symbols Outlined（实现以 `lucide-react` 1:1 替换，`DEC-012`/`UI-002`）。

### 产物元数据

- Stage: `09-frontend-spec`（组件规格扇出 — trust-feedback 模块）
- Status: `passed（2026-06-23 用户签字）`
- Owner module: `trust-feedback`
- COMP-* ID 段（模块特有）: `COMP-110` ~ `COMP-129`（实际使用 `COMP-110`~`COMP-119`；`COMP-120`~`COMP-129` 预留）
- Upstream IDs: `PAGE-040`、`PAGE-041`、`PAGE-042`、`PAGE-043`；`IA-007`；`FR-050`、`FR-060`；`FLOW-004`；`ENT-001`、`ENT-010`、`ENT-011`、`ENT-012`、`ENT-007`、`ENT-013`、`ENT-020`、`ENT-019`；`INV-04`、`INV-09`、`INV-10`、`INV-11`；`HARD-03`；`NFR-004`、`NFR-006`、`NFR-007`
- Decision IDs: `DEC-006`（GitHub 规范身份）、`DEC-007`（无经济模型）、`DEC-012`（规范设计系统 / Material Symbols Outlined）、`DEC-014`（前端栈 Next.js+TS+Tailwind+shadcn/ui）
- Source inputs: `aies/02-design/trust-feedback/PAGE_SPEC.md`、`aies/03-frontend/FRONTEND_SPEC.md`、`aies/02-design/UI_RULES.md`、`aies/02-design/IA_SPEC.md`、`aies/01-product/LIGHT_DOMAIN_MODEL.md`、`aies/00-control/ID_REGISTRY.md`
- 引用的共享组件（不在此重复定义）: `COMP-001 AppShell`、`COMP-007 PrimaryButton`、`COMP-008 SecondaryButton`、`COMP-009 Card`、`COMP-010 ModuleCard`、`COMP-011 StatusPill`、`COMP-012 TrustBadge`、`COMP-013 IconChip`、`COMP-014 StatBlock`、`COMP-015 DataTable`、`COMP-016 ListRow`、`COMP-017 LineChart`、`COMP-018 DonutChart`、`COMP-021 EmptyState`、`COMP-022 TopicChip`、`COMP-025 ConfirmDialog`、`COMP-026 Drawer`、`COMP-030 FormField`、`COMP-032 Pagination/LoadMore`、`COMP-033 Skeleton`、`COMP-034 Avatar`、`COMP-035 RatingInput`
- 本模块新增假设: `ASM-089`、`ASM-090`（见文末；**未写入 `DEFAULT_ASSUMPTIONS.md`**，待编排者裁定）

### 字段约定

每个组件含 8 字段（对齐 `templates/COMPONENTS_SPEC_TEMPLATE.md`）：Component name / Purpose / Props or inputs / Events or outputs / States / Accessibility requirements / Data dependencies / Tests。不适用项注明理由。

### 组件清单速查

| COMP | 组件 | 落地页面 | 关键追溯 | 复用的共享组件 |
| --- | --- | --- | --- | --- |
| `COMP-110` | `TrustScoreRing`（信任分环形） | PAGE-040 / PAGE-043 | `ENT-011`、`HARD-03`、`ASM-037` | `COMP-018 DonutChart` |
| `COMP-111` | `TrustBreakdown`（可解释拆解） | PAGE-041（PAGE-040 入口） | `HARD-03`、`ENT-011.解释`、`INV-10`、`NFR-004` | `COMP-026 Drawer`、`COMP-014 StatBlock`、`COMP-017 LineChart` |
| `COMP-112` | `ReputationTrend`（声誉趋势） | PAGE-040 / PAGE-041 | `ENT-011.分数趋势`、`NFR-007` | `COMP-017 LineChart` |
| `COMP-113` | `BadgeWall`（徽章墙） | PAGE-040 | `ENT-012`、`FR-050` | `COMP-012 TrustBadge`、`COMP-013 IconChip` |
| `COMP-114` | `FeedbackQualityPanel`（反馈质量区） | PAGE-040 | `ENT-010`、`INV-10`、`FR-050` | `COMP-009 Card`、`COMP-016 ListRow` |
| `COMP-115` | `TrustNetworkIndex`（信任网络索引） | PAGE-043 | `IA-007`、`INV-10`、`DEC-007`、`ENT-020` | `COMP-016 ListRow`/`COMP-015 DataTable`、`COMP-012 TrustBadge`、`COMP-014 StatBlock` |
| `COMP-116` | `FeedbackForm`（结构化反馈表单） | PAGE-042 | `FLOW-004`、`ENT-010`、`INV-10/11`、`NFR-006` | `COMP-030 FormField`、`COMP-035 RatingInput`、`COMP-007 PrimaryButton` |
| `COMP-117` | `TrustProfileHeader`（信任档案身份头） | PAGE-040 | `ENT-001`、`DEC-006`、`INV-04` | `COMP-034 Avatar`、`COMP-011 StatusPill`、`COMP-022 TopicChip` |
| `COMP-118` | `TrustExplanationLink`（信任解释入口/守卫） | PAGE-040 → PAGE-041 | `HARD-03`（入口不可缺失守卫） | `COMP-008 SecondaryButton` |
| `COMP-119` | `WeightDisclosureNote`（权重声明文案块） | PAGE-040/041/042 | `INV-10`（不可配置移除） | `COMP-013 IconChip` |
| `COMP-120`~`COMP-129` | 预留 | — | — | — |

---

## COMP-110 TrustScoreRing（信任分环形）

### Component name

- `TrustScoreRing` —— 信任档案页（`PAGE-040`）与信任网络索引项（`PAGE-043`）的信任分大圆环。落地 `UI-003` 的 DonutChart 环形（主色 `#017A6E` + 语义色分段），**底层复用共享 `COMP-018 DonutChart`**，本组件是其信任语义封装（不重新实现环形绘制）。来源：`PAGE-040 Data required·信任分圆环`、`UI_RULES.md` `LineChart/DonutChart` 行。

### Purpose

- 把 `ENT-011` 派生的当前信用分以「环形进度 + 中心大数字 + 满分基准 + 等级文案」呈现（如 `824 / 1000`「资深贡献者 / Trusted」），作为档案声誉面的视觉锚点，并作为打开信任分拆解（`PAGE-041` / `COMP-111`）的主触发点，直接服务 `HARD-03` 可解释性的「入口可达」。满分基准 `1000` 来自 `ASM-037`。

### Props or inputs

- `score: number` —— 当前信用分（如 `824`），来自 `ENT-011.用户信用分`。
- `maxScore: number`（默认 `1000`，`ASM-037`）—— 满分基准。
- `tierLabel: string` —— 等级文案（如「资深贡献者 / Trusted」），由信用分区间映射（`ASM-037`）。
- `segments?: Array<{ label: string; value: number; tokenColor: string }>` —— 可选环形分段（按四类来源占比着色：交换/反馈/验证/举报），色取规范令牌（主色 + 语义色），传给 `COMP-018`。
- `size?: 'lg' | 'md'`（档案页 `lg`，索引项 `md`）。
- `explainable?: boolean`（默认 `true`）—— 是否渲染为可点击/可聚焦以打开拆解（`HARD-03`）。
- `textSummary: string` —— 无障碍可读摘要（如「信任分 824，满分 1000，等级 资深贡献者」），`NFR-007`。
- 禁止任何价格/可购买/付费提升相关 props（`DEC-007` 守卫）。

### Events or outputs

- `onExplain()` —— 点击/回车触发，打开 `PAGE-041` 拆解抽屉（由 `COMP-118` / 父页路由 `?explain=trust` 承接）。
- 无内部写动作；纯展示 + 触发。

### States

- **就绪**：完整环形 + 中心分值 + 等级。
- **解释生成中**：当 `ENT-011.解释` 缺失时，按 `PAGE-040` 守卫显示「解释生成中」占位而非裸分值（与 `COMP-111` 一致）。
- **新用户/基础分**：显示基础分 + 「信任随交换积累」微提示（`PAGE-040` 空状态）。
- **加载**：复用 `COMP-033 Skeleton` 环形占位。
- `explainable=false` 时不响应点击（如纯静态嵌入）。

### Accessibility requirements

- 环形为装饰性图形，须提供 `textSummary` 作为可读文本（`role="img"` + `aria-label`，`NFR-007`「图表提供文字摘要」）。
- 分值/等级以文字呈现，不靠颜色单独传达等级（`NFR-007`「状态非仅靠颜色」）。
- `explainable` 态键盘可达（`tabindex`、回车/空格触发 `onExplain`），焦点态主色描边可见。

### Data dependencies

- `ENT-011 TrustProfile`（派生：用户信用分、解释、分数趋势）经 `IA-012` 公开读 API 同源口径获取，零私有内容（`INV-04`）。
- 与 `COMP-111`/`COMP-112` 同一 `ENT-011` 数据源，保证总分一致（`PAGE-041` 校验「与圆环数字一致」）。
- 数据获取走 TanStack Query（`FRONTEND_SPEC` §8），实现阶段先对接 MOCK（阶段 10），契约以阶段 15 `SERVICE_CONTRACT` 为准。

### Tests

- 渲染 `score/maxScore/tierLabel` 正确（`824 / 1000`「资深贡献者」）。
- `explainable=true` 时点击/回车触发 `onExplain`；`false` 时不触发。
- 解释缺失 → 显示「解释生成中」而非裸分（守卫断言，`HARD-03`）。
- a11y：存在 `aria-label`/`textSummary`；键盘可聚焦可触发；等级有文字。
- 守卫：props 中不接受任何价格/付费字段（`DEC-007`）。

---

## COMP-111 TrustBreakdown（可解释拆解）

### Component name

- `TrustBreakdown` —— 信任分可解释拆解面，是 `HARD-03` 的界面兑现核心，承载 `ENT-011.解释`。落地于 `PAGE-041`（在 `PAGE-040` 内以**抽屉/模态**呈现，复用共享 `COMP-026 Drawer`；深链 `?explain=trust`，`ASM-036`）。来源：`PAGE-041 Data required`、`PAGE-040 可解释拆解（HARD-03 必备）`。

### Purpose

- 把信任分从「一个数字」展开为「为什么是这个数字」：按四类来源（**交换历史 / 反馈质量 / GitHub 验证 / 举报扣分**）+ 可选徽章加成，逐项给出维度名、贡献方向/分值或占比、一句话计算口径说明；并**显式陈述权重规则**（参与方反馈 > 社交信号，经 `COMP-119`）；含指向公开评分规则的可审计链接（`NFR-004` → `IA-013`）。

### Props or inputs

- `dimensions: Array<{ key: 'exchange' | 'feedback' | 'github' | 'report' | 'badge'; label: string; direction: 'up' | 'down' | 'neutral'; valueOrShare: string; explanation: string }>` —— 拆解维度列表，来自 `ENT-011.解释`。`report` 维度为中性聚合表述，**不含举报方身份/举报细节**（`INV-04`）。
- `totalScore: number` / `maxScore: number` —— 用于与 `COMP-110` 总分一致性校验展示。
- `trendAttribution?: string` —— 可选趋势归因文案（如「近一月完成 3 次交换，反馈均值 4.8」）。
- `rulesLink: string` —— 公开评分规则链接（`IA-013`/仓库，`NFR-004`）。
- `open: boolean` / 由父页 URL `?explain=trust` 驱动。
- `isNewUser?: boolean` —— 新用户基础分态。

### Events or outputs

- `onClose()` —— 关闭抽屉返回 `PAGE-040`（清除 `?explain=trust`）。
- `onRulesLinkClick()` —— 跳 `IA-013`，并发聚合遥测 `trust_rule_link_click`（无 PII，`INV-09`）。
- 各维度可展开/折叠（`onToggleDimension(key)`），纯本地 UI 状态。
- 打开时发聚合遥测 `trust_breakdown_open`（`FLOW-008`/`INV-09`）。

### States

- **就绪**：四类来源完整拆解 + 权重声明 + 规则链接。
- **解释数据缺失/计算中**：占位「信任解释生成中」（与 `COMP-110` 守卫一致）。
- **新用户**（`isNewUser`）：「尚无足够交换与反馈，信任分以基础分起步，将随交换积累」。
- **总分不一致**：若拆解汇总与 `COMP-110` 圆环不一致，显示「数据刷新中」而非两个矛盾数字（`PAGE-041` 校验）。
- **错误**：加载失败 → 重试。

### Accessibility requirements

- 抽屉遵循 `COMP-026 Drawer` 的焦点陷阱/`Esc` 关闭/`aria-modal`。
- 各维度方向（up/down/neutral）不仅靠颜色/箭头，须带文字（如「提升」「扣分」「中性」，`NFR-007`）。
- 折叠区用 `aria-expanded`；规则链接为可聚焦 `<a>`。
- 权重声明文案（`COMP-119`）为正文文本，屏读可达。

### Data dependencies

- `ENT-011.解释`（四类来源 + 可选徽章加成）、`ENT-010`（反馈质量来源）、`ENT-007`（交换历史来源）、`ENT-012`（徽章加成）。
- 与 `COMP-110` 同一 `ENT-011` 实例（总分一致性，`PAGE-041` 校验）。
- 严禁渲染 PII / 举报方身份 / 私有内容（`INV-04`）；举报维度仅中性聚合。

### Tests

- 至少能展开为「交换历史 / 反馈质量 / GitHub 验证 / 举报」四类来源（`HARD-03` 强断言）。
- 含权重声明文案（`COMP-119` 在场，`INV-10`）。
- 拆解总分与传入 `totalScore` 一致；不一致 → 显示「数据刷新中」。
- 含指向公开规则的链接（`NFR-004`）。
- 守卫：维度数据不渲染 PII / 举报方身份（`INV-04`）；权重声明不可经 props 移除（断言其恒在）。
- 遥测：打开发 `trust_breakdown_open`、规则链接发 `trust_rule_link_click`，均无 PII。

---

## COMP-112 ReputationTrend（声誉趋势）

### Component name

- `ReputationTrend` —— 信用分时间序列折线，落地 `UI-003` `LineChart(accent)`，**底层复用共享 `COMP-017 LineChart`**（`--color-accent #019997`）。出现于 `PAGE-040`（声誉趋势区）与 `PAGE-041`（趋势归因辅助）。来源：`PAGE-040 Data required·声誉趋势（ENT-011.分数趋势）`。

### Purpose

- 把 `ENT-011.分数趋势`（近 N 期信用分）渲染为折线，让访客直观看到声誉演化方向，并提供可读文字摘要满足无障碍（`NFR-007`）。

### Props or inputs

- `series: Array<{ period: string; score: number }>` —— 时间序列点，来自 `ENT-011.分数趋势`。
- `textSummary: string` —— 文字摘要（如「近 6 期信用分由 780 升至 824」），`NFR-007`。
- `compact?: boolean` —— 在 `PAGE-041` 内嵌时的紧凑态。

### Events or outputs

- 纯展示组件，无写动作、无事件。`Not applicable`（无输出）— 理由：趋势图只读，交互聚焦由父页处理。

### States

- **就绪**：完整折线。
- **数据不足/新用户**：显示「暂无足够数据」占位（`PAGE-040` 新用户态），不画空轴。
- **加载**：`COMP-033 Skeleton`。

### Accessibility requirements

- 折线为图形，提供 `textSummary` 可读摘要（`role="img"` + `aria-label`，`NFR-007`「图表提供可读文字摘要」）。
- 线色为 accent，但趋势信息同时以文字摘要表达，不仅靠颜色。

### Data dependencies

- `ENT-011.分数趋势`（派生序列），与 `COMP-110`/`COMP-111` 同源 `ENT-011`，公开读、零私有（`INV-04`）。

### Tests

- 渲染传入序列点数与值正确。
- 序列为空/不足 → 「暂无足够数据」占位。
- a11y：存在 `aria-label`/`textSummary`。

---

## COMP-113 BadgeWall（徽章墙）

### Component name

- `BadgeWall` —— `PAGE-040` 已获徽章网格，每枚复用共享 `COMP-012 TrustBadge`（或 `COMP-013 IconChip`），本组件是其网格容器 + 授予条件 tooltip 编排。来源：`PAGE-040 Data required·徽章墙（ENT-012）`。

### Purpose

- 以网格展示用户已获 `ENT-012 Badge`（图标 + 名称 + 授予条件 tooltip，如「完成 10 次零争议交换」），作为信任与贡献的可见标记（`FR-050`）。

### Props or inputs

- `badges: Array<{ type: string; name: string; iconName: string; criteria: string }>` —— 已获徽章，来自 `ENT-012`（`iconName` 取 Material Symbols Outlined 字形名，`UI-002`）。
- `columns?: number` —— 网格列数（响应式默认，`ASM-016`）。

### Events or outputs

- `onBadgeFocus/Hover(type)` —— 展示授予条件 tooltip（纯 UI）。
- 无写动作；徽章不可购买（`DEC-007` 守卫，徽章不标价、无购买入口）。

### States

- **就绪**：徽章网格。
- **空**：无徽章 → `COMP-021 EmptyState` 微态「尚未获得徽章，徽章随交换与贡献解锁」。
- **加载**：`COMP-033 Skeleton`。

### Accessibility requirements

- 每枚徽章可键盘聚焦，授予条件 tooltip 键盘可达（`PAGE-040` 验收「徽章 tooltip 可达」，`NFR-007`）。
- 徽章名称为文字，不仅靠图标/颜色传达。

### Data dependencies

- `ENT-012 Badge`（类型、授予条件，关联 `ENT-001`），公开读、零私有（`INV-04`）。

### Tests

- 渲染徽章数量与名称；tooltip 含授予条件。
- 空徽章 → EmptyState。
- a11y：键盘可聚焦 + tooltip 可达。
- 守卫：无价格/购买入口（`DEC-007`）。

---

## COMP-114 FeedbackQualityPanel（反馈质量区）

### Component name

- `FeedbackQualityPanel` —— `PAGE-040` 的反馈质量区，展示用户作为被评价方收到的 `ENT-010` 结构化反馈维度均值 + 近期反馈摘要，并**显式标注「来自实际交换参与方」**、与社交认可视觉分区以体现 `INV-10`。来源：`PAGE-040 Data required·反馈质量（ENT-010 聚合）` + `Acceptance checks` 第 3 条。

### Purpose

- 以小型条/评分展示五维反馈均值（清单一致性 / 隐私边界 / 结构清晰度 / 有用性 / 再次交换意愿）+ 近期公开反馈摘要片段（公开文本、作者 @handle、关联交换链接），并通过显式标注与高于社交认可区的视觉权重，把 `INV-10`（参与方反馈 > 社交信号）落到界面。

### Props or inputs

- `dimensionAverages: Array<{ key: string; label: string; score: number; max: number }>` —— 五维均值（`ENT-010` 维度）。
- `recentFeedback: Array<{ excerpt: string; authorHandle: string; exchangeId: string; exchangeLabel: string }>` —— 近期公开反馈摘要（脱敏，`INV-04`）。
- `sourceLabel: string`（固定文案「来自实际交换参与方」，`INV-10`/`FR-050`，不可移除）。

### Events or outputs

- `onExchangeLinkClick(exchangeId)` —— 跳 `IA-006`（公开访客见脱敏台账视图，`INV-04`）。
- `onAuthorClick(handle)` —— 跳该作者 `PAGE-040`。
- 无写动作。

### States

- **就绪**：五维均值 + 近期反馈。
- **无反馈**：`COMP-021 EmptyState`「尚无交换反馈，反馈随完成的交换积累」（`PAGE-040` 新用户态）。
- **加载**：`COMP-033 Skeleton`。

### Accessibility requirements

- 评分条同时有数值文字，不仅靠颜色/长度（`NFR-007`）。
- 「来自实际交换参与方」标注为正文文本（屏读可达），与社交认可区在 DOM/标题层级上分区可辨。
- 反馈摘要链接键盘可达。

### Data dependencies

- `ENT-010 Feedback`（维度均值 + 公开文本 + 权重）聚合，关联 `ENT-007 Exchange`；公开读、脱敏、零私有（`INV-04`）。
- 反馈作为高权重信号来源喂入 `ENT-011`（与 `COMP-111` 拆解的「反馈质量」维度同源）。

### Tests

- 渲染五维均值且维度完整覆盖 `ENT-010`。
- 显式含「来自实际交换参与方」标注（`INV-10` 断言，不可缺失）。
- 视觉/DOM 上位于社交认可区之上/更高层级（`INV-10` 权重体现的结构断言）。
- 反馈摘要无 PII / 无私有内容（`INV-04`）。
- 空态 → EmptyState。
- 链接键盘可达、跳转正确。

---

## COMP-115 TrustNetworkIndex（信任网络索引）

### Component name

- `TrustNetworkIndex` —— `PAGE-043 /trust` 信任网络着陆页的核心：可信贡献者列表 + 筛选/检索 + 平台信任概览。复用共享 `COMP-016 ListRow`（或 `COMP-015 DataTable`）、`COMP-012 TrustBadge`、`COMP-014 StatBlock`、`COMP-034 Avatar`、`COMP-032 Pagination/LoadMore`、`COMP-021 EmptyState`。来源：`PAGE-043 Data required / Actions / States`。

### Purpose

- 让访客（含未登录、含 agent）按领域主题 / 最低信任等级 / 是否 Verified / 关键词检索社区可信贡献者，默认按「可解释信任」排序（参与方反馈权重高于社交信号，`INV-10`），并提供精选/新晋等**发现辅助分区（非排他、非付费榜，`DEC-007`）**，再二级进入某人 `PAGE-040`。补齐主导航「信任网络」着陆缺口（`ASM-061`）。

### Props or inputs

- `contributors: Array<{ login: string; displayName: string; avatarUrl: string; verified: boolean; tierLabel: string; score: number; maxScore: number; topics: string[]; moduleCount: number; exchangeCount: number }>` —— 可信贡献者列表（`ENT-001`+`ENT-011` 派生）。
- `overviewStats: Array<{ label: string; value: number }>` —— 平台信任概览（可信贡献者数 / 已验证用户数 / 累计有效反馈数，`ENT-019` 聚合口径，`INV-09`），渲染为 `COMP-014 StatBlock` 行。
- `filters: { topic?: string; minTier?: string; verifiedOnly?: boolean; q?: string }` —— 筛选维度（领域 `ENT-020` / 最低信任等级 / Verified / 关键词）。
- `sort: 'explainable-trust'（默认）| ...` —— 排序口径；**任何「排名/精选」必须标注口径**（`DEC-007`/`HARD-03`）。
- `featuredSections?: Array<{ title: string; rationale: string; items: ... }>` —— 精选 / 新晋 / 活跃领域（发现辅助，附口径说明）。
- `isAuthenticated: boolean` —— 控制关注/认可动作可用性。
- 禁止任何「付费提升排名/可购买位次」props（`DEC-007` 守卫）。

### Events or outputs

- `onFilterChange(filters)` / `onSortChange(sort)` / `onSearch(q)` —— 检索/筛选/排序（非法参数回退默认排序并提示，`PAGE-043` 校验）。
- `onContributorClick(login)` —— 进入 `PAGE-040` `/u/:login`。
- `onFollow(login)` / `onEndorse(login)`（仅登录态）—— 低权重社交信号（`ENT-013`），唯一性 + 速率限制 + 审计（`NFR-006`/`INV-11`），权重明确低于参与方反馈（`INV-10`）。
- 聚合遥测：着陆页访问量、筛选维度使用分布、条目点进率（`FLOW-008`/`INV-09`，不记录个体可识别浏览）。

### States

- **默认**：贡献者列表（分页/加载更多，`COMP-032`）。
- **加载**：`COMP-033 Skeleton`。
- **筛选无结果**：提示「放宽条件」（`PAGE-043` 校验）。
- **空注册表**（早期无足够可信用户）：`COMP-021 EmptyState`「信任随交换与反馈积累」，引导去发现页或提交模块。
- **未登录 vs 登录**：登录态解锁关注/认可。
- **错误**：可重试。

### Accessibility requirements

- 列表项键盘可达；信任等级有**文字标签**（非仅颜色，`PAGE-043` 验收 / `NFR-007`）。
- `SearchBar`/筛选 Tab 键盘可操作；当前排序口径可读。
- 关注/认可按钮有 `aria-label`；操作结果有可读反馈。

### Data dependencies

- `ENT-001 User` + `ENT-011 TrustProfile`（派生）+ `ENT-012 Badge` + `ENT-020 Topic/Tag`；平台概览来自 `ENT-019 UsageStat`（聚合、不含 PII，`INV-09`）。
- 全部公开匿名可看、零私有内容/联系方式（`INV-04/03`）。
- 排序所用信号须可解释（参与方反馈权重高于社交，`INV-10`/`HARD-03`）。

### Tests

- 主导航「信任网络」→ `/trust` 有确定着陆（缺口闭合断言，`ASM-061`）。
- 贡献者条目正确路由到 `/u/:githubLogin`（`PAGE-040`）。
- 筛选（领域/等级/Verified/关键词）与排序生效；非法参数回退默认并提示。
- 列表/统计不含 PII / 私有内容 / 联系方式（`INV-04/09`）。
- 任一「排名/精选」标注可解释口径且**无付费提升入口**（`DEC-007` 强断言）。
- 信任等级有文字标签、列表项键盘可达（`NFR-007`）。
- 登录态才显示关注/认可；触发写审计（`INV-11`）。

---

## COMP-116 FeedbackForm（结构化反馈表单）

### Component name

- `FeedbackForm` —— `PAGE-042` 结构化反馈提交表单，是信任分「反馈质量」来源的录入端、`INV-10` 高权重信号的产生处。由 exchange 模块的交换详情（`IA-006`）在交换进入 `WaitingForFeedback` 后**嵌入复用**（深链 `/exchanges/:exchangeId?feedback=1`，`ASM-036`）。复用 `COMP-030 FormField`、`COMP-035 RatingInput`、`COMP-007 PrimaryButton`、`COMP-011 StatusPill`。来源：`PAGE-042` 全字段。

> 归属说明（tradeoff，承自 `PAGE-042`）：反馈「在哪触发」属交换生命周期（exchange 模块），但「评什么维度、如何计权、如何校验」是信任语义真源，归 trust-feedback。本组件只定义反馈表单 surface，不重复交换状态机。

### Purpose

- 让一次已完成交换的**实际参与方**逐维度评分（五维 `ENT-010`）+ 可选公开评论，提交后写 `ENT-010`、触发 `ENT-011` 重算（`FLOW-004`）、写 `AuditLog`（`INV-11`）、发通知给对方（`FLOW-006`，通知模块承接）。表单内含只读权重提示，让评价者理解其反馈分量高于普通社交信号（`INV-10`）。

### Props or inputs

- `exchangeContext: { peerHandle: string; moduleTitle: string; statusLabel: string }` —— 只读上下文（来自 `ENT-007`，脱敏、不含私有内容，`INV-04`）。
- `dimensions: Array<{ key: 'checklistConsistency' | 'privacyBoundary' | 'structureClarity' | 'usefulness' | 'rebuyIntent'; label: string; required: true }>` —— 五维评分项（`ENT-010`；`checklistConsistency` 呼应 `HARD-07`）。
- `allowPublicComment: boolean` —— 可选公开评论（将公开展示于对方 `PAGE-040` 反馈质量区）。
- `weightNote: string`（固定权重提示文案，`INV-10`，经 `COMP-119`）。
- `submissionState: 'editable' | 'submitted' | 'ineligible' | 'window-closed'`。
- `allowDraft?: boolean`（草稿保存，可选增强，`ASM-039`/`ASM-089`）。

### Events or outputs

- `onSubmit(payload)` —— 提交反馈：必填维度校验通过后写 `ENT-010` + 触发 `ENT-011` 重算（`FLOW-004`）+ 写 `AuditLog`（`INV-11`）+ 发通知（`FLOW-006`）；成功 toast（`COMP-029`）。
- `onSaveDraft?(payload)` / `onCancel()`（`ASM-039`）。
- 提交前对公开评论做轻量敏感信息（疑似邮箱/密钥/私有路径）前端提醒（不替代后端校验，`INV-04`）。
- 聚合遥测 `feedback_submitted`（计数，无 PII，`INV-09`/`FLOW-008`）；不记录具体评分到可识别用户。

### States

- **可提交（editable）**：交换为 `WaitingForFeedback` 且本人未提交 → 表单可用。
- **已提交（submitted）**：只读「已提交」+ `COMP-011 StatusPill`，不可重复（唯一性，`NFR-006`）。
- **不可提交（ineligible）**：非参与方 / 未到反馈阶段 → 隐藏或禁用并说明原因。
- **窗口已过（window-closed）**：交换 `Closed` 后 → 只读「反馈窗口已结束」（`ASM-011`）。
- **提交中 / 成功 toast / 错误（内联校验）**。

### Accessibility requirements

- 每个评分维度用 `COMP-035 RatingInput`，键盘可操作、有 `aria-label` 与可读当前值（`NFR-007`）。
- 必填校验错误内联且与字段 `aria-describedby` 关联（`COMP-030 FormField`）。
- 公开评论提交前的「将公开」提示为可读文本。
- 权重提示（`COMP-119`）屏读可达。

### Data dependencies

- `ENT-010 Feedback`（写）、`ENT-007 Exchange`（资格/上下文，仅 `WaitingForFeedback` 的参与方）、触发 `ENT-011` 重算。
- 资格/唯一性/状态须**服务端二次校验**（前端禁用不足以保证，`NFR-006`）；接口形状以阶段 15 `SERVICE_CONTRACT` 为准。
- 写动作走 TanStack Query mutation + 失效相关 query（`FRONTEND_SPEC` §8）。

### Tests

- 仅 `WaitingForFeedback` 的参与方可提交；非参与方/非该阶段 → ineligible（`NFR-006`/`ASM-010/011`）。
- 五维必填校验：缺评分不可提交，内联错误；维度完整覆盖 `ENT-010`。
- 重复提交被拒（唯一性，`NFR-006`），已提交态只读。
- 提交成功触发回调（写 `ENT-010` + 重算 `ENT-011` + 审计 `INV-11` + 通知 `FLOW-006`）。
- 公开评论敏感信息前端提醒触发（疑似邮箱/密钥/私有路径，`INV-04`）。
- 窗口关闭态只读说明（`ASM-011`）。
- 含权重提示文案（`INV-10`）；无经济元素（`DEC-007`）。
- 遥测 `feedback_submitted` 无 PII。

---

## COMP-117 TrustProfileHeader（信任档案身份头）

### Component name

- `TrustProfileHeader` —— `PAGE-040` 顶部身份卡（设计图左身份卡），展示 `ENT-001` 的 GitHub 身份与 `GitHub Verified` 状态、领域标签等公开档案头。复用 `COMP-034 Avatar`、`COMP-011 StatusPill`、`COMP-022 TopicChip`、`COMP-008 SecondaryButton`。来源：`PAGE-040 Data required·身份头（ENT-001）`。

### Purpose

- 给出访客判断「是谁、是否经 GitHub 验证、属哪些领域」的第一屏身份信息，呼应 `DEC-006` GitHub 规范身份与 Verified 信任骨干，且严格只展示公开/已 opt-in 字段（联系方式默认不展示，`INV-03/04`/`DEC-010`）。

### Props or inputs

- `avatarUrl: string`、`displayName: string`、`githubLogin: string`（@handle）。
- `verified: boolean` —— GitHub Verified（`true` → `COMP-011 StatusPill` success + Octocat；`false` → 中性「未验证」Pill，`DEC-006`）。
- `bio?: string`、`topics: string[]`（领域标签 `ENT-020`）、`joinedDate: string`、`githubUrl: string`。
- `publicContacts?: Array<{ type: string; value: string }>` —— **仅已 opt-in 为 public 的联系方式**（默认空，`INV-03`/`DEC-010`）。
- `isSelf: boolean` —— 本人自看时显示「编辑档案 / 联系方式设置」入口（跳 `IA-014`，不在本页内联编辑）。
- `restrictionState?: 'normal' | 'flagged'` —— 受限/处罚态显示中性提示（不泄露举报细节，`INV-04`）。

### Events or outputs

- `onGithubLinkClick()` —— 外链 GitHub（Octocat 品牌例外，`UI-002`）。
- `onSelfManageClick()`（`isSelf`）—— 跳 `IA-014`。
- `onReportUser()`（需登录）—— 触发举报流入口（`FLOW-005`，admin 模块处理；本页仅提交入口，`ENT-014`）。
- 关注/认可动作由页面级承接（见 `PAGE-040 Actions`），可下放为 header 上的次级动作。

### States

- **就绪（已验证）**：完整身份头 + Verified success Pill。
- **未验证 GitHub**：中性「未验证」Pill，不显示 Verified 徽（`PAGE-040` 状态）。
- **本人自看**：显示自管理入口。
- **未登录访客**：社交/举报动作显示「登录后可用」。
- **受限/处罚（flagged）**：中性状态提示，不泄露细节（`INV-04`）。
- **加载**：`COMP-033 Skeleton`。

### Accessibility requirements

- Verified 状态非仅靠颜色：StatusPill 含文字「GitHub Verified」/「未验证」（`NFR-007`）。
- 头像有 `alt`；GitHub 外链有可读 label；领域标签为文字。
- 自管理/举报按钮键盘可达、有 `aria-label`。

### Data dependencies

- `ENT-001 User`（GitHub 身份、Verified、领域标签 `ENT-020`、加入日期），公开读、零私有；联系方式默认私密**不渲染**（`INV-03/04`，仅 public opt-in 项）。

### Tests

- 渲染身份字段（头像/显示名/@handle/加入日期/领域）。
- `verified=true` → success Pill + Octocat；`false` → 中性未验证 Pill。
- 默认不渲染任何私密联系方式；仅 `publicContacts` 显式 opt-in 项展示（`INV-03/04` 守卫断言）。
- `isSelf=true` → 显示自管理入口跳 `IA-014`。
- flagged 态中性提示、不泄露举报细节（`INV-04`）。
- a11y：Verified 有文字、外链 label、键盘可达。

---

## COMP-118 TrustExplanationLink（信任解释入口 / 可解释性守卫）

### Component name

- `TrustExplanationLink` —— `PAGE-040` 上「信任分如何形成」入口，触发 `COMP-111`/`PAGE-041` 拆解（深链 `?explain=trust`）。复用 `COMP-008 SecondaryButton`。本组件承载 `HARD-03` 的「入口不可缺失」界面守卫。来源：`PAGE-040 Actions·查看派生明细` + `Validation·信任分可解释性硬校验`。

### Purpose

- 保证信任分展示处**始终可达**其拆解（`HARD-03`），把「打开解释」这一动作收敛为单一可复用入口（圆环点击 + 显式文字链接两条路径都指向它），并在解释数据缺失时给出占位而非裸分。

### Props or inputs

- `githubLogin: string` —— 用于构造深链 `/u/:login?explain=trust`。
- `explanationAvailable: boolean` —— 解释数据是否就绪（缺失时显示「解释生成中」，与 `COMP-110`/`COMP-111` 守卫一致）。
- `variant?: 'link' | 'button'`（圆环旁文字链接 或 次级按钮）。

### Events or outputs

- `onOpen()` —— 打开 `PAGE-041` 抽屉（设置 URL `?explain=trust`），发聚合遥测 `trust_breakdown_open`（`INV-09`）。

### States

- **可用**：渲染入口，点击打开拆解。
- **解释生成中**：`explanationAvailable=false` → 显示「解释生成中」占位文案，入口降级但仍可见（避免裸分，`HARD-03`）。

### Accessibility requirements

- 作为可聚焦交互元素，键盘可达、焦点可见、有 `aria-label`（如「查看信任分如何形成」，`NFR-007`）。
- 深链 `?explain=trust` 便于无障碍/agent 直达（`ASM-036`）。

### Data dependencies

- 依赖 `ENT-011.解释` 是否就绪（`explanationAvailable`），与 `COMP-111` 同源；无独立数据请求。

### Tests

- 入口始终在场（`HARD-03` 守卫：信任分展示处必可达拆解，断言组件渲染）。
- 点击/回车设置 `?explain=trust` 并触发 `onOpen`。
- `explanationAvailable=false` → 显示「解释生成中」、不显示裸分依赖。
- a11y：键盘可达、有 `aria-label`。

---

## COMP-119 WeightDisclosureNote（权重声明文案块）

### Component name

- `WeightDisclosureNote` —— 显式陈述「实际交换参与方的结构化反馈，对信任分的影响高于收藏/认可等社交信号」的文案块（`INV-10`）。复用 `COMP-013 IconChip`（信息图标）。在三处出现：`PAGE-040` 反馈质量区（经 `COMP-114`）、`PAGE-041` 解释面（经 `COMP-111`）、`PAGE-042` 反馈表单（经 `COMP-116`）。来源：`PAGE-041 Data required·权重声明`、`PAGE-040/042` 对应文案。

### Purpose

- 把 `INV-10` 的权重规则作为**强约束、不可被配置移除**的界面保证统一封装为一个文案组件，避免三处文案漂移或被误删，单点维护权重声明的措辞与可审计指向。

### Props or inputs

- `context: 'profile' | 'explanation' | 'feedback-form'` —— 决定措辞视角：
  - `profile`：「以下反馈来自实际交换参与方，权重高于社交认可」；
  - `explanation`：「实际交换参与方的结构化反馈，对信任分的影响高于收藏/认可等社交信号」；
  - `feedback-form`：「你的反馈作为交换参与方，对对方信任分的影响高于普通社交信号」。
- `rulesLink?: string` —— 可选指向公开评分规则（`NFR-004`，仅 explanation 上下文使用）。
- **无**任何允许隐藏/置空文案的 prop（`INV-10` 的界面保证：不可被配置移除）。

### Events or outputs

- `onRulesLinkClick?()`（仅 explanation 上下文）—— 跳 `IA-013`，发 `trust_rule_link_click`（`INV-09`）。
- 否则纯展示，无输出。

### States

- **恒显**：单一就绪态；不存在「隐藏」态（`INV-10` 强约束）。

### Accessibility requirements

- 文案为正文文本，屏读可达；信息图标为装饰性（`aria-hidden`），语义由文字承载（`NFR-007`）。

### Data dependencies

- 无数据请求；文案为固定常量（按 `context` 取词）。`Not applicable`（无动态数据）— 理由：权重声明是产品不变量文案，不依赖用户数据。

### Tests

- 三种 `context` 各渲染对应固定文案（`INV-10` 文案在场断言）。
- 无任何 prop 能使文案隐藏/置空（不可移除性断言，`INV-10` 界面保证）。
- explanation 上下文含规则链接（`NFR-004`）。
- a11y：文字承载语义、图标 `aria-hidden`。

---

## 本模块新增假设（未写入 DEFAULT_ASSUMPTIONS.md，待编排者裁定）

| ID | 假设 | 若有误的风险 | 建议确认 |
| --- | --- | --- | --- |
| `ASM-089` | `TrustScoreRing`(COMP-110)/`ReputationTrend`(COMP-112) 作为共享 `COMP-018 DonutChart`/`COMP-017 LineChart` 的**信任语义封装**，不重复实现图形绘制 | 若共享图表组件 props 不足以承载分段/摘要，封装层需扩展或共享组件需补 props（应回 `_shared` 调整，非本模块） | 组件规格交叉审核时确认共享图表 props 充分 |
| `ASM-090` | 反馈表单（COMP-116）作为 surface 由 exchange 模块（`IA-006`）嵌入复用；trust-feedback 拥有其维度/权重/校验契约，exchange 拥有触发时机与状态机 | 若团队希望反馈表单整体归 exchange，组件归属与引用方向需调整 | 与 exchange 模块组件规格交叉审核归属边界 |

> 复用沿用上游既有假设：`ASM-036`（子 surface + 深链）、`ASM-037`（满分 1000 / 等级区间）、`ASM-038`（`/u/:githubLogin` 规范路由）、`ASM-039`（社区排名/草稿为可选增强）、`ASM-061`（PAGE-043 `/trust` 着陆）、`ASM-016`（响应式延后细化）、`ASM-066`（lucide-react 作 Material Symbols 1:1 替换）、`ASM-067`（先 MOCK 后契约）。本模块未引入与之冲突的新假设。

---

## 质量门自检（对齐 07-frontend-spec-gate + 组件规格模板完成标准）

```text
Gate: 09-frontend-spec（trust-feedback 组件规格扇出）
Status: pass（内容自检）— 待用户 / 编排者确认 + 跨模块交叉审核
Evidence:
  - 审阅产物: aies/02-design/trust-feedback/COMPONENTS_SPEC.md
  - 上游对照: PAGE_SPEC.md(PAGE-040~043)、FRONTEND_SPEC.md(§6 共享组件 / §7 COMP 段分配 COMP-110~129)、
    UI_RULES.md(UI-001/002/003)、IA_SPEC.md(IA-007)、LIGHT_DOMAIN_MODEL.md(ENT-001/010/011/012/007/013/020/019, INV-04/09/10/11)、
    ID_REGISTRY.md(COMP 前缀)、模板 templates/COMPONENTS_SPEC_TEMPLATE.md(8 字段)
Findings:
  - 10 个模块特有组件 COMP-110~119 均含 8 字段；不适用项注明理由（COMP-112/119 的 events/data）。✅
  - COMP 编号严格落在分配段 COMP-110~129，未越界、未碰其他模块段。✅
  - 共享组件只引用 ID（COMP-001/007~018/021/022/025/026/030/032~035），不重复定义。✅
  - 全部组件追溯 PAGE-040~043 / IA-007 / FR-050 / FR-060 / FLOW-004 / ENT-001/010/011/012 / INV-04/09/10/11 / HARD-03。✅
  - HARD-03 可解释性落到组件：COMP-110 触发 + COMP-118 入口守卫(不可缺失) + COMP-111 四类来源拆解。✅
  - INV-10(参与方反馈 > 社交信号)三处兑现：COMP-114 标注 / COMP-111 文案 / COMP-116 提示，统一封装为 COMP-119(不可移除)。✅
  - 无经济元素(DEC-007)：COMP-110/113/115 显式禁用价格/付费/可购买 props 与入口，写入测试守卫。✅
  - 隐私零泄露(INV-04)：COMP-114/115/117 脱敏只读、不渲染联系方式/私有内容/举报方身份，写入断言。✅
  - 锚定 shadcn/ui + Tailwind + 单一图标族 Material Symbols Outlined(DEC-012/UI-002)；图表对齐 accent / 主色分段。✅
  - 未碰 00-control / 他模块 / 共享 spec；仅写本文件；未跑 git。✅
  - 新增假设 ASM-089/090 已标注并集中列出，未改 DEFAULT_ASSUMPTIONS.md；沿用上游假设已注明。✅
Known risks:
  - 共享 COMP-017/018 的 props 是否足以承载分段/文字摘要(ASM-089)，需与 _shared/COMPONENTS_SPEC.md 交叉审核。
  - COMP-116 与 exchange 模块的归属边界(ASM-090)需跨模块交叉审核。
Decision: 内容自检通过 → 待跨模块交叉审核(尤其 _shared 图表 props 与 exchange 反馈表单归属) + 用户/编排者确认 → 登记 COMP-110~119 入 ID_REGISTRY → 转 passed → 进入 10-mock-data-spec
```
