"use client";

import {
  DataTable,
  StatusPill,
  EmptyState,
  Avatar,
  PRIVACY_RESULT_META,
  Icon,
  type ColumnDef,
} from "@/components/shared";
import { RiskLabel } from "./risk-label";
import { cn } from "@/lib/utils";
import type { AdminReviewItem } from "@/lib/queries/admin";

/*
  COMP-173 ReviewQueueTable（评审队列表）。
  列：模块名&提交者 | 隐私门结果(StatusPill) | 风险标签(RiskLabel) | 提交时间 | 操作。
  点击行驱动详情面板（onSelectRow，主色高亮）；block 行不渲染「通过」（由 ModerationActionBar 守，INV-02）。
  高风险行 error-container 极浅底 + priority_high 图标 + 风险标签 danger 文字（非仅颜色，NFR-007）。
*/
export interface ReviewQueueTableProps {
  items: AdminReviewItem[];
  selectedId?: string;
  loading?: boolean;
  onSelectRow: (id: string) => void;
}

export function ReviewQueueTable({
  items,
  selectedId,
  loading = false,
  onSelectRow,
}: ReviewQueueTableProps) {
  const columns: ColumnDef<AdminReviewItem>[] = [
    {
      id: "module",
      header: "模块名 & 提交者",
      cell: (r) => (
        <div className="flex items-center gap-2">
          {r.riskLevel === "high" && (
            <Icon
              name="priority_high"
              size={16}
              className="text-danger"
              aria-label="高风险"
            />
          )}
          <Avatar login={r.submitterLogin} size="xs" />
          <div className="min-w-0">
            <p
              className={cn(
                "truncate text-sm font-medium text-text",
                selectedId === r.id && "text-primary"
              )}
            >
              {r.moduleTitle}
            </p>
            <p className="truncate text-xs text-text-muted">
              @{r.submitterLogin}
              {r.reported && r.reporterLogin && `（举报 @${r.reporterLogin}）`}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "gate",
      header: "隐私门结果",
      cell: (r) => {
        const meta = PRIVACY_RESULT_META[r.gate];
        return <StatusPill tone={meta.tone} label={meta.label} icon={meta.icon} />;
      },
    },
    {
      id: "risk",
      header: "风险标签",
      cell: (r) => <RiskLabel level={r.riskLevel} text={r.riskLabel} />,
    },
    {
      id: "submittedAt",
      header: "提交时间",
      cell: (r) => (
        <span className="text-xs tabular-nums text-text-muted">{r.submittedAt}</span>
      ),
    },
  ];

  return (
    <DataTable<AdminReviewItem>
      caption="评审队列"
      columns={columns}
      data={items}
      getRowId={(r) => r.id}
      loading={loading}
      onRowClick={(r) => onSelectRow(r.id)}
      emptyState={
        <EmptyState
          icon="inbox"
          title="暂无待审项"
          description="队列为空，所有提交与举报均已处置。"
        />
      }
    />
  );
}
