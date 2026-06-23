"use client";

import {
  FilterTabs,
  EmptyState,
  Pagination,
  SkeletonBlock,
  SecondaryButton,
} from "@/components/shared";
import { NotificationItem } from "./NotificationItem";
import type { Notification } from "@/lib/types";
import type { NotificationFilter } from "@/lib/queries/account";

/*
  COMP-153 NotificationFeed（通知流，PAGE-062）。
  页头（标题 +「全部标记已读」）+ 5 个筛选 Tab + 通知项列表 + 空态 + 加载更多。
  乐观更新由父级 mutation 控制；失败回滚 + toast（ASM-045）。
*/
const TABS: { key: NotificationFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "exchange", label: "交换" },
  { key: "review", label: "评审" },
  { key: "feedback", label: "反馈" },
  { key: "community", label: "社区" },
];

export interface NotificationFeedProps {
  notifications: Notification[];
  filter: NotificationFilter;
  unreadCount: number;
  loading?: boolean;
  error?: boolean;
  hasMore?: boolean;
  onFilterChange?: (type: NotificationFilter) => void;
  onOpen?: (id: string, href?: string) => void;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onLoadMore?: () => void;
  onRetry?: () => void;
}

export function NotificationFeed({
  notifications,
  filter,
  unreadCount,
  loading = false,
  error = false,
  hasMore = false,
  onFilterChange,
  onOpen,
  onMarkRead,
  onMarkAllRead,
  onLoadMore,
  onRetry,
}: NotificationFeedProps) {
  return (
    <section className="flex flex-col gap-4" aria-label="通知中心">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-text">通知</h1>
        <SecondaryButton
          size="sm"
          iconLeft="check"
          disabled={unreadCount === 0}
          aria-label="全部标记已读"
          onClick={onMarkAllRead}
        >
          全部标记已读
        </SecondaryButton>
      </div>

      <FilterTabs
        tabs={TABS}
        activeKey={filter}
        onChange={(k) => onFilterChange?.(k as NotificationFilter)}
        aria-label="通知筛选"
      />

      {loading ? (
        <SkeletonBlock variant="row" count={5} />
      ) : error ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          <span>通知加载失败</span>
          <SecondaryButton size="sm" onClick={onRetry}>
            重试
          </SecondaryButton>
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="notifications"
          title={filter === "all" ? "暂无通知" : "该分类下暂无通知"}
          description="交换、评审、反馈与社区事件会在此提醒。"
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                id={n.id}
                type={n.type}
                read={n.read}
                title={n.title}
                body={n.body}
                createdAt={n.createdAt}
                refLink={n.href ? { href: n.href } : undefined}
                onOpen={onOpen}
                onMarkRead={onMarkRead}
              />
            ))}
          </ul>
          <Pagination mode="loadMore" hasMore={hasMore} onLoadMore={onLoadMore} />
        </>
      )}
    </section>
  );
}
