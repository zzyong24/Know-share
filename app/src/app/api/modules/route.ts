/*
  API-002 GET /api/modules —— 发现列表（type/topic/trustLevel/verifiedOnly/q/sort/empty/page）。
  响应 { items: KnowledgeModule[], total }（零私有 INV-04）。
*/
import { NextResponse } from "next/server";
import { listModules, parseDiscoveryFilters } from "@/server/discovery";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const result = await listModules(parseDiscoveryFilters(sp));
  return NextResponse.json(result);
}
