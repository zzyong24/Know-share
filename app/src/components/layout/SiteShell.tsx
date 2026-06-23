"use client";

import * as React from "react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/shared/app-shell";
import { DEFAULT_NAV_ITEMS } from "@/components/shared/top-nav";
import { notify } from "@/components/shared/toast";
import { useSession } from "@/lib/queries/session";
import { useSearchSuggest } from "@/lib/queries/misc";
import type { SearchSuggestion } from "@/lib/types";

/*
  SiteShell —— 把共享 COMP-001 AppShell 接进 Next 真实布局（FRONTEND_SPEC §2/§3）。
  这是其余 9 模块照搬的「外壳接线」模板：
  - 会话：useSession（失败降级匿名，ASM-019）。
  - 导航：next/navigation useRouter().push + usePathname 推导 activeNav（替换地基里的 onNavigate 占位）。
  - 搜索：onSubmit → /search?q=；联想由 useSearchSuggest 注入。
  - 登录/提交/未登录写动作：占位引导（OAuth 接入留给 auth 模块；此处给出可用降级提示）。
  各段 layout 用 <SiteShell> 包裹自己的 children 即可，无需重写外壳。
*/

/** 由 pathname 推导当前主导航项 key（与 DEFAULT_NAV_ITEMS 对齐）。 */
function navKeyFromPath(pathname: string): string {
  if (pathname === "/" || pathname.startsWith("/search") || pathname.startsWith("/discover"))
    return "discover";
  if (pathname.startsWith("/exchanges")) return "exchanges";
  if (pathname.startsWith("/trust") || pathname.startsWith("/u/")) return "trust";
  if (pathname.startsWith("/skills")) return "skills";
  if (pathname.startsWith("/developers")) return "developers";
  if (pathname.startsWith("/about")) return "about";
  if (pathname.startsWith("/notifications")) return "notifications";
  if (pathname.startsWith("/admin")) return "admin";
  return "";
}

export interface SiteShellProps {
  children: React.ReactNode;
  containerWidth?: "default" | "wide";
  sidebar?: React.ReactNode;
}

export function SiteShell({ children, containerWidth, sidebar }: SiteShellProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: suggestData } = useSearchSuggest(searchTerm);
  const suggestions: SearchSuggestion[] = suggestData?.items ?? [];

  const handleNavigate = (href: string) => router.push(href);

  const handleSearchSubmit = (q: string) => {
    const query = q.trim();
    if (!query) return; // 空串不路由（PAGE-001 validation）
    router.push(`/search?q=${encodeURIComponent(query.slice(0, 200))}`);
  };

  const handleSelectSuggestion = (item: SearchSuggestion) => router.push(item.href);

  const requireAuth = () => {
    // OAuth 接入在 auth 模块；此处降级提示，不绕过同意门（NFR-005）。
    notify("请先使用 GitHub 登录后再继续。", "info");
  };

  const handleSignIn = () => requireAuth();
  const handleSignOut = () => notify("已退出登录。", "success");

  const handleMenuSelect = (key: string) => {
    const map: Record<string, string> = {
      profile: "/me",
      settings: "/settings",
      admin: "/admin",
      notifications: "/notifications",
    };
    if (map[key]) router.push(map[key]);
    else if (key === "signout") handleSignOut();
  };

  return (
    <AppShell
      session={session ?? null}
      navItems={DEFAULT_NAV_ITEMS}
      activeNav={navKeyFromPath(pathname)}
      containerWidth={containerWidth}
      sidebar={sidebar}
      searchSuggestions={suggestions}
      onSearchChange={setSearchTerm}
      onSearchSubmit={handleSearchSubmit}
      onSelectSuggestion={handleSelectSuggestion}
      onNavigate={handleNavigate}
      onSignIn={handleSignIn}
      onSignOut={handleSignOut}
      onMenuSelect={handleMenuSelect}
      onRequireAuth={requireAuth}
    >
      {children}
    </AppShell>
  );
}
