/*
  信任反馈域服务层（trust-profiles / trust-network / feedback）。
  W-3 工作流：反馈 → 信任重算（同步实现，最终一致亦可 ASM-119）。
  守则：
  - 信任分由「交换历史 / 反馈质量 / GitHub 验证 / 举报」四来源派生，可解释（HARD-03）。
  - INV-10：交换参与方反馈权重 > 社交信号（每单位反馈对分值的贡献严格大于每单位社交信号）。
  - 满分基准 1000（ASM-037）。
  - INV-04：公开档案/网络零私有（不读取/不输出 contact / 原始内容 / 私有 URL）。
  - INV-11：反馈写入伴随 audit 记录。
  - DEC-007：无付费排名（无任何 price/fee/payment/sponsored 字段）。
  路由处理器只做 HTTP 编解码，业务在本层（便于契约/不变量测试直接调本层与 handler）。
*/
import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { getRedis } from "@/server/redis";
import { assertNoForbidden } from "@/server/projection";
import type { Session } from "@/lib/types";
import type {
  TrustProfileAggregate,
  TrustDimension,
  TrustSourceKey,
  TrustNetworkResponse,
  NetworkContributor,
  NetworkFilters,
  FeedbackDimensionAverage,
  BadgeEntry,
} from "@/lib/queries/trust-feedback";
import type { TrustLevel } from "@/lib/types";

// ── 评分常量（HARD-03 可解释来源 + INV-10 权重序）──────────────
export const MAX_SCORE = 1000; // ASM-037 满分基准

/** 各来源对总分的派生贡献系数（可解释；INV-10：反馈每单位 > 社交信号每单位）。 */
const WEIGHTS = {
  /** GitHub 验证：固定加成。 */
  github: 150,
  /** 每笔已完成/进入反馈期的交换。 */
  exchangePerExchange: 60,
  /**
    参与方反馈：每条反馈按其 5 维均值（0..5）× 该系数 × feedback.weight。
    参与方 weight 默认 1（schema 默认），社交信号每单位贡献固定 socialPerSignal。
    设计保证：满分反馈（均值 5）单条贡献 = 5 × 14 = 70 ＞ 社交信号单条 12（INV-10/TEST-009）。
  */
  feedbackPerAvgPoint: 14,
  /** 社交信号（收藏/认可/评论）每单位贡献——严格小于一条满分参与方反馈。 */
  socialPerSignal: 12,
  /** 举报惩罚：每条 penalized/pending 举报扣减。 */
  reportPenalty: 80,
} as const;

const TRUST_RANK: Record<TrustLevel, number> = {
  high: 3,
  medium: 2,
  low: 1,
  new: 0,
};

/** 计入信任的交换状态（达成交付/反馈期/已闭环）。 */
const COUNTED_EXCHANGE = new Set(["Completed", "WaitingForFeedback", "Closed"]);

/** 分值 → 级别（单一来源，computeTrust 与网络索引共用）。 */
function scoreToLevel(score: number): TrustLevel {
  return score >= 700
    ? "high"
    : score >= 400
      ? "medium"
      : score >= 150
        ? "low"
        : "new";
}

const FEEDBACK_DIMENSIONS: { key: string; label: string }[] = [
  { key: "usefulness", label: "有用性" },
  { key: "clarity", label: "清晰度" },
  { key: "accuracy", label: "准确性" },
  { key: "responsiveness", label: "响应度" },
  { key: "reciprocity", label: "互惠度" },
];

// ── 信任分计算（核心，HARD-03 可解释）────────────────────────

export interface TrustComputation {
  score: number;
  level: TrustLevel;
  dimensions: TrustDimension[];
  /** 四来源原始贡献（用于趋势/调试）。 */
  contributions: Record<TrustSourceKey, number>;
  feedbackCount: number;
  exchangeCount: number;
  socialCount: number;
}

interface FeedbackRow {
  scores: unknown;
  weight: string | number;
}

/** 5 维分数对象 → 均值（0..5），非法→0。 */
function avgOfScores(scores: unknown): number {
  if (!scores || typeof scores !== "object") return 0;
  const vals = Object.values(scores as Record<string, unknown>)
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/**
  计算某用户的信任分及四来源拆解（HARD-03）。
  - exchange：作为「被请求方（模块 owner）」或请求方参与的已完成/反馈期交换数。
  - feedback：他人对其参与交换给出的参与方反馈（按 weight 与均值加权；INV-10）。
  - github：是否 GitHub 验证。
  - report：针对该用户/其模块的有效举报惩罚。
*/
export async function computeTrust(userId: string): Promise<TrustComputation> {
  const db = await getDb();

  const [user] = await db
    .select({
      id: schema.users.id,
      githubVerified: schema.users.githubVerified,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  // 该用户拥有的模块 id。
  const ownedModules = await db
    .select({ id: schema.knowledgeModules.id })
    .from(schema.knowledgeModules)
    .where(eq(schema.knowledgeModules.ownerId, userId));
  const ownedModuleIds = ownedModules.map((m) => m.id);

  // 与该用户相关的交换：作为请求方 OR 作为其模块的被请求方。
  const asRequester = await db
    .select({
      id: schema.exchanges.id,
      requesterId: schema.exchanges.requesterId,
      targetModuleId: schema.exchanges.targetModuleId,
      status: schema.exchanges.status,
    })
    .from(schema.exchanges)
    .where(eq(schema.exchanges.requesterId, userId));

  const asOwner =
    ownedModuleIds.length > 0
      ? await db
          .select({
            id: schema.exchanges.id,
            requesterId: schema.exchanges.requesterId,
            targetModuleId: schema.exchanges.targetModuleId,
            status: schema.exchanges.status,
          })
          .from(schema.exchanges)
          .where(inArray(schema.exchanges.targetModuleId, ownedModuleIds))
      : [];

  const relevantExchanges = [...asRequester, ...asOwner];
  const countedExchanges = relevantExchanges.filter((e) =>
    COUNTED_EXCHANGE.has(e.status)
  );
  const exchangeCount = countedExchanges.length;
  const relevantExchangeIds = relevantExchanges.map((e) => e.id);

  // 他人对该用户参与交换的反馈（authorId !== userId，即「评价此用户」）。
  let feedbackRows: FeedbackRow[] = [];
  if (relevantExchangeIds.length > 0) {
    const rows = await db
      .select({
        scores: schema.feedback.scores,
        weight: schema.feedback.weight,
        authorId: schema.feedback.authorId,
        exchangeId: schema.feedback.exchangeId,
      })
      .from(schema.feedback)
      .where(inArray(schema.feedback.exchangeId, relevantExchangeIds));
    feedbackRows = rows
      .filter((r) => r.authorId !== userId)
      .map((r) => ({ scores: r.scores, weight: r.weight }));
  }

  // 社交信号：指向该用户或其模块（INV-10：权重低于反馈）。
  const socialTargetIds = [userId, ...ownedModuleIds];
  const socialRows = await db
    .select({ id: schema.socialSignals.id })
    .from(schema.socialSignals)
    .where(inArray(schema.socialSignals.targetId, socialTargetIds));
  const socialCount = socialRows.length;

  // 针对该用户/其模块的有效举报。
  const reportRows = await db
    .select({ status: schema.reports.status })
    .from(schema.reports)
    .where(inArray(schema.reports.targetId, socialTargetIds));
  const activeReports = reportRows.filter(
    (r) => r.status === "pending" || r.status === "penalized"
  ).length;

  // ── 四来源贡献 ──
  const githubContribution = user?.githubVerified ? WEIGHTS.github : 0;
  const exchangeContribution = exchangeCount * WEIGHTS.exchangePerExchange;
  const feedbackContribution = feedbackRows.reduce((sum, fb) => {
    const avg = avgOfScores(fb.scores);
    const w = Number(fb.weight) || 1;
    return sum + avg * WEIGHTS.feedbackPerAvgPoint * w;
  }, 0);
  const socialContribution = socialCount * WEIGHTS.socialPerSignal;
  const reportContribution = -(activeReports * WEIGHTS.reportPenalty);

  const rawScore =
    githubContribution +
    exchangeContribution +
    feedbackContribution +
    socialContribution +
    reportContribution;
  const score = Math.max(0, Math.min(MAX_SCORE, Math.round(rawScore)));
  const level = scoreToLevel(score);

  // ── 可解释拆解（HARD-03，四类来源必含）──
  const dimensions: TrustDimension[] = [
    {
      key: "exchange",
      label: "交换历史",
      direction: exchangeCount > 0 ? "up" : "neutral",
      valueOrShare: `+${Math.round(exchangeContribution)}`,
      explanation:
        exchangeCount > 0
          ? `完成 ${exchangeCount} 笔知识交换，是信任分的稳定基底。`
          : "暂无已完成交换；完成交换后信任分将稳步累积。",
    },
    {
      key: "feedback",
      label: "参与方反馈质量",
      direction: feedbackContribution > 0 ? "up" : "neutral",
      valueOrShare: `+${Math.round(feedbackContribution)}`,
      explanation:
        feedbackContribution > 0
          ? `来自交换参与方的结构化反馈，权重高于收藏/认可等社交信号（INV-10），是信任分的主要驱动。`
          : "尚未收到交换参与方反馈；参与方反馈对信任分的影响最大（INV-10）。",
    },
    {
      key: "github",
      label: "GitHub 验证",
      direction: githubContribution > 0 ? "up" : "neutral",
      valueOrShare: `+${Math.round(githubContribution)}`,
      explanation: user?.githubVerified
        ? "已通过 GitHub 规范身份验证，提供身份可信背书。"
        : "尚未完成 GitHub 验证；完成后可获得身份背书加成。",
    },
    {
      key: "report",
      label: "举报与申诉",
      direction: activeReports > 0 ? "down" : "neutral",
      valueOrShare: `${Math.round(reportContribution)}`,
      explanation:
        activeReports > 0
          ? `存在 ${activeReports} 条待处理/已判定举报，对信任分形成扣减。`
          : "无有效举报记录。",
    },
  ];

  return {
    score,
    level,
    dimensions,
    contributions: {
      exchange: Math.round(exchangeContribution),
      feedback: Math.round(feedbackContribution),
      github: Math.round(githubContribution),
      report: Math.round(reportContribution),
      badge: 0,
    },
    feedbackCount: feedbackRows.length,
    exchangeCount,
    socialCount,
  };
}

/**
  重算并物化用户 trust_profiles（W-3）。返回新计算结果。
  同步实现（ASM-119 允许异步/最终一致，本期同步亦可）。
*/
export async function recomputeTrust(
  userId: string
): Promise<TrustComputation> {
  const db = await getDb();
  const comp = await computeTrust(userId);

  const existing = (
    await db
      .select({ userId: schema.trustProfiles.userId, trend: schema.trustProfiles.trend })
      .from(schema.trustProfiles)
      .where(eq(schema.trustProfiles.userId, userId))
      .limit(1)
  )[0];

  const period = new Date().toISOString().slice(0, 7); // YYYY-MM
  const prevTrend = Array.isArray(existing?.trend)
    ? (existing!.trend as { period: string; score: number }[])
    : [];
  const trend = [
    ...prevTrend.filter((t) => t.period !== period),
    { period, score: comp.score },
  ].slice(-12);

  const breakdown = {
    contributions: comp.contributions,
    dimensions: comp.dimensions,
    explanationAvailable: true,
  };

  if (existing) {
    await db
      .update(schema.trustProfiles)
      .set({
        score: comp.score,
        level: comp.level,
        breakdown,
        trend,
        recomputedAt: new Date(),
      })
      .where(eq(schema.trustProfiles.userId, userId));
  } else {
    await db.insert(schema.trustProfiles).values({
      userId,
      score: comp.score,
      level: comp.level,
      breakdown,
      trend,
    });
  }
  return comp;
}

// ── API-023 信任档案聚合 ─────────────────────────────────────

export async function getTrustProfileByLogin(
  login: string,
  viewerLogin?: string | null
): Promise<TrustProfileAggregate | null> {
  const db = await getDb();
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.login, login))
    .limit(1);
  if (!user) return null;

  // 重算并物化（确保档案与最新事件一致）。
  const comp = await recomputeTrust(user.id);

  // 已发布模块（公开投影需要的最小字段，零私有）。
  const ownedModules = await db
    .select({ id: schema.knowledgeModules.id })
    .from(schema.knowledgeModules)
    .where(eq(schema.knowledgeModules.ownerId, user.id));
  const ownedModuleIds = ownedModules.map((m) => m.id);

  // 反馈五维均值（基于他人对其参与交换的反馈）。
  const relevantExchanges =
    ownedModuleIds.length > 0
      ? await db
          .select({ id: schema.exchanges.id })
          .from(schema.exchanges)
          .where(inArray(schema.exchanges.targetModuleId, ownedModuleIds))
      : [];
  const exchangeIds = relevantExchanges.map((e) => e.id);

  const feedbackAverages = await computeFeedbackAverages(exchangeIds, user.id);

  // 徽章。
  const badgeRows = await db
    .select()
    .from(schema.badges)
    .where(eq(schema.badges.userId, user.id));
  const badges: BadgeEntry[] = badgeRows.map((b) => ({
    type: b.type,
    name: b.label,
    iconName: "verified_user",
    criteria: b.label,
  }));

  const trendRows = (
    await db
      .select({ trend: schema.trustProfiles.trend })
      .from(schema.trustProfiles)
      .where(eq(schema.trustProfiles.userId, user.id))
      .limit(1)
  )[0]?.trend;
  const trend = Array.isArray(trendRows)
    ? (trendRows as { period: string; score: number }[])
    : [{ period: new Date().toISOString().slice(0, 7), score: comp.score }];

  const aggregate: TrustProfileAggregate = {
    login: user.login,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    verified: user.githubVerified,
    bio: user.bio ?? undefined,
    topics: user.domains ?? [],
    joinedDate: new Date(user.joinedAt).toISOString().slice(0, 10),
    githubUrl: `https://github.com/${user.login}`,
    isSelf: viewerLogin === user.login,
    restrictionState:
      user.restrictionState === "flagged" ? "flagged" : "normal",
    score: comp.score,
    maxScore: MAX_SCORE,
    level: comp.level,
    tierLabel: TIER_LABEL[comp.level],
    explanationAvailable: true,
    dimensions: comp.dimensions,
    trendAttribution:
      comp.feedbackCount > 0
        ? "本期信任分变化主要来自交换参与方反馈（权重高于社交信号，INV-10）。"
        : undefined,
    trend,
    stats: [
      {
        key: "score",
        label: "信任分",
        value: comp.score,
        icon: "shield",
      },
      {
        key: "exchanges",
        label: "完成交换",
        value: comp.exchangeCount,
        icon: "swap_horiz",
      },
      {
        key: "feedback",
        label: "收到反馈",
        value: comp.feedbackCount,
        icon: "rate_review",
      },
    ],
    publishedModules: [],
    exchangeHistory: [],
    badges,
    feedbackAverages,
    recentFeedback: [],
    social: { endorsers: [], followerCount: comp.socialCount },
  };

  return assertNoForbidden(aggregate, "trust-profile");
}

async function computeFeedbackAverages(
  exchangeIds: string[],
  subjectUserId: string
): Promise<FeedbackDimensionAverage[]> {
  const db = await getDb();
  const rows =
    exchangeIds.length > 0
      ? await db
          .select({
            scores: schema.feedback.scores,
            authorId: schema.feedback.authorId,
          })
          .from(schema.feedback)
          .where(inArray(schema.feedback.exchangeId, exchangeIds))
      : [];
  const incoming = rows.filter((r) => r.authorId !== subjectUserId);

  return FEEDBACK_DIMENSIONS.map((dim) => {
    const vals = incoming
      .map((r) => Number((r.scores as Record<string, unknown>)?.[dim.key]))
      .filter((n) => Number.isFinite(n));
    const score =
      vals.length > 0
        ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
        : 0;
    return { key: dim.key, label: dim.label, score, max: 5 };
  });
}

const TIER_LABEL: Record<TrustLevel, string> = {
  high: "资深贡献者 / Trusted",
  medium: "活跃贡献者",
  low: "新晋贡献者",
  new: "新用户",
};

// ── 信任网络索引（DEC-007 非付费）────────────────────────────

export function parseNetworkFilters(sp: URLSearchParams): NetworkFilters {
  return {
    topic: sp.get("topic") ?? undefined,
    minTier: (sp.get("minTier") as TrustLevel) ?? undefined,
    verifiedOnly: sp.get("verifiedOnly") === "true",
    q: (sp.get("q") ?? "").trim() || undefined,
    empty: sp.get("empty") === "true",
  };
}

export async function getTrustNetwork(
  filters: NetworkFilters
): Promise<TrustNetworkResponse> {
  if (filters.empty) {
    return { overview: [], contributors: [], featured: [], total: 0 };
  }
  const db = await getDb();

  // 批量加载（避免每用户 N+1 与写放大）：网络索引为只读派生，不物化 profile。
  const [users, modules, exchanges, feedbacks, socials, reportsAll] =
    await Promise.all([
      db.select().from(schema.users),
      db
        .select({
          id: schema.knowledgeModules.id,
          ownerId: schema.knowledgeModules.ownerId,
        })
        .from(schema.knowledgeModules),
      db
        .select({
          id: schema.exchanges.id,
          requesterId: schema.exchanges.requesterId,
          targetModuleId: schema.exchanges.targetModuleId,
          status: schema.exchanges.status,
        })
        .from(schema.exchanges),
      db
        .select({
          exchangeId: schema.feedback.exchangeId,
          authorId: schema.feedback.authorId,
          scores: schema.feedback.scores,
          weight: schema.feedback.weight,
        })
        .from(schema.feedback),
      db
        .select({ targetId: schema.socialSignals.targetId })
        .from(schema.socialSignals),
      db
        .select({
          targetId: schema.reports.targetId,
          status: schema.reports.status,
        })
        .from(schema.reports),
    ]);

  const modulesByOwner = new Map<string, string[]>();
  for (const m of modules) {
    const list = modulesByOwner.get(m.ownerId) ?? [];
    list.push(m.id);
    modulesByOwner.set(m.ownerId, list);
  }
  const contributors: NetworkContributor[] = users.map((u) => {
    const ownedIds = modulesByOwner.get(u.id) ?? [];
    const relevant = exchanges.filter(
      (e) => e.requesterId === u.id || ownedIds.includes(e.targetModuleId)
    );
    const counted = relevant.filter((e) =>
      COUNTED_EXCHANGE.has(e.status)
    );
    const relevantIds = new Set(relevant.map((e) => e.id));

    const incomingFeedback = feedbacks.filter(
      (f) => relevantIds.has(f.exchangeId) && f.authorId !== u.id
    );
    const feedbackContribution = incomingFeedback.reduce((sum, f) => {
      const avg = avgOfScores(f.scores);
      const w = Number(f.weight) || 1;
      return sum + avg * WEIGHTS.feedbackPerAvgPoint * w;
    }, 0);

    const socialTargets = new Set([u.id, ...ownedIds]);
    const socialCount = socials.filter((s) =>
      socialTargets.has(s.targetId)
    ).length;
    const activeReports = reportsAll.filter(
      (r) =>
        socialTargets.has(r.targetId) &&
        (r.status === "pending" || r.status === "penalized")
    ).length;

    const raw =
      (u.githubVerified ? WEIGHTS.github : 0) +
      counted.length * WEIGHTS.exchangePerExchange +
      feedbackContribution +
      socialCount * WEIGHTS.socialPerSignal -
      activeReports * WEIGHTS.reportPenalty;
    const score = Math.max(0, Math.min(MAX_SCORE, Math.round(raw)));
    const level = scoreToLevel(score);

    return {
      login: u.login,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      verified: u.githubVerified,
      level,
      tierLabel: TIER_LABEL[level],
      score,
      maxScore: MAX_SCORE,
      topics: u.domains ?? [],
      moduleCount: ownedIds.length,
      exchangeCount: counted.length,
    };
  });

  let filtered = contributors;
  if (filters.verifiedOnly) filtered = filtered.filter((c) => c.verified);
  if (filters.topic)
    filtered = filtered.filter((c) => c.topics.includes(filters.topic!));
  if (filters.minTier)
    filtered = filtered.filter(
      (c) => TRUST_RANK[c.level] >= TRUST_RANK[filters.minTier as TrustLevel]
    );
  if (filters.q) {
    const q = filters.q.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.login.toLowerCase().includes(q) ||
        c.displayName.toLowerCase().includes(q)
    );
  }

  // 按可解释信任分降序（非付费排名 DEC-007）。
  filtered.sort((a, b) => b.score - a.score);

  const overview = [
    { key: "contributors", label: "可信贡献者", value: filtered.length },
    {
      key: "verified",
      label: "已验证",
      value: filtered.filter((c) => c.verified).length,
    },
    {
      key: "high-trust",
      label: "高信任",
      value: filtered.filter((c) => c.level === "high").length,
    },
  ];

  const featured = [
    {
      title: "高信任贡献者",
      rationale:
        "依据可解释信任分（交换历史与参与方反馈为主，INV-10），非任何付费排名（DEC-007）。",
      logins: filtered
        .filter((c) => c.level === "high")
        .slice(0, 5)
        .map((c) => c.login),
    },
  ];

  const out: TrustNetworkResponse = {
    overview,
    contributors: filtered,
    featured,
    total: filtered.length,
  };
  return assertNoForbidden(out, "trust-network");
}

// ── API-013 提交反馈 + 重算（W-3）────────────────────────────

export type FeedbackResult =
  | { ok: true; exchangeId: string; recomputedScore: number }
  | { ok: false; status: number; error: string };

export interface FeedbackInput {
  exchangeId: string; // 公开号 EX-2024-#### 或内部 uuid
  scores: Record<string, number>;
  publicComment?: string;
}

/**
  提交结构化反馈（FLOW-004 / W-3）：
  1. 鉴权（匿名→401）。
  2. 解析交换（publicRef 或 id）；不存在→404。
  3. 资格校验：仅交换参与方（请求方 / 模块 owner）可提交，否则→403（TEST-012）。
  4. 状态校验：仅 Completed/WaitingForFeedback 可提交，否则→409（TEST-012）。
  5. 限流（NFR-006）：超阈值→429。
  6. 写 ENT-010 feedback（参与方 weight=1，> 社交信号；INV-10）。
  7. 触发被评方信任重算（W-3）。
  8. 写 audit（INV-11）。
*/
export async function submitFeedback(
  session: Session | null,
  input: FeedbackInput
): Promise<FeedbackResult> {
  if (!session?.login) return { ok: false, status: 401, error: "unauthorized" };

  const db = await getDb();

  // 当前用户。
  const [author] = await db
    .select({ id: schema.users.id, login: schema.users.login })
    .from(schema.users)
    .where(eq(schema.users.login, session.login))
    .limit(1);
  if (!author) return { ok: false, status: 401, error: "unknown-user" };

  // 限流：每用户窗口内提交次数（先于业务，避免穷举资格/唯一性）。NFR-006。
  const redis = await getRedis();
  const rl = await redis.rateLimit(`feedback:${author.id}`, 10, 60);
  if (!rl.allowed) return { ok: false, status: 429, error: "rate-limited" };

  // 解析交换：先按 publicRef，再按 id。
  let [exchange] = await db
    .select()
    .from(schema.exchanges)
    .where(eq(schema.exchanges.publicRef, input.exchangeId))
    .limit(1);
  if (!exchange) {
    [exchange] = await db
      .select()
      .from(schema.exchanges)
      .where(eq(schema.exchanges.id, input.exchangeId))
      .limit(1);
  }
  if (!exchange) return { ok: false, status: 404, error: "exchange-not-found" };

  // 模块 owner（被请求方）。
  const [moduleRow] = await db
    .select({ ownerId: schema.knowledgeModules.ownerId })
    .from(schema.knowledgeModules)
    .where(eq(schema.knowledgeModules.id, exchange.targetModuleId))
    .limit(1);
  const ownerId = moduleRow?.ownerId;

  // 资格校验：作者必须是参与方（请求方 或 模块 owner）。
  const isRequester = exchange.requesterId === author.id;
  const isOwner = ownerId === author.id;
  if (!isRequester && !isOwner) {
    return { ok: false, status: 403, error: "not-a-participant" };
  }

  // 状态校验：仅 Completed/WaitingForFeedback 可提交反馈。
  if (
    exchange.status !== "Completed" &&
    exchange.status !== "WaitingForFeedback"
  ) {
    return { ok: false, status: 409, error: "invalid-exchange-state" };
  }

  // 被评方 = 交换中的「对方」。
  const subjectId = isRequester ? ownerId : exchange.requesterId;

  // 写 feedback（唯一约束：每方每次交换一份）。重复→409。
  try {
    await db.insert(schema.feedback).values({
      exchangeId: exchange.id,
      authorId: author.id,
      scores: input.scores,
      publicComment: input.publicComment ?? null,
      weight: "1", // 参与方权重（> 社交信号；INV-10）。
    });
  } catch {
    return { ok: false, status: 409, error: "already-submitted" };
  }

  // W-3：触发被评方信任重算（同步）。
  let recomputedScore = 0;
  if (subjectId) {
    const comp = await recomputeTrust(subjectId);
    recomputedScore = comp.score;
  }

  // INV-11：写 audit（无 PII / 无原始内容）。
  await db.insert(schema.auditLog).values({
    actorId: author.id,
    action: "feedback.submitted",
    targetType: "exchange",
    targetId: exchange.id,
    metadata: {
      exchangeRef: exchange.publicRef,
      subjectRecomputed: subjectId ? true : false,
    },
  });

  return { ok: true, exchangeId: exchange.publicRef, recomputedScore };
}
