/*
  API-023 GET /api/trust-profiles/:login —— 信任档案聚合。
  信任分/趋势/四来源拆解/徽章/反馈质量，可解释（HARD-03）；公开匿名可看，零私有（INV-04）。
  未知 login → 404。
*/
import { NextResponse } from "next/server";
import { getTrustProfileByLogin } from "@/server/trust";
import { getSession } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ login: string }> }
) {
  const { login } = await params;
  const session = await getSession();
  const profile = await getTrustProfileByLogin(login, session?.login ?? null);
  if (!profile) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
  return NextResponse.json(profile);
}
