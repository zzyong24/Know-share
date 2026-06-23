/*
  API-022 POST /api/exchanges/:id/cancel —— 参与方中止（必填原因 cancelReason；非法→409）。
*/
import { NextResponse } from "next/server";
import { cancelExchange } from "@/server/exchange";
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
      await cancelExchange(id, typeof body.reason === "string" ? body.reason : undefined)
    );
  } catch (e) {
    return errorResponse(e);
  }
}
