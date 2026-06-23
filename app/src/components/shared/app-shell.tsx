"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { TopNav, DEFAULT_NAV_ITEMS, type NavItem } from "./top-nav";
import { GlobalSearchBar } from "./global-search-bar";
import { GitHubAuthButton } from "./github-auth-button";
import { SubmitModuleCTA } from "./submit-module-cta";
import { Footer } from "./footer";
import { Icon } from "./icon";
import { cn } from "@/lib/utils";
import type { Session, SearchSuggestion } from "@/lib/types";

/*
  COMP-001 AppShell（全局站点外壳）。
  landmark：header[banner] / main / footer[contentinfo] + 跳到主内容 skip link。
  侧栏 nav aria-label；汉堡 aria-expanded（窄屏）。响应式：≥1280 两栏 / 窄屏折叠。
  取数由 props 注入（搜索联想、会话）。
*/
export interface AppShellProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  session?: Session | null;
  navItems?: NavItem[];
  activeNav?: string;
  containerWidth?: "default" | "wide";
  searchSuggestions?: SearchSuggestion[];
  searchLoading?: boolean;
  onSearchChange?: (q: string) => void;
  onSearchSubmit?: (q: string) => void;
  onSelectSuggestion?: (item: SearchSuggestion) => void;
  onNavigate?: (href: string) => void;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onMenuSelect?: (key: string) => void;
  onRequireAuth?: () => void;
}

export function AppShell({
  children,
  sidebar,
  session,
  navItems = DEFAULT_NAV_ITEMS,
  activeNav,
  containerWidth = "default",
  searchSuggestions,
  searchLoading,
  onSearchChange,
  onSearchSubmit,
  onSelectSuggestion,
  onNavigate,
  onSignIn,
  onSignOut,
  onMenuSelect,
  onRequireAuth,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const maxW = containerWidth === "wide" ? "max-w-[1440px]" : "max-w-[1280px]";

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-primary focus:px-3 focus:py-1.5 focus:text-white"
      >
        跳到主内容
      </a>

      <header
        role="banner"
        className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur"
      >
        <div className={cn("mx-auto flex items-center gap-4 px-6 py-3", maxW)}>
          <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
            <span className="flex size-7 items-center justify-center rounded-control bg-primary text-sm font-bold text-white">
              K
            </span>
            <span className="hidden sm:inline">Know-share</span>
          </Link>

          {/* 桌面主导航 */}
          <div className="hidden md:block">
            <TopNav
              items={navItems}
              activeKey={activeNav}
              session={session}
              onNavigate={onNavigate}
            />
          </div>

          <div className="ml-auto hidden flex-1 justify-center md:flex">
            <GlobalSearchBar
              suggestions={searchSuggestions}
              loading={searchLoading}
              onChange={onSearchChange}
              onSubmit={onSearchSubmit}
              onSelectSuggestion={onSelectSuggestion}
            />
          </div>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <div className="hidden sm:block">
              <SubmitModuleCTA
                session={session}
                size="sm"
                onNavigate={onNavigate}
                onRequireAuth={onRequireAuth}
              />
            </div>
            <GitHubAuthButton
              session={session}
              onSignIn={onSignIn}
              onSignOut={onSignOut}
              onMenuSelect={onMenuSelect}
            />
            {/* 汉堡（窄屏） */}
            <button
              type="button"
              aria-label="打开菜单"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
              className="rounded p-1.5 text-text-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none md:hidden"
            >
              <Icon name={mobileOpen ? "close" : "expand_more"} size={20} aria-hidden />
            </button>
          </div>
        </div>

        {/* 窄屏折叠菜单 */}
        {mobileOpen && (
          <div className="border-t border-border px-6 py-3 md:hidden">
            <GlobalSearchBar
              suggestions={searchSuggestions}
              loading={searchLoading}
              onChange={onSearchChange}
              onSubmit={onSearchSubmit}
              onSelectSuggestion={onSelectSuggestion}
            />
            <div className="mt-3">
              <TopNav
                items={navItems}
                activeKey={activeNav}
                session={session}
                onNavigate={onNavigate}
              />
            </div>
          </div>
        )}
      </header>

      <div className={cn("mx-auto flex w-full flex-1 gap-6 px-6 py-6", maxW)}>
        {sidebar && (
          <nav
            aria-label="区段导航"
            className="hidden w-56 shrink-0 lg:block"
          >
            {sidebar}
          </nav>
        )}
        <main id="main-content" className="min-w-0 flex-1">
          {children}
        </main>
      </div>

      <Footer />
    </>
  );
}
