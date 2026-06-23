/*
  API-040 GET /api/me/account —— 账户身份（只读 GitHub DEC-006；本人；零私有）。
*/
import { NextResponse } from "next/server";
import { getAccountIdentity } from "@/server/account";
import { requireSession, toErrorResponse } from "@/app/api/_lib/account-route";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  try {
    return NextResponse.json(await getAccountIdentity(auth.session));
  } catch (err) {
    return toErrorResponse(err);
  }
}
