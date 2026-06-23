"use client";

import { ListRow, StatusPill, EmptyState, Icon } from "@/components/shared";
import type { AuditEntry } from "@/lib/types";

/*
  COMP-180 AuditLogList（审计日志列表，只读）。
  ListRow 呈现 时间/行动者/动作/目标；只读不可编辑或删除（INV-11/NFR-006）。
  区分 @system（自动信号）与人工行动者；目标仅显示引用不泄露私有内容（INV-04）。
*/
export interface AuditLogListProps {
  entries: AuditEntry[];
  loading?: boolean;
  onExpandEntry?: (id: string) => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AuditLogList({
  entries,
  loading = false,
  onExpandEntry,
}: AuditLogListProps) {
  if (!loading && entries.length === 0) {
    return (
      <EmptyState icon="history" title="暂无审计记录" description="处置动作产生后将在此可追溯。" />
    );
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <ul className="rounded-card border border-border bg-surface" aria-label="审计日志">
      {sorted.map((e) => {
        const isSystem = e.actorLogin === "system";
        return (
          <ListRow
            key={e.id}
            as="li"
            leading={
              <StatusPill
                tone={isSystem ? "neutral" : "primary"}
                label={isSystem ? "系统" : "人工"}
                icon={isSystem ? "smart_toy" : "person"}
                size="sm"
              />
            }
            title={
              <span>
                @{e.actorLogin} <span className="text-text-muted">{e.action}</span>{" "}
                {e.target}
              </span>
            }
            datetime={e.createdAt}
            relativeTime={formatTime(e.createdAt)}
            actions={
              onExpandEntry ? (
                <button
                  type="button"
                  aria-label={`查看审计条目 ${e.target}`}
                  onClick={() => onExpandEntry(e.id)}
                  className="rounded p-1 text-text-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <Icon name="chevron_right" size={16} aria-hidden />
                </button>
              ) : undefined
            }
          />
        );
      })}
    </ul>
  );
}
