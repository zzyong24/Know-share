"use client";

/*
  COMP-052 SourceStatsPanel（来源统计与覆盖度区，PAGE-011，#stats）。
  DonutChart（来源类型分布）+ 4 个 StatBlock（覆盖问题数/主题数/交换次数/浏览或收藏，ASM-022）+ freshness StatusPill。
  数字均为聚合派生、无 PII（INV-09）。无 source_types 时隐藏环形图、仅显计数；缺计数显 0。
*/
import { Card, DonutChart, StatBlock, StatusPill } from "@/components/shared";
import type { DonutSegment } from "@/components/shared/donut-chart";
import type { Tone } from "@/lib/types";

export interface SourceStatsPanelProps {
  sourceTypes: { label: string; ratio: number }[];
  stats: { icon: string; label: string; value: number }[];
  freshness?: string;
}

const SEGMENT_TONES: Tone[] = ["primary", "info", "accent", "success", "warning"];

export function SourceStatsPanel({
  sourceTypes,
  stats,
  freshness,
}: SourceStatsPanelProps) {
  const segments: DonutSegment[] = sourceTypes
    .filter((s) => s.ratio > 0)
    .map((s, i) => ({
      label: s.label,
      value: s.ratio,
      tone: SEGMENT_TONES[i % SEGMENT_TONES.length],
    }));

  const summary =
    segments.length > 0
      ? `来源构成：${segments.map((s) => `${s.label} ${s.value}%`).join("、")}`
      : "暂无来源构成数据";

  return (
    <Card
      header={
        <div className="flex items-center justify-between">
          <h2 id="stats" className="text-lg font-semibold text-text">
            来源统计与覆盖度
          </h2>
          {freshness && (
            <StatusPill tone="success" label={freshness} icon="schedule" size="sm" />
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {segments.length > 0 && (
          <DonutChart segments={segments} summary={summary} height={200} />
        )}
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <StatBlock
              key={s.label}
              icon={s.icon}
              label={s.label}
              value={s.value ?? 0}
            />
          ))}
        </dl>
      </div>
    </Card>
  );
}
