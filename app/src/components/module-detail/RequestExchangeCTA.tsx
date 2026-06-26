"use client";

/*
  COMP-056 RequestExchangeCTA（请求交换入口，PAGE-015）。
  唯一主色 PrimaryButton，连 FLOW-003；支持单向请求（DEC-009/INV-05）。
  本页绝不披露联系方式（INV-03/DEC-010）：「Contact Commitment」仅说明性占位/锁定态（ASM-021）。
  未登录 → 登录引导；owner 自看 → 隐藏/禁用；已有活动交换 → 改「查看进行中的交换」。
*/
import { Card, PrimaryButton, SecondaryButton, Icon } from "@/components/shared";

export interface RequestExchangeCTAProps {
  moduleId: string;
  exchangeIntent?: string;
  isAuthenticated: boolean;
  isOwnerViewing: boolean;
  /** 生命周期：作者看自己「Draft」时给「去发布」而非「请求交换/已发布」。 */
  lifecycleState?: "Published" | "Draft" | "Delisted" | "NotFound";
  activeExchange?: { exchangeId: string };
  contactCommitmentText?: string;
  onRequestExchange?: () => void;
  onViewActiveExchange?: () => void;
  onPublish?: () => void;
  onRequireLogin?: () => void;
}

const DEFAULT_CONTACT_COMMITMENT =
  "联系方式默认私密，仅在交换被接受后于交换详情页披露。本页不展示任何真实联系方式。";

export function RequestExchangeCTA({
  exchangeIntent,
  isAuthenticated,
  isOwnerViewing,
  lifecycleState,
  activeExchange,
  contactCommitmentText,
  onRequestExchange,
  onViewActiveExchange,
  onPublish,
  onRequireLogin,
}: RequestExchangeCTAProps) {
  const isOwnerDraft = isOwnerViewing && lifecycleState === "Draft";
  const handleRequest = () => {
    if (!isAuthenticated) {
      onRequireLogin?.();
      return;
    }
    onRequestExchange?.();
  };

  return (
    <Card>
      <div className="flex flex-col gap-4">
        {exchangeIntent && (
          <div>
            <p className="text-xs font-medium text-text-muted">期望交换方向</p>
            <p className="mt-1 text-sm text-text">{exchangeIntent}</p>
          </div>
        )}

        {/* 主 CTA：同屏唯一主色实心按钮（UI_RULES） */}
        {isOwnerDraft ? (
          <PrimaryButton fullWidth size="lg" iconLeft="publish" onClick={onPublish}>
            发布
          </PrimaryButton>
        ) : isOwnerViewing ? (
          <PrimaryButton fullWidth disabled aria-disabled>
            这是你发布的模块
          </PrimaryButton>
        ) : activeExchange ? (
          <SecondaryButton
            fullWidth
            variant="outline"
            iconRight="swap_horiz"
            onClick={onViewActiveExchange}
          >
            查看进行中的交换
          </SecondaryButton>
        ) : (
          <PrimaryButton
            fullWidth
            size="lg"
            iconLeft="swap_horiz"
            onClick={handleRequest}
          >
            请求交换
          </PrimaryButton>
        )}

        {isOwnerViewing && (
          <p className="text-xs text-text-muted">
            {isOwnerDraft
              ? "这是你的草稿，仅你可见；点「发布」并确认后即公开（仅脱敏清单，不含原文）。"
              : "你不能向自己的模块发起交换请求。"}
          </p>
        )}

        {/* Contact Commitment：仅说明性占位/锁定态，不露真实联系方式（ASM-021/INV-03） */}
        <div className="rounded-control border border-border bg-muted p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
            <Icon name="lock" size={14} aria-hidden />
            Contact Commitment（联系方式承诺）
          </p>
          <p className="mt-1 text-sm text-text-muted">
            {contactCommitmentText ?? DEFAULT_CONTACT_COMMITMENT}
          </p>
        </div>
      </div>
    </Card>
  );
}
