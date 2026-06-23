import { SiteShell } from "@/components/layout/SiteShell";

/*
  管理员段布局（FRONTEND_SPEC §3）。仅管理员角色可达（FR-100）。
  角色校验由中间件承载（admin 模块接入后补 middleware.ts 的 isAdmin 守卫）。
  模板约定：审核控制台等管理页面放入本组并复用此外壳。
*/
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteShell>{children}</SiteShell>;
}
