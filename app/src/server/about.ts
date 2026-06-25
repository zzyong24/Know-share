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

/**
  月度活跃「交换对」序列：从 exchanges 表按 createdAt 月份真实聚合（仅计数，无个体明细 INV-09）。
  空库 → 空序列（图表自行显示「暂无足够数据」）；不再写死假数。
*/
async function monthlyActiveSeries(): Promise<{ month: string; value: number }[]> {
  const db = await getDb();
  const rows = await db
    .select({ createdAt: schema.exchanges.createdAt })
    .from(schema.exchanges);
  const counts = new Map<string, number>(); // key: YYYY-MM
  for (const r of rows) {
    const d = new Date(r.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, value]) => ({ month: `${Number(k.slice(5))} 月`, value }));
}

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
    monthlyActiveSeries: await monthlyActiveSeries(),
    meta: {
      window: "按月聚合",
      calibration:
        "按月聚合活跃交换对，仅聚合计数、不含任何个体明细（INV-09）",
    },
  };
}
