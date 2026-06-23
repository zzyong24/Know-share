/*
  API-021 POST /api/exchanges/:id/reject —— 目标所有者拒绝（Requested→Rejected；可选原因）。
*/
import { NextResponse } from "next/server";
import { rejectExchange } from "@/server/exchange";
import { errorResponse, readBody } from "../../_http";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await readBody(request);
    return NextResponse.json(
      await rejectExchange(id, typeof body.reason === "string" ? body.reason : undefined)
    );
  } catch (e) {
    return errorResponse(e);
  }
}
