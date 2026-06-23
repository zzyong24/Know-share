/*
  API-011 GET /api/submissions/skills —— 本机技能目录（ENT-016，需认证写）。
  匿名 → 401。
*/
import { NextResponse } from "next/server";
import { getSession } from "@/server/auth";
import { listSkills, SubmissionError } from "@/server/submission";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    const result = await listSkills(session);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof SubmissionError) {
      return NextResponse.json({ error: e.code }, { status: e.status });
    }
    throw e;
  }
}
