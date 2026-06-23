"use client";

import { LineChart, SkeletonBlock } from "@/components/shared";

/*
  COMP-112 ReputationTrend（声誉趋势折线）。
  ENT-011.分数趋势 → 折线（accent）；底层复用共享 COMP-017 LineChart（ASM-089）。
  含可读文字摘要（NFR-007）；数据不足→「暂无足够数据」占位（不画空轴）。
*/
export interface ReputationTrendProps {
  series: { period: string; score: number }[];
  /** 文字摘要（NFR-007） */
  textSummary: string;
  compact?: boolean;
  loading?: boolean;
}

export function ReputationTrend({
  series,
  textSummary,
  compact = false,
  loading = false,
}: ReputationTrendProps) {
  if (loading) return <SkeletonBlock variant="chart" />;

  const data = series.map((p) => ({ x: p.period, y: p.score }));

  return (
    <div>
      <LineChart
        data={data}
        summary={textSummary}
        xLabel="时间"
        yLabel="信用分"
        height={compact ? 140 : 220}
        emptyMessage="暂无足够数据"
      />
      {data.length > 0 && (
        <p className="mt-2 text-xs text-text-muted">{textSummary}</p>
      )}
    </div>
  );
}
