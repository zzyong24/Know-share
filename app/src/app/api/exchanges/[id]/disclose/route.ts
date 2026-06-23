/*
  API-016 POST /api/exchanges/:id/disclose —— 联系方式披露。
  状态≥Accepted 且参与方（否则 403）；缺 consent→422；写 contact_disclosures 快照 + consent + audit。
*/
import { NextResponse } from "next/server";
import { discloseContacts } from "@/server/exchange";
import { errorResponse, readBody } from "../../_http";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await readBody(request);
    return NextResponse.json(
      await discloseContacts(id, {
        types: Array.isArray(body.types) ? (body.types as string[]) : undefined,
        consent: body.consent === true,
      })
    );
  } catch (e) {
    return errorResponse(e);
  }
}
