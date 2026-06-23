/*
  API-007 GET /api/topics —— 主题目录 { items: Topic[] }（公开读）。
*/
import { NextResponse } from "next/server";
import { listTopics } from "@/server/discovery";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await listTopics());
}
