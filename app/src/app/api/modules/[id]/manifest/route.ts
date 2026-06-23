/*
  API-004 GET /api/modules/:id/manifest —— 脱敏 Manifest（屏蔽 contact，INV-03/04/ASM-024）；未知 → 404。
*/
import { NextResponse } from "next/server";
import { getManifestByModuleId } from "@/server/discovery";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const man = await getManifestByModuleId(id);
  if (!man) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
  return NextResponse.json(man);
}
