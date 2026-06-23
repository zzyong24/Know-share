import { ModuleDetailView } from "@/components/module-detail";

/*
  PAGE-010 知识模块详情（route /modules/:id，(public) 段，匿名可访问 INV-04/FR-001）。
  外壳由 (public)/layout.tsx 的 SiteShell 提供；本页只渲染详情决策面（IA-003）。
  取数在客户端 ModuleDetailView（TanStack Query + MSW）；登录态后续由编排者接入会话。
*/
export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ModuleDetailView moduleId={id} />;
}
