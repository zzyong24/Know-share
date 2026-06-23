"use client";

import { Icon } from "./icon";
import { cn } from "@/lib/utils";

/*
  COMP-022 TopicChip（主题标签）。selected 用 aria-pressed + 勾选（非仅颜色）。
*/
export interface TopicChipProps {
  label: string;
  count?: number;
  selected?: boolean;
  removable?: boolean;
  onClick?: (label: string) => void;
  onRemove?: (label: string) => void;
}

export function TopicChip({
  label,
  count,
  selected = false,
  removable = false,
  onClick,
  onRemove,
}: TopicChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill border px-2.5 py-0.5 text-xs",
        selected
          ? "border-primary bg-primary-subtle font-semibold text-primary"
          : "border-border bg-surface text-text-muted"
      )}
    >
      <button
        type="button"
        aria-pressed={onClick ? selected : undefined}
        onClick={onClick ? () => onClick(label) : undefined}
        disabled={!onClick}
        className={cn(
          "inline-flex items-center gap-1",
          onClick && "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        )}
      >
        {selected && <Icon name="check" size={12} aria-hidden />}
        <span>{label}</span>
        {typeof count === "number" && (
          <span className="text-text-subtle tabular-nums">{count}</span>
        )}
      </button>
      {removable && (
        <button
          type="button"
          aria-label={`移除主题 ${label}`}
          onClick={() => onRemove?.(label)}
          className="rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <Icon name="close" size={12} aria-hidden />
        </button>
      )}
    </span>
  );
}
