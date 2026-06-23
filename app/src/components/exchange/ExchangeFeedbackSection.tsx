"use client";

import type { ReactNode } from "react";
import { Card, Icon, StatusPill } from "@/components/shared";
import type { ExchangeStatus } from "@/lib/types";

/*
  COMP-097 ExchangeFeedbackSection（结构化反馈区·状态门控容器）。
  本组件是反馈区的「状态门控外壳」，按 FLOW-003/FLOW-004 门控反馈的可见/可填。
  ★ 结构化反馈表单本体的唯一真源是 trust-feedback 的 COMP-116 FeedbackForm。
     本容器不重复组合 COMP-035/COMP-030/COMP-007 自建第二套表单，而是通过
     renderFeedbackForm 插槽嵌入 COMP-116（由 trust-feedback 模块注入）。
  本区不计算信任权重（INV-10，权重在信任模块）。

  门控（与 PAGE-031 States 对齐）：
   - 锁定态（< Completed）：灰化 + 文字说明，不挂载 COMP-116。
   - 开启态（Completed/WaitingForFeedback，窗口 open）：挂载 renderFeedbackForm（COMP-116）。
   - 已提交态：展示己方反馈摘要，等待/显示对方反馈。
   - 窗口已关闭（Closed）：只读「反馈窗口已结束」，缺失方不可补（ASM-011）。
*/
export interface ExchangeFeedbackSummary {
  /** 已提交反馈的可读摘要（公开评论/维度概览；不含 PII）。 */
  summary: string;
  submittedAt: string;
}

export interface ExchangeFeedbackSectionProps {
  exchangeStatus: ExchangeStatus;
  viewerRole: "requester" | "owner" | "spectator";
  windowState: "open" | "closed";
  myFeedback?: ExchangeFeedbackSummary;
  peerFeedback?: ExchangeFeedbackSummary;
  /**
    嵌入 trust-feedback COMP-116 FeedbackForm 的插槽（反馈表单真源）。
    仅在开启态调用；trust-feedback 模块就绪后由 PAGE-031 注入实际 COMP-116。
  */
  renderFeedbackForm?: () => ReactNode;
}

const OPEN_STATES: ExchangeStatus[] = ["Completed", "WaitingForFeedback"];

function FeedbackSummaryBlock({
  title,
  feedback,
}: {
  title: string;
  feedback: ExchangeFeedbackSummary;
}) {
  return (
    <div className="rounded-control border border-border bg-muted/30 p-3">
      <p className="mb-1 text-xs font-semibold text-text">{title}</p>
      <p className="text-sm text-text-muted">{feedback.summary}</p>
      <time
        dateTime={feedback.submittedAt}
        className="mt-1 block text-[11px] text-text-subtle"
      >
        提交于 {feedback.submittedAt}
      </time>
    </div>
  );
}

export function ExchangeFeedbackSection({
  exchangeStatus,
  viewerRole,
  windowState,
  myFeedback,
  peerFeedback,
  renderFeedbackForm,
}: ExchangeFeedbackSectionProps) {
  const isParticipant = viewerRole === "requester" || viewerRole === "owner";
  const windowClosed = windowState === "closed" || exchangeStatus === "Closed";
  const open = OPEN_STATES.includes(exchangeStatus) && !windowClosed;

  let body: ReactNode;
  if (!open && !windowClosed) {
    // 锁定态：灰化 + 文字说明，不挂载 COMP-116。
    body = (
      <div
        className="flex flex-col items-center gap-2 py-6 text-center opacity-60 grayscale"
        aria-disabled
      >
        <Icon name="lock" size={20} aria-hidden className="text-text-subtle" />
        <p className="text-sm text-text-muted">待交换完成后开启反馈。</p>
      </div>
    );
  } else if (windowClosed) {
    // 窗口已关闭（ASM-011）。
    body = (
      <div className="flex items-center gap-2 py-4 text-sm text-text-muted">
        <StatusPill tone="neutral" label="反馈窗口已结束" icon="schedule" size="sm" />
        <span>反馈窗口已结束，缺失方无法补交。</span>
      </div>
    );
  } else if (myFeedback) {
    // 已提交态：展示己方 + 等待/显示对方。
    body = (
      <div className="space-y-3">
        <FeedbackSummaryBlock title="你的反馈" feedback={myFeedback} />
        {peerFeedback ? (
          <FeedbackSummaryBlock title="对方反馈" feedback={peerFeedback} />
        ) : (
          <p className="text-xs text-text-subtle">等待对方提交反馈…</p>
        )}
      </div>
    );
  } else if (isParticipant) {
    // 开启态：嵌入 COMP-116（反馈表单真源）。
    body = renderFeedbackForm ? (
      <>{renderFeedbackForm()}</>
    ) : (
      // trust-feedback COMP-116 尚未接入时的占位（不自建第二套表单）。
      <div className="rounded-control border border-dashed border-border p-4 text-sm text-text-muted">
        反馈表单将由结构化反馈表单（COMP-116）提供。交换已开启反馈，请稍后填写五维度评分。
      </div>
    );
  } else {
    // 旁观者：开启但非参与方。
    body = (
      <p className="py-4 text-sm text-text-subtle">仅交换参与方可提交反馈。</p>
    );
  }

  return (
    <Card header={<h3 className="text-base font-semibold text-text">评价与反馈</h3>}>
      {body}
    </Card>
  );
}
