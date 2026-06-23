/*
  API-034 POST /api/notifications/:id/read —— 单条已读（幂等；本人隔离 → 404）。
*/
import { NextResponse } from "next/server";
import { markNotificationRead } from "@/server/account";
import { requireSession, toErrorResponse } from "@/app/api/_lib/account-route";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  try {
    await markNotificationRead(auth.session, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
