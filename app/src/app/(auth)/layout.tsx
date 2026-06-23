import { SiteShell } from "@/components/layout/SiteShell";

/*
  受保护段布局（FRONTEND_SPEC §3）。需 GitHub 登录可达（DEC-006/NFR-005）。
  会话/角色校验将由中间件承载（auth/account 模块接入 OAuth 后补 middleware.ts）。
  模板约定：account/submission/notifications 等需登录页面放入本组并复用此外壳。
*/
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteShell>{children}</SiteShell>;
}
