"use client";

import { Icon } from "@/components/shared";
import { SUBTLE_TONE } from "@/components/shared/tone";
import { cn } from "@/lib/utils";
import type { ScanFinding } from "@/lib/queries/admin";
import type { Tone } from "@/lib/types";

/*
  COMP-179 PrivacyScanFindings（PrivacyScan 发现项列表）。
  每项含描述 + 分级（高危/中等/低/通过）+ 可选泛化/脱敏建议；分级语义与队列 StatusPill/RiskLabel 一致。
  分级用文字词 + 图标 + 色（非仅颜色，NFR-007）；不含原始内容（INV-01）。
*/
export interface PrivacyScanFindingsProps {
  findings: ScanFinding[];
}

const SEVERITY_META: Record<
  ScanFinding["severity"],
  { tone: Tone; word: string; icon: string; rank: number }
> = {
  high: { tone: "danger", word: "高危", icon: "error", rank: 3 },
  medium: { tone: "warning", word: "中等", icon: "warning", rank: 2 },
  low: { tone: "info", word: "低", icon: "info", rank: 1 },
  pass: { tone: "success", word: "通过", icon: "check_circle", rank: 0 },
};

export function PrivacyScanFindings({ findings }: PrivacyScanFindingsProps) {
  if (findings.length === 0) {
    return <p className="text-sm text-text-muted">无隐私发现。</p>;
  }
  const sorted = [...findings].sort(
    (a, b) => SEVERITY_META[b.severity].rank - SEVERITY_META[a.severity].rank
  );

  return (
    <ul className="flex flex-col gap-2">
      {sorted.map((f) => {
        const meta = SEVERITY_META[f.severity];
        return (
          <li
            key={f.id}
            className="rounded-control border border-border p-2.5 text-sm"
          >
            <div className="flex items-start gap-2">
              <span
                className={cn(
                  "mt-0.5 inline-flex w-fit shrink-0 items-center gap-1 rounded-pill px-2 py-0.5 text-[11px] font-medium",
                  SUBTLE_TONE[meta.tone]
                )}
              >
                <Icon name={meta.icon} size={12} aria-hidden />
                {meta.word}
              </span>
              <div className="min-w-0">
                <p className="text-text">{f.description}</p>
                {f.suggestion && (
                  <p className="mt-1 text-xs text-text-muted">
                    建议：{f.suggestion}
                  </p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
