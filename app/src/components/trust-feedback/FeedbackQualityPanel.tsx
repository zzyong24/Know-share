"use client";

import { Card, ListRow, Avatar, EmptyState, SkeletonBlock } from "@/components/shared";
import { WeightDisclosureNote } from "./WeightDisclosureNote";
import type {
  FeedbackDimensionAverage,
  RecentFeedbackEntry,
} from "@/lib/queries/trust-feedback";

/*
  COMP-114 FeedbackQualityPanel（反馈质量区）。
  ENT-010 五维均值（清单一致性/隐私边界/结构清晰度/有用性/再次交换意愿）+ 近期公开反馈摘要。
  显式标注「来自实际交换参与方」、视觉/DOM 上权重高于社交认可区（INV-10）。
  评分条含数值文字（非仅颜色/长度，NFR-007）；反馈脱敏（INV-04）。
*/
export interface FeedbackQualityPanelProps {
  dimensionAverages: FeedbackDimensionAverage[];
  recentFeedback: RecentFeedbackEntry[];
  loading?: boolean;
  onExchangeLinkClick?: (exchangeId: string) => void;
  onAuthorClick?: (handle: string) => void;
}

export function FeedbackQualityPanel({
  dimensionAverages,
  recentFeedback,
  loading = false,
  onExchangeLinkClick,
  onAuthorClick,
}: FeedbackQualityPanelProps) {
  if (loading) return <SkeletonBlock variant="card" />;

  if (dimensionAverages.length === 0) {
    return (
      <EmptyState
        icon="forum"
        title="尚无交换反馈"
        description="反馈随完成的交换逐步积累。"
      />
    );
  }

  return (
    <section aria-labelledby="feedback-quality-heading" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="feedback-quality-heading" className="text-base font-semibold text-text">
          反馈质量
        </h2>
      </div>

      {/* INV-10：来自实际交换参与方，权重高于社交认可（固定标注，不可移除） */}
      <WeightDisclosureNote context="profile" />

      <ul className="flex flex-col gap-2.5">
        {dimensionAverages.map((d) => {
          const pct = Math.round((d.score / d.max) * 100);
          return (
            <li key={d.key}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text">{d.label}</span>
                <span className="tabular-nums font-medium text-text">
                  {d.score.toFixed(1)} / {d.max}
                </span>
              </div>
              <div
                className="mt-1 h-1.5 w-full overflow-hidden rounded-pill bg-muted"
                role="meter"
                aria-valuenow={d.score}
                aria-valuemin={0}
                aria-valuemax={d.max}
                aria-label={`${d.label} 均值 ${d.score.toFixed(1)} 分（满分 ${d.max}）`}
              >
                <span
                  className="block h-full rounded-pill bg-primary"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {recentFeedback.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-sm font-medium text-text-muted">近期反馈</h3>
          <Card padding="sm">
            <ul>
              {recentFeedback.map((f, i) => (
                <ListRow
                  key={`${f.exchangeId}-${i}`}
                  leading={
                    <Avatar
                      login={f.authorHandle}
                      size="sm"
                      onClick={() => onAuthorClick?.(f.authorHandle)}
                    />
                  }
                  title={<span className="text-sm text-text">{f.excerpt}</span>}
                  subtitle={
                    <span className="text-xs text-text-subtle">
                      @{f.authorHandle} ·{" "}
                      <button
                        type="button"
                        onClick={() => onExchangeLinkClick?.(f.exchangeId)}
                        className="text-primary underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                      >
                        {f.exchangeLabel}
                      </button>
                    </span>
                  }
                />
              ))}
            </ul>
          </Card>
        </div>
      )}
    </section>
  );
}
