"use client";

import { StatBlock } from "@/components/shared";
import type { ReviewSummary } from "@/lib/queries/admin";

/*
  COMP-171 RiskSummaryRow（风险摘要行）。
  4× 共享 StatBlock（待审/高风险/今日举报/已处理），不新造统计组件，仅按 admin 语义编排。
  高风险格 highRiskCount>0 用 danger 强调（同时含文字标签「高风险」，非仅颜色，NFR-007）。
  数据为 ENT-019 管理子集（聚合无 PII，INV-09）；「已处理」口径默认当日（ASM-053）。
*/
export interface RiskSummaryRowProps {
  summary?: ReviewSummary;
  loading?: boolean;
  onItemClick?: (
    key: "pending" | "highRisk" | "reportsToday" | "resolved"
  ) => void;
}

export function RiskSummaryRow({
  summary,
  loading = false,
  onItemClick,
}: RiskSummaryRowProps) {
  const s = summary;
  const highRiskTone = (s?.highRiskCount ?? 0) > 0 ? "danger" : "neutral";

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" role="group" aria-label="风险摘要">
      <StatBlock
        value={s?.pendingCount ?? 0}
        label="待审"
        icon="inbox"
        tone="primary"
        loading={loading}
        onClick={onItemClick ? () => onItemClick("pending") : undefined}
      />
      <StatBlock
        value={s?.highRiskCount ?? 0}
        label="高风险"
        icon="priority_high"
        tone={highRiskTone}
        loading={loading}
        onClick={onItemClick ? () => onItemClick("highRisk") : undefined}
      />
      <StatBlock
        value={s?.reportsToday ?? 0}
        label="今日举报"
        icon="flag"
        tone="warning"
        loading={loading}
        onClick={onItemClick ? () => onItemClick("reportsToday") : undefined}
      />
      <StatBlock
        value={s?.resolvedCount ?? 0}
        label="已处理"
        icon="task_alt"
        tone="success"
        loading={loading}
        onClick={onItemClick ? () => onItemClick("resolved") : undefined}
      />
    </div>
  );
}
