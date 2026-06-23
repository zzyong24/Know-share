/*
  API-050 POST /api/users/:login/endorse —— 认可（低权重社交信号，INV-10）。
  需登录（401）；不能认可自己（400）；未知用户（404）；限流（429）；INV-11 audit。
  认可只写 social_signals(endorse)，**不写 feedback**（不直接拉高信任，权重低于参与方反馈 INV-10）。
  响应 { endorsed, endorsementCount }（零私有 INV-04）。
*/
import { NextResponse } from "next/server";
import { getSession } from "@/server/auth";
import { getRedis } from "@/server/redis";
import {
  endorseUser,
  resolveUserId,
  CommunityError,
  communityErrorStatus,
} from "@/server/community";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ login: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const redis = await getRedis();
  const { allowed } = await redis.rateLimit(
    `rl:endorse:${session.login}`,
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

  const { login } = await params;
  try {
    const result = await endorseUser({
      actorId,
      actorLogin: session.login,
      targetLogin: login,
    });
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
