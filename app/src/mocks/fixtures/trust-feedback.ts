/*
  MOCK 种子 — trust-feedback 模块（MOCK-008/009 扩展 + 信任网络 + 反馈资格）。
  全合成；公开匿名可看、零私有内容（INV-04）；统计无 PII（INV-09）；无经济元素（DEC-007）。
  复用既有 fixtures：users（ENT-001）、trustProfiles（ENT-011，misc.ts）、modules、exchanges。
  形状为占位投影，阶段 15 对齐 SERVICE_CONTRACT（ASM-067）。
*/
import type {
  TrustProfileAggregate,
  TrustNetworkResponse,
  FeedbackEligibility,
} from "@/lib/queries/trust-feedback";
import { TRUST_LEVEL_LABEL } from "@/lib/queries/trust-feedback";
import { users } from "./users";
import { modules } from "./modules";
import { exchanges } from "./exchanges";
import { trustProfiles } from "./misc";
import type { KnowledgeModule, TrustLevel } from "@/lib/types";

const MAX_SCORE = 1000; // ASM-037

const FEEDBACK_DIMENSIONS = [
  { key: "checklistConsistency", label: "清单一致性" },
  { key: "privacyBoundary", label: "隐私边界" },
  { key: "structureClarity", label: "结构清晰度" },
  { key: "usefulness", label: "有用性" },
  { key: "rebuyIntent", label: "再次交换意愿" },
] as const;

function userByLogin(login: string) {
  return users.find((u) => u.login === login);
}

function publishedModulesOf(login: string): KnowledgeModule[] {
  return modules.filter(
    (m) => m.ownerLogin === login && m.status === "Published"
  );
}

/** 该用户公开/完成态的交换历史（脱敏，INV-04）。 */
function exchangeHistoryOf(login: string) {
  const publicStatuses = new Set(["Completed", "Closed", "Delivered"]);
  return exchanges
    .filter(
      (e) =>
        (e.requesterLogin === login || e.providerLogin === login) &&
        publicStatuses.has(e.status)
    )
    .map((e) => {
      const isRequester = e.requesterLogin === login;
      return {
        exchangeId: e.id,
        peerHandle: isRequester ? e.providerLogin : e.requesterLogin,
        direction: (isRequester ? "outgoing" : "incoming") as
          | "outgoing"
          | "incoming",
        moduleTitle: e.targetModuleTitle,
        status: e.status === "Completed" ? "已完成" : "已关闭",
        statusTone: "success",
        date: e.updatedAt,
      };
    });
}

// ── 资深贡献者样本（zyongzhu24，本人视角）──────────────────
function buildSeniorProfile(): TrustProfileAggregate {
  const u = userByLogin("zyongzhu24")!;
  const tp = trustProfiles.find((t) => t.login === "zyongzhu24")!;
  return {
    login: u.login,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    verified: u.verified,
    bio: "AI 产品与 Agent 架构实践者，专注可解释信任与隐私优先的知识交换。",
    topics: u.domains,
    joinedDate: u.joinedAt,
    githubUrl: `https://github.com/${u.login}`,
    isSelf: true,
    restrictionState: "normal",
    score: tp.score,
    maxScore: MAX_SCORE,
    level: tp.level,
    tierLabel: TRUST_LEVEL_LABEL[tp.level],
    explanationAvailable: true,
    dimensions: [
      {
        key: "exchange",
        label: "交换历史",
        direction: "up",
        valueOrShare: "+340（占比 41%）",
        explanation: "完成 18 次零争议交换，Completed/Closed 占比 96%。",
      },
      {
        key: "feedback",
        label: "反馈质量",
        direction: "up",
        valueOrShare: "+280（占比 34%）",
        explanation:
          "作为交换参与方收到的结构化反馈均值 4.7，权重高于社交信号。",
      },
      {
        key: "github",
        label: "GitHub 验证",
        direction: "up",
        valueOrShare: "+160",
        explanation: "GitHub 身份已验证，作为信任骨干贡献固定基准分。",
      },
      {
        key: "report",
        label: "举报记录（扣分）",
        direction: "down",
        valueOrShare: "−44",
        explanation: "存在历史成立举报导致的中性扣分（不展示举报细节）。",
      },
      {
        key: "badge",
        label: "徽章加成",
        direction: "up",
        valueOrShare: "+28",
        explanation: "高贡献者徽章带来标记性加成。",
      },
    ],
    trendAttribution: "近一月完成 3 次交换，反馈均值 4.8，信用分稳步上升。",
    trend: tp.trend.map((p) => ({ period: p.x, score: p.y })),
    stats: [
      { key: "modules", label: "贡献模块", value: publishedModulesOf(u.login).length, icon: "inventory_2" },
      { key: "exchanges", label: "累计交换", value: 18, icon: "swap_horiz" },
      { key: "favorites", label: "被收藏", value: 246, icon: "favorite" },
      { key: "consistency", label: "清单一致性率", value: "94%", icon: "fact_check" },
      { key: "rating", label: "平均反馈评分", value: "4.7", icon: "star" },
    ],
    publishedModules: publishedModulesOf(u.login),
    exchangeHistory: exchangeHistoryOf(u.login),
    badges: [
      {
        type: "verified",
        name: "GitHub 已验证",
        iconName: "verified_user",
        criteria: "完成 GitHub 身份验证。",
      },
      {
        type: "top-contributor",
        name: "高贡献者",
        iconName: "auto_awesome",
        criteria: "完成 10 次零争议交换。",
      },
      {
        type: "privacy-guardian",
        name: "隐私守护者",
        iconName: "lock",
        criteria: "10 次交换隐私边界评分满分。",
      },
    ],
    feedbackAverages: FEEDBACK_DIMENSIONS.map((d, i) => ({
      key: d.key,
      label: d.label,
      score: [4.8, 4.9, 4.6, 4.7, 4.5][i],
      max: 5,
    })),
    recentFeedback: [
      {
        excerpt: "清单与交付高度一致，结构清晰，隐私边界处理得当。",
        authorHandle: "rag-builder",
        exchangeId: "EX-2024-8846",
        exchangeLabel: "Agent 记忆系统设计模式",
      },
      {
        excerpt: "非常有用的设计模式，沟通顺畅，愿意再次交换。",
        authorHandle: "knowledge-trader",
        exchangeId: "EX-2024-8846",
        exchangeLabel: "Agent 记忆系统设计模式",
      },
    ],
    social: {
      endorsers: [
        { login: "rag-builder", avatarUrl: userByLogin("rag-builder")!.avatarUrl },
        { login: "growth-lab", avatarUrl: userByLogin("growth-lab")!.avatarUrl },
        { login: "bot-dev", avatarUrl: userByLogin("bot-dev")!.avatarUrl },
      ],
      followerCount: 132,
    },
  };
}

// ── 新人样本（newcomer，空态/未验证）──────────────────────
function buildNewcomerProfile(): TrustProfileAggregate {
  const u = userByLogin("newcomer")!;
  return {
    login: u.login,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    verified: false,
    bio: undefined,
    topics: [],
    joinedDate: u.joinedAt,
    githubUrl: `https://github.com/${u.login}`,
    isSelf: false,
    restrictionState: "normal",
    score: 0,
    maxScore: MAX_SCORE,
    level: "new",
    tierLabel: TRUST_LEVEL_LABEL.new,
    explanationAvailable: true,
    dimensions: [],
    trendAttribution: undefined,
    trend: [],
    stats: [
      { key: "modules", label: "贡献模块", value: 0, icon: "inventory_2" },
      { key: "exchanges", label: "累计交换", value: 0, icon: "swap_horiz" },
      { key: "favorites", label: "被收藏", value: 0, icon: "favorite" },
    ],
    publishedModules: [],
    exchangeHistory: [],
    badges: [],
    feedbackAverages: [],
    recentFeedback: [],
    social: { endorsers: [], followerCount: 0 },
  };
}

/** 据 users + trustProfiles 派生其余贡献者的简档（供网络索引/直接访问其档案）。 */
function buildGenericProfile(login: string): TrustProfileAggregate | undefined {
  const u = userByLogin(login);
  if (!u) return undefined;
  const score = u.trustScore ?? 0;
  const level: TrustLevel =
    score >= 750 ? "high" : score >= 600 ? "medium" : score > 0 ? "low" : "new";
  const pubMods = publishedModulesOf(login);
  const history = exchangeHistoryOf(login);
  return {
    login: u.login,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    verified: u.verified,
    bio: `${u.domains.join(" / ") || "贡献者"}领域的知识交换参与方。`,
    topics: u.domains,
    joinedDate: u.joinedAt,
    githubUrl: `https://github.com/${u.login}`,
    isSelf: false,
    restrictionState: "normal",
    score,
    maxScore: MAX_SCORE,
    level,
    tierLabel: TRUST_LEVEL_LABEL[level],
    explanationAvailable: true,
    dimensions: [
      {
        key: "exchange",
        label: "交换历史",
        direction: "up",
        valueOrShare: `+${Math.round(score * 0.42)}`,
        explanation: "已完成交换的累计贡献。",
      },
      {
        key: "feedback",
        label: "反馈质量",
        direction: "up",
        valueOrShare: `+${Math.round(score * 0.34)}`,
        explanation: "交换参与方结构化反馈均值，权重高于社交信号。",
      },
      {
        key: "github",
        label: "GitHub 验证",
        direction: u.verified ? "up" : "neutral",
        valueOrShare: u.verified ? "+160" : "0（未验证）",
        explanation: u.verified
          ? "GitHub 身份已验证。"
          : "尚未完成 GitHub 验证，验证项暂无贡献。",
      },
      {
        key: "report",
        label: "举报记录（扣分）",
        direction: "neutral",
        valueOrShare: "0",
        explanation: "无成立举报。",
      },
    ],
    trend: [
      { period: "3 月", score: Math.max(0, score - 40) },
      { period: "4 月", score: Math.max(0, score - 20) },
      { period: "5 月", score },
    ],
    stats: [
      { key: "modules", label: "贡献模块", value: pubMods.length, icon: "inventory_2" },
      { key: "exchanges", label: "累计交换", value: history.length, icon: "swap_horiz" },
      { key: "rating", label: "平均反馈评分", value: "4.5", icon: "star" },
    ],
    publishedModules: pubMods,
    exchangeHistory: history,
    badges: u.verified
      ? [
          {
            type: "verified",
            name: "GitHub 已验证",
            iconName: "verified_user",
            criteria: "完成 GitHub 身份验证。",
          },
        ]
      : [],
    feedbackAverages: history.length
      ? FEEDBACK_DIMENSIONS.map((d) => ({
          key: d.key,
          label: d.label,
          score: 4.5,
          max: 5,
        }))
      : [],
    recentFeedback: [],
    social: { endorsers: [], followerCount: Math.round(score / 10) },
  };
}

/** login → 聚合档案（MOCK-008/009 + 派生其余）。 */
export function trustProfileAggregate(
  login: string
): TrustProfileAggregate | undefined {
  if (login === "zyongzhu24") return buildSeniorProfile();
  if (login === "newcomer") return buildNewcomerProfile();
  return buildGenericProfile(login);
}

// ── 信任网络索引（PAGE-043）──────────────────────────────
export function trustNetwork(url: URL): TrustNetworkResponse {
  const sp = url.searchParams;
  const topic = sp.get("topic") ?? "";
  const minTier = (sp.get("minTier") ?? "") as TrustLevel | "";
  const verifiedOnly = sp.get("verifiedOnly") === "true";
  const q = (sp.get("q") ?? "").trim().toLowerCase();
  const forceEmpty = sp.get("empty") === "true";

  const TIER_RANK: Record<TrustLevel, number> = { high: 3, medium: 2, low: 1, new: 0 };

  let contributors = users
    .filter((u) => (u.trustScore ?? 0) > 0) // 仅可信贡献者（有信任历史）
    .map((u) => {
      const score = u.trustScore ?? 0;
      const level: TrustLevel =
        score >= 750 ? "high" : score >= 600 ? "medium" : "low";
      return {
        login: u.login,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        verified: u.verified,
        level,
        tierLabel: TRUST_LEVEL_LABEL[level],
        score,
        maxScore: MAX_SCORE,
        topics: u.domains,
        moduleCount: publishedModulesOf(u.login).length,
        exchangeCount: exchangeHistoryOf(u.login).length,
      };
    });

  if (forceEmpty) contributors = [];

  if (topic)
    contributors = contributors.filter((c) =>
      c.topics.some((t) => t.toLowerCase() === topic.toLowerCase())
    );
  if (minTier)
    contributors = contributors.filter(
      (c) => TIER_RANK[c.level] >= TIER_RANK[minTier]
    );
  if (verifiedOnly) contributors = contributors.filter((c) => c.verified);
  if (q)
    contributors = contributors.filter(
      (c) =>
        c.login.toLowerCase().includes(q) ||
        c.displayName.toLowerCase().includes(q) ||
        c.topics.some((t) => t.toLowerCase().includes(q))
    );

  // 默认按可解释信任排序（参与方反馈权重高于社交信号，INV-10）→ 这里以信用分降序近似
  contributors.sort((a, b) => b.score - a.score);

  const overview: TrustNetworkResponse["overview"] = [
    { key: "trusted", label: "可信贡献者", value: users.filter((u) => (u.trustScore ?? 0) >= 600).length },
    { key: "verified", label: "已验证用户", value: users.filter((u) => u.verified).length },
    { key: "feedback", label: "累计有效反馈", value: 1284 },
  ];

  const featured: TrustNetworkResponse["featured"] = [
    {
      title: "精选贡献者",
      rationale: "依据可解释信任（交换历史 + 参与方反馈，权重高于社交信号），非付费置顶。",
      logins: ["zyongzhu24", "rag-builder", "sec-researcher"],
    },
    {
      title: "新晋可信成员",
      rationale: "近期完成多次零争议交换、信任分快速积累，非排他榜。",
      logins: ["growth-lab", "bot-dev"],
    },
  ];

  return { overview, contributors, featured, total: contributors.length };
}

// ── 反馈资格（PAGE-042）──────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  WaitingForFeedback: "待反馈",
  Completed: "已完成",
  Closed: "已关闭",
};

/*
  合成反馈资格样本（不改共享 exchanges fixture）。覆盖四态供 PAGE-042/COMP-116 演示与测试：
  - FB-EDITABLE：WaitingForFeedback，本人为参与方且未提交 → editable
  - FB-CLOSED：Closed，反馈窗口已过 → window-closed
  共享 exchanges 中已有 Completed（→submitted）与非反馈态（→ineligible）。
*/
export const feedbackFixtures: FeedbackEligibility[] = [
  {
    exchangeId: "EX-2024-9001",
    peerHandle: "rag-builder",
    moduleTitle: "多模态 RAG 检索流水线",
    statusLabel: STATUS_LABEL.WaitingForFeedback,
    submissionState: "editable",
  },
  {
    exchangeId: "EX-2024-9002",
    peerHandle: "growth-lab",
    moduleTitle: "AI 产品增长实验库",
    statusLabel: STATUS_LABEL.Closed,
    submissionState: "window-closed",
  },
];

export function feedbackEligibility(exchangeId: string): FeedbackEligibility {
  const synthetic = feedbackFixtures.find((f) => f.exchangeId === exchangeId);
  if (synthetic) return synthetic;

  const ex = exchanges.find((e) => e.id === exchangeId);
  if (!ex) {
    return {
      exchangeId,
      peerHandle: "",
      moduleTitle: "",
      statusLabel: "未知",
      submissionState: "ineligible",
    };
  }
  // 资格态映射：WaitingForFeedback → editable；Completed → submitted（演示已提交）；
  // Closed → window-closed；其余 → ineligible。
  let submissionState: FeedbackEligibility["submissionState"] = "ineligible";
  if (ex.status === "WaitingForFeedback") submissionState = "editable";
  else if (ex.status === "Completed") submissionState = "submitted";
  else if (ex.status === "Closed") submissionState = "window-closed";

  return {
    exchangeId: ex.id,
    peerHandle: ex.providerLogin === "zyongzhu24" ? ex.requesterLogin : ex.providerLogin,
    moduleTitle: ex.targetModuleTitle,
    statusLabel: STATUS_LABEL[ex.status] ?? ex.status,
    submissionState,
  };
}
