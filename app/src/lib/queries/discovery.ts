/*
  发现页 query hooks（PAGE-002 / FRONTEND_SPEC §8）。
  组件只接 props，取数在本层（ASM-068）；筛选/排序维度据 ASM-017，形状阶段 15 对齐 SERVICE_CONTRACT。
*/
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { FilterValue, KnowledgeModule, SortKey } from "@/lib/types";

export interface DiscoveryParams {
  filters?: FilterValue;
  sort?: SortKey;
  q?: string;
  /** 演示/测试空注册表（MOCK-002）。 */
  empty?: boolean;
}

/** FilterValue + sort + q → 规范化 URLSearchParams（与 MSW handler 对齐）。 */
export function buildDiscoveryQuery(params: DiscoveryParams): URLSearchParams {
  const sp = new URLSearchParams();
  const { filters, sort, q, empty } = params;
  filters?.type?.forEach((t) => sp.append("type", t));
  filters?.topic?.forEach((t) => sp.append("topic", t));
  filters?.trustLevel?.forEach((t) => sp.append("trustLevel", t));
  if (filters?.verifiedOnly) sp.set("verifiedOnly", "true");
  if (sort && sort !== "relevance") sp.set("sort", sort);
  if (q?.trim()) sp.set("q", q.trim());
  if (empty) sp.set("empty", "true");
  return sp;
}

export function useDiscoveryModules(params: DiscoveryParams = {}) {
  const sp = buildDiscoveryQuery(params);
  const qs = sp.toString();
  return useQuery({
    queryKey: queryKeys.modules.list({ ...params.filters, sort: params.sort, q: params.q, empty: params.empty }),
    queryFn: () =>
      apiFetch<{ items: KnowledgeModule[]; total: number }>(
        `/api/modules${qs ? `?${qs}` : ""}`
      ),
  });
}
