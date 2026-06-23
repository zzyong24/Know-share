"use client";

import { useState } from "react";
import { TopicChip } from "@/components/shared/topic-chip";
import { SkeletonBlock } from "@/components/shared/skeleton-block";
import type { Topic } from "@/lib/types";

/*
  COMP-044 TopicChipRow（热门主题标签行）。PAGE-002 区域②。
  由共享 COMP-022 TopicChip 编排一行可点击主题（ENT-020），点击 → 上层加入 topic 筛选。
  选中态非仅颜色（TopicChip 自带勾选 + aria-pressed）。空集合不渲染容器。
*/
export interface TopicChipRowProps {
  topics: Topic[];
  selected?: string[];
  maxVisible?: number;
  loading?: boolean;
  onSelect: (topicLabel: string) => void;
}

export function TopicChipRow({
  topics,
  selected = [],
  maxVisible,
  loading = false,
  onSelect,
}: TopicChipRowProps) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-wrap gap-1.5" aria-hidden>
        <SkeletonBlock variant="text" width="64px" />
        <SkeletonBlock variant="text" width="48px" />
        <SkeletonBlock variant="text" width="72px" />
      </div>
    );
  }

  if (topics.length === 0) return null;

  const overflow = typeof maxVisible === "number" && topics.length > maxVisible;
  const visible = overflow && !expanded ? topics.slice(0, maxVisible) : topics;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((t) => (
        <TopicChip
          key={t.id}
          label={t.label}
          count={t.moduleCount}
          selected={selected.includes(t.label)}
          onClick={onSelect}
        />
      ))}
      {overflow && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((e) => !e)}
          className="rounded-pill px-2.5 py-0.5 text-xs text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          {expanded ? "收起" : `更多 ${topics.length - (maxVisible ?? 0)}`}
        </button>
      )}
    </div>
  );
}
