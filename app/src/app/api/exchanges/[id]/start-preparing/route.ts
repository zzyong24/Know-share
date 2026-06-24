/*
  POST /api/exchanges/:id/start-preparing —— 任一参与方把 Accepted→PrivatePreparing
  （进入平台外私下交付协调阶段）。非参与方 403 / 未登录 401 / 非法迁移 409。
*/
import { NextResponse } from "next/server";
import { startPreparing } from "@/server/exchange";
import { errorResponse } from "../../_http";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return NextResponse.json(await startPreparing(id));
  } catch (e) {
    return errorResponse(e);
  }
}
