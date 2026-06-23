/*
  trust-feedback 模块 query/mutation hooks（PAGE-040~043 / COMP-110~119）。
  取数 TanStack Query；组件只接 props，取数在本层（ASM-068）。
  形状为占位投影，阶段 15 对齐 SERVICE_CONTRACT（ASM-067）。零私有内容（INV-04）。

  说明：本模块 query keys 本地定义（不改 src/lib/query-keys.ts），命名空间前缀
  ["trust-feedback", ...] 避免与全局 key 冲突。
*/
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  KnowledgeModule,
  TrustBadgeItem,
  TrustLevel,
} from "@/lib/types";

// ── 本地 query keys（不污染全局 query-keys.ts）──────────────
export const trustFeedbackKeys = {
  all: ["trust-feedback"] as const,
  profile: (login: string) => ["trust-feedback", "profile", login] as const,
  network: (params?: Record<string, unknown>) =>
    ["trust-feedback", "network", params ?? {}] as const,
  feedbackEligibility: (exchangeId: string) =>
    ["trust-feedback", "feedback", exchangeId] as const,
} as const;

// ── 派生投影类型（模块自有；全局 TrustProfile 过薄，这里扩展）──

/** 四类信任来源 + 可选徽章加成（HARD-03） */
export type TrustSourceKey =
  | "exchange"
  | "feedback"
  | "github"
  | "report"
  | "badge";

export interface TrustDimension {
  key: TrustSourceKey;
  label: string;
  direction: "up" | "down" | "neutral";
  /** 占比/分值方向的文字（如「+340」「占比 41%」「−44」） */
  valueOrShare: string;
  explanation: string;
}

/** PAGE-040 顶部 StatBlock 行（派生计数） */
export interface ProfileStat {
  key: string;
  label: string;
  value: number | string;
  icon: string;
}

/** 已发布模块卡所需 owner 摘要 */
export interface ProfileModuleEntry {
  module: KnowledgeModule;
}

/** 交换历史脱敏行（INV-04） */
export interface ExchangeHistoryEntry {
  exchangeId: string;
  peerHandle: string;
  direction: "incoming" | "outgoing";
  moduleTitle: string;
  status: string; // 公开态文案
  statusTone: string;
  date: string;
}

/** 五维反馈均值（ENT-010） */
export interface FeedbackDimensionAverage {
  key: string;
  label: string;
  score: number;
  max: number;
}

/** 近期公开反馈摘要（脱敏） */
export interface RecentFeedbackEntry {
  excerpt: string;
  authorHandle: string;
  exchangeId: string;
  exchangeLabel: string;
}

export interface BadgeEntry {
  type: string;
  name: string;
  iconName: string;
  criteria: string;
}

export interface SocialSignals {
  endorsers: { login: string; avatarUrl: string }[];
  followerCount: number;
}

/** PAGE-040 信任档案聚合投影 */
export interface TrustProfileAggregate {
  login: string;
  displayName: string;
  avatarUrl: string;
  verified: boolean;
  bio?: string;
  topics: string[];
  joinedDate: string;
  githubUrl: string;
  isSelf: boolean;
  restrictionState: "normal" | "flagged";
  // 信任分
  score: number;
  maxScore: number;
  level: TrustLevel;
  tierLabel: string;
  /** 信任解释是否就绪（HARD-03 守卫；缺失→「解释生成中」） */
  explanationAvailable: boolean;
  // 拆解（HARD-03 四类来源 + 徽章）
  dimensions: TrustDimension[];
  trendAttribution?: string;
  // 趋势
  trend: { period: string; score: number }[];
  // StatBlock 行
  stats: ProfileStat[];
  // 已发布模块
  publishedModules: KnowledgeModule[];
  // 交换历史
  exchangeHistory: ExchangeHistoryEntry[];
  // 徽章
  badges: BadgeEntry[];
  // 反馈质量
  feedbackAverages: FeedbackDimensionAverage[];
  recentFeedback: RecentFeedbackEntry[];
  // 社交信号
  social: SocialSignals;
}

/** PAGE-043 信任网络索引条目 */
export interface NetworkContributor {
  login: string;
  displayName: string;
  avatarUrl: string;
  verified: boolean;
  level: TrustLevel;
  tierLabel: string;
  score: number;
  maxScore: number;
  topics: string[];
  moduleCount: number;
  exchangeCount: number;
}

export interface NetworkOverviewStat {
  key: string;
  label: string;
  value: number;
}

export interface NetworkFeaturedSection {
  title: string;
  rationale: string;
  logins: string[];
}

export interface TrustNetworkResponse {
  overview: NetworkOverviewStat[];
  contributors: NetworkContributor[];
  featured: NetworkFeaturedSection[];
  total: number;
}

export interface NetworkFilters {
  topic?: string;
  minTier?: TrustLevel | "";
  verifiedOnly?: boolean;
  q?: string;
  /** 演示/测试空注册表（MOCK 空态） */
  empty?: boolean;
}

/** 反馈表单资格上下文（PAGE-042） */
export interface FeedbackEligibility {
  exchangeId: string;
  peerHandle: string;
  moduleTitle: string;
  statusLabel: string;
  submissionState: "editable" | "submitted" | "ineligible" | "window-closed";
}

export interface FeedbackPayload {
  exchangeId: string;
  scores: Record<string, number>;
  publicComment?: string;
}

// ── hooks ───────────────────────────────────────────────

/** PAGE-040 信任档案聚合（公开匿名可看，INV-04）。 */
export function useTrustProfileAggregate(login: string) {
  return useQuery({
    queryKey: trustFeedbackKeys.profile(login),
    queryFn: () =>
      apiFetch<TrustProfileAggregate>(
        `/api/trust-profiles/${encodeURIComponent(login)}`
      ),
    enabled: !!login,
  });
}

/** FilterValue → URLSearchParams（与 MSW handler 对齐）。 */
export function buildNetworkQuery(
  filters: NetworkFilters,
  sort = "explainable-trust"
): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.topic) sp.set("topic", filters.topic);
  if (filters.minTier) sp.set("minTier", filters.minTier);
  if (filters.verifiedOnly) sp.set("verifiedOnly", "true");
  if (filters.q?.trim()) sp.set("q", filters.q.trim());
  if (filters.empty) sp.set("empty", "true");
  if (sort && sort !== "explainable-trust") sp.set("sort", sort);
  return sp;
}

/** PAGE-043 信任网络索引（含筛选/排序）。 */
export function useTrustNetwork(
  filters: NetworkFilters = {},
  sort = "explainable-trust"
) {
  const sp = buildNetworkQuery(filters, sort);
  const qs = sp.toString();
  return useQuery({
    queryKey: trustFeedbackKeys.network({ ...filters, sort }),
    queryFn: () =>
      apiFetch<TrustNetworkResponse>(
        `/api/trust-network${qs ? `?${qs}` : ""}`
      ),
  });
}

/** PAGE-042 反馈资格/上下文（仅 WaitingForFeedback 参与方）。 */
export function useFeedbackEligibility(exchangeId: string) {
  return useQuery({
    queryKey: trustFeedbackKeys.feedbackEligibility(exchangeId),
    queryFn: () =>
      apiFetch<FeedbackEligibility>(
        `/api/exchanges/${encodeURIComponent(exchangeId)}/feedback`
      ),
    enabled: !!exchangeId,
  });
}

/**
  PAGE-042 提交结构化反馈（FLOW-004）。
  写 ENT-010 + 触发 ENT-011 重算 + 写 AuditLog（INV-11）+ 发通知（FLOW-006）。
  服务端二次校验资格/唯一性/状态（NFR-006）。成功后失效相关 profile/network/eligibility。
*/
export function useSubmitFeedback(peerLogin?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FeedbackPayload) =>
      apiFetch<{ ok: true; exchangeId: string }>(
        `/api/exchanges/${encodeURIComponent(payload.exchangeId)}/feedback`,
        { method: "POST", body: JSON.stringify(payload) }
      ),
    onSuccess: (_data, payload) => {
      qc.invalidateQueries({
        queryKey: trustFeedbackKeys.feedbackEligibility(payload.exchangeId),
      });
      if (peerLogin) {
        qc.invalidateQueries({
          queryKey: trustFeedbackKeys.profile(peerLogin),
        });
      }
      qc.invalidateQueries({ queryKey: ["trust-feedback", "network"] });
    },
  });
}

/** TrustLevel → 文字标签（NFR-007：非仅颜色）。 */
export const TRUST_LEVEL_LABEL: Record<TrustLevel, string> = {
  high: "资深贡献者 / Trusted",
  medium: "活跃贡献者",
  low: "新晋贡献者",
  new: "新用户",
};

/** 复用：徽章项 → BadgeEntry（global TrustBadgeItem 仅 type/label）。 */
export function toBadgeEntry(b: TrustBadgeItem): BadgeEntry {
  return {
    type: b.type,
    name: b.label,
    iconName: "verified_user",
    criteria: b.label,
  };
}
