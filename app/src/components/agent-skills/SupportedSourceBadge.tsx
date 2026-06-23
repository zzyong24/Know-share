"use client";

import { IconChip } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { SupportedSource } from "@/lib/queries/agent-skills";

/*
  COMP-134 SupportedSourceBadge（来源支持标记）。
  着色 IconChip（单一图标族）+ 名称；展示性为主，有 href 则降级为次级链接。
  非动作：不读取本地来源、不触发技能（PAGE-050 边界）。
*/
export interface SupportedSourceBadgeProps {
  source: SupportedSource;
  asLink?: boolean;
  onClick?: () => void;
}

export function SupportedSourceBadge({
  source,
  asLink = false,
  onClick,
}: SupportedSourceBadgeProps) {
  const linked = asLink && !!source.href;
  const inner = (
    <>
      <IconChip icon={source.iconChip.glyph} tone={source.iconChip.tone} size="sm" />
      <span className="text-sm text-text">{source.name}</span>
    </>
  );

  const baseCls =
    "inline-flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2";

  if (linked) {
    return (
      <a
        href={source.href}
        onClick={onClick}
        className={cn(
          baseCls,
          "transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        )}
      >
        {inner}
      </a>
    );
  }

  return <span className={baseCls}>{inner}</span>;
}
