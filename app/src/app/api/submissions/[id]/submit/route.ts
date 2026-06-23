/*
  API-013 POST /api/submissions/:id/submit —— 提交进评审（写 Consent + Audit）。
  校验：匿名 → 401；非本人 → 403；缺 submit Consent → 422（INV-08）；
  无扫描 → 409；overallStatus=block → 409（INV-02，不可绕过）。
  成功：Draft → InReview，生成 review_item，写 consent + audit_log（INV-11）。限流 → 429。
*/
import { NextResponse } from "next/server";
import { getSession } from "@/server/auth";
import {
  submitSubmission,
  enforceRateLimit,
  SubmissionError,
} from "@/server/submission";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session?.login) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    await enforceRateLimit(session, "submit", request);
    const body = (await request.json().catch(() => ({}))) as {
      consent?: { actionType?: string; scope?: string };
    };
    const result = await submitSubmission(session, id, body);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof SubmissionError) {
      return NextResponse.json({ error: e.code }, { status: e.status });
    }
    throw e;
  }
}
