"use client";

import { DonutChart, SkeletonBlock } from "@/components/shared";
import type { DonutSegment } from "@/components/shared/donut-chart";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/types";

/*
  COMP-110 TrustScoreRing（信任分环形）。
  ENT-011 派生信任语义封装；底层复用共享 COMP-018 DonutChart（不重绘环形，ASM-089）。
  环形 + 中心大数字 + 满分基准（/1000 ASM-037）+ 等级文案 + 可点开拆解（HARD-03 入口）。
  禁止任何价格/付费/可购买 props（DEC-007）。
*/
export interface TrustScoreRingProps {
  score: number;
  maxScore?: number; // 默认 1000（ASM-037）
  tierLabel: string;
  /** 四类来源占比分段（交换/反馈/验证/举报）；着色用规范令牌 tone */
  segments?: { label: string; value: number; tone: Tone }[];
  size?: "lg" | "md";
  explainable?: boolean;
  /** 无障碍文字摘要（NFR-007） */
  textSummary: string;
  /** 解释是否就绪；缺失→守卫显示「解释生成中」而非裸分（HARD-03） */
  explanationAvailable?: boolean;
  isNewUser?: boolean;
  loading?: boolean;
  onExplain?: () => void;
}

export function TrustScoreRing({
  score,
  maxScore = 1000,
  tierLabel,
  segments,
  size = "lg",
  explainable = true,
  textSummary,
  explanationAvailable = true,
  isNewUser = false,
  loading = false,
  onExplain,
}: TrustScoreRingProps) {
  if (loading) {
    return <SkeletonBlock variant="chart" />;
  }

  const height = size === "lg" ? 220 : 150;
  const donutSegments: DonutSegment[] =
    segments && segments.length
      ? segments.map((s) => ({ label: s.label, value: s.value, tone: s.tone }))
      : [
          { label: "信任分", value: score, tone: "primary" },
          { label: "剩余", value: Math.max(0, maxScore - score), tone: "neutral" },
        ];

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 环形（视觉装饰）；中心分值由下方 testid 数字承载，避免重复读屏 */}
      <DonutChart segments={donutSegments} summary={textSummary} height={height} />

      <div className="flex flex-col items-center gap-1 text-center">
        {/* 分值大数字（单一可见来源，避免与 centerLabel 重复读屏） */}
        <span
          data-testid="trust-score-value"
          className={cn(
            "font-semibold tabular-nums text-text",
            size === "lg" ? "text-3xl" : "text-2xl"
          )}
        >
          <span className="sr-only">信任分 </span>
          {score}
          <span className="text-sm text-text-muted"> / {maxScore}</span>
        </span>
        {/* 等级文字（非仅颜色，NFR-007） */}
        <span className="rounded-pill bg-primary-subtle px-2.5 py-0.5 text-xs font-medium text-primary">
          {tierLabel}
        </span>
        {isNewUser && (
          <span className="text-xs text-text-subtle">
            信任随交换与反馈逐步积累
          </span>
        )}
      </div>

      {explainable &&
        (explanationAvailable ? (
          <button
            type="button"
            onClick={onExplain}
            aria-label="查看信任分如何形成"
            className="rounded-control text-xs font-medium text-primary underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            信任分如何形成？
          </button>
        ) : (
          <span className="text-xs text-text-subtle" role="status">
            解释生成中…
          </span>
        ))}
    </div>
  );
}
