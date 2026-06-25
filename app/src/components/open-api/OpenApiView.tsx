"use client";

import { useState } from "react";
import { ZeroLeakBanner } from "./ZeroLeakBanner";
import { ApiCategoryNav } from "./ApiCategoryNav";
import { EndpointCard } from "./EndpointCard";
import { DeveloperResourceCard } from "./DeveloperResourceCard";
import { StatsTeaser } from "./StatsTeaser";
import { ApiDocsEmptyState } from "./ApiDocsEmptyState";
import {
  API_CATEGORIES,
  API_ENDPOINTS,
  DEVELOPER_RESOURCES,
} from "@/mocks/fixtures/open-api";
import type {
  ApiCategory,
  ApiCategoryId,
  ApiEndpoint,
} from "@/mocks/fixtures/open-api";
import { useAboutStats } from "@/lib/queries/about";

/*
  PAGE-090 开放 API 文档页编排组件（route /developers）。
  顶部承诺横幅（内联可选统计）+ 左侧分类导航 + 右侧端点文档流。
  端点清单为静态文档配置（ASM-103）；首端点默认展开，余收起（PAGE-090 States）。
  文档配置缺失（异常）时回退 ApiDocsEmptyState（PAGE-090 States「空状态」）。
*/
export interface OpenApiViewProps {
  categories?: ApiCategory[];
  endpoints?: ApiEndpoint[];
}

export function OpenApiView({
  categories = API_CATEGORIES,
  endpoints = API_ENDPOINTS,
}: OpenApiViewProps) {
  const [activeId, setActiveId] = useState<ApiCategoryId | undefined>(
    categories[0]?.id
  );

  // 真实平台聚合统计（/api/stats/usage → about-stats 同源）；空库即显示 0，绝不写死假数。
  const statsQuery = useAboutStats();
  const s = statsQuery.data?.stats;
  const teaserMetrics = s
    ? {
        usersCount: s.activeUsers,
        modulesCount: s.modulesTotal,
        exchangesCount: s.exchangesTotal,
        // about-stats 的通过率单位是 %（0–100），StatsTeaser 期望比率（0–1）。
        privacyGatePassRate: s.privacyGatePassRate / 100,
        window: statsQuery.data?.meta.window ?? "",
        asOf: "",
      }
    : undefined;

  if (!endpoints.length) {
    return <ApiDocsEmptyState />;
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <ZeroLeakBanner
        statsSlot={
          <StatsTeaser metrics={teaserMetrics} loading={statsQuery.isLoading} />
        }
      />

      <div className="grid gap-6 md:grid-cols-[256px_1fr]">
        <aside className="md:sticky md:top-20 md:self-start">
          <div className="flex flex-col gap-4">
            <ApiCategoryNav
              categories={categories}
              activeId={activeId}
              onNavigate={setActiveId}
            />
            <DeveloperResourceCard links={DEVELOPER_RESOURCES} />
          </div>
        </aside>

        <div className="flex flex-col gap-4">
          {endpoints.map((endpoint, i) => (
            <EndpointCard
              key={endpoint.id}
              endpoint={endpoint}
              defaultExpanded={i === 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
