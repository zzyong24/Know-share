/*
  API-028 GET /api/skills/catalog/:slug —— 单个技能详情（ENT-016 只读）。
  未知 slug → 404。公开读，零私有内容（INV-01/04）。
*/
import { NextResponse } from "next/server";
import { getSkillBySlug } from "@/server/skills";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const skill = await getSkillBySlug(slug);
  if (!skill) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
  return NextResponse.json(skill);
}
