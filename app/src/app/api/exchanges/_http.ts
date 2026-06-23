/*
  交换域路由共享 HTTP 工具：DomainError → 统一 error schema 响应。
  错误体 { error, message?, missing? }（SERVICE_CONTRACT 错误码约定）。
*/
import { NextResponse } from "next/server";
import { DomainError } from "@/server/exchange";

export function errorResponse(e: unknown): NextResponse {
  if (e instanceof DomainError) {
    return NextResponse.json(
      { error: e.code, ...(e.extra ?? {}) },
      { status: e.status }
    );
  }
  return NextResponse.json({ error: "internal" }, { status: 500 });
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  return (await request.json().catch(() => ({}))) as Record<string, unknown>;
}
