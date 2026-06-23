/*
  账户域 handler 共享工具：会话守卫 + 错误编码。
  全部账户端点需登录（未登录 → 401）；业务层 AccountError 映射为 HTTP。
*/
import { NextResponse } from "next/server";
import { getSession } from "@/server/auth";
import { AccountError } from "@/server/account";
import type { Session } from "@/lib/types";

/** 守 401：返回会话或抛出 401 响应载荷。 */
export async function requireSession(): Promise<
  { session: Session } | { response: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return {
      response: NextResponse.json({ error: "unauthenticated" }, { status: 401 }),
    };
  }
  return { session };
}

/** 把 AccountError / 未知错误编码为 HTTP 响应。 */
export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof AccountError) {
    return NextResponse.json(
      { error: err.code, message: err.message },
      { status: err.status }
    );
  }
  return NextResponse.json({ error: "internal" }, { status: 500 });
}
