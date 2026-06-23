/*
  API-031 GET /api/me/dashboard —— 个人中心概览（本人；StatBlock + 子导航徽标）。
*/
import { NextResponse } from "next/server";
import { getDashboard } from "@/server/account";
import { requireSession, toErrorResponse } from "@/app/api/_lib/account-route";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  try {
    return NextResponse.json(await getDashboard(auth.session));
  } catch (err) {
    return toErrorResponse(err);
  }
}
