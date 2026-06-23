/*
  API-028 GET /api/skills/catalog —— 技能目录（ENT-016 只读）。
  注：旧 API-030 GET /api/skills 已 DEC-018 弃用，不在此实现。
  empty=true → 空 skills（仍带静态区块）。公开读，零私有内容（INV-01/04）。
*/
import { NextResponse } from "next/server";
import { getSkillCatalog } from "@/server/skills";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const empty = sp.get("empty") === "true";
  return NextResponse.json(await getSkillCatalog({ empty }));
}
