/*
  关于页 query hooks（PAGE-102 平台统计 / FRONTEND_SPEC §8）。
  组件只接 props，取数在本层（ASM-068）；query key 本地定义（不改 query-keys.ts）。
  统计严格聚合、无 PII（INV-09 / NFR-001 / DEC-011）；客户端只渲染服务端给定聚合值，不反推个体。
  接口形状为占位，阶段 15 对齐 SERVICE_CONTRACT（ASM-067）。
*/
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

/** 关于页统计聚合标量（ENT-019，单位见字段）。 */
export interface AboutAggregateStats {
  modulesTotal: number;
  exchangesTotal: number;
  activeUsers: number;
  /** 隐私门通过率，单位 %（0–100） */
  privacyGatePassRate: number;
}

/** 月度活跃序列点（图例「活跃交换对」）。 */
export interface MonthlyActivePoint {
  month: string;
  value: number;
}

/** 统计口径 / 时间窗元信息（供图表可读摘要，来自 ENT-019 属性）。 */
export interface AboutStatsMeta {
  window: string;
  calibration: string;
}

export interface AboutStatsResponse {
  stats: AboutAggregateStats;
  monthlyActiveSeries: MonthlyActivePoint[];
  meta: AboutStatsMeta;
}

/** 本地 query key（不写入 query-keys.ts）。 */
export const aboutQueryKeys = {
  stats: ["about", "stats"] as const,
};

export function useAboutStats() {
  return useQuery({
    queryKey: aboutQueryKeys.stats,
    queryFn: () => apiFetch<AboutStatsResponse>("/api/about/stats"),
  });
}
