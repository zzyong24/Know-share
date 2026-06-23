"use client";

import {
  Avatar,
  StatusPill,
  TopicChip,
  SecondaryButton,
  Octocat,
  Icon,
  SkeletonBlock,
} from "@/components/shared";

/*
  COMP-117 TrustProfileHeader（信任档案身份头）。
  ENT-001 公开身份：头像 / 显示名 / @handle / GitHub Verified / 简介 / 领域 / 加入日期 / GitHub 外链。
  联系方式默认私密、不渲染（仅 public opt-in 项，INV-03/04/DEC-010）。
  Verified 非仅颜色（StatusPill 含文字，NFR-007）。本人自看显示自管理入口（IA-014，不内联编辑）。
*/
export interface PublicContact {
  type: string;
  value: string;
}

export interface TrustProfileHeaderProps {
  avatarUrl: string;
  displayName: string;
  githubLogin: string;
  verified: boolean;
  bio?: string;
  topics: string[];
  joinedDate: string;
  githubUrl: string;
  /** 仅已 opt-in 为 public 的联系方式（默认空，INV-03） */
  publicContacts?: PublicContact[];
  isSelf?: boolean;
  isAuthenticated?: boolean;
  restrictionState?: "normal" | "flagged";
  loading?: boolean;
  onSelfManageClick?: () => void;
  onReportUser?: () => void;
  onRequireAuth?: () => void;
}

export function TrustProfileHeader({
  avatarUrl,
  displayName,
  githubLogin,
  verified,
  bio,
  topics,
  joinedDate,
  githubUrl,
  publicContacts = [],
  isSelf = false,
  isAuthenticated = false,
  restrictionState = "normal",
  loading = false,
  onSelfManageClick,
  onReportUser,
  onRequireAuth,
}: TrustProfileHeaderProps) {
  if (loading) return <SkeletonBlock variant="card" />;

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <Avatar src={avatarUrl} login={githubLogin} size="lg" verified={verified} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-text">{displayName}</h1>
          {verified ? (
            <StatusPill tone="success" label="GitHub Verified" icon="verified_user" />
          ) : (
            <StatusPill tone="neutral" label="未验证" icon="person" />
          )}
          {restrictionState === "flagged" && (
            <StatusPill tone="warning" label="账户受限" icon="gpp_maybe" />
          )}
        </div>

        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`在 GitHub 打开 @${githubLogin}`}
          className="mt-0.5 inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <Octocat className="size-3.5" />
          <span>@{githubLogin}</span>
          <Icon name="open_in_new" size={12} aria-hidden />
        </a>

        {bio && <p className="mt-2 text-sm text-text">{bio}</p>}

        {topics.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {topics.map((t) => (
              <TopicChip key={t} label={t} />
            ))}
          </div>
        )}

        <p className="mt-2 text-xs text-text-subtle">加入于 {joinedDate}</p>

        {/* 仅已 opt-in public 的联系方式（默认空，INV-03/04） */}
        {publicContacts.length > 0 && (
          <ul className="mt-1 flex flex-wrap gap-3 text-xs text-text-muted">
            {publicContacts.map((c) => (
              <li key={c.type}>
                {c.type}：{c.value}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        {isSelf ? (
          <SecondaryButton iconLeft="settings" onClick={onSelfManageClick}>
            编辑档案 / 联系方式设置
          </SecondaryButton>
        ) : (
          <SecondaryButton
            variant="ghost"
            iconLeft="flag"
            aria-label={`举报 @${githubLogin}`}
            onClick={isAuthenticated ? onReportUser : onRequireAuth}
          >
            {isAuthenticated ? "举报" : "登录后可举报"}
          </SecondaryButton>
        )}
      </div>
    </header>
  );
}
