/*
  社交信号 + 举报 mutation hooks（W-7 / API-049~051；DEC-018 写流程接线）。
  形状对齐后端 route handlers：
  - useFavoriteModule  → POST /api/modules/:id/favorite → { favorited, favoriteCount }
  - useEndorseUser     → POST /api/users/:login/endorse → { endorsed, endorsementCount }
  - useReport          → POST /api/reports → { id, status }
  query-key 本地定义（不污染全局 query-keys.ts）。零私有内容（INV-04）。
*/
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface FavoriteResult {
  favorited: boolean;
  favoriteCount: number;
}

export interface EndorseResult {
  endorsed: boolean;
  endorsementCount: number;
}

export interface ReportResult {
  id: string;
  status: string;
}

export interface ReportInput {
  targetType: "module" | "user" | "exchange";
  targetId: string;
  reason: string;
}

/** 收藏 / 取消收藏（API-049；toggle 幂等，INV-07）。 */
export function useFavoriteModule(moduleId: string) {
  return useMutation({
    mutationFn: (opts: { toggle?: boolean } = {}) =>
      apiFetch<FavoriteResult>(`/api/modules/${moduleId}/favorite`, {
        method: "POST",
        body: JSON.stringify({ toggle: opts.toggle ?? true }),
      }),
  });
}

/** 认可（API-050；低权重社交信号，INV-10）。 */
export function useEndorseUser(login: string) {
  return useMutation({
    mutationFn: () =>
      apiFetch<EndorseResult>(
        `/api/users/${encodeURIComponent(login)}/endorse`,
        { method: "POST" }
      ),
  });
}

/** 举报（API-051；→ 评审队列 pending）。 */
export function useReport() {
  return useMutation({
    mutationFn: (input: ReportInput) =>
      apiFetch<ReportResult>("/api/reports", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}
