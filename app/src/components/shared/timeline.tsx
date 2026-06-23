"use client";

import { Icon } from "./icon";
import { cn } from "@/lib/utils";

/*
  COMP-036 Timeline（通用竖向时间线基元）。<ol> 有序；每项时间 <time datetime>；
  节点状态有文字 + 图标（非仅颜色）；active 项 aria-current 适配。
  状态枚举见 COMPONENTS_SPEC：done/completed/active/pending/error/terminated（终止用中性而非告警）。
*/
export type TimelineStatus =
  | "done"
  | "completed"
  | "active"
  | "pending"
  | "error"
  | "terminated";

export interface TimelineItem {
  key: string;
  title: string;
  description?: string;
  timestamp: string; // ISO
  relativeTime?: string;
  status?: TimelineStatus;
  icon?: string;
}

export interface TimelineProps {
  items: TimelineItem[];
  compact?: boolean;
  onItemClick?: (key: string) => void;
}

const STATUS_META: Record<
  TimelineStatus,
  { dot: string; text: string; icon: string }
> = {
  done: { dot: "bg-success text-white", text: "已完成", icon: "check_circle" },
  completed: { dot: "bg-success text-white", text: "已完成", icon: "check_circle" },
  active: { dot: "bg-primary text-white", text: "进行中", icon: "schedule" },
  pending: { dot: "bg-muted text-text-subtle", text: "未开始", icon: "schedule" },
  error: { dot: "bg-danger text-white", text: "错误", icon: "error" },
  terminated: { dot: "bg-text-muted text-white", text: "已终止", icon: "close" },
};

export function Timeline({ items, compact = false, onItemClick }: TimelineProps) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-text-muted">暂无事件</p>;
  }
  return (
    <ol className="relative flex flex-col">
      {items.map((it, idx) => {
        const meta = STATUS_META[it.status ?? "pending"];
        const isLast = idx === items.length - 1;
        return (
          <li
            key={it.key}
            aria-current={it.status === "active" ? "step" : undefined}
            className="relative flex gap-3 pb-4"
          >
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "z-10 flex size-7 items-center justify-center rounded-full",
                  meta.dot
                )}
                aria-hidden
              >
                <Icon name={it.icon ?? meta.icon} size={14} aria-hidden />
              </span>
              {!isLast && <span className="w-px flex-1 bg-border" aria-hidden />}
            </div>
            <div className={cn("min-w-0 flex-1", compact ? "pb-1" : "pb-2")}>
              <div className="flex items-center gap-2">
                {onItemClick ? (
                  <button
                    type="button"
                    onClick={() => onItemClick(it.key)}
                    className="text-sm font-medium text-text hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded"
                  >
                    {it.title}
                  </button>
                ) : (
                  <span className="text-sm font-medium text-text">{it.title}</span>
                )}
                <span className="text-xs text-text-subtle">{meta.text}</span>
              </div>
              {it.description && (
                <p className="text-sm text-text-muted">{it.description}</p>
              )}
              <time
                dateTime={it.timestamp}
                title={it.timestamp}
                className="text-xs text-text-subtle"
              >
                {it.relativeTime ?? it.timestamp}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
