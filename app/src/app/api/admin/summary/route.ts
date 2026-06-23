/*
  API-045 GET /api/admin/summary —— 风险摘要（聚合，无 PII；仅管理员）。
*/
import { NextResponse } from "next/server";
import { getReviewSummary } from "@/server/admin";
import { errorResponse } from "../_http";

export const dynamic = "force-dynamic";

export async function GET(_request: Request) {
  try {
    void _request;
    return NextResponse.json(await getReviewSummary());
  } catch (e) {
    return errorResponse(e);
  }
}
