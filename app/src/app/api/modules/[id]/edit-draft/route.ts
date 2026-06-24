/*
  POST /api/modules/:id/edit-draft —— 本人对自己模块发起「编辑」。
  建一个 moduleId 指向原模块的 Draft 草稿，返回 { id }（草稿 id），前端跳转 /submit?draft=:id。
  未登录 401 / 非本人 403 / 不存在 404。
*/
import { NextResponse } from "next/server";
import { getSession } from "@/server/auth";
import { createDraftFromModule, SubmissionError } from "@/server/submission";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    const draft = await createDraftFromModule(session, id);
    return NextResponse.json(draft);
  } catch (e) {
    if (e instanceof SubmissionError) {
      return NextResponse.json({ error: e.code }, { status: e.status });
    }
    throw e;
  }
}
