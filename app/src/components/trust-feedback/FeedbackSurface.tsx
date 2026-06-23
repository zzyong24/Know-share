"use client";

import { notify, SkeletonBlock } from "@/components/shared";
import { FeedbackForm } from "./FeedbackForm";
import {
  useFeedbackEligibility,
  useSubmitFeedback,
} from "@/lib/queries/trust-feedback";

/*
  PAGE-042 结构化反馈提交（子 surface）。
  归属说明：反馈「在哪触发」属交换生命周期（exchange 模块 IA-006），但「评什么维度/如何计权/如何校验」
  是信任语义真源，归 trust-feedback。本组件把 COMP-116 FeedbackForm 接上资格查询 + 提交 mutation，
  供 exchange 模块在交换详情（深链 ?feedback=1）嵌入复用——exchange 只需传 exchangeId。
  提交（FLOW-004）写 ENT-010 + 触发 ENT-011 重算 + 审计（INV-11）+ 通知（FLOW-006）。
*/
export interface FeedbackSurfaceProps {
  exchangeId: string;
  /** 对方 login，用于提交成功后失效其信任档案缓存 */
  peerLogin?: string;
  allowDraft?: boolean;
  onSubmitted?: () => void;
}

export function FeedbackSurface({
  exchangeId,
  peerLogin,
  allowDraft = false,
  onSubmitted,
}: FeedbackSurfaceProps) {
  const { data, isLoading } = useFeedbackEligibility(exchangeId);
  const submit = useSubmitFeedback(peerLogin ?? data?.peerHandle);

  if (isLoading || !data) {
    return <SkeletonBlock variant="card" />;
  }

  return (
    <FeedbackForm
      exchangeContext={{
        peerHandle: data.peerHandle,
        moduleTitle: data.moduleTitle,
        statusLabel: data.statusLabel,
      }}
      submissionState={data.submissionState}
      submitting={submit.isPending}
      allowDraft={allowDraft}
      onSubmit={(payload) =>
        submit.mutate(
          { exchangeId, scores: payload.scores, publicComment: payload.publicComment },
          {
            onSuccess: () => {
              notify("反馈已提交，已计入对方信任分。", "success");
              onSubmitted?.();
            },
            onError: () => notify("反馈提交失败，请稍后重试。", "error"),
          }
        )
      }
      onSaveDraft={
        allowDraft ? () => notify("草稿已保存。", "success") : undefined
      }
    />
  );
}
