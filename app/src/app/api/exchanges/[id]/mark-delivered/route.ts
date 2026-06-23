/*
  API-018 POST /api/exchanges/:id/mark-delivered —— 己方交付确认；双方各自确认→Completed（INV-06）。
*/
import { NextResponse } from "next/server";
import { markDelivered } from "@/server/exchange";
import { errorResponse } from "../../_http";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return NextResponse.json(await markDelivered(id));
  } catch (e) {
    return errorResponse(e);
  }
}
