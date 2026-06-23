"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { notify } from "@/components/shared";
import { TrustNetworkIndex } from "./TrustNetworkIndex";
import {
  useTrustNetwork,
  type NetworkFilters,
} from "@/lib/queries/trust-feedback";
import { useSession } from "@/lib/queries/session";
import type { TrustLevel } from "@/lib/types";

/*
  PAGE-043 信任网络索引 / 着陆页（/trust）。补齐主导航「信任网络」着陆缺口（ASM-061）。
  发现可信贡献者 + 信任机制说明；非竞争性、非付费榜（DEC-007）。公开匿名可看（INV-04）。
  筛选/排序经 URL 深链；条目 → /u/:login（PAGE-040）。
*/
function parseFilters(sp: URLSearchParams): NetworkFilters {
  return {
    topic: sp.get("topic") || undefined,
    minTier: (sp.get("minTier") as TrustLevel) || "",
    verifiedOnly: sp.get("verifiedOnly") === "true",
    q: sp.get("q") || undefined,
    empty: sp.get("empty") === "true",
  };
}

export function TrustNetworkView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = parseFilters(searchParams);

  const { data, isLoading, isError, refetch } = useTrustNetwork(filters);
  const { data: session } = useSession();
  const isAuthenticated = !!session;

  const setFilters = (next: NetworkFilters) => {
    const sp = new URLSearchParams();
    if (next.topic) sp.set("topic", next.topic);
    if (next.minTier) sp.set("minTier", next.minTier);
    if (next.verifiedOnly) sp.set("verifiedOnly", "true");
    if (next.q?.trim()) sp.set("q", next.q.trim());
    const qs = sp.toString();
    router.push(qs ? `/trust?${qs}` : "/trust");
  };

  const topicOptions = Array.from(
    new Set((data?.contributors ?? []).flatMap((c) => c.topics))
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-text">信任网络</h1>
        <p className="mt-1 text-sm text-text-muted">
          发现社区中的可信贡献者，并理解信任如何随交换与反馈积累。
        </p>
      </header>

      <TrustNetworkIndex
        overviewStats={data?.overview ?? []}
        contributors={data?.contributors ?? []}
        featuredSections={data?.featured ?? []}
        filters={filters}
        topicOptions={topicOptions}
        isAuthenticated={isAuthenticated}
        loading={isLoading}
        isError={isError}
        onFilterChange={setFilters}
        onContributorClick={(login) => router.push(`/u/${login}`)}
        onFollow={(login) => notify(`已关注 @${login}。`, "success")}
        onRequireAuth={() => notify("请先使用 GitHub 登录后再继续。", "info")}
        onRetry={() => refetch()}
      />
    </div>
  );
}
