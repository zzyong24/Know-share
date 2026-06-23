import { Suspense } from "react";
import { SearchView } from "@/components/shell-discovery/SearchView";
import { SkeletonBlock } from "@/components/shared/skeleton-block";

/*
  PAGE-003 全局搜索结果面（route /search?q=&type=）。
  承接 AppShell 搜索框提交；把查询解析为 模块/主题/用户/交换 四类分组（FR-001）。
*/
export default function SearchPage() {
  return (
    <Suspense fallback={<SkeletonBlock variant="card" count={2} />}>
      <SearchView />
    </Suspense>
  );
}
