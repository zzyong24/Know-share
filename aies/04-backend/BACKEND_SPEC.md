# 后端规格（Backend Spec）

> 单一来源的统一后端规格。Know-share 后端是「同一套 API + 共享 schema + 共享不变量校验」，本文档**不按前端模块拆碎**；模块化职责见 `MODULE_WORKFLOW_SPEC.md`，逐端点契约见 `SERVICE_CONTRACT.md`。

## Artifact metadata

- Stage: `13-backend-spec`
- Status: `needs-user-confirmation`
- Source inputs: `aies/01-product/PRODUCT_SPEC.md`、`aies/01-product/BUSINESS_FLOW.md`、`aies/01-product/LIGHT_DOMAIN_MODEL.md`、`aies/02-design/*/PAGE_SPEC.md`、前端落地代码 `app/src/lib/queries/*.ts` + `app/src/mocks/handlers/*.ts` + `app/src/lib/types.ts`
- Upstream IDs: `FR-001`~`FR-140`、`NFR-001`~`NFR-007`、`FLOW-001`~`FLOW-008`、`ENT-001`~`ENT-021`、`INV-01`~`INV-11`、`HARD-01`~`HARD-09`、`PAGE-001`~`PAGE-105`
- Decision IDs: `DEC-006`（GitHub 规范身份）、`DEC-007`（无经济模型）、`DEC-009`（互惠可选）、`DEC-010`（联系方式默认私密/接受后披露）、`DEC-011`（轻后端+聚合统计）、`DEC-017`（零氪 serverless 栈）
- 新增假设: `ASM-112`~`ASM-120`（见各节就近标注 + 返回汇总）
- 新增风险: `RISK-002`~`RISK-005`
- Manifest status: stage `13-backend-spec` = `needs-user-confirmation`（待用户确认后转 `passed`）

---

## 1. 后端职责（Backend responsibilities）

后端按业务域分节描述职责。所有职责均由**同一个 Next.js 应用**承载（Route Handlers 在 `app/api/**/route.ts`，与前端同仓同类型），不拆微服务（`DEC-017`、`DEC-011`）。

### 1.1 发现 / 注册表（`FR-010`、`FLOW-002`）

- 提供公开只读模块列表，支持服务端筛选（`type`/`topic`/`trustLevel`/`verifiedOnly`）、关键字 `q`、排序（`relevance`/`latest`/`popular`/`trust`）、分页与空注册表态。
- 列表与卡片输出**仅脱敏公开投影**（对齐 `app/src/lib/types.ts#KnowledgeModule`），永不含 `contact`/原始内容/私有 URL（`INV-01`/`INV-04`）。
- 主题/标签目录（`ENT-020`）、平台聚合统计入口（`FR-140`）。
- 全局搜索：把 `q` 解析为 modules/topics/users/exchanges 四类分组结果 + 计数；搜索联想（suggest）。

### 1.2 知识模块详情（`FR-020`、`FLOW-002`）

- 聚合返回：模块身份（`ENT-003`）+ 脱敏 Manifest（`ENT-004`）+ owner 公开摘要（`ENT-001` 投影）+ 信任信号（`ENT-011` 派生）+ 隐私边界（`ENT-004.privacyBoundary`）。
- Manifest 预览/完整视图均不含 `contact`/原始内容（`INV-01`/`INV-03`/`INV-04`）；后端是权威脱敏边界（前端 `stripSensitiveFields` 仅纵深防御）。

### 1.3 提交 + 隐私门（`FR-030`、`FR-090`、`FLOW-001`、`HARD-01`）

- 草稿生命周期（`ENT-006`：`Draft → Submitted → InReview → (ChangesRequested → Submitted) → Approved/Published | Rejected`）：新建/恢复/读取本机可用技能目录。
- 隐私门：接收**本机技能产出的脱敏 findings 与脱敏 Manifest**（扫描在本机执行，`ASM-028`），后端**只接收/存储脱敏结果，绝不接收命中的原始私有值**（`INV-01`）。后端复核分级 `pass | warn | block`，并对 `block` 强制不可发布（`INV-02`）。
- 提交：强制存在 `submit` 类型 Consent（`INV-08`），否则 `422`；写 `AuditLog`（`INV-11`）；将提交入评审队列（`ENT-015`）。

### 1.4 交换（`FR-040`、`FR-130`、`FLOW-003`、`HARD-02`）

- 交换生命周期状态机（`ENT-007`：`Requested → Accepted → PrivatePreparing → Delivered → Completed → WaitingForFeedback → Closed` + `Rejected/Cancelled/Expired/Flagged`），服务端校验**合法状态迁移**，拒绝非法跳转（`RISK-003`）。
- 创建请求（目标模块 + **可选**自有模块，`DEC-009`/`INV-05`）、接受/拒绝、披露联系方式（仅 `Accepted+` 参与方，写 `ContactDisclosure` 快照 `ENT-009` + Consent + Audit，`INV-03`）、撤回披露（只影响未来，`ASM-013`）、标记已交付（双方各自确认才转 `Completed`，`INV-06`）。
- 公开台账（`ENT-007` 脱敏行）+ 详情（按会话身份派生 `viewerRole` + 披露区门控）。`Flagged` 不在公开台账列出（`FLOW-005`）；前端 `ExchangeStatus` 的 `InReview` 是 `Flagged` 的中性展示投影（`ASM-032`），**非独立持久状态**（不进状态机/`exchanges.status` 仅存 `Flagged`），同样不列出。

### 1.5 信任反馈（`FR-050`、`FR-060`、`FLOW-004`、`HARD-03`）

- 反馈：仅 `WaitingForFeedback` 的参与方可提交结构化五维反馈（`ENT-010`），后端二次校验资格/唯一性/状态（`NFR-006`）。
- 信任重算：由交换历史/反馈质量/GitHub 验证/举报派生模块信任级别与用户信用分 + 徽章（`ENT-011`/`ENT-012`），**可解释**（`HARD-03`），**参与方反馈权重高于社交信号**（`INV-10`）。
- 信任档案聚合（公开匿名可看，`INV-04`）+ 信任网络索引（筛选/排序）。

### 1.6 技能（`FR-080`、`CAP-009`）

- 只读技能/MCP 目录（`ENT-016`），支持来源类别、安装/文档、隐私级别（`local`/`remote`）；命令/配置仅占位路径，零私有内容（`INV-01`/`INV-04`）。

### 1.7 账户 / 通知 / 设置·联系方式（`FR-120`、`FR-130`、`FLOW-006`、`FLOW-007`）

- 个人中心概览（派生统计）+ 分区（modules/drafts/received/sent/favorites）。
- 通知（`ENT-017`）：列表（按 type 过滤 + unreadCount）、单条/全部标记已读（幂等）。
- 联系方式（`ENT-008`）：默认私密读写（`INV-03`）；保存写 Consent + Audit。同意/披露记录读取与撤回。账户身份（只读 GitHub，`DEC-006`）。通知偏好。

### 1.8 审核（`FR-100`、`FLOW-005`、`HARD-08`）

- 管理员评审队列（`ENT-015`）+ 详情（脱敏 Manifest 摘要 + PrivacyScan + 举报）+ 风险摘要（聚合，`INV-09`）+ 审计日志。
- 处置（`approve`/`return`/`delist`/`dismiss-report`/`resolve`）：含 `block` 不可 `approve`（`INV-02`）；退回/下架/驳回必填原因；逐项写 Audit（`INV-11`）。批量通过（仅 `pass` 且无未决举报子集）。

### 1.9 开放 API（`FR-110`、`HARD-05`、`NFR-002`）

- 公开只读注册表 API（modules/topics/exchanges 脱敏台账/stats），输出**零私有泄露**（`INV-04`），施加限流（`NFR-006`）。认证写操作（请求交换/反馈等）需 GitHub 会话（首版与站内复用同套 Route Handlers；外部 agent 的「签名 agent 身份」属扩展面 `ASM-118`）。

### 1.10 关于 / 统计（`FR-140`、`FLOW-008`、`DEC-011`）

- 平台使用统计（`ENT-019`）：聚合指标（用户数/模块数/交换数/隐私门通过率/月度活跃序列），**严格聚合、无 PII**（`INV-09`）。计数走 Upstash Redis 实时计数 + 周期物化进 Postgres（见 §2.4）。

---

## 2. 持久化模型（Persistence model）

技术：**Neon PostgreSQL（serverless）+ Drizzle ORM**，schema 与迁移由 drizzle-kit 管理（`DEC-017`）。下为 Drizzle schema **草案**（概念定稿，列名/类型在实现期按 lint 微调，`ASM-112`：Drizzle 列命名用 snake_case 数据库列 + camelCase TS 字段）。覆盖 `ENT-001`~`ENT-021`。

> 守则在 schema 层兑现：原始内容**无对应列**（`INV-01`）；`contact_info` 独立成表且默认私密（`INV-03`）；披露写快照表（`ENT-009`）；审计独立表（`ENT-018`）；聚合统计走 Upstash + 物化（`INV-09`）。

### 2.1 身份与档案

```ts
// ENT-001 User（人类所有者/账户）— FR-001/FR-060/DEC-006
users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  githubId: text("github_id").notNull().unique(),        // GitHub 规范身份（DEC-006）
  login: text("login").notNull().unique(),               // GitHub handle
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url").notNull(),
  githubVerified: boolean("github_verified").notNull().default(false), // GitHub Verified
  isAdmin: boolean("is_admin").notNull().default(false), // 角色 admin
  bio: text("bio"),
  domains: text("domains").array().notNull().default([]),  // 领域标签
  restrictionState: text("restriction_state").notNull().default("normal"), // normal|flagged（处罚）
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ loginIdx: index("users_login_idx").on(t.login) }));
// 注：trustScore/level/badges 为派生（ENT-011/012），不在本表常驻列，见 trust_profiles 物化表。

// ENT-002 Agent（个人 agent）— 默认作为 User 的行动者角色，非独立持久实体（ASM-012）。
// 本版不建表；FR-110 认证写复用 User 会话。若未来需签名 agent 身份再升格（ASM-118，扩展面）。

// ENT-008 ContactInfo（联系方式）— FR-130/DEC-010；独立表，默认私密（INV-03）
contactInfo = pgTable("contact_info", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),          // github|email|im|custom
  value: text("value").notNull(),        // 真实值（PII；仅服务端，永不进公开投影）
  label: text("label"),
  visibility: text("visibility").notNull().default("private"), // private(默认)|public（INV-03/DEC-010）
  revokedAt: timestamp("revoked_at", { withTimezone: true }),  // 撤回只影响未来披露（ASM-013）
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ userIdx: index("contact_info_user_idx").on(t.userId) }));
```

### 2.2 知识与清单

```ts
// ENT-003 KnowledgeModule — FR-010/FR-020
knowledgeModules = pgTable("knowledge_modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  type: text("type"),                    // 模块类型（来源类型/用途）
  status: text("status").notNull().default("Draft"), // Draft|Published|Updated|Delisted
  publishedAt: timestamp("published_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ownerIdx: index("km_owner_idx").on(t.ownerId),
  statusIdx: index("km_status_idx").on(t.status),
}));
// 派生（不存列）：trustLevel、exchangeCount、favoriteCount、freshness — 由事件/物化派生。

// ENT-004 Manifest — FR-020/FR-090；脱敏公开摘要，无原始内容（INV-01）
manifests = pgTable("manifests", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleId: uuid("module_id").notNull().references(() => knowledgeModules.id),
  summary: text("summary").notNull(),    // 脱敏摘要
  topics: text("topics").array().notNull().default([]),
  freshness: text("freshness"),
  sourceStats: jsonb("source_stats").notNull(), // { notes, links, files, words } — 计数，非内容
  contentCommitment: text("content_commitment"),
  privacyBoundary: text("privacy_boundary"),
  sensitivity: text("sensitivity"),
  coveredQuestions: text("covered_questions").array(),
  sourceTypes: text("source_types").array().notNull().default([]),
  version: text("version").notNull(),
  isCurrent: boolean("is_current").notNull().default(true), // 版本链（ASM-114：保留版本，扩展 diff 靠后）
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ moduleIdx: index("manifest_module_idx").on(t.moduleId) }));

// ENT-020 Topic/Tag — FR-010
topics = pgTable("topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull().unique(),
});
moduleTopics = pgTable("module_topics", {     // 多对多
  moduleId: uuid("module_id").notNull().references(() => knowledgeModules.id),
  topicId: uuid("topic_id").notNull().references(() => topics.id),
}, (t) => ({ pk: primaryKey({ columns: [t.moduleId, t.topicId] }) }));
```

### 2.3 提交与隐私

```ts
// ENT-006 Submission — FR-030/FLOW-001/005
submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleId: uuid("module_id").references(() => knowledgeModules.id),
  manifestId: uuid("manifest_id").references(() => manifests.id),
  submitterId: uuid("submitter_id").notNull().references(() => users.id),
  status: text("status").notNull().default("Draft"), // Draft|Submitted|InReview|ChangesRequested|Approved|Published|Rejected
  step: integer("step"),                 // 向导步（前端外壳态，1..5）
  manifestHashAtScan: text("manifest_hash_at_scan"), // gate-stale 检测（ASM-083）
  draftData: jsonb("draft_data"),        // 跨步草稿（脱敏；无原始内容 INV-01）
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ submitterIdx: index("sub_submitter_idx").on(t.submitterId) }));

// ENT-005 PrivacyScan — FR-090/HARD-01；仅脱敏 findings（INV-01）
privacyScans = pgTable("privacy_scans", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id").notNull().references(() => submissions.id),
  overallStatus: text("overall_status").notNull(), // pass|warn|block（取最严重）
  findings: jsonb("findings").notNull(),  // [{ ruleCategory, severity, locationRef, suggestion, explanation }] — 永不含原始命中值
  sensitivityDeclaration: text("sensitivity_declaration"),
  scannerVersion: text("scanner_version"),
  scannedAt: timestamp("scanned_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ subIdx: index("scan_submission_idx").on(t.submissionId) }));
```

### 2.4 交换与联系

```ts
// ENT-007 Exchange — FR-040/FLOW-003/DEC-009
exchanges = pgTable("exchanges", {
  id: uuid("id").primaryKey().defaultRandom(),
  publicRef: text("public_ref").notNull().unique(), // 脱敏号 EX-2024-####（ASM-031）
  requesterId: uuid("requester_id").notNull().references(() => users.id),
  targetModuleId: uuid("target_module_id").notNull().references(() => knowledgeModules.id),
  offeredModuleId: uuid("offered_module_id").references(() => knowledgeModules.id), // 可选（INV-05/DEC-009）
  status: text("status").notNull().default("Requested"),
  deliveryChannel: text("delivery_channel").default("github_private_repo"), // 仅约定标签，无真实 URL（INV-04/ASM-007）
  requesterConfirmedDelivery: boolean("requester_confirmed_delivery").notNull().default(false), // 双方确认（INV-06）
  ownerConfirmedDelivery: boolean("owner_confirmed_delivery").notNull().default(false),
  feedbackWindowClosesAt: timestamp("feedback_window_closes_at", { withTimezone: true }), // ASM-011
  cancelReason: text("cancel_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  requesterIdx: index("ex_requester_idx").on(t.requesterId),
  targetIdx: index("ex_target_idx").on(t.targetModuleId),
  statusIdx: index("ex_status_idx").on(t.status),
}));

// ENT-009 ContactDisclosure — FR-130/DEC-010/ASM-013；接受后披露快照
contactDisclosures = pgTable("contact_disclosures", {
  id: uuid("id").primaryKey().defaultRandom(),
  exchangeId: uuid("exchange_id").notNull().references(() => exchanges.id),
  discloserId: uuid("discloser_id").notNull().references(() => users.id),
  recipientId: uuid("recipient_id").notNull().references(() => users.id),
  snapshot: jsonb("snapshot").notNull(), // [{ type, label, value }] 披露时刻快照（撤回不收回已披露，ASM-013）
  disclosedAt: timestamp("disclosed_at", { withTimezone: true }).notNull().defaultNow(),
  revokedForFuture: boolean("revoked_for_future").notNull().default(false),
}, (t) => ({ exIdx: index("disc_exchange_idx").on(t.exchangeId) }));
```

### 2.5 信任与反馈

```ts
// ENT-010 Feedback — FR-050/FLOW-004
feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  exchangeId: uuid("exchange_id").notNull().references(() => exchanges.id),
  authorId: uuid("author_id").notNull().references(() => users.id),
  scores: jsonb("scores").notNull(),     // { checklistConsistency, privacyBoundary, structureClarity, usefulness, rebuyIntent }
  publicComment: text("public_comment"),
  weight: numeric("weight").notNull().default("1"), // 参与方权重 > 社交信号（INV-10）
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  exAuthorUniq: unique("feedback_ex_author_uniq").on(t.exchangeId, t.authorId), // 每方每次交换一份（NFR-006）
}));

// ENT-011 TrustProfile（派生，物化）— FR-050/FR-060/HARD-03
trustProfiles = pgTable("trust_profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id),
  score: integer("score").notNull().default(0),   // /1000
  level: text("level").notNull().default("new"),  // high|medium|low|new
  breakdown: jsonb("breakdown").notNull(),         // 四类来源 + 解释（HARD-03 可解释）
  trend: jsonb("trend"),                           // [{ period, score }]
  recomputedAt: timestamp("recomputed_at", { withTimezone: true }).notNull().defaultNow(),
});

// ENT-012 Badge — FR-050
badges = pgTable("badges", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  label: text("label").notNull(),
  awardedAt: timestamp("awarded_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ userTypeUniq: unique("badge_user_type_uniq").on(t.userId, t.type) }));
```

### 2.6 社交与治理

```ts
// ENT-013 SocialSignal — FR-070（收藏/认可/评论）
socialSignals = pgTable("social_signals", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").notNull().references(() => users.id),
  kind: text("kind").notNull(),          // favorite|endorse|comment
  targetType: text("target_type").notNull(), // module|user
  targetId: uuid("target_id").notNull(),
  text: text("text"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  // INV-07：每个 (User, Module) 至多一个有效 favorite
  favUniq: unique("favorite_uniq").on(t.actorId, t.kind, t.targetType, t.targetId),
}));

// ENT-014 Report — FR-070/FR-100
reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id").notNull().references(() => users.id),
  targetType: text("target_type").notNull(), // module|user|exchange
  targetId: uuid("target_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), // pending|dismissed|penalized
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ENT-015 ReviewItem — FR-100/FLOW-005
reviewItems = pgTable("review_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: text("kind").notNull(),          // submission|report
  submissionId: uuid("submission_id").references(() => submissions.id),
  reportId: uuid("report_id").references(() => reports.id),
  gate: text("gate"),                    // pass|warn|block（来自 PrivacyScan）
  riskLevel: text("risk_level"),         // none|low|medium|high
  riskSummary: text("risk_summary"),
  status: text("status").notNull().default("pending"), // pending|approved|rejected|changes-requested
  assigneeId: uuid("assignee_id").references(() => users.id), // admin
  resolution: text("resolution"),
  reason: text("reason"),                // 退回/下架/驳回原因
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ statusIdx: index("ri_status_idx").on(t.status) }));

// ENT-016 AgentSkill — FR-080（只读目录）
agentSkills = pgTable("agent_skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  privacyLevel: text("privacy_level").notNull().default("local"), // local|remote
  docsUrl: text("docs_url"),
  supportedSources: text("supported_sources").array(),
  installConfig: jsonb("install_config"), // 占位命令/配置，无私有路径/密钥（INV-01/04）
});
```

### 2.7 系统与轻后端

```ts
// ENT-017 Notification — FR-120/FLOW-006
notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),          // exchange|review|feedback|community
  title: text("title").notNull(),
  body: text("body").notNull(),
  href: text("href"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ userReadIdx: index("notif_user_read_idx").on(t.userId, t.read) }));

// ENT-018 AuditLog — NFR-006/FLOW-005/INV-11
auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => users.id), // 系统动作可空
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  metadata: jsonb("metadata"),           // 无 PII / 无原始内容（INV-01/09）
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ createdIdx: index("audit_created_idx").on(t.createdAt) }));

// ENT-019 UsageStat（聚合物化，无 PII）— FR-140/DEC-011/INV-09
usageStats = pgTable("usage_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  metricKey: text("metric_key").notNull(),  // users_total|modules_total|exchanges_total|privacy_gate_pass_rate|...
  value: numeric("value").notNull(),
  window: text("window"),                    // 口径/时间窗
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ keyTimeIdx: index("usage_key_time_idx").on(t.metricKey, t.capturedAt) }));
// 实时计数走 Upstash Redis（key 如 stat:exchanges_total），周期 cron 物化进本表（INV-09 仅聚合）。

// ENT-021 Consent — NFR-005/FLOW-007/INV-08
consents = pgTable("consents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  actionType: text("action_type").notNull(), // generate|submit|contact|exchange
  scope: text("scope"),
  relatedType: text("related_type"),         // submission|exchange|contact
  relatedId: text("related_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ userActionIdx: index("consent_user_action_idx").on(t.userId, t.actionType) }));
```

> Auth.js（NextAuth v5）会话/账户表（`accounts`/`sessions`/`verification_tokens`）由 Drizzle adapter 生成，与上表共库（`ASM-115`）。

### 2.8 表 → ENT 映射汇总

| 表 | ENT |
|---|---|
| `users` | `ENT-001`（`ENT-002` 作为角色，不建表，`ASM-012`） |
| `contact_info` | `ENT-008` |
| `knowledge_modules` | `ENT-003` |
| `manifests` | `ENT-004` |
| `topics` + `module_topics` | `ENT-020` |
| `submissions` | `ENT-006` |
| `privacy_scans` | `ENT-005` |
| `exchanges` | `ENT-007` |
| `contact_disclosures` | `ENT-009` |
| `feedback` | `ENT-010` |
| `trust_profiles` | `ENT-011`（派生物化） |
| `badges` | `ENT-012` |
| `social_signals` | `ENT-013` |
| `reports` | `ENT-014` |
| `review_items` | `ENT-015` |
| `agent_skills` | `ENT-016` |
| `notifications` | `ENT-017` |
| `audit_log` | `ENT-018` |
| `usage_stats`（+ Upstash 计数） | `ENT-019` |
| `consents` | `ENT-021` |

---

## 3. 鉴权与权限（Auth and permissions）

- **机制**：GitHub OAuth via Auth.js（NextAuth v5），GitHub 为规范身份（`DEC-006`）。会话经加密 cookie；`session.user` 携带 `userId`/`login`/`isAdmin`/`githubVerified`。Drizzle adapter 持久化会话/账户。
- **角色**：匿名（未登录）、`user`（登录）、`admin`（`users.is_admin = true`）。
- **会话降级**：`GET /api/session` 失败返回 `null`，前端降级匿名、不阻断公开浏览（`ASM-019`，对齐 `app/src/lib/queries/session.ts`）。
- **受保护/公开路由矩阵**（对齐 PAGE 权限）：

| 路由类别 | 权限 | 说明 |
|---|---|---|
| 发现/详情/Manifest/台账/信任档案/技能目录/统计/搜索 | 公开读 | 浏览无需登录（`FR-001`）；输出零私有（`INV-04`） |
| `GET /api/session` | 任意 | 返回会话或 `null` |
| 提交向导（草稿/扫描/提交） | `user` | 写需登录 + Consent（`INV-08`） |
| 请求交换/接受/拒绝/披露/撤回/标记交付 | `user` + 参与方角色校验 | 仅当事人；披露仅 `Accepted+`（`INV-03`） |
| 提交反馈 | `user` + `WaitingForFeedback` 参与方 | 二次校验资格（`NFR-006`） |
| 社交信号/举报 | `user` | 唯一性 + 限流（`NFR-006`/`INV-07`） |
| 账户/通知/设置·联系方式/同意记录 | `user`（仅本人 `me`） | 联系方式默认私密（`INV-03`） |
| `/api/admin/**`（队列/详情/摘要/审计/处置/批量） | `admin` | 非管理员 `403` |

- **认证写 API（`FR-110`）**：首版与站内同套会话；外部 agent 用 GitHub token/会话调用（`ASM-118`：签名 agent 身份为扩展面，不阻塞）。

---

## 4. 业务规则（服务端强制的不变量）

后端是不变量的**权威边界**（前端校验仅为 UX/纵深防御）。

| INV | 服务端强制点 | 实现 |
|---|---|---|
| `INV-01` | 不存原始内容 | schema 无原始内容列；隐私门只收脱敏 findings；提交 `draftData` 仅脱敏（`HARD-01`/`HARD-07`） |
| `INV-02` | `block` 不可发布/通过 | 提交端 & `/api/admin/moderate` 校验：含 `block` 拒绝 `approve`（`409`） |
| `INV-03` | 联系方式仅 `Accepted+` 披露 | `contact_info` 默认 `private`；披露端校验交换状态 ≥ `Accepted` 且调用者为参与方，写 `contact_disclosures` 快照 |
| `INV-04` | 公开输出零私有 | 所有公开端点经统一**公开投影序列化器**（白名单字段），剥离 contact/原始内容/私有 URL；契约测试覆盖 |
| `INV-05` | `offeredModule` 可空 | schema 可空；创建交换不强制提供模块 |
| `INV-06` | `Delivered→Completed` 双方确认 | 状态机：仅当 `requesterConfirmedDelivery && ownerConfirmedDelivery` 才迁移 `Completed` |
| `INV-07` | 每 (User,Module) 至多一 favorite | `social_signals` 唯一约束 |
| `INV-08` | 跨边界动作前必有 Consent | 提交/披露/联系/交换前写 `consents`；缺失 `422` |
| `INV-09` | UsageStat 无 PII | `usage_stats` 仅聚合标量；Upstash 计数无个体键 |
| `INV-10` | 参与方反馈权重 > 社交信号 | 信任重算用 `feedback.weight` > 社交信号系数（`HARD-03`） |
| `INV-11` | 关键动作写 Audit | 提交/审核/举报/处罚/状态变更/同意均 insert `audit_log` |

- **交换状态机服务端校验合法迁移**（`HARD-02`/`RISK-003`）：见 `MODULE_WORKFLOW_SPEC.md` §交换生命周期；非法迁移返回 `409`。
- **无任何经济字段**（`DEC-007`）：schema 中无 price/fee/commission/payment 列；任何端点不接受/返回经济字段。
- **互惠可选**（`DEC-009`/`INV-05`）：单向请求合法。

---

## 5. 集成（Integrations）

| 集成 | 用途 | 说明 |
|---|---|---|
| Neon PostgreSQL | 主持久化 | serverless Postgres；连接走 `@neondatabase/serverless` + Drizzle（`DEC-017`） |
| Upstash Redis | 聚合计数 + 限流 | `FR-140` 实时计数（周期物化）、`NFR-006` 限流令牌桶；无 PII（`INV-09`） |
| Resend | 邮件 | 站内通知优先（`ASM-048`），邮件通道按需启用（`FR-120` 邮件/webhook 延后） |
| GitHub OAuth (Auth.js v5) | 鉴权/规范身份 | `DEC-006`；`GitHub Verified` 信任骨干 |
| GitHub 私有仓库（外部引用） | 私下交付通道 | 平台只引用状态、不持有内容（`ASM-007`/`INV-01`） |

---

## 6. 运维（Operational concerns）

- **环境变量**：`DATABASE_URL`(Neon)、`UPSTASH_REDIS_REST_URL`/`_TOKEN`、`RESEND_API_KEY`、`AUTH_GITHUB_ID`/`_SECRET`、`AUTH_SECRET`、`NEXTAUTH_URL`。
- **迁移**：drizzle-kit（`drizzle-kit generate` + `migrate`；本地可 `db:push`，`DEC-017`）。
- **限流**（`NFR-006`）：Upstash 令牌桶，按 `userId`/IP 维度，覆盖写操作（提交/交换/反馈/举报/社交）与公开 API（`FR-110`）。
- **日志/审计**：业务审计走 `audit_log`（`INV-11`）；运行日志走 Vercel 平台日志（无 PII/无原始内容，`INV-01`/`INV-09`）。
- **Region**：部署 Region 选 **新加坡（sin1）**（贴近主用户）；Neon/Upstash 选就近 region 降延迟（`ASM-116`）。
- **周期任务（cron）**：信任分重算、Upstash→`usage_stats` 物化、交换 `Expired`/反馈窗口关闭扫描（`ASM-011`/`ASM-117`：Vercel Cron）。

---

## 7. 测试策略（Testing strategy）

- **框架**：Vitest（与前端同栈）。**红绿（TDD）**：先写失败契约/不变量测试，再实现（对齐项目 `tdd` 规约）。
- **单元**：状态机迁移合法性、信任重算权重（`INV-10`）、隐私门分级、披露门控。
- **契约测试**：每个端点请求/响应 schema（zod）与**前端 query hooks/MSW 实际形状一致**（`SERVICE_CONTRACT.md`）。
- **集成**：跨表事务（披露写快照+Consent+Audit 原子）、提交→评审→发布链路、交换全生命周期。
- **不变量测试**（关键，见 `SERVICE_CONTRACT.md` TEST-*）：公开输出零私有（`INV-04`）、`block` 不可发布（`INV-02`）、披露门（`INV-03`）、Consent 缺失拒绝（`INV-08`）、统计无 PII（`INV-09`）。

---

## 8. 范围外（Out of scope）— 仅 3 条产品边界

1. **不托管原始知识库**：schema 无原始内容列；后端只存清单与公开关系（`NFR-001`/`FR-090`/`INV-01`）。
2. **无经济模型**：无任何付费/计费/佣金/交易字段或端点（`DEC-007`）。
3. **不自动越过人类同意**：无自动联系/自动建仓/自动 PR；同意是显式 Consent 记录（`NFR-005`/`INV-08`）。
