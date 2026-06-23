"use client";

import { useState } from "react";
import {
  RatingInput,
  FormField,
  PrimaryButton,
  SecondaryButton,
  StatusPill,
  Card,
  notify,
} from "@/components/shared";
import { WeightDisclosureNote } from "./WeightDisclosureNote";
import type { FeedbackDimension } from "@/lib/types";

/*
  COMP-116 FeedbackForm（结构化反馈表单）—— 全站结构化反馈的单一真源。
  导出名：FeedbackForm（路径 @/components/trust-feedback/FeedbackForm）。
  由 exchange 模块的交换详情（IA-006）在 WaitingForFeedback 后嵌入复用（深链 ?feedback=1）。

  五维评分（ENT-010）+ 可选公开评论。提交（FLOW-004）写 ENT-010 + 触发 ENT-011 重算 +
  写 AuditLog（INV-11）+ 发通知（FLOW-006，由调用方/通知模块承接）。
  必填校验内联；公开评论敏感信息（疑似邮箱/密钥/私有路径）前端轻量提醒（不替代后端，INV-04）。
  含权重提示（COMP-119，INV-10）；无经济元素（DEC-007）。资格/唯一性由服务端二次校验（NFR-006）。
*/

/** 五维反馈（ENT-010；checklistConsistency 呼应 HARD-07）。模块导出供 exchange 复用。 */
export const FEEDBACK_DIMENSIONS: FeedbackDimension[] = [
  { key: "checklistConsistency", label: "清单一致性", description: "公开清单与私下交付是否一致。" },
  { key: "privacyBoundary", label: "隐私边界", description: "对方是否尊重隐私边界。" },
  { key: "structureClarity", label: "结构清晰度" },
  { key: "usefulness", label: "有用性" },
  { key: "rebuyIntent", label: "再次交换意愿" },
];

/** 公开评论轻量敏感信息检测（疑似邮箱 / 密钥 / 私有路径，INV-04）。 */
const SENSITIVE_PATTERNS: { test: RegExp; label: string }[] = [
  { test: /[\w.+-]+@[\w-]+\.[\w.-]+/, label: "疑似邮箱" },
  { test: /\b(sk|ghp|api[_-]?key|token)[-_=:]?[A-Za-z0-9]{8,}/i, label: "疑似密钥/令牌" },
  { test: /(\/Users\/|\/home\/|C:\\|\.ssh|\.env)/, label: "疑似私有路径" },
];

export function detectSensitive(text: string): string[] {
  return SENSITIVE_PATTERNS.filter((p) => p.test.test(text)).map((p) => p.label);
}

export type FeedbackSubmissionState =
  | "editable"
  | "submitted"
  | "ineligible"
  | "window-closed";

export interface FeedbackFormPayload {
  scores: Record<string, number>;
  publicComment?: string;
}

export interface FeedbackFormProps {
  exchangeContext: { peerHandle: string; moduleTitle: string; statusLabel: string };
  dimensions?: FeedbackDimension[];
  allowPublicComment?: boolean;
  submissionState?: FeedbackSubmissionState;
  allowDraft?: boolean;
  submitting?: boolean;
  onSubmit: (payload: FeedbackFormPayload) => void;
  onSaveDraft?: (payload: FeedbackFormPayload) => void;
  onCancel?: () => void;
}

export function FeedbackForm({
  exchangeContext,
  dimensions = FEEDBACK_DIMENSIONS,
  allowPublicComment = true,
  submissionState = "editable",
  allowDraft = false,
  submitting = false,
  onSubmit,
  onSaveDraft,
  onCancel,
}: FeedbackFormProps) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | undefined>();

  // 非可编辑态：只读说明（资格/窗口）。
  if (submissionState !== "editable") {
    const meta: Record<Exclude<FeedbackSubmissionState, "editable">, { tone: "success" | "neutral" | "warning"; label: string; note: string }> = {
      submitted: { tone: "success", label: "已提交", note: "你已为该次交换提交过反馈，不可重复提交。" },
      ineligible: { tone: "neutral", label: "不可提交", note: "仅该次交换的实际参与方、且交换进入待反馈阶段后可提交。" },
      "window-closed": { tone: "warning", label: "窗口已结束", note: "该次交换已关闭，反馈窗口已结束。" },
    };
    const m = meta[submissionState];
    return (
      <Card>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-text">结构化反馈</h2>
          <StatusPill tone={m.tone} label={m.label} />
        </div>
        <p className="mt-2 text-sm text-text-muted">{m.note}</p>
      </Card>
    );
  }

  const handleSubmit = () => {
    const missing = dimensions.filter((d) => scores[d.key] == null);
    if (missing.length) {
      setError(`请为全部 ${dimensions.length} 个维度评分（还差 ${missing.length} 项）。`);
      return;
    }
    if (comment.trim()) {
      const hits = detectSensitive(comment);
      if (hits.length) {
        notify(
          `公开评论中检测到${hits.join("、")}，将公开展示，请确认已脱敏。`,
          "warning"
        );
        // 提醒但不阻断（后端为权威边界，INV-04）。
      }
    }
    setError(undefined);
    onSubmit({ scores, publicComment: comment.trim() || undefined });
  };

  const payload = (): FeedbackFormPayload => ({
    scores,
    publicComment: comment.trim() || undefined,
  });

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-text">结构化反馈</h2>
            <StatusPill tone="info" label={exchangeContext.statusLabel} />
          </div>
          <p className="mt-1 text-sm text-text-muted">
            评价与 <span className="font-medium text-text">@{exchangeContext.peerHandle}</span>{" "}
            就「{exchangeContext.moduleTitle}」的本次交换。
          </p>
        </div>

        {/* 权重提示（INV-10，COMP-119） */}
        <WeightDisclosureNote context="feedback-form" />

        <RatingInput
          dimensions={dimensions}
          value={scores}
          required
          error={error}
          onChange={(key, score) =>
            setScores((prev) => ({ ...prev, [key]: score }))
          }
        />

        {allowPublicComment && (
          <FormField
            label="公开评论（可选）"
            description="将公开展示在对方的信任档案反馈质量区，请勿包含邮箱 / 密钥 / 私有路径。"
            renderControl={(ctrl) => (
              <textarea
                {...ctrl}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full rounded-control border border-border bg-surface p-2 text-sm text-text focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              />
            )}
          />
        )}

        <div className="flex flex-wrap items-center gap-2">
          <PrimaryButton
            type="button"
            iconLeft="send"
            loading={submitting}
            onClick={handleSubmit}
          >
            提交反馈
          </PrimaryButton>
          {allowDraft && onSaveDraft && (
            <SecondaryButton onClick={() => onSaveDraft(payload())}>
              保存草稿
            </SecondaryButton>
          )}
          {onCancel && (
            <SecondaryButton variant="ghost" onClick={onCancel}>
              取消
            </SecondaryButton>
          )}
        </div>
      </div>
    </Card>
  );
}
