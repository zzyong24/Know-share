/*
  API-003 GET /api/modules/:id —— 模块卡片投影；未知 id → 404。
*/
import { NextResponse } from "next/server";
import { getModuleById } from "@/server/discovery";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const m = await getModuleById(id);
  if (!m) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
  return NextResponse.json(m);
}
