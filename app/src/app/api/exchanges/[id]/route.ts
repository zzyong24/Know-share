/*
  API-015 GET /api/exchanges/:id —— 详情聚合（按调用者关系投影 + 披露门；INV-03）。未知 → 404。
*/
import { NextResponse } from "next/server";
import { getExchangeDetail } from "@/server/exchange";
import { getSession } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  const detail = await getExchangeDetail(id, session);
  if (!detail) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
  return NextResponse.json(detail);
}
