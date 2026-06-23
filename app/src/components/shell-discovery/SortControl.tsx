"use client";

import { cn } from "@/lib/utils";
import type { SortKey } from "@/lib/types";

/*
  COMP-043 SortControl（排序控件）。PAGE-002 区域②排序。
  维度（ASM-017）：相关度 / 最新 / 最热门 / 信任分。受控（value 来自 URL）；onChange 上抛。
  当前项 aria-checked + 文字标签（非仅颜色，NFR-007）。radiogroup 语义、键盘可达。
*/

const SORT_LABEL: Record<SortKey, string> = {
  relevance: "相关度",
  latest: "最新",
  popular: "最热门",
  trust: "信任分",
};

const DEFAULT_OPTIONS: SortKey[] = ["relevance", "latest", "popular", "trust"];

export interface SortControlProps {
  value: SortKey;
  options?: SortKey[];
  disabled?: boolean;
  onChange: (next: SortKey) => void;
}

export function SortControl({
  value,
  options = DEFAULT_OPTIONS,
  disabled = false,
  onChange,
}: SortControlProps) {
  // 非法 value → 渲染回退（上层亦回退默认）。
  const current = options.includes(value) ? value : options[0];
  return (
    <div
      role="radiogroup"
      aria-label="排序方式"
      className="inline-flex items-center gap-1 rounded-pill border border-border bg-surface p-0.5"
    >
      {options.map((opt) => {
        const active = opt === current;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt)}
            className={cn(
              "rounded-pill px-3 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:opacity-50",
              active
                ? "bg-primary text-white"
                : "text-text-muted hover:text-primary"
            )}
          >
            {SORT_LABEL[opt]}
          </button>
        );
      })}
    </div>
  );
}
