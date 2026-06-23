"use client";

import { Icon } from "@/components/shared";
import { SUBTLE_TONE } from "@/components/shared/tone";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/queries/admin";
import type { Tone } from "@/lib/types";

/*
  COMP-174 RiskLabel（风险等级文字标签）。
  与隐私门 StatusPill(pass/warn/block) 语义不同：这里表「风险等级」（无/低/中/高，ASM-101）。
  等级必须有文字而非仅靠颜色（NFR-007 硬项）；high 含 priority_high 图标。
*/
export interface RiskLabelProps {
  level: RiskLevel;
  text: string;
}

const LEVEL_META: Record<
  RiskLevel,
  { tone: Tone; word: string; icon?: string }
> = {
  none: { tone: "success", word: "无风险" },
  low: { tone: "info", word: "低风险" },
  medium: { tone: "warning", word: "中风险" },
  high: { tone: "danger", word: "高风险", icon: "priority_high" },
};

export function RiskLabel({ level, text }: RiskLabelProps) {
  const meta = LEVEL_META[level];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1 rounded-pill px-2 py-0.5 text-[11px] font-medium",
          SUBTLE_TONE[meta.tone]
        )}
      >
        {meta.icon && <Icon name={meta.icon} size={12} aria-hidden />}
        {/* 等级以文字词表达，移除颜色仍可辨（NFR-007） */}
        <span>{meta.word}</span>
      </span>
      {text && <span className="text-xs text-text-muted">{text}</span>}
    </span>
  );
}
