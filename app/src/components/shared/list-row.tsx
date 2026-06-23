"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/*
  COMP-016 ListRow（通用列表行）。左 leading + 中 主/副文本 + 右 meta/操作。
  未读非仅颜色：左条 + 圆点 + visually-hidden「未读」文本（NFR-007）。
  时间用 <time datetime> 绝对 title。
*/
export interface ListRowProps {
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  /** 绝对时间（ISO），渲染为 <time>；relativeTime 为展示文本 */
  datetime?: string;
  relativeTime?: string;
  actions?: React.ReactNode;
  href?: string;
  unread?: boolean;
  onClick?: () => void;
  as?: "li" | "div";
}

export function ListRow({
  leading,
  title,
  subtitle,
  meta,
  datetime,
  relativeTime,
  actions,
  href,
  unread = false,
  onClick,
  as = "li",
}: ListRowProps) {
  const Wrapper = as;
  return (
    <Wrapper
      className={cn(
        "relative flex items-start gap-3 border-b border-border px-3 py-3 last:border-b-0",
        unread && "border-l-2 border-l-primary bg-primary-subtle/30",
        (onClick || href) && "hover:bg-muted/50"
      )}
    >
      {leading && <div className="mt-0.5 shrink-0">{leading}</div>}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {unread && (
            <>
              <span className="inline-block size-2 shrink-0 rounded-full bg-primary" aria-hidden />
              <span className="sr-only">未读</span>
            </>
          )}
          {href ? (
            <Link
              href={href}
              onClick={onClick}
              className="truncate text-sm font-medium text-text hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded"
            >
              {title}
            </Link>
          ) : (
            <span className="truncate text-sm font-medium text-text">{title}</span>
          )}
        </div>
        {subtitle && <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>}
        {datetime && (
          <time
            dateTime={datetime}
            title={datetime}
            className="mt-0.5 block text-xs text-text-subtle"
          >
            {relativeTime ?? datetime}
          </time>
        )}
      </div>
      {meta && <div className="shrink-0 text-xs text-text-muted">{meta}</div>}
      {actions && <div className="shrink-0">{actions}</div>}
    </Wrapper>
  );
}
