"use client";

import { useState } from "react";
import {
  ListRow,
  StatusPill,
  ConfirmDialog,
  EmptyState,
  SkeletonBlock,
  SecondaryButton,
  Icon,
} from "@/components/shared";
import type { ConsentRecord } from "@/lib/queries/account";

/*
  COMP-157 ConsentRecordList（同意 / 披露记录列表，PAGE-063/064）。
  融合 ENT-021 Consent + ENT-009 ContactDisclosure（ASM-046）。
  撤回：ConfirmDialog 二次确认，文案显式「只影响未来、已披露快照不可收回」（ASM-013）；
  撤回按钮键盘可聚焦（非仅 hover）。撤回后行标注「已撤回（仅未来生效）」（文字徽，非仅颜色）。
*/
const ACTION_LABEL: Record<string, string> = {
  generate: "生成",
  submit: "提交",
  contact: "联系披露",
  exchange: "交换",
};

export interface ConsentRecordListProps {
  records: ConsentRecord[];
  loading?: boolean;
  error?: boolean;
  mode?: "disclosure" | "all-consent";
  onRevoke?: (id: string) => void;
  onViewDetail?: (id: string) => void;
  onRetry?: () => void;
}

export function ConsentRecordList({
  records,
  loading = false,
  error = false,
  mode = "disclosure",
  onRevoke,
  onViewDetail,
  onRetry,
}: ConsentRecordListProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const pending = records.find((r) => r.id === pendingId) ?? null;

  if (loading) return <SkeletonBlock variant="row" count={3} />;

  if (error) {
    return (
      <div
        role="alert"
        className="flex items-center justify-between gap-3 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
      >
        <span>记录加载失败</span>
        <SecondaryButton size="sm" onClick={onRetry}>
          重试
        </SecondaryButton>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <EmptyState
        icon="lock_open"
        title={mode === "all-consent" ? "暂无同意记录" : "暂无披露记录"}
        description={
          mode === "all-consent"
            ? "在跨边界动作（生成 / 提交 / 联系 / 交换）时会产生同意记录。"
            : "联系方式仅在交换被接受后才会披露。"
        }
      />
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {records.map((r) => {
          const methods = r.disclosedMethods.length
            ? r.disclosedMethods.join(" + ")
            : null;
          const title =
            methods && r.counterpartyHandle !== "—"
              ? `向 @${r.counterpartyHandle} 披露 ${methods}`
              : r.source;
          return (
            <li key={r.id}>
              <ListRow
                as="div"
                title={
                  <span className="flex items-center gap-2">
                    {title}
                    {mode === "all-consent" && r.actionType && (
                      <StatusPill
                        tone="neutral"
                        label={ACTION_LABEL[r.actionType] ?? r.actionType}
                        size="sm"
                      />
                    )}
                    {r.revoked && (
                      <StatusPill
                        tone="neutral"
                        label="已撤回（仅未来生效）"
                        size="sm"
                        icon="close"
                      />
                    )}
                  </span>
                }
                subtitle={
                  r.exchangeRef ? `${r.source} · ${r.exchangeRef}` : r.source
                }
                meta={<span className="text-xs text-text-muted">{r.date}</span>}
                actions={
                  <div className="flex gap-1">
                    {mode === "all-consent" && onViewDetail && (
                      <SecondaryButton
                        size="sm"
                        variant="ghost"
                        aria-label="查看详情"
                        onClick={() => onViewDetail(r.id)}
                      >
                        详情
                      </SecondaryButton>
                    )}
                    {r.revocable && !r.revoked && (
                      <button
                        type="button"
                        aria-label={`撤回对 @${r.counterpartyHandle} 的披露`}
                        onClick={() => setPendingId(r.id)}
                        className="rounded p-1.5 text-text-muted hover:text-danger focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                      >
                        <Icon name="close" size={16} aria-hidden />
                      </button>
                    )}
                  </div>
                }
              />
            </li>
          );
        })}
      </ul>

      {pending && (
        <ConfirmDialog
          open
          tone="danger"
          title="撤回此次披露？"
          description="撤回只影响未来披露，已披露给对方的快照无法收回。"
          confirmLabel="确认撤回"
          onOpenChange={(o) => !o && setPendingId(null)}
          onCancel={() => setPendingId(null)}
          onConfirm={() => {
            onRevoke?.(pending.id);
            setPendingId(null);
          }}
        />
      )}
    </>
  );
}
