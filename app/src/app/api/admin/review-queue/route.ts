/*
  API-043 GET /api/admin/review-queue —— 评审队列（含隐私门结果 + 风险标签；脱敏，仅管理员）。
*/
import { NextResponse } from "next/server";
import { listReviewQueue } from "@/server/admin";
import { errorResponse } from "../_http";

export const dynamic = "force-dynamic";

export async function GET(_request: Request) {
  try {
    void _request;
    return NextResponse.json(await listReviewQueue());
  } catch (e) {
    return errorResponse(e);
  }
}
