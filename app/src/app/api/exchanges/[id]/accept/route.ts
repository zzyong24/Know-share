/*
  API-020 POST /api/exchanges/:id/accept —— 目标所有者接受（Requested→Accepted；非法→409）。
*/
import { NextResponse } from "next/server";
import { acceptExchange } from "@/server/exchange";
import { errorResponse } from "../../_http";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return NextResponse.json(await acceptExchange(id));
  } catch (e) {
    return errorResponse(e);
  }
}
