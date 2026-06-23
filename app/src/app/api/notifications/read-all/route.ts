/*
  API-035 POST /api/notifications/read-all —— 全部已读（仅本人）。
*/
import { NextResponse } from "next/server";
import { markAllNotificationsRead } from "@/server/account";
import { requireSession, toErrorResponse } from "@/app/api/_lib/account-route";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  try {
    await markAllNotificationsRead(auth.session);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
