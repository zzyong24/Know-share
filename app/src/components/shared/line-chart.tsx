"use client";

import {
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { SkeletonBlock } from "./skeleton-block";

/*
  COMP-017 LineChart（折线，accent）。NFR-007：summary 必填（图表文字摘要）+ 数据表替代。
  线色用 --color-accent 令牌。
*/
export interface LineChartProps {
  data: { x: string; y: number }[];
  /** 必填：图表文字摘要（NFR-007/ASM-069） */
  summary: string;
  xLabel?: string;
  yLabel?: string;
  color?: string;
  height?: number;
  loading?: boolean;
  emptyMessage?: string;
}

export function LineChart({
  data,
  summary,
  xLabel = "时间",
  yLabel = "数值",
  color = "var(--color-accent)",
  height = 240,
  loading = false,
  emptyMessage = "暂无数据",
}: LineChartProps) {
  if (loading) return <SkeletonBlock variant="chart" />;
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-text-muted">{emptyMessage}</p>;
  }

  return (
    <figure role="img" aria-label={summary}>
      <div style={{ height, width: "100%", minHeight: height }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={height}>
          <ReLineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis dataKey="x" stroke="var(--color-text-subtle)" fontSize={12} />
            <YAxis stroke="var(--color-text-subtle)" fontSize={12} />
            <Tooltip />
            <Line type="monotone" dataKey="y" stroke={color} strokeWidth={2} dot={false} />
          </ReLineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">{summary}</figcaption>
      {/* 数据表替代（屏读可达，NFR-007） */}
      <table className="sr-only">
        <caption>{summary}</caption>
        <thead>
          <tr>
            <th scope="col">{xLabel}</th>
            <th scope="col">{yLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.x}>
              <th scope="row">{d.x}</th>
              <td>{d.y}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
