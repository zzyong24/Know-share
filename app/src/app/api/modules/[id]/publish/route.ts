/*
  POST /api/modules/:id/publish —— 本人一键发布自己的草稿模块（Draft→Published）。
  作者自发布（无评审队列）；同意由前端确认门兑现（NFR-005）；服务端复核隐私门（block→409）。
  未登录 401 / 非本人 403 / 不存在 404 / 非草稿 409 / 隐私 block 409。
*/
import { NextResponse } from "next/server";
import { getSession } from "@/server/auth";
import { publishOwnModule, OwnerModuleError } from "@/server/owner-modules";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    const result = await publishOwnModule(session, id);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof OwnerModuleError) {
      return NextResponse.json({ error: e.code }, { status: e.status });
    }
    throw e;
  }
}
