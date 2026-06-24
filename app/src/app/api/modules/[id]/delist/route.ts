/*
  POST /api/modules/:id/delist —— 本人下架自己已发布的模块。
  未登录 401 / 非本人 403 / 不存在 404 / 状态非法 409。
*/
import { NextResponse } from "next/server";
import { getSession } from "@/server/auth";
import { delistOwnModule, OwnerModuleError } from "@/server/owner-modules";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    const result = await delistOwnModule(session, id);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof OwnerModuleError) {
      return NextResponse.json({ error: e.code }, { status: e.status });
    }
    throw e;
  }
}
