"use client";

import { useState } from "react";
import { PrimaryButton, SecondaryButton } from "@/components/shared";
import { ReviewNoteInput } from "./review-note-input";
import { DestructiveConfirmDialog } from "./destructive-confirm-dialog";
import type {
  AdminReviewItem,
  ModerationAction,
} from "@/lib/queries/admin";

/*
  COMP-175 ModerationActionBar（处置动作条）。
  动作集随状态与风险动态：block 行主动作「下架」+「退回」，无「通过」（INV-02）；
  pass/warn 行「通过」+「退回」。破坏性动作（下架）经二次确认 COMP-178；
  退回/下架/驳回原因必填（ASM-051/INV-11）；不自动越过人工同意（产品边界第 3 条）。
  审计写入失败由调用方处理（处置回滚 + 报错，INV-11）。
*/
export interface ModerationActionBarProps {
  item: AdminReviewItem;
  busy?: boolean;
  rateLimited?: boolean;
  /** 提交处置：返回 Promise 以便调用方控制 busy / 错误回滚 */
  onModerate: (action: ModerationAction, reason: string) => void | Promise<void>;
}

export function ModerationActionBar({
  item,
  busy = false,
  rateLimited = false,
  onModerate,
}: ModerationActionBarProps) {
  const [reason, setReason] = useState("");
  const [returnTouched, setReturnTouched] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isBlock = item.gate === "block";
  const disabled = busy || rateLimited;

  // 退回：原因必填（ASM-051）。原因未填时禁用退回。
  const returnDisabled = disabled || !reason.trim();

  const handleApprove = () => onModerate("approve", reason);

  const handleReturn = () => {
    setReturnTouched(true);
    if (!reason.trim()) return;
    onModerate("return", reason);
  };

  const handleDelistConfirmed = async () => {
    await onModerate("delist", reason);
    setConfirmOpen(false);
  };

  const handleDismissReport = () => {
    setReturnTouched(true);
    if (!reason.trim()) return;
    onModerate("dismiss-report", reason);
  };

  return (
    <div className="flex flex-col gap-3">
      <ReviewNoteInput
        value={reason}
        required={!isBlock ? true : true /* 退回/下架/驳回均需原因 */}
        onChange={setReason}
        error={
          returnTouched && !reason.trim() ? "处置原因为必填项" : undefined
        }
      />

      <div className="flex flex-wrap gap-2">
        {/* block 行无「通过」（INV-02） */}
        {!isBlock && (
          <PrimaryButton
            size="sm"
            iconLeft="check_circle"
            disabled={disabled}
            loading={busy}
            onClick={handleApprove}
          >
            通过
          </PrimaryButton>
        )}

        {item.kind === "report" ? (
          <SecondaryButton
            size="sm"
            iconLeft="gavel"
            disabled={returnDisabled}
            onClick={handleDismissReport}
          >
            驳回举报
          </SecondaryButton>
        ) : (
          <SecondaryButton
            size="sm"
            iconLeft="undo"
            disabled={returnDisabled}
            onClick={handleReturn}
          >
            退回 / 要求修改
          </SecondaryButton>
        )}

        {/* 下架：破坏性，二次确认（COMP-178） */}
        <SecondaryButton
          size="sm"
          variant="outline"
          iconLeft="block"
          disabled={disabled}
          className="text-danger"
          onClick={() => setConfirmOpen(true)}
        >
          下架
        </SecondaryButton>
      </div>

      {rateLimited && (
        <p className="text-xs text-warning">操作过于频繁，请稍后再试（速率限制）。</p>
      )}

      <DestructiveConfirmDialog
        open={confirmOpen}
        action="delist"
        targetSummary={`将下架模块「${item.moduleTitle}」（提交者 @${item.submitterLogin}）。`}
        impactText="下架后该模块不再公开可见，此操作记入审计。"
        requireReason
        reason={reason}
        onReasonChange={setReason}
        busy={busy}
        onConfirm={handleDelistConfirmed}
        onCancel={() => setConfirmOpen(false)}
        onOpenChange={setConfirmOpen}
      />
    </div>
  );
}
