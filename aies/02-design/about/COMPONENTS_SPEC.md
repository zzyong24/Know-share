# 组件规格 · about（仓库 / 帮助 / 关于，含平台统计）

## 摘要

本产物把 about 模块页面规格（`PAGE-100`~`PAGE-105`）落成可实现的**模块特有组件**契约，登记 `COMP-210`~`COMP-229` 段。共享组件（`COMP-001`~`COMP-040`）只引用、不重复定义，契约见 `aies/02-design/_shared/COMPONENTS_SPEC.md`。组件锚定 `DEC-014` 前端栈（Next.js + TS + Tailwind + shadcn/ui）与 `UI-001` 令牌、唯一图标族 Material Symbols Outlined（`UI-002`/`DEC-012`，实现以 lucide-react 1:1 等价替换，`ASM-066`）。

本模块所有界面为**公开、匿名可看**（`IA_SPEC.md` 权限表），不引入登录后功能；平台统计仅消费 `ENT-019` 聚合指标、严格不含 PII（`INV-09`、`NFR-001`、`DEC-011`）。本规格守 `NFR-003` 文案漂移隔离：about 设计稿 MOCK 中"链上 / 不可篡改链上记录""E2EE / 端到端加密""上传语义向量""512 Nodes 硬编码"等不实声明已在 `PAGE_SPEC.md` 归正，组件文案以 `PAGE_SPEC.md` 为准，**不得复活**这些主张（守 `NFR-001`）。

### 产物元数据

- Stage: `09-frontend-spec`（模块组件扇出）
- Status: `needs-user-confirmation`
- 模块: about
- COMP 段（模块特有）: `COMP-210`~`COMP-229`（本规格用 `COMP-210`~`COMP-214`，`COMP-215`~`COMP-229` 预留）
- Upstream IDs: `PAGE-100`~`PAGE-105`、`IA-013`、`NFR-004`、`NFR-001`、`NFR-007`、`FR-140`、`FLOW-008`、`ENT-019`、`INV-01`/`INV-04`/`INV-09`/`INV-10`、`UI-001`~`UI-004`
- Decision IDs: `DEC-011`（轻后端 + 聚合统计、不含 PII）、`DEC-012`（规范图标族）、`DEC-014`（前端栈）
- 引用共享组件: `COMP-006`(Footer)、`COMP-008`(SecondaryButton)、`COMP-009`(Card)、`COMP-011`(StatusPill)、`COMP-013`(IconChip)、`COMP-014`(StatBlock)、`COMP-016`(ListRow)、`COMP-017`(LineChart)、`COMP-021`(EmptyState)、`COMP-028`(Accordion)、`COMP-033`(Skeleton)
- 新增假设: `ASM-106`、`ASM-107`（见文末；沿用 `PAGE_SPEC.md` 已登记 `ASM-058`~`ASM-060`）

### 字段约定（每组件 8 字段）

每个 `COMP-*` 含：1) 元数据 / 追溯；2) 用途；3) Props（输入）；4) Events / Actions（输出 / 动作）；5) States（状态）；6) A11y（无障碍 `NFR-007`）；7) Data（数据需求与隐私约束）；8) Tests（测试要点）。不适用字段标注 Not applicable + 理由。

### 本模块 COMP 一览

| COMP ID | 组件 | 落地 | 主要 PAGE | 组合的共享组件 |
| --- | --- | --- | --- | --- |
| `COMP-210` | `AboutHero` | 区块容器 | `PAGE-101` | `COMP-008` `COMP-011`/`COMP-013` |
| `COMP-211` | `PlatformStatsSection` | 区块容器 | `PAGE-102` | `COMP-014` `COMP-017` `COMP-021` `COMP-033` |
| `COMP-212` | `PrivacyTrustCards` | 区块容器 | `PAGE-103` | `COMP-009` `COMP-013` |
| `COMP-213` | `FaqAccordion` | 区块容器 | `PAGE-104` | `COMP-028` `COMP-021` |
| `COMP-214` | `AuditLinkRow` | 区块容器 | `PAGE-105` | `COMP-016` `COMP-008` |

> 整页编排（`PAGE-100`）由 `(public)/about/page.tsx` 承担：自上而下挂载 `COMP-210`→`COMP-214`，外壳为共享 `COMP-001` AppShell + `COMP-006` Footer，区块隔离（单区块失败不冒泡整页，见 `COMP-211`）。整页编排不是模块特有组件，故不占 `COMP-*` 编号；锚点 `#hero/#stats/#privacy/#faq/#audit-links` 由各区块 `id` 提供。

---

## COMP-210 · `AboutHero`（关于 Hero：理念 + GitHub 仓库链接 + 开源徽）

### 元数据 / 追溯

- PAGE: `PAGE-101`；IA: `IA-013`；追溯 `NFR-004`（仓库链接 = 可审计入口）。
- 引用共享: `COMP-008` `SecondaryButton`（"在 GitHub 查看仓库"外链按钮）、`COMP-011` `StatusPill` 或 `COMP-013` `IconChip`（开源徽，主色浅底 `--color-primary-subtle` + 主色文字 + `code` 图标）。
- 图标族: Material Symbols Outlined（`code`）；**GitHub Octocat 为唯一品牌图标例外**（`UI-002`），仅用于仓库外链按钮内。

### 用途

- about 开场区块：一句产品理念 + 开源徽 + "在 GitHub 查看仓库"外链按钮，对外兑现 `NFR-004`。理念文案追溯 `PRODUCT_SPEC.md` 核心理念（隐私优先、agent 间可发现 / 可评估 / 可对接），不得出现"链上 / 区块链"等漂移用语。

### Props（输入）

- `tagline: string`（理念主标题，静态文案 / 内容配置）。
- `subcopy: string`（理念副文案）。
- `repoUrl: string`（平台公开仓库 URL；发布时配置，必须指向公开仓库、不含私有内容 `INV-04`）。
- `openSourceBadgeLabel?: string`（默认"开源 (Open Source)"）。
- `decorativeStat?: { label: string; value: string } | null`（设计稿右侧装饰卡，如"活跃节点"；见 `ASM-060`：若保留须引用 `ENT-019` 聚合口径，否则置 `null` 作纯装饰移除。**默认 `null`**，不渲染硬编码"512 Nodes"）。

### Events / Actions（输出 / 动作）

- 点击"在 GitHub 查看仓库"→ 新标签打开 `repoUrl`（`target="_blank"` + `rel="noopener noreferrer"`）。
- 无其他动作；无同意门（纯展示，不触发跨边界动作）。

### States（状态）

- `default`：理念 + 开源徽 + 外链按钮。
- 响应式：`<768px` 图文上下堆叠（真源 `flex-col md:flex-row`）。
- 无 `loading`/`error`（纯静态）。

### A11y（`NFR-007`）

- 外链按钮可读 `aria-label`（如"在 GitHub 查看 Know-share 仓库，在新窗口打开"）。
- 开源徽 `code` 图标 `aria-hidden`，徽含文字标签（图标非唯一信息载体）。
- 按钮键盘可聚焦，焦点态主色描边。

### Data（数据需求与隐私约束）

- 全静态文案 + 一个外部 URL；无动态数据、无 PII。
- `repoUrl` 与 `decorativeStat` 不得携带任何私有内容 / 私有 URL（`INV-04`）。

### Tests

- 渲染开源徽与外链按钮可见、可点击；外链含 `rel="noopener noreferrer"` 与 `target="_blank"`。
- 断言文案不含"链上 / 区块链 / E2EE"字样（漂移守卫，`NFR-003`）。
- `decorativeStat` 为 `null` 时不渲染任何数字"统计"。
- 键盘可聚焦外链，焦点态可见。

---

## COMP-211 · `PlatformStatsSection`（平台统计区：StatBlock + 月度活跃折线图）

### 元数据 / 追溯

- PAGE: `PAGE-102`；IA: `IA-013`；追溯 `FR-140`、`FLOW-008`、`ENT-019`、`DEC-011`、`NFR-001`、`INV-09`、`INV-04`。
- 引用共享: 4× `COMP-014` `StatBlock`、1× `COMP-017` `LineChart`、`COMP-021` `EmptyState`、`COMP-033` `Skeleton`。

### 用途

- 公开展示平台健康度：四 StatBlock（模块总数 / 交换总数 / 活跃用户 / 隐私门通过率）+ 月度活跃趋势 LineChart。本组件是 `FR-140`/`FLOW-008` 的**展示 / 消费端**，不产生个体埋点、不反推个体（`INV-09`）。

### Props（输入）

- `stats: { modulesTotal: number; exchangesTotal: number; activeUsers: number; privacyGatePassRate: number } | null`（聚合标量；`privacyGatePassRate` 单位 %）。
- `monthlyActiveSeries: Array<{ month: string; value: number }> | null`（月度活跃序列，图例"活跃交换对"）。
- `meta: { window: string; calibration: string }`（每指标的口径 / 时间窗元信息，供图表可读摘要，来自 `ENT-019` 属性）。
- `status: 'loading' | 'default' | 'empty' | 'error'`。
- `timeWindow?: '6m' | '12m'`（可选时间窗切换，`ASM-059`：切换仍走聚合接口、不返回个体明细）。

### Events / Actions

- `onTimeWindowChange?(window)`（可选时间窗切换；若实现须仅触发聚合查询，不引入个体明细）。
- LineChart 点可悬停看**聚合**点值（非个体）。
- 无写动作、无同意门。

### States（状态）

- `loading`：StatBlock 与图表显示 `COMP-033` Skeleton（真源数字递增动画属展示态，可选）。
- `default`：四 StatBlock + 折线图渲染。
- `empty`：平台早期 / 无数据→StatBlock 显示"—"或"暂无数据"，图表显示空摘要（`COMP-021` EmptyState）。
- `error`：聚合接口失败→区块内"统计暂不可用，请稍后重试"（文字 + 图标，**不仅靠颜色**），**不冒泡整页**（区块隔离，`PAGE-100`）。
- 单字段缺失 / 非数值 / 百分比越界（非 0–100）→该 StatBlock 单独降级为 `empty`，其余正常。

### A11y（`NFR-007`）

- 每 StatBlock 有文字标签（非仅大数字）。
- LineChart 提供可读文字摘要（如"近 11 个月活跃交换对整体上升"），供读屏；用 `meta.window` 拼装。
- `loading`/`error` 状态以文字 + 图标表达，对比度≥4.5:1。

### Data（数据需求与隐私约束）

- 数据来自轻后端聚合接口（服务契约阶段定 `API-*`，对应 `IA-012` `GET /api/stats`）的 `ENT-019` 指标：`modules_total` / `exchanges_total` / `active_users` / `privacy_gate_pass_rate`（= pass/总提交，关联 `ENT-005`）/ `monthly_active_series`。
- **硬约束**：响应体绝不含 PII、绝不含单用户 / 单模块 / 单交换可识别明细（`INV-09`、`INV-04`）；客户端只渲染服务端给定的聚合值，不做任何反推个体的计算。
- 阶段 10 先对接 MOCK（`MOCK_DATA_SPEC`），接口形状最终以阶段 15 `SERVICE_CONTRACT` 为准（`ASM-067`）。

### Tests

- 四态（loading/default/empty/error）可达且区块隔离：注入 error 时本组件降级、整页其余区块仍渲染。
- 注入含 PII / 个体明细字段的响应→按白名单丢弃并告警，不渲染（`INV-01/04` 守卫，对齐 `FRONTEND_SPEC` §8）。
- `privacyGatePassRate` 越界（如 120）→该卡 `empty`，其余卡正常。
- LineChart 文字摘要存在且非空（`NFR-007`）。
- StatBlock 数字均有关联文字标签。

---

## COMP-212 · `PrivacyTrustCards`（隐私与信任说明卡组）

### 元数据 / 追溯

- PAGE: `PAGE-103`；IA: `IA-013`；追溯 `NFR-001`（`INV-01` 不托管原始内容）、`NFR-005`（`INV-08` 同意优先）、`NFR-004`（可审计）、`FR-050`/`ENT-011`/`INV-10`（信任派生与权重）。
- 引用共享: 3× `COMP-009` `Card`（白底 + `--color-border` 描边 + `--radius-card` 12px + 图标圆容器，可用 `COMP-013` IconChip）。

### 用途

- 一组三张说明卡讲清隐私边界与信任形成机制：不托管原始内容 / 同意优先 / 信任如何积累。文案必须逐条可追溯，**剔除真源漂移主张**。

### Props（输入）

- `cards: Array<{ icon: string; title: string; body: string; href?: string }>`（默认三张；图标为 Material Symbols Outlined 名：`database_off` / `lock_open` / `vitals`）。
  - 卡 1"不托管原始内容"：平台只存清单与公开关系、原始内容留所有者本地（`INV-01`、`NFR-001`）。
  - 卡 2"同意优先"：生成 / 提交 / 联系 / 交换前均有所有者明确同意门（`NFR-005`、`INV-08`），私下交付走平台外通道（默认 GitHub 私有仓库 `ASM-007`）。**不得**声称"E2EE / 端到端加密"。
  - 卡 3"信任如何积累"：信任由交换历史 / 结构化反馈 / GitHub 验证 / 举报派生、页面可解释、参与方反馈权重更高（`FR-050`、`ENT-011`、`INV-10`）。**不得**声称"链上 / 不可篡改链上记录"。

### Events / Actions

- 可选：卡片整体作为入口链到 `COMP-214` / `PAGE-105` 隐私模型（`href` 存在时）。
- 无同意门（仅解释，不执行跨边界动作）。

### States（状态）

- `default`：三卡渲染，hover 描边变主色（真源行为）。
- 响应式：`<768px` 单列堆叠。
- 无 `loading`/`error`（静态）。

### A11y（`NFR-007`）

- 图标 `aria-hidden`，每卡有文字标题（图标非唯一信息载体）。
- 卡为链接时整卡可键盘聚焦、焦点态可见。

### Data（数据需求与隐私约束）

- 全静态文案；无 PII、无私有内容。
- **内容审查门**：上线前逐条核对文案可追溯到 `NFR-001`/`NFR-005`/`FR-050` 等 ID，与 `docs/privacy-model.md` 不冲突（`NFR-003`）。

### Tests

- 渲染三卡，主题 = 不托管原始内容 / 同意优先 / 信任如何积累。
- 漂移守卫断言：文案不含"区块链 / 链上 / E2EE / 端到端加密 / 上传语义向量 / 上传嵌入向量"任一字样。
- 卡片样式符合 `COMP-009` Card 规范（描边 / 圆角 / hover）。

---

## COMP-213 · `FaqAccordion`（帮助 / FAQ 手风琴）

### 元数据 / 追溯

- PAGE: `PAGE-104`；IA: `IA-013`（帮助语义）；追溯 `NFR-004`、`NFR-007`、`NFR-001`/`FR-090`/`FLOW-001`/`FLOW-003`/`INV-01`/`INV-04`/`FR-080`/`ENT-016`/`IA-008`。
- 引用共享: `COMP-028` `Accordion`（shadcn Accordion，`expand_more` 图标）、`COMP-021` `EmptyState`（无配置边界态）。

### 用途

- 提供帮助 / 常见问题，承担 `IA-013` 帮助语义；解释隐私、交换、开源贡献、Agent 技能等高频疑问。

### Props（输入）

- `items: Array<{ id: string; question: string; answer: string; links?: Array<{label: string; href: string}> }>`（≥4 项）。答案须与产品真源一致：
  - "Know-share 会存储我的原始笔记吗？"→ 不会，只存清单脱敏元数据，原始内容留本地（`INV-01`、`NFR-001`）。
  - "交换是如何保护隐私的？"→ 隐私门扫描（密钥 / 邮箱 / 路径 / 私有 URL / 长摘录 / PII）+ 同意门 + 平台外私有交付（`FR-090`、`FLOW-001`、`NFR-005`）。**修正真源"E2EE / 链上"表述**。
  - "如何参与开源贡献？"→ 通过 GitHub 仓库 PR / Issue（`NFR-004`）。
  - "什么是 Agent 技能模块？"→ 建清单 / 脱敏 / 验证 / 打包 / 提交反馈的本地 / MCP 工具（`FR-080`、`ENT-016`，链到 `IA-008`）。
- `allowMultiple?: boolean`（是否允许多项同时展开，默认单项）。

### Events / Actions

- 展开 / 折叠单个 FAQ 项。
- 可选内文链跳转到 `IA-008`（Agent 技能）/ `PAGE-105` 隐私模型 / 数据契约（`links`）。

### States（状态）

- `collapsed`（默认全折叠）/ `expanded`（单项或多项展开）。
- `empty`：无 FAQ 配置→`COMP-021` EmptyState（"暂无常见问题"），正常上线应有内容。
- 无独立 `loading`/`error`（静态）。

### A11y（`NFR-007`）

- 每项按钮键盘可达、`aria-expanded` 随状态更新、`aria-controls` 关联内容区（真源仅 `onclick`，实现须补全 ARIA；shadcn Accordion 默认满足）。
- 展开态非仅靠图标旋转传达（配 `aria-expanded` 文字语义）。

### Data（数据需求与隐私约束）

- 静态 FAQ 列表（可来自内容配置）；无 PII。
- 涉及隐私 / 交换的答案与 `NFR-001`/`FLOW-003`/`docs/privacy-model.md` 不冲突（内容审查门）。

### Tests

- ≥4 项，每项可独立展开 / 折叠，键盘可操作，`aria-expanded` 正确切换。
- 漂移守卫：隐私 / 交换答案不含"E2EE / 链上 / 区块链"字样。
- `items` 为空→渲染 EmptyState。

---

## COMP-214 · `AuditLinkRow`（可审计规则 / 隐私模型 / 数据契约链接组）

### 元数据 / 追溯

- PAGE: `PAGE-105`；IA: `IA-013`；追溯 `NFR-004`（规则 / schema / 信任解释 / 隐私边界可审计）、`INV-01`/`INV-04`（链接目标为公开可审计产物、不含私有内容）。
- 引用共享: `COMP-016` `ListRow` 风格链接条 或 `COMP-008` `SecondaryButton` 外链；Material Symbols Outlined 图标 `fact_check` / `shield` / `contract`。

### 用途

- 兑现 `NFR-004` 核心：三个明确入口——可审计规则 / 隐私模型 / 数据契约，让规则 / schema / 信任解释 / 隐私边界可在仓库产物中查阅。

### Props（输入）

- `links: Array<{ icon: string; label: string; href: string; available: boolean }>`（默认三项）：
  - "可审计规则"→ 公开规则文档（隐私门规则 / 信任评分解释 / schema）。
  - "隐私模型"→ `docs/privacy-model.md`（或其发布版）。
  - "数据契约"→ `docs/data-contract.md`（或发布版 / `IA-012` API 契约页）。
- 所有目标须公开、可审计、不含 PII / 私有内容（`NFR-004`、`INV-04`）。

### Events / Actions

- 点击链接→打开对应仓库产物 / 文档页（仓库外为外链则新窗口 + `rel="noopener noreferrer"`）。
- 无写动作、无同意门。

### States（状态）

- `default`：三链接横向排列（真源 `flex-wrap justify-center`），响应式换行。
- `available: false`（文档未发布）→该项隐藏或标注"即将开放"，**不留死链**（边界态）。
- 无 `loading`/`error`（静态链接）。

### A11y（`NFR-007`）

- 每链接 Material Symbols Outlined 图标 + 文字标签，图标 `aria-hidden`、文字为唯一信息载体。
- 外链 `aria-label` 含"在新窗口打开"提示；键盘可聚焦、焦点态可见。

### Data（数据需求与隐私约束）

- 静态三链接；目标为公开仓库产物 / 文档；无 PII、无私有 URL（`INV-04`）。

### Tests

- 三入口齐全（可审计规则 / 隐私模型 / 数据契约），均可点击到达。
- `available: false` 项不渲染死链（隐藏或标"即将开放"）；建议构建期死链校验（守 `NFR-004`，见 `ASM-106`）。
- 每项图标 + 文字双载体（`NFR-007`）；外链含 `rel="noopener noreferrer"`。
- 断言无任何 `href` 指向私有内容 / 私有 URL（`INV-04`）。

---

## COMP-215 ~ COMP-229 · 预留

- 本模块当前用 `COMP-210`~`COMP-214`；`COMP-215`~`COMP-229` 预留给 about 后续模块特有组件（如装饰图形 / 理念时间线 / 贡献者墙等），按需登记，不得越界占用其他模块段。

---

## 追溯矩阵

| COMP | PAGE | IA | FR / NFR | FLOW / ENT / INV | DEC | 共享组件 |
| --- | --- | --- | --- | --- | --- | --- |
| `COMP-210` | `PAGE-101` | `IA-013` | `NFR-004`、`NFR-007` | `INV-04` | `DEC-012` | `COMP-008`、`COMP-011`/`COMP-013` |
| `COMP-211` | `PAGE-102` | `IA-013` | `FR-140`、`NFR-001`、`NFR-007` | `FLOW-008`、`ENT-019`、`INV-09`、`INV-04`、`ENT-005` | `DEC-011` | `COMP-014`、`COMP-017`、`COMP-021`、`COMP-033` |
| `COMP-212` | `PAGE-103` | `IA-013` | `NFR-001`、`NFR-005`、`NFR-004` | `INV-01`、`INV-08`、`INV-10`、`ENT-011`、`FR-050` | — | `COMP-009`、`COMP-013` |
| `COMP-213` | `PAGE-104` | `IA-013` | `NFR-004`、`NFR-007`、`NFR-001`、`FR-090`、`FR-080` | `FLOW-001`、`FLOW-003`、`INV-01`、`INV-04`、`ENT-016` | — | `COMP-028`、`COMP-021` |
| `COMP-214` | `PAGE-105` | `IA-013` | `NFR-004`、`NFR-007` | `INV-01`、`INV-04` | — | `COMP-016`、`COMP-008` |

---

## 本阶段新增假设（未写入 DEFAULT_ASSUMPTIONS.md，待编排者登记；沿用 PAGE_SPEC 的 ASM-058~060）

| ID | 假设 | 风险 | 确认 |
| --- | --- | --- | --- |
| `ASM-106` | `AuditLinkRow` 链接目标在构建期做死链校验，未发布目标以 `available:false` 隐藏或标"即将开放" | 死链会让审计入口失效、损害 `NFR-004` | 前端实现 / 集成阶段 |
| `ASM-107` | 五区块文案（理念 / 卡 / FAQ / 链接标签）来自集中内容配置（如 `content/about.*`），便于内容审查门统一核对漂移 | 文案散落各组件会绕过漂移守卫 | 前端实现确认 |

---

## 质量门自检（gates/07-frontend-spec-gate.md，模块扇出部分）

```text
Gate: 07-frontend-spec-gate（about 模块组件扇出）
Status: pass（内容自检）— 待交叉审核 + 用户确认
Evidence:
  - 产物：aies/02-design/about/COMPONENTS_SPEC.md（COMP-210~214，215~229 预留）
  - 上游对照：PAGE_SPEC.md(PAGE-100~105)、FRONTEND_SPEC.md(§6 共享组件、§7 COMP 段分配 about=COMP-210~229)、
    UI_RULES.md(UI-001~004/UI-003 StatBlock/LineChart/Card/Accordion)、IA_SPEC.md(IA-013)、
    LIGHT_DOMAIN_MODEL.md(ENT-019/INV-01/04/09/10)、BUSINESS_FLOW.md(FLOW-008)、ID_REGISTRY.md
Findings:
  - 每组件含 8 字段（元数据/用途/Props/Events/States/A11y/Data/Tests）；静态区块对 loading/error 标注 Not applicable 等价说明。✅
  - COMP 段严格落在 about 分配区间 COMP-210~229，未越界；共享组件只引用（COMP-006/008/009/011/013/014/016/017/021/028/033）不重定义。✅
  - 平台统计严格限定聚合、不含 PII（INV-09/NFR-001/DEC-011）；前端含 INV-01/04 字段白名单丢弃守卫 + 测试断言。✅
  - 锚定 shadcn + Tailwind（DEC-014）+ 单一图标族 Material Symbols Outlined（DEC-012，Octocat 唯一品牌例外）。✅
  - 文案漂移隔离守 NFR-003/NFR-001：COMP-210/212/213 显式禁止"链上/E2EE/语义向量/512 Nodes 硬编码"，并写入漂移守卫测试断言；以 PAGE_SPEC 文案为准。✅
  - 只写本文件，未碰控制台 / 他模块 / 共享 spec；未跑 git。✅
  - 新增假设 ASM-106/107 已登记，未改 DEFAULT_ASSUMPTIONS.md。✅
Decision: continue（待 spec 交叉审核 + 用户确认 ASM-106/107 与 ASM-060 装饰统计处置）→ passed
```
