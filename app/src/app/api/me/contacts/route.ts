/*
  API-036 GET / API-037 PUT /api/me/contacts —— 联系方式（脱敏；默认私密 INV-03/DEC-010；本人）。
  保存写 Consent(contact) + Audit；限流 → 429。
*/
import { NextResponse } from "next/server";
import { listContacts, saveContacts } from "@/server/account";
import { requireSession, toErrorResponse } from "@/app/api/_lib/account-route";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  try {
    return NextResponse.json(await listContacts(auth.session));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PUT(request: Request) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  try {
    const body = (await request.json()) as { items?: unknown[] };
    const items = Array.isArray(body.items) ? body.items : [];
    return NextResponse.json(
      await saveContacts(auth.session, items as Parameters<typeof saveContacts>[1])
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
