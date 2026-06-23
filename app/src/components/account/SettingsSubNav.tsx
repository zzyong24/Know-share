"use client";

import Link from "next/link";
import { Icon } from "@/components/shared";
import { cn } from "@/lib/utils";

/*
  设置左侧子导航（PAGE-063/064 共用）。4 项：联系方式 / 隐私与同意 / 账户 / 通知偏好。
  当前项 aria-current + 加粗 + 浅底（非仅颜色，NFR-007）。非命名特有组件（ASM-099），
  为页面布局内联结构。
*/
const ITEMS = [
  { key: "contact", label: "联系方式", href: "/settings/contact", icon: "person" },
  { key: "privacy", label: "隐私与同意", href: "/settings/privacy", icon: "shield" },
  { key: "account", label: "账户", href: "/settings/account", icon: "person" },
  {
    key: "notifications",
    label: "通知偏好",
    href: "/settings/notifications",
    icon: "notifications",
  },
] as const;

export function SettingsSubNav({ activeKey }: { activeKey: string }) {
  return (
    <nav aria-label="设置导航" className="flex flex-col gap-1">
      {ITEMS.map((item) => {
        const active = item.key === activeKey;
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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
