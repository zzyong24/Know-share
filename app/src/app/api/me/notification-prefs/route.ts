/*
  API-041 GET / API-042 PUT /api/me/notification-prefs —— 通知偏好（仅站内 ASM-048；本人）。
*/
import { NextResponse } from "next/server";
import {
  getNotificationPrefs,
  saveNotificationPrefs,
} from "@/server/account";
import { requireSession, toErrorResponse } from "@/app/api/_lib/account-route";
import type { NotificationPrefs } from "@/mocks/fixtures/account";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  try {
    return NextResponse.json(await getNotificationPrefs(auth.session));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PUT(request: Request) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  try {
    const prefs = (await request.json()) as NotificationPrefs;
    return NextResponse.json(await saveNotificationPrefs(auth.session, prefs));
  } catch (err) {
    return toErrorResponse(err);
  }
}
