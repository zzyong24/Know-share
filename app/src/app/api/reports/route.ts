/*
  API-051 POST /api/reports —— 举报（目标=模块/用户/交换）。
  需登录（401）；缺字段/非法 targetType（400）；限流（429）；写 ENT-014 reports(pending) + INV-11 audit。
  响应 { id, status: "pending" }（零私有 INV-04；audit 不落 reason 原文）。
*/
import { NextResponse } from "next/server";
import { getSession } from "@/server/auth";
import { getRedis } from "@/server/redis";
import {
  validateReport,
  createReport,
  resolveUserId,
  CommunityError,
  communityErrorStatus,
} from "@/server/community";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const redis = await getRedis();
  const { allowed } = await redis.rateLimit(
    `rl:report:${session.login}`,
    20,
    60
  );
  if (!allowed) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }

  const reporterId = await resolveUserId(session.login);
  if (!reporterId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  try {
    const report = validateReport(body);
    const result = await createReport({ reporterId, report });
    return NextResponse.json(result, { status: 201 });
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
