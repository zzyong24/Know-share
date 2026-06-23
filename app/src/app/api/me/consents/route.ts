/*
  API-038 GET /api/me/consents?mode= —— 同意/披露记录（disclosure|all-consent；融合 ASM-046；本人）。
*/
import { NextResponse } from "next/server";
import { listConsents, type ConsentMode } from "@/server/account";
import { requireSession, toErrorResponse } from "@/app/api/_lib/account-route";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const modeParam = new URL(request.url).searchParams.get("mode");
  const mode: ConsentMode = modeParam === "all-consent" ? "all-consent" : "disclosure";
  try {
    return NextResponse.json(await listConsents(auth.session, mode));
  } catch (err) {
    return toErrorResponse(err);
  }
}
