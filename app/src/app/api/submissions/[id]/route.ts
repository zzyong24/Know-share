/*
  GET /api/submissions/:id（API-010）—— 恢复草稿（仅本人）。
  DELETE /api/submissions/:id —— 删除草稿（仅本人、仅 Draft 态）。
  匿名 → 401；非本人 → 403；未知 → 404；非 Draft → 409。
*/
import { NextResponse } from "next/server";
import { getSession } from "@/server/auth";
import { getDraft, deleteDraft, SubmissionError } from "@/server/submission";

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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    const result = await deleteDraft(session, id);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof SubmissionError) {
      return NextResponse.json({ error: e.code }, { status: e.status });
    }
    throw e;
  }
}
