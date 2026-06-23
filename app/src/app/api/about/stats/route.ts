/*
  API-053 GET /api/about/stats —— 平台聚合统计 + 月度活跃序列。
  严格聚合、无 PII（INV-09 / NFR-001 / DEC-011）；公开读。
  响应 { stats, monthlyActiveSeries, meta }。
*/
import { NextResponse } from "next/server";
import { getAboutStats } from "@/server/about";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getAboutStats());
}
