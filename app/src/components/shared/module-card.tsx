"use client";

import { Card } from "./card";
import { TopicChip } from "./topic-chip";
import { TrustBadge } from "./trust-badge";
import { StatusPill } from "./status-pill";
import { Avatar } from "./avatar";
import { PrimaryButton } from "./primary-button";
import { Icon } from "./icon";
import { SkeletonBlock } from "./skeleton-block";
import { stripSensitiveFields } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { KnowledgeModule, Tone } from "@/lib/types";

/*
  COMP-010 ModuleCard（知识模块卡片）。仅渲染公开脱敏字段（INV-01/04）。
  卡内单一主链接（标题→详情）；「请求交换」独立按钮；收藏 aria-pressed。
  取数由 props 注入（ASM-068）；白名单守卫剥离异常私有字段。
*/
const STATUS_META: Record<string, { tone: Tone; label: string }> = {
  Draft: { tone: "neutral", label: "草稿" },
  Published: { tone: "success", label: "已发布" },
  Updated: { tone: "info", label: "已更新" },
  Delisted: { tone: "neutral", label: "已下架" },
};

export interface ModuleCardProps {
  module: KnowledgeModule;
  owner?: { login: string; avatarUrl: string; verified?: boolean };
  href: string;
  variant?: "grid" | "list";
  favorited?: boolean;
  loading?: boolean;
  isAuthenticated?: boolean;
  onRequestExchange?: (moduleId: string) => void;
  onFavorite?: (moduleId: string) => void;
  onRequireAuth?: () => void;
}

export function ModuleCard({
  module,
  owner,
  href,
  variant = "grid",
  favorited = false,
  loading = false,
  isAuthenticated = false,
  onRequestExchange,
  onFavorite,
  onRequireAuth,
}: ModuleCardProps) {
  if (loading) {
    return (
      <Card>
        <SkeletonBlock variant="text" count={3} />
      </Card>
    );
  }

  // 白名单守卫（INV-04）：剥离异常私有字段后再渲染。
  const safe = stripSensitiveFields(
    module as unknown as Record<string, unknown>,
    "ModuleCard"
  ) as unknown as KnowledgeModule;

  const status = STATUS_META[safe.status] ?? { tone: "neutral" as Tone, label: safe.status };
  const { notes, links, files, words } = safe.sourceStats;

  const handleRequest = () => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    onRequestExchange?.(safe.id);
  };

  return (
    <Card
      className={cn(variant === "list" && "sm:flex-row")}
      header={
        <div className="flex items-start justify-between gap-2">
          <a
            href={href}
            className="text-base font-semibold text-text hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded"
          >
            {safe.title}
          </a>
          <StatusPill tone={status.tone} label={status.label} />
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {owner && (
              <Avatar
                src={owner.avatarUrl}
                login={owner.login}
                verified={owner.verified}
                size="xs"
              />
            )}
            <TrustBadge level={safe.trustLevel} size="sm" />
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-pressed={favorited}
              aria-label={favorited ? `取消收藏 ${safe.title}` : `收藏 ${safe.title}`}
              onClick={() => onFavorite?.(safe.id)}
              className="inline-flex items-center gap-1 rounded p-1 text-text-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <Icon name="favorite" size={16} aria-hidden className={favorited ? "text-danger" : ""} />
              <span className="text-xs tabular-nums">{safe.favoriteCount}</span>
            </button>
            <PrimaryButton
              size="sm"
              aria-label={`请求交换 ${safe.title}`}
              onClick={handleRequest}
            >
              请求交换
            </PrimaryButton>
          </div>
        </div>
      }
    >
      <p className="text-sm text-text-muted">{safe.summary}</p>
      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-subtle">
        <span>
          <dt className="inline">笔记 </dt>
          <dd className="inline tabular-nums">{notes}</dd>
        </span>
        <span>
          <dt className="inline">链接 </dt>
          <dd className="inline tabular-nums">{links}</dd>
        </span>
        <span>
          <dt className="inline">文件 </dt>
          <dd className="inline tabular-nums">{files}</dd>
        </span>
        <span>
          <dt className="inline">词数 </dt>
          <dd className="inline tabular-nums">{words.toLocaleString()}</dd>
        </span>
        <span>{safe.freshness}</span>
      </dl>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {safe.topics.map((t) => (
          <TopicChip key={t} label={t} />
        ))}
      </div>
    </Card>
  );
}
