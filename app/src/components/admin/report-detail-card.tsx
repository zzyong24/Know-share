"use client";

import { Card, StatusPill, Avatar } from "@/components/shared";
import type { ReportDetail } from "@/lib/queries/admin";
import type { Tone } from "@/lib/types";

/*
  COMP-181 ReportDetailCard（举报详情卡）。
  仅在 ReviewItem 来源为 Report 时渲染：举报方 handle + 目标引用（仅引用不含私有内容 INV-04）
  + 举报原因 + 当前状态。处置动作走 COMP-175，本卡仅展示。无仲裁/申诉 UI（产品边界）。
*/
export interface ReportDetailCardProps {
  report: ReportDetail;
}

const STATUS_META: Record<
  ReportDetail["status"],
  { tone: Tone; label: string }
> = {
  pending: { tone: "warning", label: "待处理" },
  dismissed: { tone: "neutral", label: "已驳回" },
  penalized: { tone: "danger", label: "已处罚（下架）" },
};

const TARGET_TYPE_LABEL: Record<ReportDetail["targetType"], string> = {
  module: "模块",
  user: "用户",
  exchange: "交换",
};

export function ReportDetailCard({ report }: ReportDetailCardProps) {
  const sm = STATUS_META[report.status];
  return (
    <Card padding="sm">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-text">举报详情</h4>
        <StatusPill tone={sm.tone} label={sm.label} />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Avatar login={report.reporterHandle} size="xs" />
        <span className="text-sm text-text-muted">
          举报方 @{report.reporterHandle}
        </span>
      </div>
      <p className="mt-2 text-sm text-text-muted">
        目标：{TARGET_TYPE_LABEL[report.targetType]} {report.targetRef}
      </p>
      <p className="mt-2 text-sm text-text">{report.reason}</p>
    </Card>
  );
}
