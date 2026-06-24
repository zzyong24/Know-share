/*
  用户身份回填（DEC-006 GitHub 规范身份）。
  GitHub OAuth 登录成功后，把公开身份 upsert 进 users 表
  —— trust/exchange/审核等域以真实 users 行做外键，登录必须先落地这一行。
  守则：
  - 仅公开身份（githubId/login/displayName/avatar），无 PII/联系方式（INV-04/DEC-010）。
  - isAdmin：以 DB 现值为准；KNOWSHARE_ADMIN_LOGINS 白名单命中可「提升」，
    登录路径绝不「降级」既有管理员（避免误配白名单把管理员踢掉）。
  - githubVerified：以 DB 现值为准（平台验证流程维护），登录不擅自置真。
*/
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import * as schema from "@/server/db/schema";

export interface GitHubIdentity {
  githubId: string;
  login: string;
  displayName: string;
  avatarUrl: string;
}

export interface PlatformUser {
  id: string;
  login: string;
  avatarUrl: string;
  isAdmin: boolean;
  githubVerified: boolean;
}

/** 解析管理员白名单（逗号分隔的 GitHub login，大小写敏感同 GitHub）。 */
function adminLogins(): string[] {
  return (process.env.KNOWSHARE_ADMIN_LOGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
  按 githubId upsert 平台用户，返回会话所需的公开投影。
  - 新用户：isAdmin = 白名单命中、githubVerified = false。
  - 老用户：刷新 login/displayName/avatar；白名单命中则提升 isAdmin；
    既有 isAdmin/githubVerified 不被登录降级。
*/
export async function upsertUserFromGitHub(
  id: GitHubIdentity
): Promise<PlatformUser> {
  const db = await getDb();
  const displayName = id.displayName || id.login;
  const isWhitelisted = adminLogins().includes(id.login);

  const [row] = await db
    .insert(schema.users)
    .values({
      githubId: id.githubId,
      login: id.login,
      displayName,
      avatarUrl: id.avatarUrl,
      isAdmin: isWhitelisted,
      domains: [],
    })
    .onConflictDoUpdate({
      target: schema.users.githubId,
      set: {
        login: id.login,
        displayName,
        avatarUrl: id.avatarUrl,
        // 仅白名单命中时提升管理员；非命中不写该列（不经登录降级）。
        ...(isWhitelisted ? { isAdmin: true } : {}),
      },
    })
    .returning({
      id: schema.users.id,
      login: schema.users.login,
      avatarUrl: schema.users.avatarUrl,
      isAdmin: schema.users.isAdmin,
      githubVerified: schema.users.githubVerified,
    });

  return {
    id: row.id,
    login: row.login,
    avatarUrl: row.avatarUrl,
    isAdmin: row.isAdmin,
    githubVerified: row.githubVerified,
  };
}

/** 按 login 读取平台用户（无则 null）。 */
export async function getUserByLogin(login: string): Promise<PlatformUser | null> {
  const db = await getDb();
  const [row] = await db
    .select({
      id: schema.users.id,
      login: schema.users.login,
      avatarUrl: schema.users.avatarUrl,
      isAdmin: schema.users.isAdmin,
      githubVerified: schema.users.githubVerified,
    })
    .from(schema.users)
    .where(eq(schema.users.login, login));
  return row ?? null;
}
