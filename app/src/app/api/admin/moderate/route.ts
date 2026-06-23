/*
  API-047 POST /api/admin/moderate —— 单项处置（approve/return/delist/dismiss-report/resolve；仅管理员）。
  block 项 approve → 409（INV-02）；return/delist/dismiss-report 缺原因 → 400；逐项写 audit（INV-11）。
*/
import { NextResponse } from "next/server";
import { moderate } from "@/server/admin";
import { errorResponse, readBody } from "../_http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    return NextResponse.json(await moderate(await readBody(request)));
  } catch (e) {
    return errorResponse(e);
  }
}
