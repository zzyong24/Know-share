/*
  module-detail 模块 query hooks（FRONTEND_SPEC §8）。
  取数由本层负责、组件只接 props（ASM-068）。query-key 在本文件本地定义（勿改 lib/query-keys.ts）。
  形状为占位，阶段 15 对齐 SERVICE_CONTRACT。
*/
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { ModuleDetail } from "@/mocks/fixtures/module-detail";

/** 本模块本地 query-key（不污染全局 query-keys.ts）。 */
export const moduleDetailKeys = {
  detail: (id: string) => ["module-detail", id] as const,
};

export type { ModuleDetail };

/** 详情页聚合数据（GET /api/modules/:id/detail）。 */
export function useModuleDetail(id: string) {
  return useQuery<ModuleDetail>({
    queryKey: moduleDetailKeys.detail(id),
    queryFn: () => apiFetch<ModuleDetail>(`/api/modules/${id}/detail`),
    enabled: !!id,
  });
}
