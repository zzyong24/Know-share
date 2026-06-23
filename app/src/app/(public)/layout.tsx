import { SiteShell } from "@/components/layout/SiteShell";

/*
  公开段布局（FRONTEND_SPEC §2/§3）。匿名可访问、零私有内容（INV-04）。
  挂共享 AppShell（经 SiteShell 接 Next 路由/会话）。模板约定：
  其余公开模块（module-detail/exchange/trust/skills/about/open-api）把页面放进本组并复用此外壳。
*/
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteShell>{children}</SiteShell>;
}
