/*
  GET /api/manifest-schema —— 发布 Manifest 上传契约（know-share-manifest@1，JSON Schema）。
  本机 Skill 的 validate 与 agent 自描述按此校验。
*/
import { NextResponse } from "next/server";
import { MANIFEST_JSON_SCHEMA } from "@/server/manifest-schema";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(MANIFEST_JSON_SCHEMA);
}
