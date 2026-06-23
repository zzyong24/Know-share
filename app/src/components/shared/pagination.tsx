"use client";

import { SecondaryButton } from "./secondary-button";
import { Icon } from "./icon";
import { cn } from "@/lib/utils";

/*
  COMP-032 Pagination / LoadMore。两形态共用契约。
  pages：nav aria-label="分页"，当前页 aria-current="page"。
  loadMore：按钮 aria-label + 加载中 aria-busy；hasMore=false 显示「已全部加载」。
*/
export interface PaginationProps {
  mode: "pages" | "loadMore";
  page?: number;
  pageCount?: number;
  hasMore?: boolean;
  loading?: boolean;
  onPageChange?: (page: number) => void;
  onLoadMore?: () => void;
}

export function Pagination({
  mode,
  page = 1,
  pageCount = 1,
  hasMore = false,
  loading = false,
  onPageChange,
  onLoadMore,
}: PaginationProps) {
  if (mode === "loadMore") {
    if (!hasMore) {
      return (
        <p className="py-4 text-center text-sm text-text-subtle">已全部加载</p>
      );
    }
    return (
      <div className="flex justify-center py-4">
        <SecondaryButton
          loading={loading}
          aria-busy={loading || undefined}
          aria-label="加载更多"
          onClick={onLoadMore}
        >
          加载更多
        </SecondaryButton>
      </div>
    );
  }

  // pages 模式：单页隐藏
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <nav aria-label="分页" className="flex items-center justify-center gap-1 py-4">
      <button
        type="button"
        aria-label="上一页"
        disabled={page <= 1 || loading}
        onClick={() => onPageChange?.(page - 1)}
        className="rounded p-1.5 text-text-muted hover:text-primary disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        <Icon name="chevron_left" size={16} aria-hidden />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          aria-current={p === page ? "page" : undefined}
          disabled={loading}
          onClick={() => onPageChange?.(p)}
          className={cn(
            "min-w-8 rounded px-2 py-1 text-sm tabular-nums focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
            p === page
              ? "bg-primary text-white font-semibold"
              : "text-text-muted hover:bg-muted"
          )}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        aria-label="下一页"
        disabled={page >= pageCount || loading}
        onClick={() => onPageChange?.(page + 1)}
        className="rounded p-1.5 text-text-muted hover:text-primary disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        <Icon name="chevron_right" size={16} aria-hidden />
      </button>
    </nav>
  );
}
