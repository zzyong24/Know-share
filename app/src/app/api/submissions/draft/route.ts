/*
  API-009 GET /api/submissions/draft —— 新建草稿（需认证写）。
  仅编解码；业务在 src/server/submission.ts。匿名 → 401。
*/
import { NextResponse } from "next/server";
import { getSession } from "@/server/auth";
import { createDraft, SubmissionError } from "@/server/submission";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    const draft = await createDraft(session);
    return NextResponse.json(draft);
  } catch (e) {
    if (e instanceof SubmissionError) {
      return NextResponse.json({ error: e.code }, { status: e.status });
    }
    throw e;
  }
}
