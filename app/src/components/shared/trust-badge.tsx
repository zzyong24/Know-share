"use client";

import { Icon } from "./icon";
import { cn } from "@/lib/utils";
import type { TrustLevel, TrustBadgeItem, Tone } from "@/lib/types";

/*
  COMP-012 TrustBadge（信任徽章）。等级用文字 + 图标（非仅颜色）；可选解释入口（HARD-03）。
*/
export interface TrustBadgeProps {
  level: TrustLevel;
  score?: number;
  label?: string;
  size?: "sm" | "md";
  showScore?: boolean;
  badges?: TrustBadgeItem[];
  onExplain?: () => void;
}

const LEVEL_META: Record<
  TrustLevel,
  { tone: Tone; text: string; icon: string; classes: string }
> = {
  high: { tone: "success", text: "高信任", icon: "verified_user", classes: "bg-success/10 text-success" },
  medium: { tone: "info", text: "中等信任", icon: "shield", classes: "bg-info/10 text-info" },
  low: { tone: "warning", text: "较低信任", icon: "gpp_maybe", classes: "bg-warning/10 text-warning" },
  new: { tone: "neutral", text: "新用户", icon: "person", classes: "bg-muted text-text-muted" },
};

export function TrustBadge({
  level,
  score,
  label,
  size = "md",
  showScore = false,
  badges,
  onExplain,
}: TrustBadgeProps) {
  const meta = LEVEL_META[level];
  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-pill font-medium",
          meta.classes,
          size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1"
        )}
      >
        <Icon name={meta.icon} size={size === "sm" ? 12 : 14} aria-hidden />
        <span>{label ?? meta.text}</span>
        {showScore && typeof score === "number" && (
          <span className="tabular-nums" aria-label={`信用分 ${score} 分`}>
            · {score} 分
          </span>
        )}
      </span>
      {badges?.map((b) => (
        <span
          key={b.type}
          className="inline-flex items-center gap-1 rounded-pill bg-primary-subtle px-2 py-0.5 text-[11px] text-primary"
        >
          <Icon name="verified" size={12} aria-hidden />
          {b.label}
        </span>
      ))}
      {onExplain && (
        <button
          type="button"
          aria-label="查看信任解释"
          onClick={onExplain}
          className="inline-flex items-center text-text-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded"
        >
          <Icon name="info" size={14} aria-hidden />
        </button>
      )}
    </div>
  );
}
