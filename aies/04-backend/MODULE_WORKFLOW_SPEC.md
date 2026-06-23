# 模块工作流规格（Module Workflow Spec）

> 后端多步业务工作流的定义。后端是统一服务，本文按**工作流**（而非微服务）组织。每个工作流给出：触发、步骤、状态、校验、失败/补偿、写哪些表/审计。与 `BACKEND_SPEC.md`（schema/职责）、`SERVICE_CONTRACT.md`（端点）配套。

## Artifact metadata

- Stage: `14-module-workflow-spec`
- Status: `needs-user-confirmation`
- Source inputs: `aies/01-product/BUSINESS_FLOW.md`（`FLOW-001`~`FLOW-008`）、`LIGHT_DOMAIN_MODEL.md`、`BACKEND_SPEC.md`、前端 `app/src/lib/queries/*.ts`
- Upstream IDs: `FLOW-001`~`FLOW-008`、`FR-030/040/050/090/100/120/130/140`、`ENT-005/006/007/009/010/011/015/017/018/019/021`、`INV-01`~`INV-11`、`HARD-01/02/03/07/08/09`
- Decision IDs: `DEC-006/007/009/010/011/017`
- 新增假设: `ASM-117`（Vercel Cron 驱动到期/物化）、`ASM-119`（信任重算异步触发，最终一致）
- 新增风险: `RISK-003`（非法状态迁移）、`RISK-005`（信任重算竞态）
- Manifest status: stage `14-module-workflow-spec` = `needs-user-confirmation`

---

## 工作流 W-1：提交 → 隐私门 → 评审 → 发布（`FLOW-001`/`FLOW-005`，解 `HARD-01`/`HARD-07`/`HARD-08`）

**模块名**：Submission & Privacy Gate & Review。
**职责**：把发布方本机生成的脱敏清单经隐私门、人工评审，安全发布为公开模块；全程不接收原始内容（`INV-01`）。

**触发**：发布方 `user` 在提交向导操作（草稿/扫描/提交）。

**步骤与状态**：

1. **草稿** — `GET /api/submissions/draft`（新建）或 `/api/submissions/:id`（恢复）。`submissions.status = Draft`，`step` 跨步推进。读本机技能目录 `/api/submissions/skills`。
2. **本机隐私扫描上报**（`ASM-028`）— 本机技能执行扫描，`POST /api/submissions/privacy-scan` **只发送脱敏 Manifest**，后端复核并返回脱敏 `findings` + `overallStatus`（`pass|warn|block`），写 `privacy_scans`。**校验**：后端绝不接收命中的原始私有值（`INV-01`）。
3. **gate-stale 检测** — 扫描后若 Manifest 改动（`manifestHashAtScan` 不符），旧扫描/同意失效，需重跑（`ASM-083`）。
4. **提交** — `POST /api/submissions/:id/submit`。**校验**：(a) 必带 `submit` 类型 Consent，否则 `422`（`INV-08`）；(b) `overallStatus = block` 不可提交（`INV-02`）。写 `consents` + `audit_log`（`INV-11`），`submissions.status = Submitted → InReview`，生成 `review_items`（kind=submission，gate/riskLevel 来自扫描）。发通知（W-5）。
5. **评审**（管理员，W-4 处置之一）— `approve` → `Approved/Published`（`knowledge_modules.status = Published`，写 `manifests`）；`return`（changes-requested）→ 回 `Draft`（带原因）；`reject` → `Rejected`。

**失败/补偿**：扫描含 `block` → 返回阻断项与脱敏建议，修订后重跑（`FLOW-001` 回环）；提交缺 Consent → `422`，不落库；评审退回 → 发布方修订重入隐私门与评审（`FLOW-005 ↔ FLOW-001`）。

**写表/审计**：`submissions`、`privacy_scans`、`manifests`（发布时）、`knowledge_modules`（状态）、`consents`、`review_items`、`audit_log`、`notifications`。

---

## 工作流 W-2：交换生命周期状态机（`FLOW-003`，解 `HARD-02`）

**模块名**：Exchange Lifecycle。
**职责**：管理一次知识对接的关系与进度（不含内容，`INV-01`/`INV-04`），服务端校验合法状态迁移（`RISK-003`）。

**触发**：消费方发起请求；双方所有者推进；举报；cron 到期。

**合法状态迁移表**（服务端强制；非法迁移 `409`）：

| 当前态 | 允许 → | 触发者 / 条件 |
|---|---|---|
| `Requested` | `Accepted` / `Rejected` | 目标所有者决策（`NFR-005`） |
| `Requested` | `Cancelled` | 请求方接受前撤回 |
| `Requested` | `Expired` | cron：时限未响应（`ASM-117`） |
| `Accepted` | `PrivatePreparing` | 双方同意进入私下交付 |
| `Accepted` / `PrivatePreparing` | `Cancelled` | 任一所有者中止（**必填原因** `cancelReason`） |
| `PrivatePreparing` | `Delivered` | 平台外交付完成回报 |
| `Delivered` | `Completed` | **双方各自确认**（`INV-06`：`requesterConfirmedDelivery && ownerConfirmedDelivery`） |
| `Completed` | `WaitingForFeedback` | 自动触发反馈请求（W-3） |
| `WaitingForFeedback` | `Closed` | 双方反馈齐全 或 cron 窗口到期（`ASM-011`） |
| 任意活动态 | `Flagged` | 举报触发（→ W-4 审核，不公开内容）。前端以中性 `InReview`「审核中」投影展示（`ASM-032`），`exchanges.status` 仅存 `Flagged`，`InReview` 非独立持久态 |

**关键步骤校验**：

- **创建请求** — `user`；目标模块存在且 `Published`；`offeredModule` 可空（`INV-05`/`DEC-009`）；写 `exchanges`(Requested) + `consents`(exchange) + `audit_log`；发通知。
- **接受** — 仅目标所有者；`Requested → Accepted`；**接受后按 `FR-130` 触发联系方式披露准备**（W-2a）；发通知。
- **披露联系方式**（W-2a，`FR-130`/`DEC-010`，解隐私门一部分）— 仅状态 `≥ Accepted` 且调用者为参与方（`INV-03`）；必带 `contact` 类型 Consent；写 `contact_disclosures` 快照（`ENT-009`）+ `consents` + `audit_log`；对方可见快照。**撤回**只置 `revokedForFuture`，已披露快照不收回（`ASM-013`）。
- **标记已交付** — 仅参与方；置己方 `*ConfirmedDelivery`；双方齐才 `Completed`（`INV-06`）。

**失败/补偿**：请求被拒/超时 → 消费方可调整后重发（新 `Requested`）；私下交付中止 → `Cancelled` + 原因，不扣信任分（除非举报成立）；非法迁移 → `409` 不改状态。

**写表/审计**：`exchanges`、`contact_disclosures`、`consents`、`audit_log`、`notifications`；Upstash `exchanges_total` 计数（W-6）。

---

## 工作流 W-3：反馈 → 信任分重算（`FLOW-004`，解 `HARD-03`）

**模块名**：Feedback & Trust Recompute。
**职责**：交换后收集结构化反馈，重算可解释信任分；参与方反馈权重高于社交信号（`INV-10`）。

**触发**：交换进入 `WaitingForFeedback`；参与方提交反馈。

**步骤与校验**：

1. **资格** — `GET /api/exchanges/:id/feedback` 返回 `submissionState`（`editable|submitted|ineligible|window-closed`）。仅 `WaitingForFeedback` 参与方为 `editable`。
2. **提交** — `POST /api/exchanges/:id/feedback`。**校验**：(a) 资格 `editable`，否则 `409`；(b) 五维必填（`checklistConsistency`/`privacyBoundary`/`structureClarity`/`usefulness`/`rebuyIntent`），缺失 `422`；(c) 唯一性（每方每次交换一份，`NFR-006`）。写 `feedback`（`weight` 参与方>社交）+ `audit_log`。
3. **信任重算**（异步触发，最终一致 `ASM-119`）— 由交换历史/反馈质量/GitHub 验证/举报派生 `trust_profiles`（score/level/breakdown/trend）+ `badges`。**可解释**：`breakdown` 含四类来源解释（`HARD-03`）。竞态由「以 `recomputedAt` 单调更新 / 全量重算覆盖」处理（`RISK-005`）。
4. **窗口关闭** — cron：`WaitingForFeedback` 超期 → `Closed`，缺反馈方不获正向信号（`ASM-011`）。

**失败/补偿**：不合资格 `409`；校验失败 `422`，不落库；重算失败可重试（幂等全量重算）。

**写表/审计**：`feedback`、`trust_profiles`、`badges`、`audit_log`、`notifications`（收到反馈）。

---

## 工作流 W-4：审核处置 + 审计（`FLOW-005`，解 `HARD-08`）

**模块名**：Moderation。
**职责**：管理员处理评审队列与举报，留审计轨迹。

**触发**：提交入队（W-1）；举报创建（W-7）；管理员处置。

**步骤与校验**：

1. **队列/详情/摘要/审计** — `admin` 读 `review_items`/详情（脱敏 Manifest 摘要 + PrivacyScan + 举报）/风险摘要（聚合 `INV-09`）/`audit_log`。
2. **单项处置** `POST /api/admin/moderate` — 动作 `approve|return|delist|dismiss-report|resolve`。**校验**：(a) 含 `block` 不可 `approve`（`409`，`INV-02`）；(b) `return/delist/dismiss-report` 必填原因（`400`）。写 `review_items.status/resolution` + `audit_log`（`INV-11`），触发对应连锁（发布/退回/下架/举报处置）。
3. **批量通过** `POST /api/admin/bulk-approve` — 仅 `pass` 且无未决举报子集（`ASM-050`），逐项写审计。

**失败/补偿**：`block` approve → `409`；缺原因 → `400`。本产品**无争议仲裁**，仅处罚/下架（产品边界）。

**写表/审计**：`review_items`、`knowledge_modules`（下架/发布）、`reports`、`audit_log`、`notifications`。

---

## 工作流 W-5：通知事件扇出（`FLOW-006`，解 `HARD-09`）

**模块名**：Notification Fan-out。
**职责**：把业务事件扇出为站内通知（邮件/webhook 延后）。

**触发**：交换请求/接受/拒绝/交付变化、反馈到期/收到、评审结果、社交认可。

**步骤**：领域动作成功后，在同事务或事务后 insert `notifications`（按收件人，type ∈ `exchange|review|feedback|community`）。读：列表（按 type 过滤 + `unreadCount`）、标记已读（单条/全部，幂等）。

**失败/补偿**：通知写入失败不回滚主业务（旁路，最佳努力）；标记已读幂等。

**写表**：`notifications`；可选 Resend 邮件（按偏好，`ASM-048`）。

---

## 工作流 W-6：统计聚合（`FLOW-008`，`FR-140`/`DEC-011`）

**模块名**：Usage Stats Aggregation。
**职责**：维护平台聚合统计，无 PII（`INV-09`）。

**触发**：业务事件（用户注册/模块发布/交换创建/隐私门结果）→ Upstash 计数；cron 周期物化。

**步骤**：(1) 事件 `INCR` Upstash 计数键（无个体键，`INV-09`）；(2) Vercel Cron 周期把计数 + 派生比率（如隐私门通过率、月度活跃序列）物化进 `usage_stats`；(3) 公开端点 `/api/stats/usage`、`/api/about/stats` 读物化值。

**失败/补偿**：计数失败不阻断主业务；物化幂等覆盖。

**写表**：`usage_stats`（+ Upstash）。

---

## 工作流 W-7：社交信号与举报（`FR-070`，贯穿）

**模块名**：Social & Reports（轻量，列出以闭合 FR-070）。
**职责**：收藏/认可/评论与举报，受唯一性 + 限流约束（`NFR-006`/`INV-07`）。

**步骤与校验**：favorite 唯一（`INV-07`）；举报创建 `reports`(pending) → 入 `review_items`（W-4）；限流（Upstash）。

**写表/审计**：`social_signals`、`reports`、`review_items`、`audit_log`。

---

## 工作流依赖图

```text
W-1 提交/隐私门 ──(InReview)──> W-4 审核 ──(approve)──> 模块 Published ──> W-2 交换可发起
W-2 交换 ──(Accepted)──> W-2a 披露 ; ──(WaitingForFeedback)──> W-3 反馈 ──> 信任重算
W-7 举报 ──> W-4 审核 ; 任意活动态 ──Flagged──> W-4
所有工作流 ──成功事件──> W-5 通知扇出 ; ──计数──> W-6 统计
所有跨边界写 ──> consents + audit_log（INV-08/INV-11）
```

## 完成证据（Completion evidence）

- 每个工作流的状态迁移与校验由 §对应不变量 + `SERVICE_CONTRACT.md` 的 TEST-* 覆盖（红绿）。
- 工作流追溯回 `FLOW-001`~`FLOW-008` 与 `HARD-01/02/03/07/08/09`；未引入无追溯步骤。
