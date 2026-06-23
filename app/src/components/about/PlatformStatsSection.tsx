"use client";

import { StatBlock } from "@/components/shared/stat-block";
import { LineChart } from "@/components/shared/line-chart";
import { Icon } from "@/components/shared/icon";
import type {
  AboutAggregateStats,
  MonthlyActivePoint,
  AboutStatsMeta,
} from "@/lib/queries/about";

/*
  COMP-211 PlatformStatsSection（PAGE-102）：四 StatBlock + 月度活跃 LineChart。
  FR-140 / FLOW-008 的展示端；严格聚合、无 PII（INV-09 / NFR-001 / DEC-011）。
  状态：loading / default / empty / error；区块隔离——本区块失败不冒泡整页（PAGE-100）。
  单字段缺失 / 非数值 / 百分比越界（非 0–100）→ 该 StatBlock 单独降级为 empty，其余正常。
  状态用文字 + 图标表达，不仅靠颜色（NFR-007）。
*/
export interface PlatformStatsSectionProps {
  stats: AboutAggregateStats | null;
  monthlyActiveSeries: MonthlyActivePoint[] | null;
  meta?: AboutStatsMeta;
  status: "loading" | "default" | "empty" | "error";
}

/** 数值字段渲染：缺失 / 非数值 → "—"；否则按格式化器输出。 */
function renderScalar(
  value: number | undefined | null,
  format: (n: number) => string
): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return format(value);
}

/** 百分比：越界（非 0–100）视为数据异常 → "—"（该卡 empty）。 */
function renderPercent(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  if (value < 0 || value > 100) return "—";
  return `${value}%`;
}

function buildSummary(
  series: MonthlyActivePoint[],
  meta?: AboutStatsMeta
): string {
  const window = meta?.window ?? `近 ${series.length} 个月`;
  if (series.length < 2) return `${window}活跃交换对趋势。`;
  const first = series[0].value;
  const last = series[series.length - 1].value;
  const dir = last > first ? "整体上升" : last < first ? "整体下降" : "基本持平";
  return `${window}活跃交换对${dir}（从 ${first.toLocaleString(
    "en-US"
  )} 到 ${last.toLocaleString("en-US")}）。`;
}

export function PlatformStatsSection({
  stats,
  monthlyActiveSeries,
  meta,
  status,
}: PlatformStatsSectionProps) {
  const isLoading = status === "loading";

  return (
    <section
      id="stats"
      aria-labelledby="about-stats-title"
      className="border-t border-border py-12"
    >
      <h2 id="about-stats-title" className="text-2xl font-semibold text-text">
        平台统计
      </h2>
      <p className="mt-2 text-sm text-text-muted">
        以下均为聚合指标，不含任何个体明细或 PII。
      </p>

      {status === "error" ? (
        <div
          role="status"
          className="mt-6 flex items-center gap-2 rounded-card border border-border bg-surface px-4 py-6 text-sm text-text-muted"
        >
          <Icon name="warning" size={18} aria-hidden />
          <span>统计暂不可用，请稍后重试。</span>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatBlock
              loading={isLoading}
              value={renderScalar(stats?.modulesTotal, (n) =>
                n.toLocaleString("en-US")
              )}
              label="模块总数"
              icon="inventory_2"
            />
            <StatBlock
              loading={isLoading}
              value={renderScalar(stats?.exchangesTotal, (n) =>
                n.toLocaleString("en-US")
              )}
              label="交换总数"
              icon="swap_horiz"
              tone="accent"
            />
            <StatBlock
              loading={isLoading}
              value={renderScalar(stats?.activeUsers, (n) =>
                n.toLocaleString("en-US")
              )}
              label="活跃用户"
              icon="group"
              tone="info"
            />
            <StatBlock
              loading={isLoading}
              value={renderPercent(stats?.privacyGatePassRate)}
              label="隐私门通过率"
              icon="verified_user"
              tone="success"
            />
          </div>

          <div className="mt-8 rounded-card border border-border bg-surface p-5 shadow-card">
            <h3 className="text-base font-semibold text-text">平台月度活跃趋势</h3>
            <p className="mt-1 text-xs text-text-muted">图例：活跃交换对</p>
            <div className="mt-4">
              {status === "empty" ||
              !monthlyActiveSeries ||
              monthlyActiveSeries.length === 0 ? (
                <p className="py-8 text-center text-sm text-text-muted">
                  暂无统计数据
                </p>
              ) : (
                <LineChart
                  loading={isLoading}
                  data={monthlyActiveSeries.map((p) => ({
                    x: p.month,
                    y: p.value,
                  }))}
                  xLabel="月份"
                  yLabel="活跃交换对"
                  color="var(--color-primary)"
                  summary={buildSummary(monthlyActiveSeries, meta)}
                />
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
