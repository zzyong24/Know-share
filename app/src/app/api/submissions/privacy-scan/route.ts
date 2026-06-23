/*
  API-012 POST /api/submissions/privacy-scan —— 上报脱敏 Manifest → 脱敏 findings。
  扫描在用户本机由 Agent 技能执行（ASM-028）；平台只收脱敏 Manifest，复核后返回
  findings + overallStatus（pass|warn|block），写 privacy_scans。
  INV-01：携带原始私有值 → 400 拒收。匿名 → 401。限流 → 429。
*/
import { NextResponse } from "next/server";
import { getSession } from "@/server/auth";
import {
  reportPrivacyScan,
  enforceRateLimit,
  SubmissionError,
} from "@/server/submission";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    // 限流前先确认登录（requireUser 在服务层；此处仅做匿名快速门）。
    if (!session?.login) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    await enforceRateLimit(session, "privacy-scan", request);
    const body = (await request.json().catch(() => ({}))) as {
      submissionId?: string;
      manifest?: Record<string, unknown>;
    };
    const result = await reportPrivacyScan(session, body);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof SubmissionError) {
      return NextResponse.json({ error: e.code }, { status: e.status });
    }
    throw e;
  }
}
