"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NotificationFeed } from "./NotificationFeed";
import { notify } from "@/components/shared";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type NotificationFilter,
} from "@/lib/queries/account";

/*
  NotificationsView —— PAGE-062 通知中心客户端视图。
  筛选 Tab（all/exchange/review/feedback/community）+ 乐观标记已读 / 全部已读（ASM-045）。
*/
export interface NotificationsViewProps {
  initialFilter?: NotificationFilter;
}

export function NotificationsView({
  initialFilter = "all",
}: NotificationsViewProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<NotificationFilter>(initialFilter);

  const { data, isLoading, isError, refetch } = useNotifications(filter);
  const markRead = useMarkNotificationRead(filter);
  const markAll = useMarkAllNotificationsRead(filter);

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-6">
      <NotificationFeed
        notifications={data?.items ?? []}
        filter={filter}
        unreadCount={data?.unreadCount ?? 0}
        loading={isLoading}
        error={isError}
        onFilterChange={setFilter}
        onOpen={(_id, href) => href && router.push(href)}
        onMarkRead={(id) => markRead.mutate(id)}
        onMarkAllRead={() =>
          markAll.mutate(undefined, {
            onError: () => notify("标记失败，请重试", "error"),
          })
        }
        onRetry={() => refetch()}
      />
    </div>
  );
}
