/*
  MOCK 种子：审核控制台（admin / IA-011）。
  复用 misc.ts 的 reviewQueue / auditLog 作为队列与审计基线，再补 admin 专属的
  评审项详情（Manifest 脱敏摘要 + PrivacyScan 发现 + 举报详情）与摘要计数。
  守则：零私有内容（INV-01/04，Manifest 仅清单字段、不含原始内容/私有 URL）；
  统计聚合无 PII（INV-09）；block 样本不可通过（INV-02）；@system 自动信号仅入队不自动处置（产品边界第 3 条）。
*/
import type { PrivacyResult } from "@/lib/types";
import { reviewQueue, auditLog } from "./misc";
import type {
  ReviewItemDetail,
  RiskLevel,
  ReviewSummary,
  AdminReviewItem,
} from "@/lib/queries/admin";

/** 队列项扩展为 admin 视图模型（在 misc.reviewQueue 基础上补模块名/提交者/风险等级/可选举报）。 */
export const adminReviewQueue: AdminReviewItem[] = [
  {
    id: "rv-1",
    kind: "submission",
    moduleTitle: "私有部署脚本集",
    submitterLogin: "ops-bot",
    gate: "block",
    riskLevel: "high",
    riskLabel: "疑似含私有路径",
    submittedAt: "2024-10-24 09:15",
    status: "pending",
    reported: false,
  },
  {
    id: "rv-2",
    kind: "submission",
    moduleTitle: "AI 产品增长实验库",
    submitterLogin: "growth-lab",
    gate: "pass",
    riskLevel: "none",
    riskLabel: "未检出隐私问题",
    submittedAt: "2024-10-24 08:40",
    status: "pending",
    reported: false,
  },
  {
    id: "rv-3",
    kind: "report",
    moduleTitle: "量化交易因子清单",
    submitterLogin: "trader",
    gate: "warn",
    riskLevel: "medium",
    riskLabel: "缺少版本说明",
    submittedAt: "2024-10-23 17:02",
    status: "pending",
    reported: true,
    reporterLogin: "sec-researcher",
  },
];

/** 每个评审项的详情（Manifest 脱敏摘要 + PrivacyScan 发现 + 举报详情）。 */
export const reviewItemDetails: Record<string, ReviewItemDetail> = {
  "rv-1": {
    id: "rv-1",
    title: "私有部署脚本集",
    manifestSummary: {
      id: "mod-3291",
      version: "1.0.0",
      entry: "deploy/index.sh",
      env: ["NODE_ENV", "REGION"],
    },
    scanFindings: [
      {
        id: "f-1",
        description: "硬编码 IP 泄露（203.0.113.7）",
        severity: "high",
        suggestion: "移除硬编码地址，改用环境变量注入。",
      },
      {
        id: "f-2",
        description: "未声明的 HTTP 出站请求",
        severity: "medium",
        suggestion: "在清单 env 中声明外部依赖端点。",
      },
    ],
  },
  "rv-2": {
    id: "rv-2",
    title: "AI 产品增长实验库",
    manifestSummary: {
      id: "mod-1284",
      version: "2.3.0",
      entry: "experiments/manifest.json",
      env: [],
    },
    scanFindings: [],
  },
  "rv-3": {
    id: "rv-3",
    title: "量化交易因子清单",
    manifestSummary: {
      id: "mod-1022",
      version: "0.9.0",
      entry: "factors/manifest.json",
      env: ["MARKET"],
    },
    scanFindings: [
      {
        id: "f-3",
        description: "清单缺少版本变更说明",
        severity: "low",
        suggestion: "补充 CHANGELOG 字段以便追溯。",
      },
    ],
    report: {
      reporterHandle: "sec-researcher",
      targetType: "module",
      targetRef: "模块#1022",
      reason: "举报方称该因子清单与其已发布模块高度相似，疑似抄袭。",
      status: "pending",
    },
  },
};

/** 风险摘要四项聚合计数（ENT-019 管理子集；聚合无 PII，INV-09）。 */
export const reviewSummary: ReviewSummary = {
  pendingCount: 8,
  highRiskCount: 1,
  reportsToday: 2,
  resolvedCount: 24,
};

/** 审计日志：在 misc.auditLog 基础上补一条 @system 自动信号行（仅入队、非处置）。 */
export const adminAuditLog = [
  ...auditLog,
  {
    id: "a-3",
    actorLogin: "system",
    action: "flag-high-risk",
    target: "模块#1022",
    createdAt: "2026-06-21T11:15:00Z",
  },
];

// 供 handler 内部使用的轻量校验：批量通过仅作用于 pass 且无未决举报子集（INV-02/ASM-050）。
export function bulkApprovableIds(items: AdminReviewItem[]): string[] {
  return items
    .filter((i) => i.gate === ("pass" as PrivacyResult) && !i.reported)
    .map((i) => i.id);
}

// 仅为类型完整性导出（避免未使用告警在严格模式下报错时的占位）。
export type { RiskLevel };
export { reviewQueue };
