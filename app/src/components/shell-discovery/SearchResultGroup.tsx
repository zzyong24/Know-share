"use client";

import { useId } from "react";
import { ModuleCard } from "@/components/shared/module-card";
import { TopicChip } from "@/components/shared/topic-chip";
import { Pagination } from "@/components/shared/pagination";
import { SkeletonBlock } from "@/components/shared/skeleton-block";
import { SecondaryButton } from "@/components/shared/secondary-button";
import { UserResultRow } from "./UserResultRow";
import { ExchangeResultRow } from "./ExchangeResultRow";
import type {
  ExchangeResult,
  KnowledgeModule,
  SearchScope,
  Topic,
  UserResult,
} from "@/lib/types";

/*
  COMP-047 SearchResultGroup（搜索结果分组容器）。PAGE-003。
  按 scope 渲染：模块→COMP-010 ModuleCard，用户→COMP-048，交换→COMP-049，主题→COMP-022。
  统一管理标题/计数/加载/空/错误/加载更多（FR-001/FR-010）。
  分组标题语义层级 + 计数关联；私有守卫在结果项组件层执行（INV-04）。
*/
type GroupItem = KnowledgeModule | Topic | UserResult | ExchangeResult;

export interface SearchResultGroupProps {
  scope: Exclude<SearchScope, "all">;
  title: string;
  items: GroupItem[];
  totalCount?: number;
  hasMore?: boolean;
  loading?: boolean;
  error?: boolean;
  isAuthenticated?: boolean;
  onLoadMore?: () => void;
  onRetry?: () => void;
  onSelectTopic?: (label: string) => void;
  onRequireAuth?: () => void;
}

export function SearchResultGroup({
  scope,
  title,
  items,
  totalCount,
  hasMore = false,
  loading = false,
  error = false,
  isAuthenticated = false,
  onLoadMore,
  onRetry,
  onSelectTopic,
  onRequireAuth,
}: SearchResultGroupProps) {
  const headingId = useId();
  const count = totalCount ?? items.length;

  if (loading) {
    return (
      <section aria-labelledby={headingId} aria-busy>
        <h2 id={headingId} className="mb-3 text-base font-semibold text-text">
          {title}
        </h2>
        <SkeletonBlock variant="card" count={2} />
      </section>
    );
  }

  if (error) {
    return (
      <section aria-labelledby={headingId}>
        <h2 id={headingId} className="mb-3 text-base font-semibold text-text">
          {title}
        </h2>
        <div className="rounded-card border border-danger/30 bg-danger/5 p-4 text-sm text-text-muted">
          <p className="mb-2">该分组加载失败。</p>
          {onRetry && (
            <SecondaryButton size="sm" iconLeft="refresh" onClick={onRetry}>
              重试
            </SecondaryButton>
          )}
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section aria-labelledby={headingId}>
        <h2 id={headingId} className="mb-3 text-base font-semibold text-text">
          {title}
        </h2>
        <p className="text-sm text-text-subtle">该分类暂无结果。</p>
      </section>
    );
  }

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-3 text-base font-semibold text-text">
        {title}
        <span className="ml-2 text-sm font-normal text-text-subtle">共 {count} 条</span>
      </h2>

      {scope === "modules" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(items as KnowledgeModule[]).map((m) => (
            <ModuleCard
              key={m.id}
              module={m}
              href={`/modules/${m.id}`}
              isAuthenticated={isAuthenticated}
              onRequireAuth={onRequireAuth}
            />
          ))}
        </div>
      )}

      {scope === "topics" && (
        <div className="flex flex-wrap gap-1.5">
          {(items as Topic[]).map((t) => (
            <TopicChip
              key={t.id}
              label={t.label}
              count={t.moduleCount}
              onClick={onSelectTopic}
            />
          ))}
        </div>
      )}

      {scope === "users" && (
        <ul className="rounded-card border border-border bg-surface">
          {(items as UserResult[]).map((u) => (
            <UserResultRow key={u.login} user={u} />
          ))}
        </ul>
      )}

      {scope === "exchanges" && (
        <ul className="rounded-card border border-border bg-surface">
          {(items as ExchangeResult[]).map((e) => (
            <ExchangeResultRow key={e.id} exchange={e} />
          ))}
        </ul>
      )}

      {hasMore && (
        <Pagination mode="loadMore" hasMore onLoadMore={onLoadMore} />
      )}
    </section>
  );
}
