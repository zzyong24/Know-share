/*
  其余共享 query hooks 脚手架（信任 / 技能 / 通知 / 主题 / 统计 / 审核 / 搜索）。
  占位形状，阶段 15 对齐 SERVICE_CONTRACT；各模块批次 2 可在自己的 queries 文件内扩展。
*/
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type {
  TrustProfile,
  AgentSkill,
  Notification,
  Topic,
  UsageStat,
  ReviewItem,
  SearchSuggestion,
} from "@/lib/types";

export function useTrustProfile(login: string) {
  return useQuery({
    queryKey: queryKeys.trust.profile(login),
    queryFn: () => apiFetch<TrustProfile>(`/api/trust/${login}`),
    enabled: !!login,
  });
}

export function useSkills() {
  return useQuery({
    queryKey: queryKeys.skills.all,
    queryFn: () => apiFetch<{ items: AgentSkill[] }>("/api/skills"),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: () => apiFetch<{ items: Notification[] }>("/api/notifications"),
  });
}

export function useTopics() {
  return useQuery({
    queryKey: queryKeys.topics.all,
    queryFn: () => apiFetch<{ items: Topic[] }>("/api/topics"),
  });
}

export function useUsageStats() {
  return useQuery({
    queryKey: queryKeys.stats.usage,
    queryFn: () => apiFetch<{ items: UsageStat[] }>("/api/stats/usage"),
  });
}

export function useReviewQueue() {
  return useQuery({
    queryKey: queryKeys.admin.reviewQueue,
    queryFn: () => apiFetch<{ items: ReviewItem[] }>("/api/admin/review-queue"),
  });
}

export function useSearchSuggest(q: string) {
  return useQuery({
    queryKey: queryKeys.search.suggest(q),
    queryFn: () =>
      apiFetch<{ items: SearchSuggestion[] }>(
        `/api/search/suggest?q=${encodeURIComponent(q)}`
      ),
    enabled: q.trim().length > 0,
  });
}
