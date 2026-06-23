/*
  API-052 GET /api/stats/usage —— 平台聚合统计 { items: UsageStat[] }。
  严格聚合、无 PII（INV-09）；公开读。
*/
import { NextResponse } from "next/server";
import { listUsageStats } from "@/server/discovery";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await listUsageStats());
}
