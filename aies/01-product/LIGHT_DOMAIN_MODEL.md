# 轻量领域模型

## 摘要

本产物把产品规格与业务流程落成轻量的领域词汇：实体（`ENT-*`）、关系、生命周期状态与不变量（`INV-*`）。只建支撑主路径与契约所需的概念，**不做持久化/数据库/框架选型**。重点编码已确认决策：互惠可选（`DEC-009`）、联系方式默认私密+同意披露（`DEC-010`/`FR-130`）、轻度后端聚合统计（`DEC-011`/`FR-140`）。所有实体追溯到上游 `FR-*`/`FLOW-*`/`CAP-*`。

### 产物元数据

- Stage: `05-light-domain-model`
- Status: `needs-user-confirmation`
- Source inputs: `aies/01-product/PRODUCT_SPEC.md`、`aies/01-product/BUSINESS_FLOW.md`
- Decision IDs: `DEC-006`、`DEC-007`、`DEC-009`、`DEC-010`、`DEC-011`
- 新增假设: `ASM-012`（Agent 为与 User 关联的行动者身份，非独立持久实体）、`ASM-013`（联系方式按交换披露快照，撤回只影响未来）

---

## 实体词汇表

### 身份与档案
| ENT ID | 实体 | 用途 | 关键属性（概念层） | 来源 |
| --- | --- | --- | --- | --- |
| `ENT-001` | User（人类所有者/账户） | 平台主体，知识与交换的归属与同意方 | GitHub 身份、GitHub Verified、档案摘要、领域标签、加入日期、信用分(派生)、徽章(派生) | `FR-001`、`FR-060`、`DEC-006` |
| `ENT-002` | Agent（个人 agent） | 代表 User 行动的消费方/发布方身份 | 关联 User、角色(消费/发布) | `JOB-001`、`JOB-002`、`ASM-012` |
| `ENT-008` | ContactInfo（联系方式） | 服务一对一私下深连接 | 关联 User、方式类型、值、可见性(private/exchange-revealed/public)、可编辑/撤回 | `FR-130`、`DEC-010` |

### 知识与清单
| ENT ID | 实体 | 用途 | 关键属性 | 来源 |
| --- | --- | --- | --- | --- |
| `ENT-003` | KnowledgeModule（知识模块） | 公开"目录卡片"背后的一块知识 | 关联 owner(User)、类型、状态、信任级别(派生)、交换/收藏/反馈计数(派生) | `FR-010`、`FR-020`、`CAP-002/003` |
| `ENT-004` | Manifest（清单） | 模块的脱敏公开摘要，发现与评估的依据 | 关联 KnowledgeModule、脱敏摘要、主题、新鲜度、来源统计、内容承诺、隐私边界、版本 | `FR-020`、`FR-090`、`docs/data-contract.md` |
| `ENT-020` | Topic/Tag（主题标签） | 发现的搜索/筛选维度 | 名称、关联模块 | `FR-010` |

### 提交与隐私
| ENT ID | 实体 | 用途 | 关键属性 | 来源 |
| --- | --- | --- | --- | --- |
| `ENT-006` | Submission（提交） | 清单进入评审的一次提交 | 关联 Module/Manifest、状态、关联 PrivacyScan、提交者 | `FR-030`、`FLOW-001/005` |
| `ENT-005` | PrivacyScan（隐私扫描结果） | 隐私门的扫描与分级 | 发现项(pass/warn/block)、泛化建议、敏感度声明 | `FR-090`、`HARD-01` |

### 交换与联系
| ENT ID | 实体 | 用途 | 关键属性 | 来源 |
| --- | --- | --- | --- | --- |
| `ENT-007` | Exchange（交换） | 一次知识对接关系与进度（不含内容） | 请求方(User)、目标模块、**可选**提供模块、生命周期状态、私有通道引用(仅引用不含内容)、时间戳 | `FR-040`、`FLOW-003`、`DEC-009` |
| `ENT-009` | ContactDisclosure（联系方式披露） | 记录某次交换接受后对对方披露的联系方式快照 | 关联 Exchange、披露方/接收方、披露的 ContactInfo 快照、时间 | `FR-130`、`DEC-010`、`ASM-013` |

### 信任与反馈
| ENT ID | 实体 | 用途 | 关键属性 | 来源 |
| --- | --- | --- | --- | --- |
| `ENT-010` | Feedback（反馈） | 交换后的结构化评价 | 关联 Exchange、作者(User)、维度(清单一致性/隐私边界/结构清晰度/有用性/再次交换意愿)、公开文本、权重 | `FR-050`、`FLOW-004` |
| `ENT-011` | TrustProfile（信任档案，派生） | 模块信任级别与用户信用的可解释聚合 | 模块信任级别、用户信用分、分数趋势、解释 | `FR-050`、`FR-060`、`HARD-03` |
| `ENT-012` | Badge（徽章） | 信任与贡献的可见标记 | 类型、授予条件、关联 User | `FR-050` |

### 社交与治理
| ENT ID | 实体 | 用途 | 关键属性 | 来源 |
| --- | --- | --- | --- | --- |
| `ENT-013` | SocialSignal（社交信号） | 收藏/认可/评论等轻量操作 | 类型、关联 User+目标(模块/档案)、文本(可选) | `FR-070` |
| `ENT-014` | Report（举报） | 举报问题内容/行为 | 举报方、目标(模块/用户/交换)、原因、状态 | `FR-070`、`FR-100` |
| `ENT-015` | ReviewItem（评审/审核项） | 评审队列中的一项与处置 | 关联 Submission/Report、管理员、裁决(批准/拒绝/要求修改/处罚)、风险摘要 | `FR-100`、`FLOW-005` |
| `ENT-016` | AgentSkill（Agent 技能条目） | MCP/本地工具目录条目 | 名称(建清单/脱敏/验证/打包/提交反馈)、安装/文档、隐私级别、支持来源类别 | `FR-080`、`CAP-009` |

### 系统与轻后端
| ENT ID | 实体 | 用途 | 关键属性 | 来源 |
| --- | --- | --- | --- | --- |
| `ENT-017` | Notification（通知） | 事件驱动各方推进 | 关联 User、事件类型、引用、已读状态 | `FR-120`、`FLOW-006` |
| `ENT-018` | AuditLog（审计记录） | 合规与可追溯 | 行动者、动作、目标、时间 | `NFR-006`、`FLOW-005` |
| `ENT-019` | UsageStat（使用统计，聚合） | 平台使用统计 | 指标(用户数/模块数/交换数等)、口径、时间窗；**不含 PII** | `FR-140`、`DEC-011` |
| `ENT-021` | Consent（同意记录） | 证明跨边界动作经所有者批准 | 关联 User、动作类型(生成/提交/联系/交换)、时间、范围 | `NFR-005`、`FLOW-007` |

## 关系

```text
User(ENT-001) ──owns──>* KnowledgeModule(ENT-003) ──has 1──> Manifest(ENT-004)
User ──operates──> Agent(ENT-002)                 KnowledgeModule ──tagged──>* Topic(ENT-020)
User ──has──>* ContactInfo(ENT-008)               KnowledgeModule ──via──>* Submission(ENT-006) ──has 1──> PrivacyScan(ENT-005)

Exchange(ENT-007):
  requester  *──1 User
  targetModule *──1 KnowledgeModule
  offeredModule *──0..1 KnowledgeModule        (互惠可选, DEC-009)
  ──produces──>* Feedback(ENT-010)
  ──on Accepted──>* ContactDisclosure(ENT-009) (引用 ContactInfo 快照)

User ──has 1──> TrustProfile(ENT-011, 派生)  ──awards──>* Badge(ENT-012)
User ──acts──>* SocialSignal(ENT-013) / Report(ENT-014)
Report/Submission ──enters──> ReviewItem(ENT-015) ──by──> Admin(User 的管理员角色)
所有跨边界动作 ──writes──> Consent(ENT-021) + AuditLog(ENT-018)
事件 ──emit──>* Notification(ENT-017)
聚合 ──compute──> UsageStat(ENT-019)
AgentSkill(ENT-016) 为目录内容，独立于上述关系
```

## 生命周期状态

- **Exchange（`ENT-007`，解 `HARD-02`）**：`Requested → Accepted → PrivatePreparing → Delivered → Completed → WaitingForFeedback → Closed`；异常：`Rejected`（目标拒绝）、`Cancelled`（接受前撤回/中止）、`Expired`（超时未响应）、`Flagged`（举报→审核）。详见 `BUSINESS_FLOW.md`。
- **Submission（`ENT-006`）**：`Draft → Submitted → InReview → (ChangesRequested → Submitted) → Approved/Published | Rejected`。
- **KnowledgeModule（`ENT-003`）**：`Draft → Published → (Updated) → Delisted/Removed`。
- **ContactInfo（`ENT-008`）**：`Private(默认) →（交换接受时生成 ContactDisclosure 快照）`；可由用户改为 `Public` 或 `Revoked`；撤回只影响未来披露（`ASM-013`）。
- **Submission 内嵌的 PrivacyScan（`ENT-005`）**：发现分级 `pass | warn | block`；含 `block` 不可发布。

## 不变量

| INV ID | 不变量 | 来源 |
| --- | --- | --- |
| `INV-01` | 平台永不存储原始知识内容；只存清单与公开关系 | `NFR-001`、`FR-090` |
| `INV-02` | 含 `block` 级隐私发现的清单不得发布 | `FR-090`、`HARD-01` |
| `INV-03` | ContactInfo 默认私密；仅在所属 Exchange 进入 `Accepted` 后对该次对方披露；公开须用户显式 opt-in | `FR-130`、`DEC-010` |
| `INV-04` | 公开记录与 API 输出不含私有内容或私有 URL | `FR-040`、`FR-110` |
| `INV-05` | Exchange.offeredModule 可为空（互惠可选） | `DEC-009`、`ASM-009` |
| `INV-06` | `Delivered → Completed` 需交换双方各自确认 | `ASM-010` |
| `INV-07` | 每个 (User, KnowledgeModule) 至多一个有效 favorite | `FR-070` |
| `INV-08` | 生成触及范围/提交/联系/交换前必须存在对应 Consent 记录 | `NFR-005`、`FLOW-007` |
| `INV-09` | UsageStat 为聚合指标、不含 PII | `FR-140`、`DEC-011` |
| `INV-10` | 交换参与方反馈对信任的权重高于社交信号 | `FR-050` |
| `INV-11` | 提交/审核/举报/处罚/状态变更/同意均写入 AuditLog | `NFR-006` |

## 派生值

- **TrustProfile（`ENT-011`）**：用户信用分、模块信任级别、徽章——由交换历史、反馈质量、GitHub 验证、举报派生，且可在页面解释（`FR-050`/`FR-060`）。
- **模块计数**：交换次数、收藏数、反馈数由相应事件派生（`FR-010`/`FR-020`）。
- **新鲜度**：由模块/清单更新时间派生（`FR-010`）。
- **UsageStat（`ENT-019`）**：用户数/模块数/交换数等聚合，由轻后端按口径计算（`FR-140`）。

## 外部引用

- **GitHub 身份 / GitHub Verified**：规范身份与验证来源，外部系统（`DEC-006`、`FR-001`）。
- **私有交付通道**：默认 GitHub 私有仓库，平台只引用状态、不持有内容（`ASM-007`、`INV-01`）。
- **知识来源类型**：Obsidian、Logseq、Notion、Markdown、语雀、飞书文档、本地文件夹、自定义——由本地 Agent 技能处理，外部于平台（`FR-080`）。

## 开放建模问题

- `ENT-002` Agent 是否需成为独立持久实体（带自身凭据/签名身份），还是仅作 User 的行动者角色？当前默认后者（`ASM-012`）；若 `FR-110` 认证写 API 需要"签名的 agent 身份"，在服务契约阶段升格。属扩展面，非阻塞。
- 模块版本/清单 diff 的建模（历史、版本链）：属目标产品的扩展面，优先级靠后；在页面/服务契约阶段细化，非本阶段阻塞。
- ContactDisclosure 撤回语义：默认"撤回只影响未来披露，已披露快照不可收回"（`ASM-013`）；若需更强的撤回/失效，在服务契约阶段定义。

## 质量门结果

```text
Gate: 03-domain-model-gate
Status: pass（内容检查）— 待用户确认
Evidence: aies/01-product/LIGHT_DOMAIN_MODEL.md 对照 PRODUCT_SPEC.md、BUSINESS_FLOW.md
Findings: 实体使用产品词汇；关系与生命周期支撑业务流程（交换状态机、隐私门、联系方式披露、信任派生、轻后端统计）；未做持久化/框架选型。新增假设 ASM-012/ASM-013（建模默认，已标记）。开放问题为扩展面，非阻塞。
Decision: 待用户确认词汇与生命周期状态 → 转 passed → 进入 06-ia-spec
```
