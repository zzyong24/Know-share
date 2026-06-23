"use client";

import { useState } from "react";
import {
  ModuleCard,
  ListRow,
  StatusPill,
  EmptyState,
  ConfirmDialog,
  Pagination,
  SkeletonBlock,
  SecondaryButton,
  Icon,
  EXCHANGE_STATUS_META,
} from "@/components/shared";
import type { KnowledgeModule, Exchange, Tone } from "@/lib/types";
import type { DraftItem } from "@/lib/queries/account";

/*
  COMP-152 MySectionList（分区列表容器，PAGE-061）。
  按 section 渲染 ModuleCard 网格 / ListRow + StatusPill / 草稿行 + 每分区独立空态。
  破坏性操作（下架 / 删除草稿 / 取消收藏）经 ConfirmDialog 二次确认。
  交换状态机不在此改（仅导航出模块至 IA-006）。状态非仅颜色（StatusPill 含文字，NFR-007）。
*/
export type MeSection =
  | "modules"
  | "drafts"
  | "received"
  | "sent"
  | "favorites";

export interface MySectionListProps {
  section: MeSection;
  items: KnowledgeModule[] | DraftItem[] | Exchange[];
  loading?: boolean;
  error?: boolean;
  hasMore?: boolean;
  onModuleAction?: (id: string, action: "edit" | "viewPublic" | "delist") => void;
  onDraftAction?: (id: string, action: "continue" | "delete") => void;
  onExchangeOpen?: (id: string) => void;
  onFavoriteToggle?: (moduleId: string, on: boolean) => void;
  onLoadMore?: () => void;
  onRetry?: () => void;
  onFilter?: () => void;
}

const SECTION_TITLE: Record<MeSection, { title: string; desc: string }> = {
  modules: { title: "我的模块", desc: "你已发布的知识模块。" },
  drafts: { title: "草稿", desc: "尚未提交发布的草稿。" },
  received: { title: "收到的交换", desc: "他人向你发起、待你处理的交换。" },
  sent: { title: "发起的交换", desc: "你发起的交换请求。" },
  favorites: { title: "收藏", desc: "你收藏的知识模块。" },
};

type Pending =
  | { kind: "delist"; id: string; title: string }
  | { kind: "delete"; id: string; title: string }
  | { kind: "unfavorite"; id: string; title: string }
  | null;

export function MySectionList({
  section,
  items,
  loading = false,
  error = false,
  hasMore = false,
  onModuleAction,
  onDraftAction,
  onExchangeOpen,
  onFavoriteToggle,
  onLoadMore,
  onRetry,
  onFilter,
}: MySectionListProps) {
  const [pending, setPending] = useState<Pending>(null);
  const meta = SECTION_TITLE[section];

  function header() {
    return (
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-text">{meta.title}</h2>
          <p className="text-sm text-text-muted">{meta.desc}</p>
        </div>
        {onFilter && (
          <SecondaryButton size="sm" iconLeft="label" onClick={onFilter} aria-label="筛选">
            筛选
          </SecondaryButton>
        )}
      </div>
    );
  }

  function confirmDialog() {
    if (!pending) return null;
    const map = {
      delist: {
        title: "下架该模块？",
        description: `下架「${pending.title}」后将不再公开可见，可重新发布。`,
        confirmLabel: "下架",
      },
      delete: {
        title: "删除该草稿？",
        description: `删除草稿「${pending.title}」后不可恢复。`,
        confirmLabel: "删除",
      },
      unfavorite: {
        title: "取消收藏？",
        description: `将「${pending.title}」从收藏中移除。`,
        confirmLabel: "取消收藏",
      },
    } as const;
    const c = map[pending.kind];
    return (
      <ConfirmDialog
        open
        tone="danger"
        title={c.title}
        description={c.description}
        confirmLabel={c.confirmLabel}
        onOpenChange={(o) => !o && setPending(null)}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending.kind === "delist") onModuleAction?.(pending.id, "delist");
          if (pending.kind === "delete") onDraftAction?.(pending.id, "delete");
          if (pending.kind === "unfavorite")
            onFavoriteToggle?.(pending.id, false);
          setPending(null);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div>
        {header()}
        <SkeletonBlock variant="card" count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        {header()}
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          <span>列表加载失败</span>
          <SecondaryButton size="sm" onClick={onRetry}>
            重试
          </SecondaryButton>
        </div>
      </div>
    );
  }

  const isEmpty = items.length === 0;

  // ── 空态（每分区独立 CTA 目标）──
  if (isEmpty) {
    const EMPTY: Record<MeSection, { icon: string; title: string; desc: string; cta: { label: string; href: string } }> = {
      modules: {
        icon: "folder",
        title: "还没有已发布模块",
        desc: "把你的知识打包成脱敏模块，开始交换。",
        cta: { label: "去提交向导", href: "/submit" },
      },
      drafts: {
        icon: "description",
        title: "还没有草稿",
        desc: "在提交向导中保存的草稿会显示在这里。",
        cta: { label: "去提交向导创建", href: "/submit" },
      },
      received: {
        icon: "inbox",
        title: "暂无收到的交换请求",
        desc: "当他人对你的模块发起交换时会出现在这里。",
        cta: { label: "查看我的模块", href: "/me/modules" },
      },
      sent: {
        icon: "send",
        title: "你还没有发起过交换",
        desc: "在发现页浏览模块并发起交换。",
        cta: { label: "去发现页", href: "/" },
      },
      favorites: {
        icon: "favorite",
        title: "还没有收藏",
        desc: "在发现页收藏感兴趣的模块。",
        cta: { label: "去发现页", href: "/" },
      },
    };
    const e = EMPTY[section];
    return (
      <div>
        {header()}
        <EmptyState
          icon={e.icon}
          title={e.title}
          description={e.desc}
          action={{ label: e.cta.label, href: e.cta.href }}
        />
      </div>
    );
  }

  // ── 模块 / 收藏：ModuleCard 网格 ──
  if (section === "modules" || section === "favorites") {
    const mods = items as KnowledgeModule[];
    return (
      <div>
        {header()}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mods.map((m) => (
            <ModuleCard
              key={m.id}
              module={m}
              href={`/modules/${m.id}`}
              favorited={section === "favorites"}
              isAuthenticated
              onFavorite={(id) =>
                section === "favorites"
                  ? setPending({ kind: "unfavorite", id, title: m.title })
                  : onFavoriteToggle?.(id, true)
              }
              onRequestExchange={() => onModuleAction?.(m.id, "viewPublic")}
            />
          ))}
        </div>
        <Pagination
          mode="loadMore"
          hasMore={hasMore}
          onLoadMore={onLoadMore}
        />
        {confirmDialog()}
      </div>
    );
  }

  // ── 草稿：列表行 ──
  if (section === "drafts") {
    const ds = items as DraftItem[];
    const SCAN_META: Record<string, { tone: Tone; label: string }> = {
      pass: { tone: "success", label: "隐私门通过" },
      warn: { tone: "warning", label: "隐私门警告" },
      block: { tone: "danger", label: "隐私门阻止" },
      pending: { tone: "neutral", label: "待扫描" },
    };
    return (
      <div>
        {header()}
        <ul className="rounded-card border border-border bg-surface">
          {ds.map((d) => {
            const scan = d.privacyScanStatus
              ? SCAN_META[d.privacyScanStatus]
              : null;
            return (
              <ListRow
                key={d.id}
                title={d.moduleTitle}
                datetime={d.lastEditedAt}
                relativeTime={`最后编辑 ${d.lastEditedAt.slice(0, 10)}`}
                meta={
                  scan && <StatusPill tone={scan.tone} label={scan.label} size="sm" />
                }
                actions={
                  <div className="flex gap-1">
                    <SecondaryButton
                      size="sm"
                      variant="ghost"
                      aria-label={`继续编辑 ${d.moduleTitle}`}
                      onClick={() => onDraftAction?.(d.id, "continue")}
                    >
                      继续编辑
                    </SecondaryButton>
                    <button
                      type="button"
                      aria-label={`删除草稿 ${d.moduleTitle}`}
                      onClick={() =>
                        setPending({ kind: "delete", id: d.id, title: d.moduleTitle })
                      }
                      className="rounded p-1.5 text-text-muted hover:text-danger focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                      <Icon name="delete" size={16} aria-hidden />
                    </button>
                  </div>
                }
              />
            );
          })}
        </ul>
        {confirmDialog()}
      </div>
    );
  }

  // ── 收到 / 发起的交换：ListRow + StatusPill（状态含文字）──
  const exs = items as Exchange[];
  return (
    <div>
      {header()}
      <ul className="rounded-card border border-border bg-surface">
        {exs.map((ex) => {
          const sm = EXCHANGE_STATUS_META[ex.status] ?? {
            tone: "neutral" as Tone,
            label: ex.status,
          };
          const counterparty =
            section === "received" ? ex.requesterLogin : ex.providerLogin;
          return (
            <ListRow
              key={ex.id}
              title={ex.targetModuleTitle}
              subtitle={`${section === "received" ? "来自" : "面向"} @${counterparty} · ${ex.id}`}
              datetime={ex.updatedAt}
              relativeTime={`更新于 ${ex.updatedAt}`}
              meta={<StatusPill tone={sm.tone} label={sm.label} icon={sm.icon} size="sm" />}
              actions={
                <SecondaryButton
                  size="sm"
                  variant="ghost"
                  aria-label={`查看交换 ${ex.id}`}
                  onClick={() => onExchangeOpen?.(ex.id)}
                >
                  查看交换
                </SecondaryButton>
              }
            />
          );
        })}
      </ul>
      <Pagination mode="loadMore" hasMore={hasMore} onLoadMore={onLoadMore} />
    </div>
  );
}
