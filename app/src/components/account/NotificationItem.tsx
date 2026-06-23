"use client";

import { IconChip } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { NotificationType, Tone } from "@/lib/types";

/*
  COMP-154 NotificationItem（单条通知，未读/已读两态，PAGE-062）。
  类型 IconChip + 主文本 + 相对时间（绝对 title）+「查看」链接。
  未读语义非仅颜色：左条 + 圆点 + 加粗 + sr-only「未读」（NFR-007）。
*/
const TYPE_META: Record<NotificationType, { icon: string; tone: Tone }> = {
  exchange: { icon: "swap_horiz", tone: "primary" },
  review: { icon: "verified_user", tone: "info" },
  feedback: { icon: "star", tone: "warning" },
  community: { icon: "group", tone: "accent" },
};

export interface NotificationItemProps {
  id: string;
  type: NotificationType;
  read: boolean;
  title: string;
  body?: string;
  createdAt: string;
  refLink?: { href: string; disabled?: boolean; reason?: string };
  onOpen?: (id: string, href?: string) => void;
  onMarkRead?: (id: string) => void;
}

export function NotificationItem({
  id,
  type,
  read,
  title,
  body,
  createdAt,
  refLink,
  onOpen,
  onMarkRead,
}: NotificationItemProps) {
  const meta = TYPE_META[type];

  function handleActivate() {
    if (!read) onMarkRead?.(id);
    if (refLink && !refLink.disabled) onOpen?.(id, refLink.href);
  }

  return (
    <li
      className={cn(
        "relative flex items-start gap-3 rounded-card border border-border bg-surface px-4 py-3",
        !read && "border-l-2 border-l-primary bg-primary-subtle/30"
      )}
    >
      <IconChip icon={meta.icon} tone={meta.tone} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {!read && (
            <>
              <span
                className="inline-block size-2 shrink-0 rounded-full bg-primary"
                aria-hidden
              />
              <span className="sr-only">未读：</span>
            </>
          )}
          <button
            type="button"
            onClick={handleActivate}
            className={cn(
              "truncate text-left text-sm text-text hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded",
              !read && "font-semibold"
            )}
          >
            {title}
          </button>
        </div>
        {body && <p className="mt-0.5 text-sm text-text-muted">{body}</p>}
        <div className="mt-1 flex items-center gap-3">
          <time
            dateTime={createdAt}
            title={createdAt}
            className="text-xs text-text-subtle"
          >
            {createdAt.slice(0, 10)}
          </time>
          {refLink &&
            (refLink.disabled ? (
              <span
                aria-disabled="true"
                className="text-xs text-text-subtle"
              >
                {refLink.reason ?? "该内容已不可用"}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleActivate}
                className="text-xs font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded"
              >
                查看
              </button>
            ))}
        </div>
      </div>
    </li>
  );
}
