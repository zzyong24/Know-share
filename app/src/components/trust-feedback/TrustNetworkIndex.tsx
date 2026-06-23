"use client";

import {
  StatBlock,
  ListRow,
  Avatar,
  TrustBadge,
  StatusPill,
  TopicChip,
  EmptyState,
  SkeletonBlock,
  SecondaryButton,
  Card,
  Icon,
} from "@/components/shared";
import type {
  NetworkContributor,
  NetworkOverviewStat,
  NetworkFeaturedSection,
  NetworkFilters,
} from "@/lib/queries/trust-feedback";
import type { TrustLevel } from "@/lib/types";

/*
  COMP-115 TrustNetworkIndex（信任网络索引）—— PAGE-043 /trust 核心。
  平台信任概览 StatBlock 行 + 筛选/检索 + 可信贡献者列表（默认按可解释信任排序，INV-10）
  + 精选/新晋发现辅助分区（标注口径，非排他/非付费榜，DEC-007）。
  贡献者条目 → /u/:login（PAGE-040）。信任等级有文字标签（NFR-007）。零 PII/私有内容（INV-04/09）。
*/
const TIER_OPTIONS: { value: TrustLevel | ""; label: string }[] = [
  { value: "", label: "全部等级" },
  { value: "high", label: "资深及以上" },
  { value: "medium", label: "活跃及以上" },
  { value: "low", label: "新晋及以上" },
];

export interface TrustNetworkIndexProps {
  overviewStats: NetworkOverviewStat[];
  contributors: NetworkContributor[];
  featuredSections?: NetworkFeaturedSection[];
  filters: NetworkFilters;
  topicOptions: string[];
  isAuthenticated?: boolean;
  loading?: boolean;
  isError?: boolean;
  onFilterChange: (next: NetworkFilters) => void;
  onContributorClick: (login: string) => void;
  onFollow?: (login: string) => void;
  onEndorse?: (login: string) => void;
  onRequireAuth?: () => void;
  onRetry?: () => void;
}

export function TrustNetworkIndex({
  overviewStats,
  contributors,
  featuredSections = [],
  filters,
  topicOptions,
  isAuthenticated = false,
  loading = false,
  isError = false,
  onFilterChange,
  onContributorClick,
  onFollow,
  onRequireAuth,
  onRetry,
}: TrustNetworkIndexProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* 平台信任概览（聚合，无 PII，INV-09） */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {overviewStats.map((s) => (
          <StatBlock
            key={s.key}
            value={s.value.toLocaleString("en-US")}
            label={s.label}
            icon={
              s.key === "verified"
                ? "verified_user"
                : s.key === "feedback"
                  ? "forum"
                  : "group"
            }
          />
        ))}
      </div>

      {/* 信任如何运作说明 + 排序口径标注（DEC-007/HARD-03） */}
      <Card padding="sm">
        <p className="flex items-start gap-2 text-sm text-text-muted">
          <Icon name="info" size={16} className="mt-0.5 text-info" aria-hidden />
          <span>
            默认按<strong className="text-text">可解释信任</strong>排序：依据交换历史与实际交换参与方的结构化反馈（权重高于收藏 / 认可等社交信号）。这是发现辅助，
            <strong className="text-text">非竞争性、非付费榜</strong>。
          </span>
        </p>
      </Card>

      {/* 筛选/检索 */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="trust-search">
          搜索可信贡献者
        </label>
        <input
          id="trust-search"
          type="search"
          value={filters.q ?? ""}
          placeholder="搜索贡献者 / 领域"
          onChange={(e) => onFilterChange({ ...filters, q: e.target.value })}
          className="h-9 min-w-[12rem] flex-1 rounded-control border border-border bg-surface px-3 text-sm text-text focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        />
        <label className="sr-only" htmlFor="trust-topic">
          按领域筛选
        </label>
        <select
          id="trust-topic"
          value={filters.topic ?? ""}
          onChange={(e) => onFilterChange({ ...filters, topic: e.target.value || undefined })}
          className="h-9 rounded-control border border-border bg-surface px-2 text-sm text-text"
        >
          <option value="">全部领域</option>
          {topicOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="trust-tier">
          按最低信任等级筛选
        </label>
        <select
          id="trust-tier"
          value={filters.minTier ?? ""}
          onChange={(e) =>
            onFilterChange({ ...filters, minTier: (e.target.value as TrustLevel) || "" })
          }
          className="h-9 rounded-control border border-border bg-surface px-2 text-sm text-text"
        >
          {TIER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <label className="inline-flex items-center gap-1.5 text-sm text-text-muted">
          <input
            type="checkbox"
            checked={!!filters.verifiedOnly}
            onChange={(e) => onFilterChange({ ...filters, verifiedOnly: e.target.checked })}
          />
          仅已验证
        </label>
      </div>

      {/* 精选 / 新晋（发现辅助，附口径，非付费榜 DEC-007） */}
      {featuredSections.length > 0 && !loading && contributors.length > 0 && (
        <div className="flex flex-col gap-3">
          {featuredSections.map((sec) => (
            <Card key={sec.title} padding="sm">
              <h3 className="text-sm font-semibold text-text">{sec.title}</h3>
              <p className="mt-0.5 text-xs text-text-subtle">{sec.rationale}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sec.logins.map((login) => (
                  <button
                    key={login}
                    type="button"
                    onClick={() => onContributorClick(login)}
                    className="inline-flex items-center gap-1.5 rounded-pill border border-border px-2 py-0.5 text-xs text-text hover:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    <Avatar login={login} size="xs" />@{login}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 贡献者列表 */}
      <section aria-label="可信贡献者列表">
        {loading ? (
          <SkeletonBlock variant="text" count={4} />
        ) : isError ? (
          <EmptyState
            icon="error"
            title="加载失败"
            description="信任网络数据加载失败。"
            action={onRetry ? { label: "重试", onClick: onRetry } : undefined}
          />
        ) : contributors.length === 0 ? (
          <EmptyState
            icon="group"
            title="暂无符合条件的可信贡献者"
            description="信任随交换与反馈积累；可放宽筛选条件，或前往发现页提交模块。"
            action={{ label: "去发现页", href: "/" }}
          />
        ) : (
          <ul className="overflow-hidden rounded-card border border-border">
            {contributors.map((c) => (
              <ListRow
                key={c.login}
                leading={<Avatar src={c.avatarUrl} login={c.login} size="md" verified={c.verified} />}
                title={
                  <button
                    type="button"
                    onClick={() => onContributorClick(c.login)}
                    className="text-sm font-medium text-text hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    {c.displayName}{" "}
                    <span className="font-normal text-text-subtle">@{c.login}</span>
                  </button>
                }
                subtitle={
                  <span className="flex flex-wrap items-center gap-1.5">
                    <TrustBadge level={c.level} score={c.score} showScore label={c.tierLabel} size="sm" />
                    {c.verified && (
                      <StatusPill tone="success" label="Verified" icon="verified_user" size="sm" />
                    )}
                    {c.topics.slice(0, 2).map((t) => (
                      <TopicChip key={t} label={t} />
                    ))}
                  </span>
                }
                meta={
                  <span className="text-xs text-text-subtle">
                    {c.moduleCount} 模块 · {c.exchangeCount} 交换
                  </span>
                }
                actions={
                  onFollow && (
                    <SecondaryButton
                      size="sm"
                      variant="ghost"
                      aria-label={`关注 @${c.login}`}
                      onClick={() => (isAuthenticated ? onFollow(c.login) : onRequireAuth?.())}
                    >
                      {isAuthenticated ? "关注" : "登录后关注"}
                    </SecondaryButton>
                  )
                }
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
