"use client";

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import type { Session } from "@/lib/types";

/*
  COMP-002 TopNav（主水平导航）。基于 shadcn NavigationMenu。
  按 session 过滤需登录/管理员项；当前项 aria-current="page"；active 非仅颜色（含下划线/加粗）。
*/
export interface NavItem {
  key: string;
  label: string;
  href: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
}

export interface TopNavProps {
  items: NavItem[];
  activeKey?: string;
  session?: Session | null;
  onNavigate?: (href: string) => void;
}

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { key: "discover", label: "发现", href: "/" },
  { key: "exchanges", label: "交换记录", href: "/exchanges" },
  { key: "trust", label: "信任网络", href: "/trust" },
  { key: "skills", label: "Agent 技能", href: "/skills" },
  { key: "notifications", label: "通知", href: "/notifications", requiresAuth: true },
  { key: "admin", label: "审核台", href: "/admin", requiresAdmin: true },
];

export function TopNav({ items, activeKey, session, onNavigate }: TopNavProps) {
  const visible = items.filter((it) => {
    if (it.requiresAdmin) return !!session?.isAdmin;
    if (it.requiresAuth) return !!session;
    return true;
  });

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {visible.map((it) => {
          const active = it.key === activeKey;
          return (
            <NavigationMenuItem key={it.key}>
              <NavigationMenuLink
                href={it.href}
                aria-current={active ? "page" : undefined}
                onClick={
                  onNavigate
                    ? (e) => {
                        e.preventDefault();
                        onNavigate(it.href);
                      }
                    : undefined
                }
                className={cn(
                  "px-3 py-1.5 text-sm",
                  active
                    ? "font-semibold text-primary underline decoration-2 underline-offset-4"
                    : "text-text-muted"
                )}
              >
                {it.label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
