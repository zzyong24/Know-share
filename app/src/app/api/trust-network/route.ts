/*
  GET /api/trust-network —— 信任网络索引（可信贡献者）。
  排序依据可解释信任分（交换历史/参与方反馈为主，INV-10），非付费排名（DEC-007）；零私有（INV-04）。
*/
import { NextResponse } from "next/server";
import { getTrustNetwork, parseNetworkFilters } from "@/server/trust";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const filters = parseNetworkFilters(sp);
  const result = await getTrustNetwork(filters);
  return NextResponse.json(result);
}
