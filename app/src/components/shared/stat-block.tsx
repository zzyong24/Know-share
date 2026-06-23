"use client";

import { useId } from "react";
import { IconChip } from "./icon-chip";
import { Icon } from "./icon";
import { SkeletonBlock } from "./skeleton-block";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/types";

/*
  COMP-014 StatBlock（统计数字块）。大数字 + label（aria 关联）+ 可选趋势。
  趋势非仅颜色：含箭头图标 + 文字（NFR-007）。数字 tabular-nums。
*/
export interface StatBlockProps {
  value: string | number;
  label: string;
  icon?: string;
  tone?: Tone;
  trend?: { direction: "up" | "down" | "flat"; delta: string };
  loading?: boolean;
  onClick?: () => void;
}

const TREND_META = {
  up: { icon: "trending_up", cls: "text-success", word: "上升" },
  down: { icon: "trending_down", cls: "text-danger", word: "下降" },
  flat: { icon: "trending_flat", cls: "text-text-muted", word: "持平" },
} as const;

export function StatBlock({
  value,
  label,
  icon,
  tone = "primary",
  trend,
  loading = false,
  onClick,
}: StatBlockProps) {
  const labelId = useId();
  const valueId = useId();

  if (loading) {
    return <SkeletonBlock variant="stat" />;
  }

  const isEmpty = value === "" || value === null || value === undefined;
  const tm = trend ? TREND_META[trend.direction] : null;

  const inner = (
    <div className="flex items-start gap-3">
      {icon && <IconChip icon={icon} tone={tone} size="md" />}
      <div className="flex flex-col">
        <span
          id={valueId}
          aria-labelledby={`${valueId} ${labelId}`}
          className="text-2xl font-semibold tabular-nums text-text"
        >
          {isEmpty ? "—" : value}
        </span>
        <span id={labelId} className="text-sm text-text-muted">
          {label}
        </span>
        {tm && (
          <span className={cn("mt-1 inline-flex items-center gap-0.5 text-xs", tm.cls)}>
            <Icon name={tm.icon} size={14} aria-hidden />
            <span aria-label={`较上期${tm.word} ${trend!.delta}`}>{trend!.delta}</span>
          </span>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-card text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        {inner}
      </button>
    );
  }
  return inner;
}
