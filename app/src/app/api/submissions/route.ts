/*
  POST /api/submissions —— Agent 原生上传脱敏 Manifest，建 Draft 模块。
  认证：GitHub 细粒度 token（Bearer）或 web 会话（getActor）。无 → 401。
  契约/不变量：manifest strict 校验 + 隐私门服务端复核（block→409）；停在 Draft（NFR-005）。
  body: { manifest: <know-share-manifest@1> }
*/
import { NextResponse } from "next/server";
import { getActor } from "@/server/api-auth";
import { createSubmissionFromManifest, SubmissionError } from "@/server/submission";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const actor = await getActor(request);
    if (!actor) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const body = (await request.json().catch(() => ({}))) as {
      manifest?: unknown;
    };
    const result = await createSubmissionFromManifest(actor, body.manifest);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof SubmissionError) {
      return NextResponse.json({ error: e.code, message: e.message }, { status: e.status });
    }
    throw e;
  }
}
