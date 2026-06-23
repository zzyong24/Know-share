"use client";

import { cn } from "@/lib/utils";

/*
  COMP-172 QueueFilterBar（队列筛选条）。
  「全部 / 已过滤风险项 / 来源:提交 / 来源:举报」切换，驱动队列数据集（ASM-049）。
  toggle group 语义：role=tablist，当前项 aria-pressed；筛选项文字非仅颜色（NFR-007）。
*/
export interface QueueFilterValue {
  status: "all" | "risk";
  source: "all" | "submission" | "report";
}

export interface QueueFilterBarProps {
  value: QueueFilterValue;
  counts?: { all: number; risk: number; submission: number; report: number };
  onChange: (next: QueueFilterValue) => void;
}

interface Opt {
  key: string;
  label: string;
  next: QueueFilterValue;
  countKey: keyof NonNullable<QueueFilterBarProps["counts"]>;
}

export function QueueFilterBar({ value, counts, onChange }: QueueFilterBarProps) {
  const opts: Opt[] = [
    { key: "all", label: "全部状态", next: { status: "all", source: "all" }, countKey: "all" },
    { key: "risk", label: "已过滤风险项", next: { status: "risk", source: "all" }, countKey: "risk" },
    { key: "submission", label: "提交", next: { status: "all", source: "submission" }, countKey: "submission" },
    { key: "report", label: "举报", next: { status: "all", source: "report" }, countKey: "report" },
  ];

  const isActive = (o: Opt) =>
    o.next.status === value.status && o.next.source === value.source;

  return (
    <div role="tablist" aria-label="队列筛选" className="flex flex-wrap gap-2">
      {opts.map((o) => {
        const active = isActive(o);
        return (
          <button
            key={o.key}
            type="button"
            role="tab"
            aria-pressed={active}
            aria-current={active ? "true" : undefined}
            onClick={() => onChange(o.next)}
            className={cn(
              "inline-flex items-center gap-1 rounded-pill border px-3 py-1 text-xs font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
              active
                ? "border-primary bg-primary-subtle text-primary"
                : "border-border text-text-muted hover:text-text"
            )}
          >
            {o.label}
            {counts && (
              <span className="tabular-nums">{counts[o.countKey]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
