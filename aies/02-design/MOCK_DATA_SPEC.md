# Mock 数据规格（MOCK_DATA_SPEC）

## 摘要

本产物为前端实现（阶段 11）与浏览器验证（阶段 12）提供**单一来源、跨模块一致**的拟真 MOCK 数据：按领域实体（`ENT-*`）定义种子数据集，所有页面/组件复用同一批 MOCK 用户/模块/交换（避免各模块自造导致不一致），并按各 `PAGE_SPEC.md` 的 States 字段覆盖正常/空/加载/错误/权限敏感场景。全部数据**合成、无真实 PII、不含原始知识内容**（守 `INV-01`/`INV-03`/`INV-04`）。接口形状最终以阶段 15 `SERVICE_CONTRACT` 为准（`ASM-067`），本规格只定数据形态与场景。

### 产物元数据

- Stage: `10-mock-data-spec`
- Status: `needs-user-confirmation`
- Upstream IDs: `ENT-001~021`、`INV-01/03/04/09`、`PAGE-001~105`、`FR-140`、`DEC-007/010/011`、`ASM-067`
- Decision IDs: `DEC-007`（无经济模型 → MOCK 无任何价格/计费字段）、`DEC-010`（联系方式默认私密）、`DEC-011`（统计聚合无 PII）
- 新增假设: `ASM-108`~`ASM-111`（见文末）
- 交付形态: `app/mocks/`（静态 JSON 种子 + MSW handlers），见 §「重置与生成规则」

---

## Dataset purpose（数据集用途）

驱动 14 个界面（`IA-001~014`）/ ~32 页 / COMP-001~229 组件在脱离真实后端时按真实状态渲染与交互；支撑组件单测、页面集成测试与阶段 12 浏览器核心路径（发现→详情→请求交换→接受后披露→反馈；提交向导隐私门；管理审核处置）。不引入任何无法追溯到 `ENT-*`/`PAGE-*` 的数据字段或行为。

## Entities and relationships（实体与关系）

以 `LIGHT_DOMAIN_MODEL.md` 的 `ENT-*` 为准，MOCK 覆盖下列实体并保持引用一致（同一 `userId`/`moduleId`/`exchangeId` 跨数据集互指）：

| 实体 | MOCK 集 | 关键关系 |
| --- | --- | --- |
| `ENT-001` User | `users` | 拥有 modules、参与 exchanges、派生 trustProfile |
| `ENT-003` KnowledgeModule | `modules` | 属某 user；含一份 manifest；被 exchanges 引用 |
| `ENT-004` Manifest | `manifests` | 脱敏摘要，**屏蔽 contact 字段**（`INV-03`/`ASM-024`） |
| `ENT-005` PrivacyScan | `privacyScans` | pass/warn/block，挂在 submission |
| `ENT-006` Submission | `submissions` | Draft/InReview 态，属 user |
| `ENT-007` Exchange | `exchanges` | 关联请求方/提供方 user + 模块；状态机 `FLOW-003` |
| `ENT-008/009` ContactInfo/Disclosure | `contacts`/`disclosures` | 默认私密；仅 Accepted 交换有 disclosure 快照 |
| `ENT-010` Feedback | `feedback` | 关联 exchange + 评价方/被评方 |
| `ENT-011` TrustProfile（派生） | `trustProfiles` | 每 user 一份，含分值/趋势/可解释拆解 |
| `ENT-012` Badge | `badges` | 授予 user |
| `ENT-013` SocialSignal | `socialSignals` | 收藏/认可/关注 |
| `ENT-014/015` Report/ReviewItem | `reports`/`reviewQueue` | 审核台数据 |
| `ENT-016` AgentSkill | `agentSkills` | 技能目录 |
| `ENT-017` Notification | `notifications` | 事件驱动，属 user |
| `ENT-018` AuditLog | `auditLog` | 审核/处置留痕 |
| `ENT-019` UsageStat（聚合） | `usageStats` | 平台聚合，**无 PII**（`INV-09`/`DEC-011`） |
| `ENT-020` Topic/Tag | `topics` | 模块/发现的筛选维度 |
| `ENT-021` Consent | `consents` | 同意记录 |

## Seed records（种子记录）

合成、可读、跨集一致。核心种子：

- **users（8 名，全合成 handle）**：`@zyongzhu24`（本人视角，含 6 模块 / 信任分 824 / 管理员角色用于 admin 场景）、`@knowledge-trader`、`@bot-dev`、`@ops-bot`、`@rag-builder`、`@growth-lab`、`@newcomer`（无历史，驱动空状态/未验证态）、`@sec-researcher`。每条：合成头像 URL、displayName、githubLogin、verified 布尔、领域标签、加入日期、派生信用分。
- **modules（~12）**：如「Agent 记忆系统设计模式」「多模态 RAG 检索流水线」「AI 产品增长实验库」「私有部署脚本集」（用于审核 block 场景）等；每条含脱敏摘要、来源统计（23/12/8/18.7k 风格）、主题标签、信任级别、stars/forks 计数、状态（Published/Draft）。
- **manifests**：与 modules 一一对应的脱敏清单 JSON（字段对齐 `docs/data-contract.md` + `examples/knowledge-module.manifest.json`），**不含 contact、不含原始内容**；1 条含 `content-commitment` 字段（`ASM-023`）。
- **exchanges（~10）**：覆盖状态机全谱（见场景）；脱敏交换号 `EX-2024-####`（`ASM-031`）。
- **trustProfiles**：每 user 一份，含分值（/1000，`ASM-037`）、近 N 期趋势序列、四类来源拆解（交换/反馈/验证/举报）。
- **notifications（~8）**：交换/评审/反馈/社区四类，含已读/未读。
- **usageStats**：模块 1,842 / 交换 12,857 / 活跃用户 2,196 / 隐私门通过率 98.6%（聚合，关于页用）。
- **agentSkills（~5）**：Create/Reduct/Validate Manifest、Package Private Repo、Submit Feedback。
- **reviewQueue/reports/auditLog**：审核台 3 待审 + 1 高风险（疑似私有路径）+ 2 举报 + 审计若干。

## Scenario coverage（场景覆盖，登记为 MOCK-*）

每个场景给前端一组确定数据以渲染特定状态；覆盖各 `PAGE_SPEC` 的 States。

| MOCK | 场景 | 覆盖页/状态 |
| --- | --- | --- |
| `MOCK-001` | 发现页·有结果（含统计条） | PAGE-002 正常 |
| `MOCK-002` | 发现页·空注册表 / 筛选无结果 | PAGE-002 空状态 |
| `MOCK-003` | 模块详情·完整（含来源统计/隐私边界/Manifest 预览/Contact 锁定占位） | PAGE-010 正常（`ASM-021`） |
| `MOCK-004` | 提交向导·五步含隐私门 pass/warn/block 三态 | PAGE-020~024（`INV-02` block 不可绕过） |
| `MOCK-005` | 交换记录台账·混合状态 + 1 条「审核中」中性态 | PAGE-030（`ASM-032`） |
| `MOCK-006` | 交换详情·已接受待交付（披露入口解锁） | PAGE-031（`INV-03`） |
| `MOCK-007` | 交换详情·已请求未接受（披露锁定） | PAGE-031 权限态 |
| `MOCK-008` | 信任档案·资深用户（满拆解/趋势/徽章/反馈质量） | PAGE-040 正常 |
| `MOCK-009` | 信任档案·新用户无历史 | PAGE-040 空/未验证态 |
| `MOCK-010` | 信任网络着陆·可信贡献者列表 | PAGE-043 |
| `MOCK-011` | Agent 技能目录 + 技能详情抽屉 | PAGE-050/051 |
| `MOCK-012` | 个人中心·有模块/草稿/进行中交换 | PAGE-060/061 |
| `MOCK-013` | 个人中心·草稿空状态 | PAGE-061 空状态 |
| `MOCK-014` | 通知中心·混合已读未读 + 空态 | PAGE-062 |
| `MOCK-015` | 设置·联系方式（默认私密 + 同意记录） | PAGE-063/064（`INV-03`） |
| `MOCK-016` | 审核台·队列 + 高风险 block + 举报 + 审计 | PAGE-080~085（仅管理员） |
| `MOCK-017` | 开放 API 文档·端点 + 示例 JSON 响应（无 contact） | PAGE-090（`ASM-055`） |
| `MOCK-018` | 关于页·平台聚合统计 + 趋势 | PAGE-100~105（`INV-09`） |
| `MOCK-019` | 全局加载态（各页 skeleton） | 全站 loading |
| `MOCK-020` | 全局错误态（请求失败可重试） | 全站 error |

## Invalid or edge records（非法 / 边界记录）

- 含私有路径/凭据的「脏」manifest（用于隐私门 block 场景 `MOCK-004`/审核 `MOCK-016`）——前端须脱敏/拦截，验证 `INV-01` 守卫。
- 异常含 contact 字段的公开数据样本——验证前端按白名单丢弃（`INV-03`/`ASM-020`）。
- 超长标题/标签、缺失头像、未验证 GitHub、信用分缺解释——驱动降级渲染。
- 速率限制/重复认可触发态（社交动作约束 `NFR-006`）。
- 时间窗无数据的统计——验证统计空态（`MOCK-018` 变体）。

## Sensitive-data handling（敏感数据处理）

- **全部合成**：无真实姓名/邮箱/电话/真实仓库。邮箱形如 `z****@example.com`（脱敏展示）。
- **联系方式默认私密**（`INV-03`/`DEC-010`）：`contacts` 默认 `visibility: private`；仅在 Accepted 交换的 `disclosures` 快照里对该次对方可见；MOCK 不把 contact 放进任何公开数据集（modules/manifests/exchanges 公开投影/API 响应）。
- **不含原始知识内容**（`INV-01`）：manifests 只有脱敏摘要，无全文/私有 embeddings。
- **统计仅聚合无 PII**（`INV-09`/`DEC-011`）：`usageStats` 不含可识别个体；遥测 MOCK 不记录「谁看了谁」。
- **无经济字段**（`DEC-007`）：任何数据集不得出现价格/计费/打赏。

## Reset and generation rules（重置与生成规则）

- 交付：`app/mocks/`——静态 JSON 种子（`*.seed.json`，按实体集）+ MSW（Mock Service Worker）handlers 按 query hooks 路径返回；场景通过 query 参数或 MSW scenario 切换（`MOCK-001~020`）。
- 确定性：固定种子、固定 ID（`@zyongzhu24`、`EX-2024-8842` 等稳定），便于测试断言可复现；时间戳相对「今天」由生成器注入，避免硬编码漂移。
- 单一真源：所有页面/组件从同一 `mocks/` 取数，禁止各模块内联自造 MOCK（守跨模块一致，呼应交叉审核教训）。
- 切真：阶段 15 服务契约就绪后，MSW handler 形状对齐契约、逐步替换为真实 API（`ASM-067`）。

## 本阶段新增假设（待登记）

| ID | 假设 | 风险 | 确认 |
| --- | --- | --- | --- |
| `ASM-108` | MOCK 交付用静态 JSON 种子 + MSW handlers，放 `app/mocks/` | 若团队偏好别的 mock 方案（如 json-server）需调 | 前端实现确认 |
| `ASM-109` | 种子 8 用户 / ~12 模块 / ~10 交换的规模足以覆盖所有页面状态 | 规模不足以演示分页/性能时再扩 | 前端实现/验证阶段 |
| `ASM-110` | 时间戳相对「今天」由生成器注入（不硬编码绝对日期） | 若需固定演示日期则改为固定时间锚 | 前端实现确认 |
| `ASM-111` | MOCK 数据形态为占位，最终字段以阶段 15 SERVICE_CONTRACT 为准 | 契约定稿后需回填种子与 handler | 服务契约阶段 |

## 质量门结果

```text
Gate: 08-mock-data-gate
Status: pass（内容自检）— 待用户确认数据源与敏感数据规则
Evidence: aies/02-design/MOCK_DATA_SPEC.md 对照 LIGHT_DOMAIN_MODEL(ENT-*)、各 PAGE_SPEC States、FRONTEND_SPEC §8 数据获取
Findings:
  - MOCK 覆盖正常/空/加载/错误/权限敏感态（MOCK-001~020 映射各 PAGE States）。✅
  - 数据匹配领域模型实体与页面需求；跨集引用一致（单一真源）。✅
  - 敏感/受规管数据全合成；契约联系方式默认私密、不含原始内容、统计无 PII、无经济字段（INV-01/03/09、DEC-007/010/011）。✅
  - 非法/边界记录覆盖隐私门 block、白名单丢弃、降级渲染、速率限制。✅
Decision: 内容自检通过；待用户确认数据源与敏感数据规则 → 转 passed → 进入 11-frontend-implementation（其前先跑 Task Zero 建可运行工程与绿色基线）
```
