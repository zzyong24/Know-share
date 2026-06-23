"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { ReviewNoteInput } from "./review-note-input";
import { cn } from "@/lib/utils";

/*
  COMP-178 DestructiveConfirmDialog（破坏性操作二次确认）。
  对共享 COMP-025 ConfirmDialog 的 admin 治理特化封装（动作语义 + 必填原因 + 批量集合说明，ASM-102）。
  下架/封禁/批量通过执行前必经本对话框（产品边界第 3 条：不越过人类同意）。
  下架/封禁必填原因（ASM-051/INV-11），未填则确认禁用；批量通过文案显式列条数并排除 block/被举报项（INV-02/ASM-050）。
  AlertDialog 提供焦点陷入 + Esc 取消（NFR-007）；danger 按钮含文字非仅红。
*/
export type DestructiveAction = "delist" | "ban" | "penalize" | "bulk_approve";

export interface DestructiveConfirmDialogProps {
  open: boolean;
  action: DestructiveAction;
  targetSummary: string;
  impactText: string;
  /** 下架/封禁=true（需填原因）；批量通过=false */
  requireReason: boolean;
  reason: string;
  onReasonChange: (v: string) => void;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onOpenChange: (open: boolean) => void;
}

const ACTION_LABEL: Record<DestructiveAction, string> = {
  delist: "确认下架",
  ban: "确认封禁",
  penalize: "确认处罚",
  bulk_approve: "确认批量通过",
};

const ACTION_TITLE: Record<DestructiveAction, string> = {
  delist: "下架模块",
  ban: "封禁用户",
  penalize: "处罚用户",
  bulk_approve: "批量通过",
};

export function DestructiveConfirmDialog({
  open,
  action,
  targetSummary,
  impactText,
  requireReason,
  reason,
  onReasonChange,
  busy = false,
  onConfirm,
  onCancel,
  onOpenChange,
}: DestructiveConfirmDialogProps) {
  const reasonMissing = requireReason && !reason.trim();
  const confirmDisabled = reasonMissing || busy;
  const isDanger = action !== "bulk_approve";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{ACTION_TITLE[action]}</AlertDialogTitle>
          <AlertDialogDescription>
            {targetSummary}
            <br />
            {impactText}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {requireReason && (
          <div className="py-1">
            <ReviewNoteInput
              value={reason}
              required
              onChange={onReasonChange}
              error={reasonMissing ? "处置原因为必填项" : undefined}
              placeholder="说明处置原因（写入审计）…"
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>取消</AlertDialogCancel>
          <AlertDialogAction
            disabled={confirmDisabled}
            aria-disabled={confirmDisabled}
            onClick={confirmDisabled ? (e) => e.preventDefault() : onConfirm}
            className={cn(isDanger && "bg-danger text-white hover:bg-danger/90")}
          >
            {ACTION_LABEL[action]}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
