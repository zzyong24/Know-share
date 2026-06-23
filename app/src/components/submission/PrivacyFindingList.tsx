"use client";

import { StatusPill } from "@/components/shared/status-pill";
import { IconChip } from "@/components/shared/icon-chip";
import { SecondaryButton } from "@/components/shared/secondary-button";
import { PRIVACY_RESULT_META } from "@/components/shared/status-pill";
import type {
  FindingSeverity,
  PrivacyFindingDetail,
  RuleCategory,
} from "@/lib/queries/submission";

/*
  COMP-075 PrivacyFindingList（第 3 步右栏：扫描发现列表，PAGE-022）。
  按 severity（block→warn→pass）分组渲染；每项显示规则类别 + 命中位置（locationRef，
  绝不回显原始私有值全文，INV-01/INV-04）+ 泛化建议。纯展示 + 逐项动作回调。
*/
const RULE_LABEL: Record<RuleCategory, string> = {
  "secret/credential": "密钥 / 凭据",
  email: "邮箱",
  path: "本地 / 私有路径",
  "private-url": "私有 URL",
  "long-excerpt": "长摘录 / 疑似原文",
  "third-party-pii": "第三方个人数据",
  "contact-exposure": "联系方式暴露",
};

const RULE_ICON: Record<RuleCategory, string> = {
  "secret/credential": "lock",
  email: "person",
  path: "folder",
  "private-url": "open_in_new",
  "long-excerpt": "description",
  "third-party-pii": "group",
  "contact-exposure": "person",
};

const SEVERITY_ORDER: FindingSeverity[] = ["block", "warn", "pass"];
const SEVERITY_TITLE: Record<FindingSeverity, string> = {
  block: "必须解决的阻断项",
  warn: "需确认的警告项",
  pass: "已通过项",
};

export interface PrivacyFindingListProps {
  findings: PrivacyFindingDetail[];
  sensitivityDeclaration: string;
  counts: { pass: number; warn: number; block: number };
  onReviseField?: (locationRef: string) => void;
}

export function PrivacyFindingList({
  findings,
  sensitivityDeclaration,
  counts,
  onReviseField,
}: PrivacyFindingListProps) {
  if (findings.length === 0) {
    return (
      <p className="rounded-control border border-success/30 bg-success/5 p-3 text-sm text-text-muted">
        未检出任何隐私风险，全部通过。
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-text-subtle">
        敏感度声明：<span className="font-medium text-text">{sensitivityDeclaration}</span>
      </p>
      {SEVERITY_ORDER.map((sev) => {
        const group = findings.filter((f) => f.severity === sev);
        if (group.length === 0) return null;
        const meta = PRIVACY_RESULT_META[sev];
        return (
          <section key={sev} aria-label={SEVERITY_TITLE[sev]}>
            <div className="mb-2 flex items-center gap-2">
              <StatusPill tone={meta.tone} label={meta.label} icon={meta.icon} size="sm" />
              <span className="text-sm font-medium text-text">
                {SEVERITY_TITLE[sev]}（{counts[sev]}）
              </span>
            </div>
            <ul className="flex flex-col gap-2">
              {group.map((f, i) => (
                <li
                  key={`${sev}-${i}`}
                  className="rounded-control border border-border p-3 text-sm"
                >
                  <div className="flex items-start gap-2">
                    <IconChip
                      icon={RULE_ICON[f.ruleCategory]}
                      size="sm"
                      tone={meta.tone}
                      label={RULE_LABEL[f.ruleCategory]}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-text">
                          {RULE_LABEL[f.ruleCategory]}
                        </span>
                        <code className="rounded bg-muted px-1 font-mono text-xs text-text-muted">
                          {f.locationRef}
                        </code>
                      </div>
                      <p className="mt-1 text-text-muted">{f.explanation}</p>
                      <p className="mt-0.5 text-text">建议：{f.suggestion}</p>
                      {(sev === "block" || sev === "warn") && onReviseField && (
                        <SecondaryButton
                          size="sm"
                          variant="ghost"
                          iconLeft="edit"
                          className="mt-2"
                          onClick={() => onReviseField(f.locationRef)}
                          aria-label={`去修订字段 ${f.locationRef}`}
                        >
                          去修订
                        </SecondaryButton>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
