/*
  API-014 GET /api/exchanges —— 公开脱敏台账（{items,total,topics}；排除 Flagged，INV-04）。
  API-019 POST /api/exchanges —— 创建交换请求（目标 Published + 可选自有模块；INV-05/DEC-009）。
*/
import { NextResponse } from "next/server";
import { listLedger, parseLedgerFilters, createExchange } from "@/server/exchange";
import { errorResponse, readBody } from "./_http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const result = await listLedger(parseLedgerFilters(sp));
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  try {
    const result = await createExchange(await readBody(request));
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
