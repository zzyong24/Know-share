/*
  API-010 GET /api/submissions/:id —— 恢复草稿（仅本人）。
  匿名 → 401；非本人 → 403；未知 → 404。
*/
import { NextResponse } from "next/server";
import { getSession } from "@/server/auth";
import { getDraft, SubmissionError } from "@/server/submission";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    const draft = await getDraft(session, id);
    return NextResponse.json(draft);
  } catch (e) {
    if (e instanceof SubmissionError) {
      return NextResponse.json({ error: e.code }, { status: e.status });
    }
    throw e;
  }
}
