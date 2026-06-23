/*
  全局搜索结果 query hooks（PAGE-003 / FRONTEND_SPEC §8）。
  把查询解析为四类实体结果分组（FR-001）；模块结果保持与发现页同一脱敏边界（INV-04）。
*/
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { SearchResults } from "@/lib/types";

export function useSearchResults(q: string) {
  const query = q.trim();
  return useQuery({
    queryKey: queryKeys.search.results(query),
    queryFn: () =>
      apiFetch<SearchResults>(`/api/search?q=${encodeURIComponent(query)}`),
    enabled: query.length > 0,
  });
}
