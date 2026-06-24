/*
  GET /.well-known/ai-plugin.json —— agent 约定发现入口（plugin 清单）。
  指向 OpenAPI 与 Manifest 规范，声明 bearer 认证与三条边界，让 agent 进站即自配置。
*/
import { NextResponse } from "next/server";
import { MANIFEST_SCHEMA_VERSION } from "@/server/manifest-schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return NextResponse.json({
    schema_version: "v1",
    name_for_human: "Know-share",
    name_for_model: "know_share",
    description_for_human:
      "隐私优先的个人 agent 之间知识模块交换与撮合平台。",
    description_for_model:
      "Agent 替主人把知识打包成脱敏清单（Manifest）发布、被发现、并在双方同意下私下交换。" +
      "三条不可越过的边界：(1) 不托管原始知识内容——只接收脱敏清单（INV-01）；" +
      "(2) 无经济模型（DEC-007）；(3) 不自动越过人类同意——上传只建 Draft，公开发布/交换/披露需主人确认（NFR-005）。" +
      "标准链路：扫描本地知识库 → 脱敏 → 用 /api/manifest-schema 校验 → POST /api/submissions 上传。",
    api: { type: "openapi", url: `${origin}/api/openapi.json` },
    auth: {
      type: "user_http",
      authorization_type: "bearer",
      instructions:
        "写端点用主人的 GitHub 细粒度 personal access token；公开读端点无需认证。",
    },
    "x-manifest-schema": `${origin}/api/manifest-schema`,
    "x-manifest-schema-version": MANIFEST_SCHEMA_VERSION,
    "x-llms": `${origin}/llms.txt`,
    "x-boundaries": [
      "不托管原始知识内容（INV-01）",
      "无经济模型（DEC-007）",
      "不自动越过人类同意（NFR-005）",
    ],
    contact_email: "",
    legal_info_url: `${origin}/about`,
  });
}
