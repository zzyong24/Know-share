/*
  Drizzle schema —— 覆盖 ENT-001~021（BACKEND_SPEC §2）。
  守则在 schema 层兑现：
  - 原始知识内容**无对应列**（INV-01）；
  - contact_info 独立表且默认私密（INV-03）；
  - 披露写快照表（ENT-009）；审计独立表（ENT-018）；
  - 聚合统计仅标量、无 PII（INV-09）；
  - 无任何经济字段 price/fee/commission/payment（DEC-007）。
  列名 snake_case（数据库列）+ camelCase（TS 字段）（ASM-112）。
*/
import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  jsonb,
  index,
  unique,
  primaryKey,
} from "drizzle-orm/pg-core";

// ── ENT-001 User（人类所有者/账户）— FR-001/FR-060/DEC-006 ──
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    githubId: text("github_id").notNull().unique(), // GitHub 规范身份（DEC-006）
    login: text("login").notNull().unique(), // GitHub handle
    displayName: text("display_name").notNull(),
    avatarUrl: text("avatar_url").notNull(),
    githubVerified: boolean("github_verified").notNull().default(false),
    isAdmin: boolean("is_admin").notNull().default(false),
    bio: text("bio"),
    domains: text("domains").array().notNull().default([]),
    restrictionState: text("restriction_state").notNull().default("normal"), // normal|flagged
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("users_login_idx").on(t.login)]
);
// trustScore/level/badges 为派生（ENT-011/012），见 trust_profiles 物化表。

// ── ENT-008 ContactInfo（联系方式）— FR-130/DEC-010；独立表，默认私密（INV-03）──
export const contactInfo = pgTable(
  "contact_info",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    type: text("type").notNull(), // github|email|im|custom
    value: text("value").notNull(), // 真实值（PII；仅服务端，永不进公开投影）
    label: text("label"),
    visibility: text("visibility").notNull().default("private"), // private(默认)|public（INV-03）
    revokedAt: timestamp("revoked_at", { withTimezone: true }), // 撤回只影响未来（ASM-013）
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("contact_info_user_idx").on(t.userId)]
);

// ── ENT-003 KnowledgeModule — FR-010/FR-020 ──
export const knowledgeModules = pgTable(
  "knowledge_modules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""), // 脱敏摘要（卡片用，非原始内容）
    type: text("type"), // 模块类型
    status: text("status").notNull().default("Draft"), // Draft|Published|Updated|Delisted
    freshness: text("freshness"), // 新鲜度相对文本（展示）
    publishedAt: timestamp("published_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("km_owner_idx").on(t.ownerId),
    index("km_status_idx").on(t.status),
  ]
);
// 派生（不存列）：trustLevel、exchangeCount、favoriteCount — 由事件/物化派生。

// ── ENT-004 Manifest — FR-020/FR-090；脱敏公开摘要，无原始内容（INV-01）──
export const manifests = pgTable(
  "manifests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => knowledgeModules.id),
    summary: text("summary").notNull(),
    topics: text("topics").array().notNull().default([]),
    freshness: text("freshness"),
    sourceStats: jsonb("source_stats").notNull(), // { notes, links, files, words } — 计数，非内容
    contentCommitment: text("content_commitment"),
    privacyBoundary: text("privacy_boundary"),
    sensitivity: text("sensitivity"),
    coveredQuestions: text("covered_questions").array(),
    sourceTypes: text("source_types").array().notNull().default([]),
    version: text("version").notNull(),
    isCurrent: boolean("is_current").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("manifest_module_idx").on(t.moduleId)]
);

// ── ENT-020 Topic/Tag — FR-010 ──
export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull().unique(),
});

export const moduleTopics = pgTable(
  "module_topics",
  {
    moduleId: uuid("module_id")
      .notNull()
      .references(() => knowledgeModules.id),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id),
  },
  (t) => [primaryKey({ columns: [t.moduleId, t.topicId] })]
);

// ── ENT-006 Submission — FR-030/FLOW-001/005 ──
export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    moduleId: uuid("module_id").references(() => knowledgeModules.id),
    manifestId: uuid("manifest_id").references(() => manifests.id),
    submitterId: uuid("submitter_id")
      .notNull()
      .references(() => users.id),
    status: text("status").notNull().default("Draft"), // Draft|Submitted|InReview|ChangesRequested|Approved|Published|Rejected
    step: integer("step"),
    manifestHashAtScan: text("manifest_hash_at_scan"),
    draftData: jsonb("draft_data"), // 跨步草稿（脱敏；无原始内容 INV-01）
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("sub_submitter_idx").on(t.submitterId)]
);

// ── ENT-005 PrivacyScan — FR-090/HARD-01；仅脱敏 findings（INV-01）──
export const privacyScans = pgTable(
  "privacy_scans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id),
    overallStatus: text("overall_status").notNull(), // pass|warn|block
    findings: jsonb("findings").notNull(), // 永不含原始命中值（INV-01）
    sensitivityDeclaration: text("sensitivity_declaration"),
    scannerVersion: text("scanner_version"),
    scannedAt: timestamp("scanned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("scan_submission_idx").on(t.submissionId)]
);

// ── ENT-007 Exchange — FR-040/FLOW-003/DEC-009 ──
export const exchanges = pgTable(
  "exchanges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicRef: text("public_ref").notNull().unique(), // 脱敏号 EX-2024-####
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => users.id),
    targetModuleId: uuid("target_module_id")
      .notNull()
      .references(() => knowledgeModules.id),
    offeredModuleId: uuid("offered_module_id").references(
      () => knowledgeModules.id
    ), // 可选（INV-05/DEC-009）
    status: text("status").notNull().default("Requested"),
    deliveryChannel: text("delivery_channel").default("github_private_repo"), // 仅标签，无真实 URL（INV-04）
    requesterConfirmedDelivery: boolean("requester_confirmed_delivery")
      .notNull()
      .default(false),
    ownerConfirmedDelivery: boolean("owner_confirmed_delivery")
      .notNull()
      .default(false),
    feedbackWindowClosesAt: timestamp("feedback_window_closes_at", {
      withTimezone: true,
    }),
    cancelReason: text("cancel_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("ex_requester_idx").on(t.requesterId),
    index("ex_target_idx").on(t.targetModuleId),
    index("ex_status_idx").on(t.status),
  ]
);

// ── ENT-009 ContactDisclosure — FR-130/DEC-010/ASM-013；接受后披露快照 ──
export const contactDisclosures = pgTable(
  "contact_disclosures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    exchangeId: uuid("exchange_id")
      .notNull()
      .references(() => exchanges.id),
    discloserId: uuid("discloser_id")
      .notNull()
      .references(() => users.id),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => users.id),
    snapshot: jsonb("snapshot").notNull(), // [{ type, label, value }] 披露时刻快照
    disclosedAt: timestamp("disclosed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedForFuture: boolean("revoked_for_future").notNull().default(false),
  },
  (t) => [index("disc_exchange_idx").on(t.exchangeId)]
);

// ── ENT-010 Feedback — FR-050/FLOW-004 ──
export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    exchangeId: uuid("exchange_id")
      .notNull()
      .references(() => exchanges.id),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),
    scores: jsonb("scores").notNull(), // 五维
    publicComment: text("public_comment"),
    weight: numeric("weight").notNull().default("1"), // 参与方权重 > 社交信号（INV-10）
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("feedback_ex_author_uniq").on(t.exchangeId, t.authorId)] // 每方每次交换一份（NFR-006）
);

// ── ENT-011 TrustProfile（派生，物化）— FR-050/FR-060/HARD-03 ──
export const trustProfiles = pgTable("trust_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id),
  score: integer("score").notNull().default(0), // /1000
  level: text("level").notNull().default("new"), // high|medium|low|new
  breakdown: jsonb("breakdown").notNull(), // 四类来源 + 解释（HARD-03）
  trend: jsonb("trend"),
  recomputedAt: timestamp("recomputed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── ENT-012 Badge — FR-050 ──
export const badges = pgTable(
  "badges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    type: text("type").notNull(),
    label: text("label").notNull(),
    awardedAt: timestamp("awarded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("badge_user_type_uniq").on(t.userId, t.type)]
);

// ── ENT-013 SocialSignal — FR-070（收藏/认可/评论）──
export const socialSignals = pgTable(
  "social_signals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id),
    kind: text("kind").notNull(), // favorite|endorse|comment
    targetType: text("target_type").notNull(), // module|user
    targetId: uuid("target_id").notNull(),
    text: text("text"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  // INV-07：每 (User, Module) 至多一个有效 favorite
  (t) => [unique("favorite_uniq").on(t.actorId, t.kind, t.targetType, t.targetId)]
);

// ── ENT-014 Report — FR-070/FR-100 ──
export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id")
    .notNull()
    .references(() => users.id),
  targetType: text("target_type").notNull(), // module|user|exchange
  targetId: uuid("target_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), // pending|dismissed|penalized
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── ENT-015 ReviewItem — FR-100/FLOW-005 ──
export const reviewItems = pgTable(
  "review_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(), // submission|report
    submissionId: uuid("submission_id").references(() => submissions.id),
    reportId: uuid("report_id").references(() => reports.id),
    gate: text("gate"), // pass|warn|block
    riskLevel: text("risk_level"), // none|low|medium|high
    riskSummary: text("risk_summary"),
    status: text("status").notNull().default("pending"), // pending|approved|rejected|changes-requested
    assigneeId: uuid("assignee_id").references(() => users.id),
    resolution: text("resolution"),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("ri_status_idx").on(t.status)]
);

// ── ENT-016 AgentSkill — FR-080（只读目录）──
export const agentSkills = pgTable("agent_skills", {
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

// ── ENT-017 Notification — FR-120/FLOW-006 ──
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    type: text("type").notNull(), // exchange|review|feedback|community
    title: text("title").notNull(),
    body: text("body").notNull(),
    href: text("href"),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("notif_user_read_idx").on(t.userId, t.read)]
);

// ── ENT-018 AuditLog — NFR-006/FLOW-005/INV-11 ──
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id), // 系统动作可空
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    metadata: jsonb("metadata"), // 无 PII / 无原始内容（INV-01/09）
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)]
);

// ── ENT-019 UsageStat（聚合物化，无 PII）— FR-140/DEC-011/INV-09 ──
export const usageStats = pgTable(
  "usage_stats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    metricKey: text("metric_key").notNull(),
    value: numeric("value").notNull(),
    window: text("window"),
    capturedAt: timestamp("captured_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("usage_key_time_idx").on(t.metricKey, t.capturedAt)]
);

// ── ENT-021 Consent — NFR-005/FLOW-007/INV-08 ──
export const consents = pgTable(
  "consents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    actionType: text("action_type").notNull(), // generate|submit|contact|exchange
    scope: text("scope"),
    relatedType: text("related_type"), // submission|exchange|contact
    relatedId: text("related_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("consent_user_action_idx").on(t.userId, t.actionType)]
);

/** 全部表（供 harness pushSchema 建表用）。 */
export const allTables = {
  users,
  contactInfo,
  knowledgeModules,
  manifests,
  topics,
  moduleTopics,
  submissions,
  privacyScans,
  exchanges,
  contactDisclosures,
  feedback,
  trustProfiles,
  badges,
  socialSignals,
  reports,
  reviewItems,
  agentSkills,
  notifications,
  auditLog,
  usageStats,
  consents,
};
