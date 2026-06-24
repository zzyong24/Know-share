/*
  Agent 写入认证（DEC-006 GitHub 规范身份；ASM-118 复议：外部 agent 用 GitHub 细粒度 token）。
  - 主人在 GitHub 生成细粒度 token 交给本机 agent；agent 以 `Authorization: Bearer <token>` 调写端点。
  - 服务端用该 token 向 GitHub 反查身份（GET /user），成功则 upsert 平台用户并投影为会话行动者。
  - 仅公开身份（login/avatar），无 PII（INV-04）；token 不落库、不日志。
  测试可用 setTokenVerifier 注入校验器，免真实 GitHub 网络。
*/
import type { Session } from "@/lib/types";
import { upsertUserFromGitHub } from "@/server/users";

export interface GitHubTokenProfile {
  id: number | string;
  login: string;
  name?: string;
  avatar_url?: string;
}

type Verifier = (token: string) => Promise<GitHubTokenProfile | null>;

let verifierOverride: Verifier | null = null;

/** 测试：注入 token 校验器（返回 null = 无效 token）。 */
export function setTokenVerifier(v: Verifier | null): void {
  verifierOverride = v;
}

/** 默认校验：拿 token 反查 GitHub 用户身份。 */
async function defaultVerify(token: string): Promise<GitHubTokenProfile | null> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "know-share",
    },
  });
  if (!res.ok) return null;
  const j = (await res.json()) as GitHubTokenProfile;
  return j?.login ? j : null;
}

/** 从请求头取 Bearer token。 */
export function extractBearer(req: Request): string | null {
  const h = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1].trim() : null;
}

/** 用 token 解析 agent 行动者；无/无效 → null。成功则 upsert 平台用户。 */
export async function resolveApiActor(req: Request): Promise<Session | null> {
  const token = extractBearer(req);
  if (!token) return null;
  const verify = verifierOverride ?? defaultVerify;
  let profile: GitHubTokenProfile | null;
  try {
    profile = await verify(token);
  } catch {
    return null;
  }
  if (!profile?.login) return null;
  const u = await upsertUserFromGitHub({
    githubId: String(profile.id),
    login: profile.login,
    displayName: profile.name || profile.login,
    avatarUrl: profile.avatar_url ?? "",
  });
  return {
    login: u.login,
    avatarUrl: u.avatarUrl,
    isAdmin: u.isAdmin,
    verified: u.githubVerified,
  };
}

/** 写端点统一行动者：先 token（agent 程序化），后 cookie 会话（web）。 */
export async function getActor(req: Request): Promise<Session | null> {
  const viaToken = await resolveApiActor(req);
  if (viaToken) return viaToken;
  const { getSession } = await import("@/server/auth");
  return getSession();
}
