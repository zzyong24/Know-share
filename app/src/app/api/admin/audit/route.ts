/*
  API-046 GET /api/admin/audit —— 审计日志（脱敏；仅管理员；INV-11）。
*/
import { NextResponse } from "next/server";
import { listAudit } from "@/server/admin";
import { errorResponse } from "../_http";

export const dynamic = "force-dynamic";

export async function GET(_request: Request) {
  try {
    void _request;
    return NextResponse.json(await listAudit());
  } catch (e) {
    return errorResponse(e);
  }
}
