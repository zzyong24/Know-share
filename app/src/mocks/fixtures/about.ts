/*
  关于页（about）MOCK 种子（PAGE-100~105 / COMP-210~214）。
  统计严格聚合、无 PII（INV-09 / NFR-001 / DEC-011）。
  四个标量复用 misc.ts 的 usageStats（同口径，ASM-074），另加月度活跃序列「活跃交换对」。
  文案以 PAGE_SPEC.md 归正版为准——不复活真源 HTML 的「链上 / 区块链 / E2EE / 语义向量 / 512 Nodes」漂移主张。
*/
import { usageStats } from "./misc";
import type { AboutStatsResponse } from "@/lib/queries/about";

function statValue(key: string): number {
  return usageStats.find((s) => s.key === key)?.value ?? 0;
}

// ── ENT-019 聚合统计（关于页展示口径，无 PII）──
export const aboutStats: AboutStatsResponse = {
  stats: {
    modulesTotal: statValue("modules"), // 1,842
    exchangesTotal: statValue("exchanges"), // 12,857
    activeUsers: statValue("activeUsers"), // 2,196
    privacyGatePassRate: statValue("privacyPassRate"), // 98.6
  },
  // 月度活跃趋势：图例「活跃交换对」按月（1–11 月），聚合计数（非个体明细）。
  monthlyActiveSeries: [
    { month: "1 月", value: 612 },
    { month: "2 月", value: 705 },
    { month: "3 月", value: 798 },
    { month: "4 月", value: 864 },
    { month: "5 月", value: 932 },
    { month: "6 月", value: 1015 },
    { month: "7 月", value: 1102 },
    { month: "8 月", value: 1188 },
    { month: "9 月", value: 1264 },
    { month: "10 月", value: 1351 },
    { month: "11 月", value: 1442 },
  ],
  meta: {
    window: "近 11 个月",
    calibration: "按月聚合活跃交换对，仅聚合计数、不含任何个体明细（INV-09）",
  },
};
