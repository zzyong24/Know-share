import { MeDashboardView } from "@/components/account";
import type { MeSection } from "@/components/account";

/*
  PAGE-060/061 个人中心容器 + 分区视图（/me/:section）。
  section ∈ modules|drafts|received|sent|favorites；非法值由视图回退 modules。
*/
export default async function MeSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <MeDashboardView section={section as MeSection} />;
}
