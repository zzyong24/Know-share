/*
  API-001 GET /api/session —— 当前会话或 null（降级匿名 ASM-019）。
  动态路由（不预渲染），避免 build 期触发 auth。
*/
import { NextResponse } from "next/server";
import { getSession } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  return NextResponse.json(session);
}
