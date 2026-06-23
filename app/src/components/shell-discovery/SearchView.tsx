"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { SkeletonBlock } from "@/components/shared/skeleton-block";
import { SecondaryButton } from "@/components/shared/secondary-button";
import { notify } from "@/components/shared/toast";
import { SearchScopeTabs } from "./SearchScopeTabs";
import { SearchResultGroup } from "./SearchResultGroup";
import { parseSearchScope } from "./url";
import { useSearchResults } from "@/lib/queries/search";
import { useSession } from "@/lib/queries/session";
import type { SearchScope } from "@/lib/types";

/*
  SearchView —— PAGE-003 客户端视图。
  - q 来自 URL ?q=；type 来自 ?type=（非法回退 all）。
  - 取数 useSearchResults；模块结果复用 ModuleCard，保持发现页同一脱敏边界（INV-04）。
  - 空查询 / 无结果 / 错误态齐全；切 Tab 更新 ?type=（深链）。
*/
const SCOPE_TITLE: Record<Exclude<SearchScope, "all">, string> = {
  modules: "模块结果",
  topics: "主题结果",
  users: "用户结果",
  exchanges: "交换记录结果",
};

export function SearchView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").slice(0, 200);
  const scope = parseSearchScope(searchParams.get("type"));

  const { data, isLoading, isError, refetch } = useSearchResults(q);
  const { data: session } = useSession();
  const isAuthenticated = !!session;

  const setScope = (next: SearchScope) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (next !== "all") sp.set("type", next);
    router.push(`/search?${sp.toString()}`);
  };

  const selectTopic = (label: string) =>
    router.push(`/?topic=${encodeURIComponent(label)}`);
  const requireAuth = () => notify("请先使用 GitHub 登录后再发起交换。", "info");

  // 空查询：引导回发现页（PAGE-003 空查询态）。
  if (!q.trim()) {
    return (
      <EmptyState
        icon="search"
        title="输入关键词开始搜索"
        description="可搜索模块、主题、用户或交换记录。"
        action={{ label: "去发现页浏览", href: "/" }}
      />
    );
  }

  const showGroup = (s: Exclude<SearchScope, "all">) => scope === "all" || scope === s;
  const counts = data?.counts;
  const totalResults =
    (counts?.modules ?? 0) +
    (counts?.topics ?? 0) +
    (counts?.users ?? 0) +
    (counts?.exchanges ?? 0);

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-xl font-semibold text-text">
          “{q}” 的搜索结果
        </h1>
      </header>

      <SearchScopeTabs value={scope} counts={counts} onChange={setScope} />

      <div className="mt-6 space-y-8">
        {isLoading ? (
          <SkeletonBlock variant="card" count={2} />
        ) : isError ? (
          <div className="rounded-card border border-danger/30 bg-danger/5 p-6 text-center text-sm text-text-muted">
            <p className="mb-3">搜索失败，请稍后重试。</p>
            <SecondaryButton iconLeft="refresh" onClick={() => refetch()}>
              重试
            </SecondaryButton>
          </div>
        ) : totalResults === 0 ? (
          <EmptyState
            icon="search_off"
            title={`没有与 “${q}” 匹配的结果`}
            description="检查拼写、更换关键词，或去发现页浏览。"
            action={{ label: "去发现页", href: "/" }}
          />
        ) : (
          <>
            {showGroup("modules") && (counts?.modules ?? 0) > 0 && (
              <SearchResultGroup
                scope="modules"
                title={SCOPE_TITLE.modules}
                items={data?.modules ?? []}
                isAuthenticated={isAuthenticated}
                onRequireAuth={requireAuth}
              />
            )}
            {showGroup("topics") && (counts?.topics ?? 0) > 0 && (
              <SearchResultGroup
                scope="topics"
                title={SCOPE_TITLE.topics}
                items={data?.topics ?? []}
                onSelectTopic={selectTopic}
              />
            )}
            {showGroup("users") && (counts?.users ?? 0) > 0 && (
              <SearchResultGroup
                scope="users"
                title={SCOPE_TITLE.users}
                items={data?.users ?? []}
              />
            )}
            {showGroup("exchanges") && (counts?.exchanges ?? 0) > 0 && (
              <SearchResultGroup
                scope="exchanges"
                title={SCOPE_TITLE.exchanges}
                items={data?.exchanges ?? []}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
