import { Suspense } from "react";
import { DiscoveryView } from "@/components/shell-discovery/DiscoveryView";
import { SkeletonBlock } from "@/components/shared/skeleton-block";

/*
  PAGE-002 发现 / 注册表页（route /，等价 /discover）。
  首屏价值橱窗：Hero + 筛选/排序/主题 + 模块卡片网格 + 底部平台统计 strip。
  视图为客户端组件（URL searchParams 深链 + query hooks 取数）；用 Suspense 包裹 useSearchParams。
*/
export default function DiscoverPage() {
  return (
    <Suspense fallback={<SkeletonBlock variant="card" count={3} />}>
      <DiscoveryView />
    </Suspense>
  );
}
