/*
  会话 query hook（PAGE-001 / FR-140 / DEC-011）。
  失败时降级匿名（返回 null），不阻断公开浏览（ASM-019）。AppShell 据此切换匿名/登录态。
*/
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { Session } from "@/lib/types";

export function useSession() {
  return useQuery({
    queryKey: queryKeys.session.current,
    queryFn: async (): Promise<Session | null> => {
      try {
        return await apiFetch<Session | null>("/api/session");
      } catch {
        // 会话端点失败 → 降级匿名，不报错（PAGE-001 错误/降级态）。
        return null;
      }
    },
    // 降级语义：失败也视为匿名，不无限重试打断浏览。
    retry: false,
  });
}
