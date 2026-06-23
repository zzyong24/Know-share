/*
  交换相关 query hooks 脚手架（FRONTEND_SPEC §8）。占位形状，阶段 15 对齐契约。
*/
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { Exchange } from "@/lib/types";

export function useExchanges(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.exchanges.list(filters),
    queryFn: () =>
      apiFetch<{ items: Exchange[]; total: number }>("/api/exchanges"),
  });
}

export function useExchange(id: string) {
  return useQuery({
    queryKey: queryKeys.exchanges.detail(id),
    queryFn: () => apiFetch<Exchange>(`/api/exchanges/${id}`),
    enabled: !!id,
  });
}
