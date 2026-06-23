/*
  API-048 POST /api/admin/bulk-approve —— 批量通过（仅 pass 且无未决举报子集；逐项写审计；仅管理员）。
*/
import { NextResponse } from "next/server";
import { bulkApprove } from "@/server/admin";
import { errorResponse, readBody } from "../_http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readBody(request);
    const ids = Array.isArray(body.ids) ? (body.ids as string[]) : [];
    return NextResponse.json(await bulkApprove(ids));
  } catch (e) {
    return errorResponse(e);
  }
}
