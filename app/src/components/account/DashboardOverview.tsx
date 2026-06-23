"use client";

import { StatBlock } from "@/components/shared";
import { SecondaryButton } from "@/components/shared";
import { Avatar } from "@/components/shared";
import { SkeletonBlock } from "@/components/shared";

/*
  COMP-150 DashboardOverview（个人中心概览，PAGE-060）。
  欢迎条 + 4 × StatBlock（我的模块 / 进行中交换 / 信任分 / 未读通知）。
  统计派生只读（ENT-011/003/007/017）。未读=0 去红点（条件渲染，非仅颜色，NFR-007）。
*/
export interface DashboardOverviewProps {
  currentUser: {
    displayName: string;
    githubHandle: string;
    avatarUrl?: string;
    githubVerified: boolean;
  };
  stats: {
    myModulesCount: number;
    activeExchangesCount: number;
    trustScore: number;
    unreadNotificationsCount: number;
  };
  welcomeSummary: string;
  loading?: boolean;
  error?: boolean;
  onStatClick?: (stat: "modules" | "exchanges" | "trust" | "unread") => void;
  onRetry?: () => void;
}

export function DashboardOverview({
  currentUser,
  stats,
  welcomeSummary,
  loading = false,
  error = false,
  onStatClick,
  onRetry,
}: DashboardOverviewProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <SkeletonBlock variant="row" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SkeletonBlock variant="stat" count={4} />
        </div>
      </div>
    );
  }

  const hasUnread = stats.unreadNotificationsCount > 0;

  return (
    <section className="flex flex-col gap-4" aria-label="个人中心概览">
      {/* 欢迎条 */}
      <div className="flex items-center gap-3 rounded-card border border-border bg-surface p-4">
        <Avatar
          src={currentUser.avatarUrl}
          login={currentUser.githubHandle}
          verified={currentUser.githubVerified}
          size="lg"
        />
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-text">
            欢迎回来，{currentUser.displayName}
          </h1>
          <p className="text-sm text-text-muted">{welcomeSummary}</p>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          <span>概览数据加载失败</span>
          <SecondaryButton size="sm" onClick={onRetry}>
            重试
          </SecondaryButton>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 rounded-card border border-border bg-surface p-4 sm:grid-cols-4">
          <StatBlock
            value={stats.myModulesCount}
            label="我的模块"
            icon="folder"
            tone="primary"
          />
          <StatBlock
            value={stats.activeExchangesCount}
            label="进行中交换"
            icon="swap_horiz"
            tone="info"
            onClick={() => onStatClick?.("exchanges")}
          />
          <StatBlock
            value={stats.trustScore}
            label="信任分"
            icon="verified_user"
            tone="success"
          />
          {/* 未读通知：可点跳通知中心；红点非唯一信息载体（数字 + aria-label） */}
          <div className="relative">
            {hasUnread && (
              <span
                className="absolute -right-1 -top-1 inline-block size-2.5 rounded-full bg-danger"
                aria-hidden
              />
            )}
            <StatBlock
              value={stats.unreadNotificationsCount}
              label={`未读通知${hasUnread ? `（${stats.unreadNotificationsCount} 条）` : ""}`}
              icon="notifications"
              tone="warning"
              onClick={() => onStatClick?.("unread")}
            />
          </div>
        </div>
      )}
    </section>
  );
}
