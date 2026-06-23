/*
  exchange 模块取数层（PAGE-030 公开台账 + PAGE-031 交换详情）。
  - 本地定义 query keys（不改全局 query-keys.ts；类型本地扩展，不改 types.ts）。
  - 组件只接 props，取数集中于此层（ASM-068）；走 TanStack Query + MSW。
  - 形状为前端消费占位，阶段 15 以 SERVICE_CONTRACT 为准（ASM-067/111）。
  - 守 INV-01/04：公开投影零私有内容；联系方式真实值仅 Accepted 后由后端对该次对方返回（INV-03/ASM-086）。
*/
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  ExchangeStatus,
  Session,
  TrustLevel,
} from "@/lib/types";

/* ── 本地 query keys（exchange 模块私有，便于精确失效）─────────── */
export const exchangeKeys = {
  all: ["exchange"] as const,
  ledger: (filters?: ExchangeLedgerQuery) =>
    ["exchange", "ledger", filters ?? {}] as const,
  detail: (id: string) => ["exchange", "detail", id] as const,
  session: ["exchange", "session"] as const,
} as const;

/* ── 本地类型扩展（不改 types.ts；公开脱敏投影 + 详情聚合）──────── */

/** 台账行：一次 Exchange 的脱敏投影（ENT-007；零私有内容 INV-01/04）。 */
export interface ExchangeLedgerRow {
  exchangeId: string; // 脱敏号 EX-2024-####（ASM-031）
  requester: ExchangePartyLite;
  target: ExchangePartyLite;
  direction: "reciprocal" | "oneway"; // offeredModule 是否为空派生（INV-05）
  targetModuleName: string;
  offeredModuleName?: string;
  topics: string[];
  status: ExchangeStatus;
  createdAt: string;
  updatedAt: string;
}

/** 台账/详情用的轻量公开身份（ENT-001 + ENT-011 派生只读信号）。 */
export interface ExchangePartyLite {
  login: string;
  avatarUrl?: string;
  verified: boolean;
  trustLevel: TrustLevel;
}

/** 详情参与方卡（含角色与公开成功交换次数；不含联系方式 INV-03）。 */
export interface ExchangePartyDetail extends ExchangePartyLite {
  role: "requester" | "owner";
  successfulExchanges: number;
}

/** 详情时间线步骤（FLOW-003 状态机 → 可视步骤；ASM-087）。 */
export interface ExchangeTimelineStep {
  key: string;
  label: string;
  status: "completed" | "active" | "pending" | "terminated";
  timestamp?: string;
  actorLogin?: string;
  note?: string;
}

/** 可公开验证摘要项（仅引用身份/所有权/状态信号 ASM-034；不读交付物 INV-01）。 */
export interface ExchangeVerificationItem {
  key: "identity" | "ownership" | "delivery";
  label: string;
  status: "verified" | "pending" | "na";
  note?: string;
}

/** 模块摘要卡（脱敏元数据；无私有内容 INV-01/04）。 */
export interface ExchangeModuleSummary {
  moduleId: string;
  title: string;
  summary: string;
  topics: string[];
  signal?: string; // 如「高信任度」「4.8 分」等公开信号文本
}

/** 联系方式（本人偏好；前端仅脱敏占位/类型 ASM-086）。 */
export interface ExchangeContactInfo {
  type: "github" | "email" | "im" | "custom";
  label: string;
  masked: string;
}

/** 披露快照（ENT-009；撤回只影响未来 ASM-013）。 */
export interface ExchangeDisclosureSnapshot {
  contacts: { type: ExchangeContactInfo["type"]; label: string; value: string }[];
  disclosedAt: string;
}

/** 私下交付通道（仅约定/状态文案；无真实 URL/邀请 INV-04/ASM-007）。 */
export type ExchangeDeliveryChannel =
  | "github_private_repo"
  | "dm"
  | "approval_link";

/** 交换详情聚合（PAGE-031）。公开面 + 私域门控（披露/反馈按角色与状态）。 */
export interface ExchangeDetail {
  exchangeId: string;
  status: ExchangeStatus;
  createdAt: string;
  /** 当前查看者相对本次交换的角色（按 session 派生）。 */
  viewerRole: "requester" | "owner" | "spectator";
  isAuthenticated: boolean;
  direction: "reciprocal" | "oneway";
  requester: ExchangePartyDetail;
  target: ExchangePartyDetail;
  targetModule: ExchangeModuleSummary;
  offeredModule?: ExchangeModuleSummary;
  timeline: ExchangeTimelineStep[];
  verification: ExchangeVerificationItem[];
  delivery: {
    channel: ExchangeDeliveryChannel;
    channelLabel: string;
    deliveryHint: string;
  };
  /** 联系方式披露区数据（仅参与方且 Accepted+ 才含真实清单/快照 INV-03）。 */
  disclosure: {
    myContacts: ExchangeContactInfo[];
    myDisclosure?: ExchangeDisclosureSnapshot;
    peerDisclosure?: ExchangeDisclosureSnapshot;
  };
  /** 反馈窗口状态（ASM-011）。 */
  feedbackWindow: "open" | "closed";
}

/* ── 台账筛选/排序 → URL 查询（与 MSW handler 对齐）──────────── */
export interface ExchangeLedgerQuery {
  status?: string; // 状态分组键：active|completed|unfulfilled|all
  topic?: string;
  q?: string;
  sort?: "latest" | "mostActive";
  page?: number;
}

export function buildLedgerQuery(params: ExchangeLedgerQuery): URLSearchParams {
  const sp = new URLSearchParams();
  if (params.status && params.status !== "all") sp.set("status", params.status);
  if (params.topic) sp.set("topic", params.topic);
  if (params.q?.trim()) sp.set("q", params.q.trim());
  if (params.sort && params.sort !== "latest") sp.set("sort", params.sort);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  return sp;
}

/* ── Hooks ─────────────────────────────────────────────────── */

/** 公开脱敏台账（PAGE-030）。匿名可看（INV-04）。 */
export function useExchangeLedger(params: ExchangeLedgerQuery = {}) {
  const sp = buildLedgerQuery(params);
  const qs = sp.toString();
  return useQuery({
    queryKey: exchangeKeys.ledger(params),
    queryFn: () =>
      apiFetch<{ items: ExchangeLedgerRow[]; total: number; topics: string[] }>(
        `/api/exchanges${qs ? `?${qs}` : ""}`
      ),
  });
}

/** 交换详情（PAGE-031）。公开脱敏面 + 私域门控。 */
export function useExchangeDetail(id: string) {
  return useQuery({
    queryKey: exchangeKeys.detail(id),
    queryFn: () => apiFetch<ExchangeDetail>(`/api/exchanges/${id}`),
    enabled: !!id,
  });
}

/** 会话（详情私域动作的角色/登录判断）。失败降级匿名（不阻断公开面）。 */
export function useExchangeViewer() {
  return useQuery({
    queryKey: exchangeKeys.session,
    queryFn: async (): Promise<Session | null> => {
      try {
        return await apiFetch<Session | null>("/api/session");
      } catch {
        return null;
      }
    },
    retry: false,
  });
}

/* ── 创建交换（API-019 / ASM-120）──────────────────────────── */

export interface CreateExchangeInput {
  targetModuleId: string;
  offeredModuleId?: string;
}

export interface CreateExchangeResult {
  exchangeId: string;
  status: ExchangeStatus;
}

/**
  创建交换请求（API-019）。目标 Published + 可选自有模块（INV-05/DEC-009）；
  缺 Consent → 后端 422（前端始终携带 actionType:"exchange"，INV-08）。
*/
export function useCreateExchange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExchangeInput) =>
      apiFetch<CreateExchangeResult>("/api/exchanges", {
        method: "POST",
        body: JSON.stringify({
          targetModuleId: input.targetModuleId,
          offeredModuleId: input.offeredModuleId,
          consent: { actionType: "exchange" },
        }),
      }),
    onSuccess: () => {
      // 台账可能新增一行 → 失效列表缓存。
      qc.invalidateQueries({ queryKey: exchangeKeys.all });
    },
  });
}

/* ── Mutations（写动作：披露/撤回/交付确认）──────────────────── */

function useInvalidateDetail(id: string) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: exchangeKeys.detail(id) });
}

/** 披露联系方式（仅 Accepted+ 参与方；写 Consent 后生成 ENT-009 快照）。 */
export function useDiscloseContacts(id: string) {
  const invalidate = useInvalidateDetail(id);
  return useMutation({
    mutationFn: (selectedTypes: ExchangeContactInfo["type"][]) =>
      apiFetch<ExchangeDetail>(`/api/exchanges/${id}/disclose`, {
        method: "POST",
        body: JSON.stringify({ types: selectedTypes, consent: true }),
      }),
    onSuccess: invalidate,
  });
}

/** 撤回披露（仅停止未来披露；已披露快照不可收回 ASM-013）。 */
export function useRevokeDisclosure(id: string) {
  const invalidate = useInvalidateDetail(id);
  return useMutation({
    mutationFn: () =>
      apiFetch<ExchangeDetail>(`/api/exchanges/${id}/revoke`, {
        method: "POST",
      }),
    onSuccess: invalidate,
  });
}

/** 标记为已交付（己方确认；Delivered→Completed 需双方各自确认 INV-06）。 */
export function useMarkDelivered(id: string) {
  const invalidate = useInvalidateDetail(id);
  return useMutation({
    mutationFn: () =>
      apiFetch<ExchangeDetail>(`/api/exchanges/${id}/mark-delivered`, {
        method: "POST",
      }),
    onSuccess: invalidate,
  });
}

/* ── 台账行 → 状态分组键（FLOW-003；Flagged 不单列 ASM-032）──── */
export const LEDGER_STATUS_GROUPS: Record<string, ExchangeStatus[]> = {
  active: ["Requested", "Accepted", "PrivatePreparing", "Delivered"],
  completed: ["Completed", "Closed", "WaitingForFeedback"],
  unfulfilled: ["Rejected", "Cancelled", "Expired"],
};
