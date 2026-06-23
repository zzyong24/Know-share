"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { SkeletonBlock } from "./skeleton-block";
import type { Tone } from "@/lib/types";

/*
  COMP-018 DonutChart（环形/分段）。NFR-007：summary 必填 + 图例含 label + 百分比文字 + 数据表替代。
  分段用主色 + 语义色令牌。
*/
const TONE_VAR: Record<Tone, string> = {
  primary: "var(--color-primary)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
  info: "var(--color-info)",
  accent: "var(--color-accent)",
  neutral: "var(--color-text-subtle)",
};

export interface DonutSegment {
  label: string;
  value: number;
  tone: Tone;
}

export interface DonutChartProps {
  segments: DonutSegment[];
  /** 必填：图表文字摘要（NFR-007/ASM-069） */
  summary: string;
  centerLabel?: string;
  height?: number;
  loading?: boolean;
}

export function DonutChart({
  segments,
  summary,
  centerLabel,
  height = 240,
  loading = false,
}: DonutChartProps) {
  if (loading) return <SkeletonBlock variant="chart" />;
  if (segments.length === 0) {
    return <p className="py-8 text-center text-sm text-text-muted">暂无数据</p>;
  }

  const total = segments.reduce((acc, s) => acc + s.value, 0);
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);

  return (
    <figure role="img" aria-label={summary}>
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div style={{ height, width: height, minHeight: height, minWidth: height }} className="relative">
          <ResponsiveContainer width="100%" height="100%" minWidth={height} minHeight={height}>
            <PieChart>
              <Pie
                data={segments}
                dataKey="value"
                nameKey="label"
                innerRadius="60%"
                outerRadius="90%"
                strokeWidth={0}
              >
                {segments.map((s) => (
                  <Cell key={s.label} fill={TONE_VAR[s.tone]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          {centerLabel && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium text-text">
              {centerLabel}
            </span>
          )}
        </div>
        {/* 图例：label + 百分比文字（非仅颜色） */}
        <ul className="flex flex-col gap-1.5 text-sm">
          {segments.map((s) => (
            <li key={s.label} className="flex items-center gap-2">
              <span
                className="inline-block size-3 rounded-sm"
                style={{ background: TONE_VAR[s.tone] }}
                aria-hidden
              />
              <span className="text-text">{s.label}</span>
              <span className="tabular-nums text-text-muted">{pct(s.value)}%</span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="sr-only">{summary}</figcaption>
      <table className="sr-only">
        <caption>{summary}</caption>
        <thead>
          <tr>
            <th scope="col">分段</th>
            <th scope="col">数值</th>
            <th scope="col">占比</th>
          </tr>
        </thead>
        <tbody>
          {segments.map((s) => (
            <tr key={s.label}>
              <th scope="row">{s.label}</th>
              <td>{s.value}</td>
              <td>{pct(s.value)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
