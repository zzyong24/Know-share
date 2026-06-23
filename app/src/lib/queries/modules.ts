/*
  模块相关 query hooks 脚手架（FRONTEND_SPEC §8）。
  取数由本层负责、组件只接 props（ASM-068）。形状为占位，阶段 15 对齐 SERVICE_CONTRACT。
*/
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { KnowledgeModule, Manifest } from "@/lib/types";

export function useModules(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.modules.list(filters),
    queryFn: () =>
      apiFetch<{ items: KnowledgeModule[]; total: number }>("/api/modules"),
  });
}

export function useModule(id: string) {
  return useQuery({
    queryKey: queryKeys.modules.detail(id),
    queryFn: () => apiFetch<KnowledgeModule>(`/api/modules/${id}`),
    enabled: !!id,
  });
}

export function useManifest(id: string) {
  return useQuery({
    queryKey: queryKeys.modules.manifest(id),
    queryFn: () => apiFetch<Manifest>(`/api/modules/${id}/manifest`),
    enabled: !!id,
  });
}
