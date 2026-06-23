"use client";

import { PrimaryButton } from "@/components/shared/primary-button";
import { SecondaryButton } from "@/components/shared/secondary-button";

/*
  COMP-078 WizardNav（向导底部导航条，PAGE-020~024）。
  承载按步禁用规则：「下一步 / 提交」可用性由外壳综合 canProceed 传入（INV-02 在导航层的强制点之一）。
  纯导航控件，不持有业务校验；禁用态给 aria-disabled + 文字原因（NFR-007）。
*/
export interface WizardNavProps {
  step: 1 | 2 | 3 | 4 | 5;
  canProceed: boolean;
  canGoBack: boolean;
  isLastStep: boolean;
  busy?: boolean;
  /** 禁用「下一步」时的可读原因（如「存在阻断项」），用于无障碍说明 */
  disabledReason?: string;
  /** 隐私门步：前进控件由 PrivacyGatePanel 的三态门承载，导航条隐藏主前进按钮（避免双「下一步」） */
  hideNext?: boolean;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onExit?: () => void;
}

export function WizardNav({
  step,
  canProceed,
  canGoBack,
  isLastStep,
  busy = false,
  disabledReason,
  hideNext = false,
  onNext,
  onBack,
  onSaveDraft,
  onExit,
}: WizardNavProps) {
  const nextDisabled = !canProceed || busy;
  return (
    <div
      data-step={step}
      className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"
    >
      <div className="flex items-center gap-2">
        {canGoBack && (
          <SecondaryButton iconLeft="chevron_left" onClick={onBack} disabled={busy}>
            上一步
          </SecondaryButton>
        )}
        <SecondaryButton variant="ghost" onClick={onSaveDraft} disabled={busy}>
          保存草稿
        </SecondaryButton>
        {onExit && (
          <SecondaryButton variant="ghost" onClick={onExit} disabled={busy}>
            退出向导
          </SecondaryButton>
        )}
      </div>

      {!hideNext && (
        <div className="flex items-center gap-3">
          {nextDisabled && disabledReason && (
            <span className="text-xs text-text-muted">{disabledReason}</span>
          )}
          <PrimaryButton
            iconRight={isLastStep ? undefined : "chevron_right"}
            disabled={nextDisabled}
            aria-disabled={nextDisabled}
            loading={busy}
            onClick={nextDisabled ? undefined : onNext}
          >
            {isLastStep ? "提交" : "下一步"}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
