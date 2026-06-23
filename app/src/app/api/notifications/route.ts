/*
  API-033 GET /api/notifications —— 通知列表（type 过滤 + unreadCount；本人）。
  契约权威形状：{ items, unreadCount }。
*/
import { NextResponse } from "next/server";
import { listNotifications } from "@/server/account";
import { requireSession, toErrorResponse } from "@/app/api/_lib/account-route";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const type = new URL(request.url).searchParams.get("type") ?? undefined;
  try {
    return NextResponse.json(await listNotifications(auth.session, type));
  } catch (err) {
    return toErrorResponse(err);
  }
}
