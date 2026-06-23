"use client";

import Link from "next/link";
import { StatBlock } from "@/components/shared/stat-block";
import { Card } from "@/components/shared/card";
import { cn } from "@/lib/utils";

/*
  COMP-045 PlatformStatsStrip（平台聚合统计条）。PAGE-002 区域④。
  4 个共享 COMP-014 StatBlock（模块/交换/活跃用户/隐私门通过率）+ 说明卡。
  数字千分位；缺失/0 显示「—」/0（不伪造）；error 静默隐藏。仅聚合无 PII（INV-09）。
  与关于页统计区共用同口径（ASM-074）。
*/
export interface PlatformStats {
  modules: number;
  exchanges: number;
  activeUsers: number;
  privacyPassRate: number;
}

export interface StatsNote {
  title: string;
  body: string;
  href?: string;
}

export interface PlatformStatsStripProps {
  stats?: PlatformStats;
  notes?: StatsNote[];
  loading?: boolean;
  error?: boolean;
}

function fmt(n: number | undefined): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US");
}

const ICONS = {
  modules: "inventory_2",
  exchanges: "swap_horiz",
  activeUsers: "group",
  privacyPassRate: "shield",
} as const;

export function PlatformStatsStrip({
  stats,
  notes = [],
  loading = false,
  error = false,
}: PlatformStatsStripProps) {
  // 整段失败 → 静默隐藏，不阻断卡片浏览（PAGE-002 States/Validation）。
  if (error) return null;

  return (
    <section aria-label="平台统计" className="mt-10 border-t border-border pt-8">
      <div
        className={cn(
          "grid gap-4",
          "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
        )}
      >
        <StatBlock
          loading={loading}
          value={fmt(stats?.modules)}
          label="模块总数"
          icon={ICONS.modules}
        />
        <StatBlock
          loading={loading}
          value={fmt(stats?.exchanges)}
          label="交换总数"
          icon={ICONS.exchanges}
          tone="accent"
        />
        <StatBlock
          loading={loading}
          value={fmt(stats?.activeUsers)}
          label="活跃用户"
          icon={ICONS.activeUsers}
          tone="info"
        />
        <StatBlock
          loading={loading}
          value={
            stats?.privacyPassRate === undefined
              ? "—"
              : `${stats.privacyPassRate}%`
          }
          label="隐私门通过率"
          icon={ICONS.privacyPassRate}
          tone="success"
        />
      </div>

      {notes.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Card key={note.title} padding="sm">
              <h3 className="text-sm font-semibold text-text">{note.title}</h3>
              <p className="mt-1 text-sm text-text-muted">{note.body}</p>
              {note.href && (
                <Link
                  href={note.href}
                  className="mt-2 inline-block text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  了解更多
                </Link>
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
