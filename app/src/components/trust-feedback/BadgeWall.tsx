"use client";

import { IconChip, EmptyState, SkeletonBlock } from "@/components/shared";
import type { BadgeEntry } from "@/lib/queries/trust-feedback";

/*
  COMP-113 BadgeWall（徽章墙）。
  ENT-012 已获徽章网格：图标 + 名称 + 授予条件 tooltip（如「完成 10 次零争议交换」）。
  徽章名称为文字（非仅图标/颜色，NFR-007）；tooltip 键盘可达（title + 可聚焦）。
  徽章不可购买/无价格（DEC-007）。
*/
export interface BadgeWallProps {
  badges: BadgeEntry[];
  loading?: boolean;
}

export function BadgeWall({ badges, loading = false }: BadgeWallProps) {
  if (loading) return <SkeletonBlock variant="text" count={2} />;

  if (badges.length === 0) {
    return (
      <EmptyState
        icon="star"
        title="尚未获得徽章"
        description="徽章随交换与贡献逐步解锁。"
      />
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {badges.map((b) => (
        <li key={b.type}>
          <button
            type="button"
            title={b.criteria}
            aria-label={`徽章：${b.name}。授予条件：${b.criteria}`}
            className="flex w-full items-center gap-2 rounded-card border border-border bg-surface p-2.5 text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <IconChip icon={b.iconName} tone="primary" size="md" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-text">
                {b.name}
              </span>
              <span className="block truncate text-xs text-text-subtle">
                {b.criteria}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
