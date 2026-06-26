"use client";

import { useRouter } from "next/navigation";
import { DashboardOverview } from "./DashboardOverview";
import { AccountSubNav, type AccountSubNavItem } from "./AccountSubNav";
import { MySectionList, type MeSection } from "./MySectionList";
import { notify } from "@/components/shared";
import {
  useDashboard,
  useMeSection,
  useDeleteDraft,
  useDelistModule,
  usePublishModule,
  useCreateEditDraft,
  useToggleFavorite,
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
  const publishModule = usePublishModule();
  const deleteDraft = useDeleteDraft();
  const delistModule = useDelistModule();
  const editDraft = useCreateEditDraft();
  const toggleFav = useToggleFavorite();

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
            onModuleAction={(id, action) => {
              if (action === "viewPublic") {
                router.push(`/modules/${id}`);
                return;
              }
              if (action === "publish") {
                // 草稿模块「发布」→ 一键直发（已弹确认门同意，NFR-005），无评审队列。
                publishModule.mutate(id, {
                  onSuccess: () => notify("已发布，现已在公开发现页可见。", "success"),
                  onError: () => notify("发布失败，请稍后重试。", "error"),
                });
                return;
              }
              if (action === "delist") {
                delistModule.mutate(id, {
                  onSuccess: () => notify("模块已下架，不再公开可见。", "success"),
                  onError: () => notify("下架失败，请稍后重试。", "error"),
                });
                return;
              }
              // edit：建编辑草稿后进提交向导（提交通过后更新原模块为新版本）。
              editDraft.mutate(id, {
                onSuccess: (d) => router.push(`/submit?draft=${d.id}`),
                onError: () => notify("无法发起编辑，请稍后重试。", "error"),
              });
            }}
            onDraftAction={(id, action) => {
              if (action === "continue") {
                router.push(`/submit?draft=${id}`);
                return;
              }
              deleteDraft.mutate(id, {
                onSuccess: () => notify("草稿已删除。", "success"),
                onError: () => notify("删除失败，请稍后重试。", "error"),
              });
            }}
            onExchangeOpen={(id) => router.push(`/exchanges/${id}`)}
            onFavoriteToggle={(id, on) =>
              toggleFav.mutate(id, {
                onSuccess: () => notify(on ? "已收藏。" : "已取消收藏。", "success"),
                onError: () => notify("操作失败，请稍后重试。", "error"),
              })
            }
          />
        </section>
      </div>
    </div>
  );
}
