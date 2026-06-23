/*
  API-049 POST /api/modules/:id/favorite —— 收藏 / 取消收藏。
  需登录（401）；INV-07 收藏唯一（toggle 幂等，不破唯一约束）；限流（429，NFR-006/TEST-015）；INV-11 audit。
  请求体可选 { toggle?: boolean }：toggle=true 切换；缺省/false 确保收藏（幂等不增）。
  响应 { favorited, favoriteCount }（零私有，INV-04）。
*/
import { NextResponse } from "next/server";
import { getSession } from "@/server/auth";
import { getRedis } from "@/server/redis";
import {
  favoriteModule,
  resolveUserId,
  CommunityError,
  communityErrorStatus,
} from "@/server/community";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const redis = await getRedis();
  const { allowed } = await redis.rateLimit(
    `rl:favorite:${session.login}`,
    30,
    60
  );
  if (!allowed) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }

  const actorId = await resolveUserId(session.login);
  if (!actorId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let toggle = false;
  try {
    const body = await request.json();
    if (body && typeof body.toggle === "boolean") toggle = body.toggle;
  } catch {
    // 空 body → 缺省确保收藏（幂等）。
  }

  try {
    const result = await favoriteModule({ actorId, moduleId: id, toggle });
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    if (e instanceof CommunityError) {
      return NextResponse.json(
        { error: e.message },
        { status: communityErrorStatus(e.code) }
      );
    }
    throw e;
  }
}
