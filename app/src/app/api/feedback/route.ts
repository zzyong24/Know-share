/*
  API-013 POST /api/feedback —— 提交结构化反馈（FLOW-004 / W-3）。
  参与方资格校验（非参与方→403）、状态校验（非 Completed/WaitingForFeedback→409）、
  限流（→429，NFR-006）、写 ENT-010 + 触发信任重算 + 写 audit（INV-11）。
*/
import { NextResponse } from "next/server";
import { getSession } from "@/server/auth";
import { submitFeedback, type FeedbackInput } from "@/server/trust";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession();

  let body: Partial<FeedbackInput>;
  try {
    body = (await request.json()) as Partial<FeedbackInput>;
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  if (!body.exchangeId || !body.scores || typeof body.scores !== "object") {
    return NextResponse.json({ error: "invalid-payload" }, { status: 400 });
  }

  const result = await submitFeedback(session, {
    exchangeId: body.exchangeId,
    scores: body.scores as Record<string, number>,
    publicComment: body.publicComment,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, exchangeId: result.exchangeId });
}
