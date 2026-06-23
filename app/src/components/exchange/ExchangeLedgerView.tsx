"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  EmptyState,
  SecondaryButton,
  SkeletonBlock,
} from "@/components/shared";
import { ExchangeLedgerTable } from "./ExchangeLedgerTable";
import { ExchangeLedgerFilters } from "./ExchangeLedgerFilters";
import {
  useExchangeLedger,
  type ExchangeLedgerQuery,
} from "@/lib/queries/exchange";

/*
  ExchangeLedgerView —— PAGE-030 公开交换记录（脱敏台账）客户端视图。
  - 匿名可看脱敏台账（INV-04）；状态/主题/搜索/排序映射到 URL searchParams（可分享深链）。
  - 取数走 useExchangeLedger（query hooks + MSW）；组件只接 props（ASM-068）。
  - 空注册表 / 筛选无结果 / 错误 / 加载态齐全；审核中交换由后端隐藏（ASM-032）。
*/
const VALID_STATUS = new Set(["all", "active", "completed", "unfulfilled"]);
const VALID_SORT = new Set(["latest", "mostActive"]);

function parseParams(sp: URLSearchParams): ExchangeLedgerQuery {
  const status = sp.get("status");
  const sort = sp.get("sort");
  return {
    status: status && VALID_STATUS.has(status) ? status : "all",
    topic: sp.get("topic") ?? undefined,
    q: sp.get("q") ?? undefined,
    sort: sort && VALID_SORT.has(sort) ? (sort as "latest" | "mostActive") : "latest",
    page: Number(sp.get("page")) > 1 ? Number(sp.get("page")) : 1,
  };
}

export function ExchangeLedgerView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = parseParams(searchParams);

  const ledgerQuery = useExchangeLedger(params);
  const rows = ledgerQuery.data?.items ?? [];
  const topicOptions = ledgerQuery.data?.topics ?? [];

  const pushParams = useCallback(
    (next: ExchangeLedgerQuery) => {
      const sp = new URLSearchParams();
      if (next.status && next.status !== "all") sp.set("status", next.status);
      if (next.topic) sp.set("topic", next.topic);
      if (next.q?.trim()) sp.set("q", next.q.trim());
      if (next.sort && next.sort !== "latest") sp.set("sort", next.sort);
      if (next.page && next.page > 1) sp.set("page", String(next.page));
      const qs = sp.toString();
      router.push(qs ? `/exchanges?${qs}` : "/exchanges");
    },
    [router]
  );

  const hasActiveFilter =
    (params.status && params.status !== "all") || !!params.topic || !!params.q;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-text">
          公开交换记录
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          透明的脱敏交换台账：谁与谁、就哪类模块、进行到哪个状态。绝不暴露私有内容。
        </p>
      </header>

      <ExchangeLedgerFilters
        value={params}
        topicOptions={topicOptions}
        resultCount={ledgerQuery.isLoading ? undefined : rows.length}
        onChange={pushParams}
      />

      {ledgerQuery.isError ? (
        <div className="rounded-card border border-danger/30 bg-danger/5 p-6 text-center text-sm text-text-muted">
          <p className="mb-3">交换记录加载失败。</p>
          <SecondaryButton iconLeft="refresh" onClick={() => ledgerQuery.refetch()}>
            重试
          </SecondaryButton>
        </div>
      ) : ledgerQuery.isLoading ? (
        <SkeletonBlock variant="row" count={6} />
      ) : (
        <ExchangeLedgerTable
          rows={rows}
          onRowClick={(id) => router.push(`/exchanges/${id}`)}
          onPartyClick={(login) => router.push(`/u/${login}`)}
          onTopicClick={(t) => pushParams({ ...params, topic: t, page: 1 })}
          emptyState={
            hasActiveFilter ? (
              <EmptyState
                icon="search_off"
                title="当前筛选无匹配交换"
                description="试试更换状态、主题或关键词。"
                action={{ label: "清除筛选", onClick: () => pushParams({}) }}
              />
            ) : (
              <EmptyState
                icon="swap_horiz"
                title="还没有公开交换记录"
                description="交换从发现页或模块详情发起，完成后会出现在这里。"
                action={{ label: "去发现模块", href: "/" }}
              />
            )
          }
        />
      )}
    </div>
  );
}
