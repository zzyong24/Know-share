/*
  API-005 GET /api/modules/:id/detail —— 详情聚合（module+manifest+owner+trust+privacy+fullManifest）。
  后端是权威脱敏边界：fullManifest 不含 contact（INV-03/04）。未知 → 404。
*/
import { NextResponse } from "next/server";
import { getModuleDetail } from "@/server/discovery";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const detail = await getModuleDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
  return NextResponse.json(detail);
}
