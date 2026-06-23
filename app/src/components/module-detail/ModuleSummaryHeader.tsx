"use client";

/*
  COMP-051 ModuleSummaryHeader（脱敏摘要头，PAGE-010）。
  标题(<h1>) + GitHub Verified + owner handle + 主题标签 + 脱敏摘要 + 操作行（收藏/认可/举报/复制深链接）。
  只渲染脱敏 summary，绝不出现原始内容（INV-01/04）。未登录写操作触发登录引导（FLOW-007）。
*/
import {
  StatusPill,
  TopicChip,
  Icon,
  Octocat,
  notify,
} from "@/components/shared";
import { cn } from "@/lib/utils";

export interface ModuleSummaryHeaderProps {
  title: string;
  summary: string;
  ownerHandle: string;
  githubVerified: boolean;
  topics: string[];
  updatedAt?: string;
  moduleType?: string;
  isAuthenticated: boolean;
  socialState: { favorited: boolean; endorsed: boolean; rateLimited: boolean };
  isOwnerViewing: boolean;
  onToggleFavorite?: () => void;
  onToggleEndorse?: () => void;
  onReport?: () => void;
  onCopyDeepLink?: () => void;
  onTopicClick?: (topic: string) => void;
  onRequireLogin?: () => void;
}

export function ModuleSummaryHeader({
  title,
  summary,
  ownerHandle,
  githubVerified,
  topics,
  updatedAt,
  moduleType,
  isAuthenticated,
  socialState,
  isOwnerViewing,
  onToggleFavorite,
  onToggleEndorse,
  onReport,
  onCopyDeepLink,
  onTopicClick,
  onRequireLogin,
}: ModuleSummaryHeaderProps) {
  // 写操作：未登录 → 登录引导（不静默失败，FLOW-007/NFR-005）。
  const guarded = (fn?: () => void) => () => {
    if (!isAuthenticated) {
      onRequireLogin?.();
      return;
    }
    fn?.();
  };

  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-text sm:text-3xl">{title}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted">
          <span>
            由 <span className="font-medium text-text">@{ownerHandle}</span> 发布
          </span>
          {githubVerified && (
            <StatusPill
              tone="success"
              label="GitHub Verified"
              icon="verified"
              size="sm"
            />
          )}
          {githubVerified && (
            <Octocat className="text-text-muted" />
          )}
          {moduleType && <span>· {moduleType}</span>}
          {updatedAt && <span>· {updatedAt}</span>}
        </div>
      </div>

      {topics.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="主题标签">
          {topics.map((t) => (
            <li key={t}>
              <TopicChip label={t} onClick={onTopicClick} />
            </li>
          ))}
        </ul>
      )}

      <p className="max-w-2xl text-base leading-relaxed text-text">{summary}</p>

      {/* 操作行 */}
      <div className="flex flex-wrap items-center gap-2">
        {!isOwnerViewing && (
          <ActionButton
            icon="favorite"
            label={socialState.favorited ? "取消收藏" : "收藏"}
            pressed={socialState.favorited}
            disabled={socialState.rateLimited}
            onClick={guarded(onToggleFavorite)}
          />
        )}
        {!isOwnerViewing && (
          <ActionButton
            icon="thumb_up"
            label={socialState.endorsed ? "取消认可" : "认可"}
            pressed={socialState.endorsed}
            onClick={guarded(onToggleEndorse)}
          />
        )}
        {!isOwnerViewing && (
          <ActionButton
            icon="flag"
            label="举报"
            disabled={socialState.rateLimited}
            onClick={guarded(onReport)}
          />
        )}
        <ActionButton
          icon="content_copy"
          label="复制链接"
          onClick={() => {
            onCopyDeepLink?.();
            notify("已复制链接", "success");
          }}
        />
      </div>
    </header>
  );
}

function ActionButton({
  icon,
  label,
  pressed,
  disabled,
  onClick,
}: {
  icon: string;
  label: string;
  pressed?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-control border border-border px-3 py-1.5 text-sm text-text-muted",
        "hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        pressed && "border-primary bg-primary-subtle text-primary"
      )}
    >
      <Icon name={icon} size={16} aria-hidden />
      <span>{label}</span>
    </button>
  );
}
