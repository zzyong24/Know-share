"use client";

import { useState } from "react";
import { Card } from "@/components/shared/card";
import { StatusPill } from "@/components/shared/status-pill";
import { PrimaryButton } from "@/components/shared/primary-button";
import { SecondaryButton } from "@/components/shared/secondary-button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Icon } from "@/components/shared/icon";
import { PRIVACY_RESULT_META } from "@/components/shared/status-pill";

/*
  COMP-077 SubmitConfirmPanel（第 5 步：提交确认，PAGE-024）。
  提交摘要 + 私下交换机制说明（仅说明，本步不上传内容，ASM-030/INV-01）+ 公开提交同意门
  + 「提交」（经 COMP-025 二次确认）。提交成功写 Consent(提交)+AuditLog，Draft→Submitted。
  防御：overallStatus=block → block-guard 禁提交并指回 PAGE-022（INV-02）；限流 rate-limited（NFR-006）。
*/
export type SubmitState =
  | "idle"
  | "submitting"
  | "submitted"
  | "rate-limited"
  | "block-guard"
  | "error";

export interface SubmitConfirmPanelProps {
  summary: {
    title: string;
    sourceTypes: string[];
    privacyOverall: "pass" | "warn" | "block";
    manifestVersion?: string;
  };
  privateExchangeNote: string;
  consentGiven: boolean;
  submitState: SubmitState;
  onConsentToggle: (checked: boolean) => void;
  onSubmit: () => void;
  onBackToGate: () => void;
  onGoDashboard?: () => void;
}

export function SubmitConfirmPanel({
  summary,
  privateExchangeNote,
  consentGiven,
  submitState,
  onConsentToggle,
  onSubmit,
  onBackToGate,
  onGoDashboard,
}: SubmitConfirmPanelProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isBlocked = summary.privacyOverall === "block" || submitState === "block-guard";
  const submitting = submitState === "submitting";

  if (submitState === "submitted") {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-success/15">
          <Icon name="check_circle" size={28} aria-hidden className="text-success" />
        </span>
        <h2 className="text-lg font-semibold text-text">已提交，进入评审队列</h2>
        <StatusPill tone="neutral" label="审核中" icon="fact_check" />
        <p className="max-w-sm text-sm text-text-muted">
          模块已提交评审。私下交换包将在交换被接受后于 GitHub 私有仓库准备。
        </p>
        <SecondaryButton iconLeft="person" onClick={onGoDashboard}>
          去个人中心查看状态
        </SecondaryButton>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-text">提交确认</h2>
        <div className="rounded-card border border-danger/30 bg-danger/5 p-6 text-center">
          <p className="mb-3 flex items-center justify-center gap-1 text-sm text-danger">
            <Icon name="error" size={16} aria-hidden />
            隐私门存在阻断项，无法提交。请回第 3 步修订后重跑（INV-02）。
          </p>
          <SecondaryButton iconLeft="shield" onClick={onBackToGate}>
            回隐私门
          </SecondaryButton>
        </div>
      </div>
    );
  }

  const privacyMeta = PRIVACY_RESULT_META[summary.privacyOverall];
  const submitDisabled = !consentGiven || submitting;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-text">提交确认</h2>
        <p className="mt-1 text-sm text-text-muted">
          确认后将公开提交此脱敏清单并进入评审队列。
        </p>
      </div>

      <Card header={<h3 className="text-sm font-semibold text-text">提交摘要</h3>}>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-text-muted">模块标题</dt>
            <dd className="text-text">{summary.title}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-text-muted">来源类别</dt>
            <dd className="text-text">{summary.sourceTypes.join("、")}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-text-muted">隐私门结果</dt>
            <dd>
              <StatusPill tone={privacyMeta.tone} label={privacyMeta.label} icon={privacyMeta.icon} />
            </dd>
          </div>
          {summary.manifestVersion && (
            <div className="flex justify-between gap-2">
              <dt className="text-text-muted">清单版本</dt>
              <dd className="font-mono text-text">{summary.manifestVersion}</dd>
            </div>
          )}
        </dl>
      </Card>

      <Card header={<h3 className="text-sm font-semibold text-text">私下交换机制</h3>}>
        <p className="flex items-start gap-1 text-sm text-text-muted">
          <Icon name="shield" size={14} aria-hidden className="mt-0.5" />
          {privateExchangeNote}
        </p>
      </Card>

      {submitState === "rate-limited" && (
        <p className="flex items-center gap-1 rounded-control border border-warning/30 bg-warning/5 p-3 text-sm text-text-muted">
          <Icon name="schedule" size={14} aria-hidden className="text-warning" />
          提交过于频繁，请稍后再试（NFR-006）。
        </p>
      )}
      {submitState === "error" && (
        <p className="flex items-center gap-1 rounded-control border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          <Icon name="error" size={14} aria-hidden />
          提交失败，请稍后重试。
        </p>
      )}

      <section aria-label="公开提交同意门" className="rounded-card border border-border bg-surface p-4">
        <label className="flex items-start gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => onConsentToggle(e.target.checked)}
            className="mt-0.5"
          />
          <span>我确认在所有者同意下公开提交此脱敏清单。</span>
        </label>
        <div className="mt-4">
          <PrimaryButton
            disabled={submitDisabled}
            aria-disabled={submitDisabled}
            loading={submitting}
            onClick={submitDisabled ? undefined : () => setConfirmOpen(true)}
          >
            提交
          </PrimaryButton>
        </div>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="确认公开提交？"
        description="提交后将进入评审队列，并记录一条公开提交同意与审计日志。"
        confirmLabel="确认提交"
        loading={submitting}
        onOpenChange={setConfirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onSubmit();
        }}
      />
    </div>
  );
}
