"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ModuleCard } from "@/components/shared/module-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SkeletonBlock } from "@/components/shared/skeleton-block";
import { SecondaryButton } from "@/components/shared/secondary-button";
import { notify } from "@/components/shared/toast";
import { DiscoveryHero } from "./DiscoveryHero";
import { DiscoveryFilters } from "./DiscoveryFilters";
import { SortControl } from "./SortControl";
import { TopicChipRow } from "./TopicChipRow";
import { PlatformStatsStrip, type PlatformStats } from "./PlatformStatsStrip";
import { useDiscoveryModules } from "@/lib/queries/discovery";
import { useTopics, useUsageStats } from "@/lib/queries/misc";
import { useSession } from "@/lib/queries/session";
import { ALL_MODULE_TYPES, parseDiscoveryParams } from "./url";
import type { FilterValue, SortKey } from "@/lib/types";

/*
  DiscoveryView —— PAGE-002 客户端视图（取数 + URL 深链 + 交互）。
  - 筛选/排序/主题状态全部映射到 URL searchParams（可分享/可深链，ASM-017/ASM-027）。
  - 取数走 query hooks（discovery/topics/stats）+ MSW；组件只接 props（ASM-068）。
  - 空注册表 / 无结果 / 错误 / 加载态齐全（PAGE-002 States）。
  - 写动作（请求交换/收藏）匿名引导登录（NFR-005/NFR-006）。
*/
const TRUST_LEVELS = ["high", "medium", "low", "new"] as const;

export function DiscoveryView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { filters, sort, q, empty } = parseDiscoveryParams(searchParams);

  const { data: session } = useSession();
  const isAuthenticated = !!session;

  const modulesQuery = useDiscoveryModules({ filters, sort, q, empty });
  const topicsQuery = useTopics();
  const statsQuery = useUsageStats();

  const items = modulesQuery.data?.items ?? [];
  const topics = topicsQuery.data?.items ?? [];

  // UsageStat[] → PlatformStats（COMP-045 口径）。
  const stats: PlatformStats | undefined = useMemo(() => {
    const list = statsQuery.data?.items;
    if (!list) return undefined;
    const byKey = Object.fromEntries(list.map((s) => [s.key, s.value]));
    return {
      modules: byKey.modules,
      exchanges: byKey.exchanges,
      activeUsers: byKey.activeUsers,
      privacyPassRate: byKey.privacyPassRate,
    };
  }, [statsQuery.data]);

  // URL 写入：保留 q，覆盖筛选/排序/主题。
  const pushParams = useCallback(
    (next: { filters?: FilterValue; sort?: SortKey; q?: string }) => {
      const sp = new URLSearchParams();
      const f = next.filters ?? filters;
      const s = next.sort ?? sort;
      const query = next.q ?? q;
      f.type?.forEach((t) => sp.append("type", t));
      f.topic?.forEach((t) => sp.append("topic", t));
      f.trustLevel?.forEach((t) => sp.append("trustLevel", t));
      if (f.verifiedOnly) sp.set("verifiedOnly", "true");
      if (s && s !== "relevance") sp.set("sort", s);
      if (query?.trim()) sp.set("q", query.trim());
      const qs = sp.toString();
      router.push(qs ? `/?${qs}` : "/");
    },
    [router, filters, sort, q]
  );

  const handleFilterChange = (nextFilters: FilterValue) =>
    pushParams({ filters: nextFilters });
  const handleClear = () => pushParams({ filters: {} });
  const handleSort = (nextSort: SortKey) => pushParams({ sort: nextSort });
  const handleTopicSelect = (label: string) => {
    const current = filters.topic ?? [];
    const nextTopic = current.includes(label)
      ? current.filter((t) => t !== label)
      : [...current, label];
    pushParams({ filters: { ...filters, topic: nextTopic } });
  };

  const requireAuth = () => notify("请先使用 GitHub 登录后再发起交换。", "info");
  const handleRequestExchange = (id: string) => router.push(`/exchanges/new?module=${id}`);
  const handleFavorite = () => {
    if (!isAuthenticated) requireAuth();
    else notify("已收藏。", "success");
  };

  const hasActiveFilter =
    !!filters.type?.length ||
    !!filters.topic?.length ||
    !!filters.trustLevel?.length ||
    !!filters.verifiedOnly ||
    !!q;

  return (
    <div>
      <DiscoveryHero />

      {/* 筛选 + 排序 + 主题（区域②） */}
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <DiscoveryFilters
            value={filters}
            options={{
              types: ALL_MODULE_TYPES,
              topics,
              trustLevels: [...TRUST_LEVELS],
            }}
            loading={modulesQuery.isLoading}
            onChange={handleFilterChange}
            onClear={handleClear}
          />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-text-subtle">排序</span>
            <SortControl value={sort} disabled={modulesQuery.isLoading} onChange={handleSort} />
          </div>
        </div>
        <TopicChipRow
          topics={topics}
          selected={filters.topic}
          loading={topicsQuery.isLoading}
          onSelect={handleTopicSelect}
        />
      </div>

      {/* 卡片网格（主区，区域③） */}
      <div className="mt-6">
        {modulesQuery.isLoading ? (
          <div
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            aria-busy
            aria-label="模块加载中"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBlock key={i} variant="card" />
            ))}
          </div>
        ) : modulesQuery.isError ? (
          <div className="rounded-card border border-danger/30 bg-danger/5 p-6 text-center text-sm text-text-muted">
            <p className="mb-3">模块列表加载失败。</p>
            <SecondaryButton iconLeft="refresh" onClick={() => modulesQuery.refetch()}>
              重试
            </SecondaryButton>
          </div>
        ) : items.length === 0 ? (
          hasActiveFilter ? (
            <EmptyState
              icon="search_off"
              title="没有匹配的模块"
              description="试试减少筛选条件或更换关键词。"
              action={{ label: "清除筛选", onClick: handleClear }}
            />
          ) : (
            <EmptyState
              icon="inventory_2"
              title="还没有公开模块"
              description="成为第一个分享脱敏知识模块的人。"
              action={{ label: "提交首个模块", href: "/submit" }}
            />
          )
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((m) => (
              <ModuleCard
                key={m.id}
                module={m}
                href={`/modules/${m.id}`}
                isAuthenticated={isAuthenticated}
                onRequestExchange={handleRequestExchange}
                onFavorite={handleFavorite}
                onRequireAuth={requireAuth}
              />
            ))}
          </div>
        )}
      </div>

      {/* 底部平台统计 strip（区域④） */}
      <PlatformStatsStrip
        stats={stats}
        loading={statsQuery.isLoading}
        error={statsQuery.isError}
        notes={[
          {
            title: "为什么选择 Know-share",
            body: "在不暴露原始内容的前提下发现并互换知识模块，隐私门把关每一次提交。",
            href: "/about",
          },
          {
            title: "社区讨论",
            body: "加入讨论，了解高价值模块的最新交换动态。",
            href: "/about",
          },
        ]}
      />
    </div>
  );
}
