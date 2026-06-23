"use client";

/*
  COMP-053 PrivacyBoundaryCard（隐私边界与内容承诺卡，PAGE-012，#privacy）。
  敏感度 + 隐私门分级摘要 + 脱敏说明 + 内容承诺 + 举报/可审计规则入口。
  绝不渲染原始扫描命中 / 私有路径样例 / 原始内容（INV-01/04）。敏感度/隐私门用 StatusPill + 文字（非仅颜色）。
*/
import {
  Card,
  StatusPill,
  SecondaryButton,
  Icon,
} from "@/components/shared";
import type { Tone } from "@/lib/types";

export interface PrivacyBoundaryCardProps {
  sensitivity: "low" | "medium" | "high";
  privacyGate: "pass" | "warn";
  gateExplanation: string;
  redactionNotes?: string;
  contentCommitment?: string;
  auditRulesUrl: string;
  isAuthenticated: boolean;
  onReport?: () => void;
  onRequireLogin?: () => void;
}

const SENSITIVITY_META: Record<
  PrivacyBoundaryCardProps["sensitivity"],
  { tone: Tone; label: string }
> = {
  low: { tone: "success", label: "低敏感度" },
  medium: { tone: "warning", label: "中敏感度" },
  high: { tone: "danger", label: "高敏感度" },
};

const GATE_META: Record<
  PrivacyBoundaryCardProps["privacyGate"],
  { tone: Tone; label: string; icon: string }
> = {
  pass: { tone: "success", label: "隐私扫描通过", icon: "verified_user" },
  warn: { tone: "warning", label: "隐私扫描需复核", icon: "gpp_maybe" },
};

const DEFAULT_COMMITMENT =
  "公开的只是脱敏清单。平台不托管原始知识内容；私下交付包将与此清单声明保持一致。";

export function PrivacyBoundaryCard({
  sensitivity,
  privacyGate,
  gateExplanation,
  redactionNotes,
  contentCommitment,
  auditRulesUrl,
  isAuthenticated,
  onReport,
  onRequireLogin,
}: PrivacyBoundaryCardProps) {
  const sm = SENSITIVITY_META[sensitivity];
  const gm = GATE_META[privacyGate];

  const handleReport = () => {
    if (!isAuthenticated) {
      onRequireLogin?.();
      return;
    }
    onReport?.();
  };

  return (
    <Card
      header={
        <h2 id="privacy" className="text-lg font-semibold text-text">
          隐私边界与内容承诺
        </h2>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={sm.tone} label={sm.label} icon="shield" size="sm" />
          <StatusPill tone={gm.tone} label={gm.label} icon={gm.icon} size="sm" />
        </div>

        <p className="text-sm text-text-muted">{gateExplanation}</p>

        <div className="rounded-control bg-muted p-3">
          <p className="text-xs font-medium text-text-muted">脱敏说明</p>
          <p className="mt-1 text-sm text-text">
            {redactionNotes ?? DEFAULT_COMMITMENT}
          </p>
        </div>

        <div className="rounded-control border border-primary-subtle bg-primary-subtle/40 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <Icon name="lock" size={14} aria-hidden />
            内容承诺
          </p>
          <p className="mt-1 text-sm text-text">
            {contentCommitment ?? DEFAULT_COMMITMENT}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={auditRulesUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <SecondaryButton
              variant="ghost"
              size="sm"
              iconRight="open_in_new"
              aria-label="查看可审计的隐私规则（在新标签打开）"
            >
              可审计规则
            </SecondaryButton>
          </a>
          <SecondaryButton
            variant="ghost"
            size="sm"
            iconLeft="flag"
            onClick={handleReport}
          >
            举报该模块
          </SecondaryButton>
        </div>
      </div>
    </Card>
  );
}
