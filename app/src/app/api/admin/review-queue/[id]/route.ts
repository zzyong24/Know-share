/*
  API-044 GET /api/admin/review-queue/:id —— 评审项详情（Manifest 脱敏摘要 + 扫描发现 + 举报；仅管理员）。
*/
import { NextResponse } from "next/server";
import { getReviewDetail } from "@/server/admin";
import { errorResponse } from "../../_http";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const detail = await getReviewDetail(id);
    if (!detail) return NextResponse.json({ error: "not-found" }, { status: 404 });
    return NextResponse.json(detail);
  } catch (e) {
    return errorResponse(e);
  }
}
