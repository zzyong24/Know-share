"use client";

import { useState } from "react";
import {
  Card,
  ConfirmDialog,
  FormField,
  Icon,
  PrimaryButton,
  SecondaryButton,
  notify,
} from "@/components/shared";
import { Textarea } from "@/components/ui/textarea";
import type { ExchangeStatus } from "@/lib/types";

/*
  COMP-099 ExchangeOwnerActions（交换操作面板，PAGE-031 私域动作）。
  按 viewerRole + status 门控展示「接受 / 拒绝 / 取消请求」（FLOW-003 状态迁移 W-2）：
  - 被请求方(owner) 且 status=Requested → 「接受」「拒绝」。
  - 请求方(requester) 且 status∈可取消前置(Requested/Accepted/PrivatePreparing) → 「取消请求」。
  拒绝/取消：先内联填写必填原因（后端 cancel 缺原因 → 400），再走 ConfirmDialog 二次确认。
  原因输入放在对话框外、确认前收集（Radix AlertDialog 打开时背景 pointer-events:none）。
  无经济元素（DEC-007）；非参与方/匿名不渲染（INV-03）。
*/
export interface ExchangeOwnerActionsProps {
  viewerRole: "requester" | "owner" | "spectator";
  status: ExchangeStatus;
  isAuthenticated: boolean;
  accepting?: boolean;
  rejecting?: boolean;
  cancelling?: boolean;
  onAccept: () => Promise<void> | void;
  onReject: (reason: string) => Promise<void> | void;
  onCancel: (reason: string) => Promise<void> | void;
}

/** 请求方可取消的前置状态（终态/已拒绝等不可取消）。 */
const CANCELLABLE_STATES: ExchangeStatus[] = [
  "Requested",
  "Accepted",
  "PrivatePreparing",
];

type ReasonMode = "reject" | "cancel" | null;

export function ExchangeOwnerActions({
  viewerRole,
  status,
  isAuthenticated,
  accepting = false,
  rejecting = false,
  cancelling = false,
  onAccept,
  onReject,
  onCancel,
}: ExchangeOwnerActionsProps) {
  // 内联原因收集态（reject/cancel 共用）。
  const [reasonMode, setReasonMode] = useState<ReasonMode>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | undefined>();
  // 二次确认对话框（在原因填好后开启）。
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isOwner = viewerRole === "owner";
  const isRequester = viewerRole === "requester";
  const canRespond = isAuthenticated && isOwner && status === "Requested";
  const canCancel =
    isAuthenticated && isRequester && CANCELLABLE_STATES.includes(status);

  // 无可用操作（非参与方 / 状态不匹配）→ 不渲染面板。
  if (!canRespond && !canCancel) return null;

  const resetReason = () => {
    setReasonMode(null);
    setReason("");
    setReasonError(undefined);
    setConfirmOpen(false);
  };

  // 「继续」：校验必填原因后开二次确认（原因须在对话框打开前填好）。
  const proceedToConfirm = () => {
    if (!reason.trim()) {
      setReasonError("请填写原因（必填）。");
      return;
    }
    setReasonError(undefined);
    setConfirmOpen(true);
  };

  const confirmDestructive = async () => {
    const trimmed = reason.trim();
    const action = reasonMode === "reject" ? onReject : onCancel;
    const successMsg =
      reasonMode === "reject" ? "已拒绝交换请求。" : "已取消交换请求。";
    try {
      await action(trimmed);
      resetReason();
      notify(successMsg, "success");
    } catch {
      setConfirmOpen(false);
      notify("操作失败，请稍后重试。", "error");
    }
  };

  const reasonTitle =
    reasonMode === "reject" ? "拒绝交换请求" : "取消交换请求";
  const confirmTitle =
    reasonMode === "reject" ? "确认拒绝该交换请求？" : "确认取消该交换请求？";
  const confirmDesc =
    reasonMode === "reject"
      ? "拒绝后该请求将关闭，不可恢复。对方将收到通知（含你填写的原因）。"
      : "取消后本次交换将终止，不可恢复。对方将收到通知（含你填写的原因）。";
  const confirmLabel = reasonMode === "reject" ? "确认拒绝" : "确认取消";

  return (
    <Card
      header={
        <h3 className="flex items-center gap-2 text-sm font-semibold text-text">
          <Icon name="swap_horiz" size={16} aria-hidden className="text-primary" />
          交换操作
        </h3>
      }
    >
      {reasonMode ? (
        // ── 内联原因收集态 ──────────────────────────────
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-text">{reasonTitle}</p>
          <FormField
            label="原因"
            required
            error={reasonError}
            renderControl={(p) => (
              <Textarea
                {...p}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (reasonError) setReasonError(undefined);
                }}
                rows={3}
                placeholder="请简要说明原因…"
              />
            )}
          />
          <div className="flex gap-2">
            <SecondaryButton variant="ghost" onClick={resetReason}>
              返回
            </SecondaryButton>
            <PrimaryButton iconLeft="check" onClick={proceedToConfirm}>
              继续
            </PrimaryButton>
          </div>
        </div>
      ) : (
        // ── 操作按钮态 ──────────────────────────────────
        <div className="flex flex-col gap-2">
          {canRespond && (
            <>
              <PrimaryButton
                iconLeft="check"
                loading={accepting}
                fullWidth
                onClick={async () => {
                  try {
                    await onAccept();
                    notify("已接受交换请求。", "success");
                  } catch {
                    notify("操作失败，请稍后重试。", "error");
                  }
                }}
              >
                接受
              </PrimaryButton>
              <SecondaryButton
                iconLeft="close"
                variant="outline"
                fullWidth
                onClick={() => {
                  setReason("");
                  setReasonError(undefined);
                  setReasonMode("reject");
                }}
              >
                拒绝
              </SecondaryButton>
            </>
          )}

          {canCancel && (
            <SecondaryButton
              iconLeft="close"
              variant="outline"
              fullWidth
              onClick={() => {
                setReason("");
                setReasonError(undefined);
                setReasonMode("cancel");
              }}
            >
              取消请求
            </SecondaryButton>
          )}
        </div>
      )}

      {/* 二次确认（在原因填好后开启；破坏性 danger） */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        description={confirmDesc}
        confirmLabel={confirmLabel}
        tone="danger"
        loading={rejecting || cancelling}
        onConfirm={confirmDestructive}
        onCancel={() => setConfirmOpen(false)}
        onOpenChange={setConfirmOpen}
      />
    </Card>
  );
}
