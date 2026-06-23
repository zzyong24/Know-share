"use client";

import { useRouter } from "next/navigation";
import { DashboardOverview } from "./DashboardOverview";
import { AccountSubNav, type AccountSubNavItem } from "./AccountSubNav";
import { MySectionList, type MeSection } from "./MySectionList";
import { notify } from "@/components/shared";
import {
  useDashboard,
  useMeSection,
} from "@/lib/queries/account";
import type { KnowledgeModule, Exchange } from "@/lib/types";
import type { DraftItem } from "@/lib/queries/account";

/*
  MeDashboardView —— PAGE-060 容器 + 概览 + 左侧子导航 + 右侧分区（PAGE-061）。
  section 由路由传入（默认 modules）。统计与子导航徽标来自 useDashboard。
*/
export interface MeDashboardViewProps {
  section: MeSection;
}

const VALID: MeSection[] = ["modules", "drafts", "received", "sent", "favorites"];

export function MeDashboardView({ section }: MeDashboardViewProps) {
  const router = useRouter();
  const safeSection: MeSection = VALID.includes(section) ? section : "modules";

  const dash = useDashboard();
  const sec = useMeSection<unknown>(safeSection);

  const received = dash.data?.subNavBadges.received ?? 0;
  const navItems: AccountSubNavItem[] = [
    { key: "modules", label: "我的模块", href: "/me/modules", icon: "folder" },
    { key: "drafts", label: "草稿", href: "/me/drafts", icon: "description" },
    {
      key: "received",
      label: "收到的交换",
      href: "/me/received",
      icon: "inbox",
      badge: received,
    },
    { key: "sent", label: "发起的交换", href: "/me/sent", icon: "send" },
    { key: "favorites", label: "收藏", href: "/me/favorites", icon: "favorite" },
    { key: "settings", label: "设置", href: "/settings/contact", icon: "settings" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-6">
      {dash.data && (
        <DashboardOverview
          currentUser={dash.data.currentUser}
          stats={dash.data.stats}
          welcomeSummary={dash.data.welcomeSummary}
          loading={dash.isLoading}
          error={dash.isError}
          onStatClick={(stat) => {
            if (stat === "unread") router.push("/notifications");
            if (stat === "exchanges") router.push("/me/received");
          }}
          onRetry={() => dash.refetch()}
        />
      )}
      {dash.isLoading && !dash.data && (
        <DashboardOverview
          currentUser={{ displayName: "", githubHandle: "", githubVerified: false }}
          stats={{
            myModulesCount: 0,
            activeExchangesCount: 0,
            trustScore: 0,
            unreadNotificationsCount: 0,
          }}
          welcomeSummary=""
          loading
        />
      )}

      <div className="flex flex-col gap-6 md:flex-row">
        <aside className="md:w-64 md:shrink-0">
          <AccountSubNav items={navItems} activeKey={safeSection} />
        </aside>
        <section className="flex-1">
          <MySectionList
            section={safeSection}
            items={
              (sec.data?.items ?? []) as
                | KnowledgeModule[]
                | DraftItem[]
                | Exchange[]
            }
            loading={sec.isLoading}
            error={sec.isError}
            onRetry={() => sec.refetch()}
            onFilter={() => notify("筛选面板（占位）。", "info")}
            onModuleAction={(id, action) =>
              action === "viewPublic"
                ? router.push(`/modules/${id}`)
                : notify(`模块操作：${action}（占位）。`, "info")
            }
            onDraftAction={(id, action) =>
              action === "continue"
                ? router.push(`/submit?draft=${id}`)
                : notify("草稿已删除（占位）。", "success")
            }
            onExchangeOpen={(id) => router.push(`/exchanges/${id}`)}
            onFavoriteToggle={() => notify("已更新收藏（占位）。", "success")}
          />
        </section>
      </div>
    </div>
  );
}
