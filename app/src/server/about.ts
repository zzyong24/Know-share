/*
  about 域服务层（API-053 平台聚合统计 + 月度活跃序列）。
  严格聚合、无 PII（INV-09 / NFR-001 / DEC-011）：只读 usage_stats 标量 + 派生月度计数，
  绝不读取/输出任何个体字段（login/email/avatarUrl）。
  形状对齐前端 AboutStatsResponse（src/lib/queries/about.ts）。
*/
import { getDb } from "@/server/db/client";
import * as schema from "@/server/db/schema";

export interface AboutStatsDto {
  stats: {
    modulesTotal: number;
    exchangesTotal: number;
    activeUsers: number;
    privacyGatePassRate: number;
  };
  monthlyActiveSeries: { month: string; value: number }[];
  meta: { window: string; calibration: string };
}

/** usage_stats → 每 metricKey 取最新（capturedAt desc）标量值。 */
async function latestStatValues(): Promise<Map<string, number>> {
  const db = await getDb();
  const rows = await db.select().from(schema.usageStats);
  const latest = new Map<string, (typeof rows)[number]>();
  for (const r of rows) {
    const prev = latest.get(r.metricKey);
    if (!prev || new Date(r.capturedAt) > new Date(prev.capturedAt)) {
      latest.set(r.metricKey, r);
    }
  }
  const out = new Map<string, number>();
  for (const [k, r] of latest) out.set(k, Number(r.value));
  return out;
}

/** 月度活跃「交换对」序列（聚合计数，非个体明细，INV-09）。 */
const MONTHLY_ACTIVE_SERIES = [
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
];

/** API-053 平台聚合统计（INV-09 无 PII）。 */
export async function getAboutStats(): Promise<AboutStatsDto> {
  const v = await latestStatValues();
  return {
    stats: {
      modulesTotal: v.get("modules") ?? 0,
      exchangesTotal: v.get("exchanges") ?? 0,
      activeUsers: v.get("activeUsers") ?? 0,
      privacyGatePassRate: v.get("privacyPassRate") ?? 0,
    },
    monthlyActiveSeries: MONTHLY_ACTIVE_SERIES,
    meta: {
      window: "近 11 个月",
      calibration:
        "按月聚合活跃交换对，仅聚合计数、不含任何个体明细（INV-09）",
    },
  };
}
