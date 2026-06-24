/*
  GET /api/openapi.json —— 机读 API 描述（OpenAPI 3.1）。agent 进站第一站。
*/
import { NextResponse } from "next/server";
import { buildOpenApiDoc } from "@/server/openapi";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return NextResponse.json(buildOpenApiDoc(origin));
}
