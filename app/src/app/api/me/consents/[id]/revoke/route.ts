/*
  API-039 POST /api/me/consents/:id/revoke —— 撤回披露（只影响未来 INV-08/ASM-013；本人隔离；写 audit）。
*/
import { NextResponse } from "next/server";
import { revokeConsent } from "@/server/account";
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
    return NextResponse.json(await revokeConsent(auth.session, id));
  } catch (err) {
    return toErrorResponse(err);
  }
}
