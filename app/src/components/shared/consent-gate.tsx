"use client";

import { useState } from "react";
import { Icon } from "./icon";
import { PrimaryButton } from "./primary-button";
import { SUBTLE_TONE } from "./tone";
import { cn } from "@/lib/utils";
import type { PrivacyResult, PrivacyFinding, Tone } from "@/lib/types";

/*
  COMP-020 ConsentGate（隐私/同意门，三态）。INV-02 的 UI 落点：
  - pass：可直接继续
  - warn：需勾选同意后才可继续
  - block：「继续」按钮硬禁用且不可绕过（ASM-071）
  注意：前端拦截非安全边界，最终发布拦截以后端二次校验为准（INV-02）。
*/
const RESULT_META: Record<
  PrivacyResult,
  { tone: Tone; title: string; icon: string }
> = {
  pass: { tone: "success", title: "隐私检查通过", icon: "check_circle" },
  warn: { tone: "warning", title: "存在需要确认的隐私提示", icon: "warning" },
  block: { tone: "danger", title: "存在阻止项，无法发布", icon: "error" },
};

export interface ConsentGateProps {
  result: PrivacyResult;
  findings: PrivacyFinding[];
  consentRequired?: boolean;
  consentText?: string;
  loading?: boolean;
  onConsent?: (checked: boolean) => void;
  onProceed?: () => void;
}

export function ConsentGate({
  result,
  findings,
  consentRequired = result === "warn",
  consentText = "我已知悉上述提示，并确认可以继续。",
  loading = false,
  onConsent,
  onProceed,
}: ConsentGateProps) {
  const [consented, setConsented] = useState(false);
  const meta = RESULT_META[result];

  // INV-02：block 永久禁用继续；warn 需勾选；pass 可继续。
  const proceedDisabled =
    result === "block" ||
    loading ||
    (result === "warn" && consentRequired && !consented);

  const handleConsent = (checked: boolean) => {
    setConsented(checked);
    onConsent?.(checked);
  };

  return (
    <section
      aria-label="隐私门"
      className={cn("rounded-card border p-4", "border-border bg-surface")}
    >
      <div
        className={cn(
          "flex items-center gap-2 rounded-control px-3 py-2",
          SUBTLE_TONE[meta.tone]
        )}
      >
        <Icon name={meta.icon} size={18} aria-hidden />
        <span className="font-medium">{meta.title}</span>
      </div>

      {findings.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {findings.map((f, i) => (
            <li key={i} className="rounded-control border border-border p-2 text-sm">
              <span className="font-medium text-text">{f.message}</span>
              {f.suggestion && (
                <span className="mt-0.5 block text-text-muted">建议：{f.suggestion}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {result === "warn" && consentRequired && (
        <label className="mt-3 flex items-start gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={consented}
            onChange={(e) => handleConsent(e.target.checked)}
            className="mt-0.5"
          />
          <span>{consentText}</span>
        </label>
      )}

      <div className="mt-4 flex items-center gap-3">
        <PrimaryButton
          disabled={proceedDisabled}
          aria-disabled={proceedDisabled}
          loading={loading}
          onClick={proceedDisabled ? undefined : onProceed}
        >
          继续
        </PrimaryButton>
        {result === "block" && (
          <span className="text-sm text-danger">存在阻止项，无法发布。</span>
        )}
      </div>
    </section>
  );
}
