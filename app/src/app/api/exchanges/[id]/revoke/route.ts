/*
  API-017 POST /api/exchanges/:id/revoke —— 撤回披露（仅影响未来 ASM-013；已披露快照不收回）。
*/
import { NextResponse } from "next/server";
import { revokeDisclosure } from "@/server/exchange";
import { errorResponse } from "../../_http";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return NextResponse.json(await revokeDisclosure(id));
  } catch (e) {
    return errorResponse(e);
  }
}
