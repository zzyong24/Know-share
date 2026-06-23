"use client";

import Link from "next/link";
import { Icon } from "@/components/shared";
import { cn } from "@/lib/utils";

/*
  COMP-151 AccountSubNav（私域子导航，PAGE-060/061）。
  6 项：我的模块 | 草稿 | 收到的交换 | 发起的交换 | 收藏 | 设置入口。
  当前项 aria-current="page" + 加粗 + 浅底（非仅颜色，NFR-007）；项可带计数徽。
*/
export interface AccountSubNavItem {
  key: string;
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

export interface AccountSubNavProps {
  items: AccountSubNavItem[];
  activeKey: string;
}

export function AccountSubNav({ items, activeKey }: AccountSubNavProps) {
  return (
    <nav aria-label="个人中心导航" className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.key === activeKey;
        const showBadge = typeof item.badge === "number" && item.badge > 0;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-control px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
              active
                ? "bg-primary-subtle font-semibold text-primary"
                : "text-text-muted hover:bg-muted hover:text-text"
            )}
          >
            <Icon name={item.icon} size={18} aria-hidden />
            <span className="flex-1">{item.label}</span>
            {showBadge && (
              <span
                className="inline-flex min-w-5 items-center justify-center rounded-pill bg-primary px-1.5 text-xs font-medium tabular-nums text-white"
                aria-label={`${item.label}，待处理 ${item.badge} 项`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
