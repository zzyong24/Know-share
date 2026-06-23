/*
  Auth.js (NextAuth v5) GitHub OAuth 路由（DEC-006）。
  懒加载 handlers，避免 build 期需要 AUTH_* env。
*/
import { authHandlers } from "@/server/auth";

export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { GET: handler } = await authHandlers();
  return handler(request);
}

export async function POST(request: NextRequest) {
  const { POST: handler } = await authHandlers();
  return handler(request);
}
