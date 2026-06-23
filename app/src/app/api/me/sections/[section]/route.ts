/*
  API-032 GET /api/me/sections/:section —— 分区（modules/drafts/received/sent/favorites；本人隔离）。
  非法分区 → 400。
*/
import { NextResponse } from "next/server";
import { getSection } from "@/server/account";
import { requireSession, toErrorResponse } from "@/app/api/_lib/account-route";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ section: string }> }
) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { section } = await params;
  try {
    return NextResponse.json(await getSection(auth.session, section));
  } catch (err) {
    return toErrorResponse(err);
  }
}
