/*
  鉴权（Auth.js / NextAuth v5）—— GitHub provider，GitHub 为规范身份（DEC-006）。
  - session.user 携带 login/avatarUrl/isAdmin/verified（对齐前端 Session 类型）。
  - getSession() 统一会话读取封装；公开端点会话失败降级匿名（null，ASM-019）。
  - 测试可用 setTestSession() 注入 mock session，无需真实 OAuth。
  懒初始化：仅在首次调用 handlers/getSession 时构建 NextAuth，避免 build 期需要 env。
*/
import type { Session } from "@/lib/types";

/** 会话读取的可注入实现（测试用 mock；默认走 NextAuth）。 */
type SessionResolver = () => Promise<Session | null>;

let testSession: Session | null | undefined; // undefined = 未注入；null = 显式匿名
let resolverOverride: SessionResolver | null = null;

/** 测试：注入固定会话（或匿名 null）。 */
export function setTestSession(session: Session | null): void {
  testSession = session;
}

/** 测试：清除注入，恢复真实解析。 */
export function clearTestSession(): void {
  testSession = undefined;
  resolverOverride = null;
}

/** 测试：注入自定义解析器（如按请求头切换身份）。 */
export function setSessionResolver(resolver: SessionResolver): void {
  resolverOverride = resolver;
}

/** 懒构建 NextAuth 实例（仅运行期；缺 env 不在 build 期触发）。 */
async function buildNextAuth() {
  const { default: NextAuth } = await import("next-auth");
  const { default: GitHub } = await import("next-auth/providers/github");
  return NextAuth({
    providers: [
      GitHub({
        clientId: process.env.AUTH_GITHUB_ID,
        clientSecret: process.env.AUTH_GITHUB_SECRET,
      }),
    ],
    secret: process.env.AUTH_SECRET,
    callbacks: {
      // 将 GitHub 公开身份投影进 session（无 PII/无联系方式，DEC-010/INV-04）。
      session({ session, token }) {
        if (session.user) {
          // login/avatar 由 GitHub profile 注入到 token（按需扩展）。
          const u = session.user as unknown as Record<string, unknown>;
          const t = token as unknown as Record<string, unknown>;
          u.login = t.login;
          u.isAdmin = t.isAdmin;
          u.verified = t.verified;
        }
        return session;
      },
    },
  });
}

let nextAuthCache: Awaited<ReturnType<typeof buildNextAuth>> | null = null;

async function getNextAuth() {
  if (!nextAuthCache) nextAuthCache = await buildNextAuth();
  return nextAuthCache;
}

/** Route Handler 用的 GET/POST（`app/api/auth/[...nextauth]/route.ts` 转发）。 */
export async function authHandlers() {
  const { handlers } = await getNextAuth();
  return handlers;
}

/**
  统一会话读取（DEC-006）。返回前端 Session 投影或 null（降级匿名）。
  测试注入优先；否则读 NextAuth session 并投影。失败吞掉返回 null（ASM-019）。
*/
export async function getSession(): Promise<Session | null> {
  if (resolverOverride) return resolverOverride();
  if (testSession !== undefined) return testSession;
  // dev 联调会话（KNOWSHARE_DEV_SESSION）：免真实 GitHub OAuth，仅 dev 路径生效。
  // 仅 GitHub 公开身份（login/avatar/isAdmin/verified），无 PII/联系方式（DEC-010/INV-04）。
  if (process.env.KNOWSHARE_DEV_SESSION && process.env.NODE_ENV !== "test") {
    return {
      login: "zyongzhu24",
      avatarUrl: "https://avatars.example.com/zyongzhu24.png",
      isAdmin: true,
      verified: true,
    };
  }
  try {
    const { auth } = await getNextAuth();
    const raw = await auth();
    if (!raw?.user) return null;
    const u = raw.user as unknown as Record<string, unknown>;
    const login = typeof u.login === "string" ? u.login : null;
    if (!login) return null;
    return {
      login,
      avatarUrl: typeof u.image === "string" ? u.image : "",
      isAdmin: u.isAdmin === true,
      verified: u.verified === true,
    };
  } catch {
    return null; // 会话端点失败 → 匿名，不阻断公开浏览（ASM-019）。
  }
}
