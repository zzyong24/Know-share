"use client";

import { ListRow } from "@/components/shared/list-row";
import { Avatar } from "@/components/shared/avatar";
import { StatusPill } from "@/components/shared/status-pill";
import { stripSensitiveFields } from "@/lib/api";
import type { UserResult } from "@/lib/types";

/*
  COMP-048 UserResultRow（用户搜索结果行）。PAGE-003。
  基于共享 COMP-016 ListRow + COMP-034 Avatar + COMP-011 StatusPill。
  仅 ENT-001 公开身份（login/头像/Verified/派生信用分）；非 PII、非 ENT-008 联系方式（DEC-010/INV-04）。
  Verified 非仅颜色（药丸含图标 + 文字）。整行链接到档案 /u/:login（IA-007）。
*/
export interface UserResultRowProps {
  user: UserResult;
  onActivate?: (login: string) => void;
}

export function UserResultRow({ user, onActivate }: UserResultRowProps) {
  // 二次防线：剥离异常私有字段（INV-04 / ASM-076）。
  const safe = stripSensitiveFields(
    user as unknown as Record<string, unknown>,
    "UserResultRow"
  ) as unknown as UserResult;

  return (
    <ListRow
      leading={
        <Avatar src={safe.avatarUrl} login={safe.login} verified={safe.githubVerified} size="sm" />
      }
      title={`@${safe.login}`}
      href={`/u/${safe.login}`}
      onClick={onActivate ? () => onActivate(safe.login) : undefined}
      subtitle={safe.domainTags?.length ? safe.domainTags.join(" · ") : undefined}
      meta={
        <div className="flex items-center gap-2">
          {safe.githubVerified && (
            <StatusPill tone="success" label="GitHub Verified" icon="verified" size="sm" />
          )}
          {typeof safe.trustScore === "number" && (
            <span className="tabular-nums" aria-label={`信用分 ${safe.trustScore} 分`}>
              {safe.trustScore} 分
            </span>
          )}
        </div>
      }
    />
  );
}
