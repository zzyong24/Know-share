/*
  审核控制台（admin / IA-011）取数与处置 hooks。
  - query key 本地定义于此（不改 query-keys.ts）；复用全局 queryClient 失效。
  - 取数 TanStack Query；处置走 mutation 写审计（ENT-018）后失效队列/审计/摘要。
  - 守则：仅管理员（路由段约束）；不自动越过人工同意（产品边界第 3 条）；
    block 不可通过（INV-02）；处置原因对退回/下架/驳回必填（ASM-051/INV-11）。
  形状为占位，阶段 15 对齐 SERVICE_CONTRACT（ASM-067/111）。
*/
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { PrivacyResult, AuditEntry } from "@/lib/types";

// ── admin 本地 query keys（不污染全局 query-keys.ts）──────────────
export const adminKeys = {
  queue: ["admin", "review-queue"] as const,
  detail: (id: string) => ["admin", "review-detail", id] as const,
  audit: ["admin", "audit"] as const,
  summary: ["admin", "summary"] as const,
} as const;

// ── admin 视图模型（比 types.ts 的精简 ReviewItem 更丰富，仅前端消费）──
export type RiskLevel = "none" | "low" | "medium" | "high";

/** 队列行视图模型（ENT-015 ReviewItem + 关联 ENT-003 模块 / ENT-005 门控 / 提交者）。 */
export interface AdminReviewItem {
  id: string;
  kind: "submission" | "report";
  moduleTitle: string;
  submitterLogin: string;
  gate: PrivacyResult; // pass / warn / block
  riskLevel: RiskLevel; // 无 / 低 / 中 / 高（必含文字，NFR-007）
  riskLabel: string; // 风险描述文本
  submittedAt: string;
  status: "pending" | "approved" | "rejected" | "changes-requested";
  reported: boolean; // 是否有未决举报（影响批量集合，INV-02/ASM-050）
  reporterLogin?: string;
}

/** PrivacyScan 发现项（ENT-005）。 */
export interface ScanFinding {
  id: string;
  description: string;
  severity: "pass" | "low" | "medium" | "high";
  suggestion?: string;
}

/** Manifest 脱敏摘要（ENT-004，仅清单字段，绝不含原始内容/私有 URL，INV-04）。 */
export interface ManifestSummary {
  id: string;
  version: string;
  entry: string;
  env: string[];
}

/** 举报详情（ENT-014）。 */
export interface ReportDetail {
  reporterHandle: string;
  targetType: "module" | "user" | "exchange";
  targetRef: string;
  reason: string;
  status: "pending" | "dismissed" | "penalized";
}

/** 评审项详情（详情面板 PAGE-082 消费）。 */
export interface ReviewItemDetail {
  id: string;
  title: string;
  manifestSummary: ManifestSummary;
  scanFindings: ScanFinding[];
  report?: ReportDetail;
}

/** 风险摘要四项聚合（ENT-019 管理子集，INV-09）。 */
export interface ReviewSummary {
  pendingCount: number;
  highRiskCount: number;
  reportsToday: number;
  resolvedCount: number;
}

// ── 处置动作类型（ModerationActionBar / DestructiveConfirmDialog 共用）──
export type ModerationAction =
  | "approve"
  | "return"
  | "delist"
  | "dismiss-report"
  | "resolve";

export interface ModerationPayload {
  reviewItemId: string;
  action: ModerationAction;
  reason?: string; // 退回/下架/驳回必填（ASM-051/INV-11）
}

// ── queries ──────────────────────────────────────────────────────
export function useReviewQueueAdmin() {
  return useQuery({
    queryKey: adminKeys.queue,
    queryFn: () =>
      apiFetch<{ items: AdminReviewItem[] }>("/api/admin/review-queue"),
  });
}

export function useReviewSummary() {
  return useQuery({
    queryKey: adminKeys.summary,
    queryFn: () => apiFetch<ReviewSummary>("/api/admin/summary"),
  });
}

export function useReviewDetail(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.detail(id ?? ""),
    queryFn: () =>
      apiFetch<ReviewItemDetail>(`/api/admin/review-queue/${id}`),
    enabled: !!id,
  });
}

export function useAuditLog() {
  return useQuery({
    queryKey: adminKeys.audit,
    queryFn: () => apiFetch<{ items: AuditEntry[] }>("/api/admin/audit"),
  });
}

// ── mutations（处置 + 批量通过）──────────────────────────────────
/** 单项处置：写审计后失效队列/审计/摘要/详情（INV-11；失败不视为成功）。 */
export function useModerate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ModerationPayload) =>
      apiFetch<{ ok: true; audit: AuditEntry }>("/api/admin/moderate", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.queue });
      qc.invalidateQueries({ queryKey: adminKeys.audit });
      qc.invalidateQueries({ queryKey: adminKeys.summary });
    },
  });
}

/** 批量通过：仅作用于 pass 且无未决举报子集（INV-02/ASM-050），逐项写审计。 */
export function useBulkApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      apiFetch<{ ok: true; approved: string[] }>("/api/admin/bulk-approve", {
        method: "POST",
        body: JSON.stringify({ ids }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.queue });
      qc.invalidateQueries({ queryKey: adminKeys.audit });
      qc.invalidateQueries({ queryKey: adminKeys.summary });
    },
  });
}
