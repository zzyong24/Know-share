"use client";

import { Card, CodeBlock } from "@/components/shared";
import { PrivacyScanFindings } from "./privacy-scan-findings";
import { ReportDetailCard } from "./report-detail-card";
import { ModerationActionBar } from "./moderation-action-bar";
import type {
  AdminReviewItem,
  ReviewItemDetail,
  ModerationAction,
} from "@/lib/queries/admin";

/*
  COMP-176 ReviewDetailPanel（评审详情面板）。
  右栏 sticky：Manifest 脱敏摘要（等宽 JSON，CodeBlock）+ PrivacyScan 发现（COMP-179）
  + 举报详情（COMP-181，有则显）+ 审核意见 + 处置动作（COMP-175）。
  Manifest 仅清单字段（绝不展示原始内容/私有 URL，INV-04）；CodeBlock sanitizeJson 白名单兜底。
  未选中显示引导空态。
*/
export interface ReviewDetailPanelProps {
  item?: AdminReviewItem;
  detail?: ReviewItemDetail;
  loading?: boolean;
  busy?: boolean;
  onModerate: (action: ModerationAction, reason: string) => void | Promise<void>;
}

export function ReviewDetailPanel({
  item,
  detail,
  loading = false,
  busy = false,
  onModerate,
}: ReviewDetailPanelProps) {
  if (!item) {
    return (
      <Card>
        <p className="py-8 text-center text-sm text-text-muted">
          从左侧队列选择一项以查看详情
        </p>
      </Card>
    );
  }

  return (
    <section aria-label={`评审详情：${item.moduleTitle}`} className="flex flex-col gap-4">
      <Card>
        <h3 className="text-base font-semibold text-text">
          正在查看：{item.moduleTitle}
        </h3>

        {loading ? (
          <p className="mt-3 text-sm text-text-muted">加载中…</p>
        ) : detail ? (
          <div className="mt-3 flex flex-col gap-4">
            {/* Manifest 脱敏摘要（等宽 JSON；白名单兜底 INV-04） */}
            <div>
              <h4 className="mb-1.5 text-sm font-semibold text-text">
                Manifest 摘要
              </h4>
              <CodeBlock
                language="json"
                sanitizeJson
                label="manifest.json（脱敏）"
                code={JSON.stringify(detail.manifestSummary, null, 2)}
              />
            </div>

            {/* PrivacyScan 发现 */}
            <div>
              <h4 className="mb-1.5 text-sm font-semibold text-text">
                隐私扫描发现
              </h4>
              <PrivacyScanFindings findings={detail.scanFindings} />
            </div>

            {/* 举报详情（来源为举报时） */}
            {detail.report && <ReportDetailCard report={detail.report} />}
          </div>
        ) : null}
      </Card>

      {/* 处置动作（含审核意见 + 二次确认） */}
      <Card>
        <h4 className="mb-2 text-sm font-semibold text-text">处置</h4>
        <ModerationActionBar item={item} busy={busy} onModerate={onModerate} />
      </Card>
    </section>
  );
}
