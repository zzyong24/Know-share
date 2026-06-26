/*
  account 集群 query / mutation hooks（PAGE-060~064）。
  query key 本地定义（不改 query-keys.ts），便于精确失效。取数走 apiFetch（MSW → 阶段15 契约）。
  乐观更新：通知标记已读 / 全部已读（ASM-045），失败回滚。
*/
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Notification } from "@/lib/types";
import type {
  DashboardData,
  DraftItem,
  ConsentRecord,
  ContactMethod,
  AccountIdentity,
  NotificationPrefs,
} from "@/mocks/fixtures/account";

// ── 本地 query keys（不污染共享 query-keys.ts）──
export const accountKeys = {
  dashboard: ["account", "dashboard"] as const,
  section: (section: string) => ["account", "section", section] as const,
  notifications: (type: string) => ["account", "notifications", type] as const,
  contacts: ["account", "contacts"] as const,
  consents: (mode: string) => ["account", "consents", mode] as const,
  identity: ["account", "identity"] as const,
  notificationPrefs: ["account", "notification-prefs"] as const,
} as const;

// ── PAGE-060 个人中心概览 ──
export function useDashboard() {
  return useQuery({
    queryKey: accountKeys.dashboard,
    queryFn: () => apiFetch<DashboardData>("/api/me/dashboard"),
  });
}

// ── PAGE-061 分区视图 ──
export type MeSection =
  | "modules"
  | "drafts"
  | "received"
  | "sent"
  | "favorites";

export function useMeSection<T>(section: MeSection) {
  return useQuery({
    queryKey: accountKeys.section(section),
    queryFn: () =>
      apiFetch<{ items: T[] }>(`/api/me/sections/${section}`),
  });
}

export type { DraftItem };

// ── PAGE-061 分区写动作（草稿删除 / 模块下架 / 编辑 / 收藏切换）──
// 成功后失效对应分区 + 概览徽标，列表自动刷新。

/** 删除草稿（DELETE /api/submissions/:id；仅本人、仅 Draft）。 */
export function useDeleteDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/submissions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: accountKeys.section("drafts") });
      qc.invalidateQueries({ queryKey: accountKeys.dashboard });
    },
  });
}

/** 下架自己已发布的模块（POST /api/modules/:id/delist）。 */
export function useDelistModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/modules/${id}/delist`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: accountKeys.section("modules") });
      qc.invalidateQueries({ queryKey: accountKeys.dashboard });
    },
  });
}

/** 一键发布自己的草稿模块（POST /api/modules/:id/publish；Draft→Published）。 */
export function usePublishModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/modules/${id}/publish`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: accountKeys.section("modules") });
      qc.invalidateQueries({ queryKey: accountKeys.section("drafts") });
      qc.invalidateQueries({ queryKey: accountKeys.dashboard });
    },
  });
}

/** 对自己模块发起编辑：建草稿，返回草稿 id（前端跳 /submit?draft=:id）。 */
export function useCreateEditDraft() {
  return useMutation({
    mutationFn: (moduleId: string) =>
      apiFetch<{ id: string }>(`/api/modules/${moduleId}/edit-draft`, {
        method: "POST",
      }),
  });
}

/** 收藏分区里取消收藏（POST /api/modules/:id/favorite，toggle 幂等）。 */
export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (moduleId: string) =>
      apiFetch(`/api/modules/${moduleId}/favorite`, {
        method: "POST",
        body: JSON.stringify({ toggle: true }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: accountKeys.section("favorites") });
      qc.invalidateQueries({ queryKey: accountKeys.dashboard });
    },
  });
}

// ── PAGE-062 通知 ──
export type NotificationFilter =
  | "all"
  | "exchange"
  | "review"
  | "feedback"
  | "community";

interface NotificationsResponse {
  items: Notification[];
  unreadCount: number;
}

export function useNotifications(filter: NotificationFilter) {
  return useQuery({
    queryKey: accountKeys.notifications(filter),
    queryFn: () => {
      const qs = filter === "all" ? "" : `?type=${filter}`;
      return apiFetch<NotificationsResponse>(`/api/notifications${qs}`);
    },
  });
}

/** 单条标记已读（乐观，幂等，ASM-045）。 */
export function useMarkNotificationRead(filter: NotificationFilter) {
  const qc = useQueryClient();
  const key = accountKeys.notifications(filter);
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/notifications/${id}/read`, { method: "POST" }),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<NotificationsResponse>(key);
      if (prev) {
        qc.setQueryData<NotificationsResponse>(key, {
          ...prev,
          items: prev.items.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, prev.unreadCount - 1),
        });
      }
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
  });
}

/** 全部标记已读（乐观，失败回滚 + toast 由调用方处理，ASM-045）。 */
export function useMarkAllNotificationsRead(filter: NotificationFilter) {
  const qc = useQueryClient();
  const key = accountKeys.notifications(filter);
  return useMutation({
    mutationFn: () =>
      apiFetch("/api/notifications/read-all", { method: "POST" }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<NotificationsResponse>(key);
      if (prev) {
        qc.setQueryData<NotificationsResponse>(key, {
          ...prev,
          items: prev.items.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
  });
}

// ── PAGE-063 联系方式 ──
export function useContactMethods() {
  return useQuery({
    queryKey: accountKeys.contacts,
    queryFn: () =>
      apiFetch<{ items: ContactMethod[] }>("/api/me/contacts"),
  });
}

export function useSaveContactMethods() {
  return useMutation({
    mutationFn: (methods: ContactMethod[]) =>
      apiFetch("/api/me/contacts", {
        method: "PUT",
        body: JSON.stringify({ items: methods }),
      }),
  });
}

export type { ContactMethod };

// ── PAGE-063 / 064 同意 / 披露记录 ──
export type ConsentMode = "disclosure" | "all-consent";

export function useConsents(mode: ConsentMode) {
  return useQuery({
    queryKey: accountKeys.consents(mode),
    queryFn: () =>
      apiFetch<{ items: ConsentRecord[] }>(
        `/api/me/consents?mode=${mode}`
      ),
  });
}

export function useRevokeConsent() {
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/me/consents/${id}/revoke`, { method: "POST" }),
  });
}

export type { ConsentRecord };

// ── PAGE-064 账户身份 ──
export function useAccountIdentity() {
  return useQuery({
    queryKey: accountKeys.identity,
    queryFn: () => apiFetch<AccountIdentity>("/api/me/account"),
  });
}

export type { AccountIdentity };

// ── PAGE-064 通知偏好 ──
export function useNotificationPrefs() {
  return useQuery({
    queryKey: accountKeys.notificationPrefs,
    queryFn: () => apiFetch<NotificationPrefs>("/api/me/notification-prefs"),
  });
}

export function useSaveNotificationPrefs() {
  return useMutation({
    mutationFn: (prefs: NotificationPrefs) =>
      apiFetch("/api/me/notification-prefs", {
        method: "PUT",
        body: JSON.stringify(prefs),
      }),
  });
}

export type { NotificationPrefs };
