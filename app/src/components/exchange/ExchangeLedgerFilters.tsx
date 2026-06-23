"use client";

import { FilterTabs, TopicChip, Icon } from "@/components/shared";
import { Input } from "@/components/ui/input";
import type { ExchangeLedgerQuery } from "@/lib/queries/exchange";

/*
  COMP-092 ExchangeLedgerFilters（状态/主题/搜索/排序筛选条）。
  状态分组按 FLOW-003（进行中/已完成/未成；Flagged 不单列 ASM-032）。
  全部维度由上层映射到 URL searchParams（可分享深链）；本组件受控、只回调。
  关键词只搜模块名/主题，不搜私有字段（INV-04）。
*/
export interface ExchangeLedgerFiltersProps {
  value: ExchangeLedgerQuery;
  topicOptions: string[];
  resultCount?: number;
  onChange: (next: ExchangeLedgerQuery) => void;
}

const STATUS_TABS = [
  { key: "all", label: "全部" },
  { key: "active", label: "进行中" },
  { key: "completed", label: "已完成" },
  { key: "unfulfilled", label: "未成" },
];

const SORT_OPTIONS = [
  { key: "latest", label: "最新" },
  { key: "mostActive", label: "最活跃" },
] as const;

export function ExchangeLedgerFilters({
  value,
  topicOptions,
  resultCount,
  onChange,
}: ExchangeLedgerFiltersProps) {
  const activeStatus = value.status ?? "all";
  const activeSort = value.sort ?? "latest";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          tabs={STATUS_TABS}
          activeKey={activeStatus}
          onChange={(key) => onChange({ ...value, status: key, page: 1 })}
          aria-label="按状态筛选交换"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-subtle">排序</span>
          <select
            aria-label="排序方式"
            value={activeSort}
            onChange={(e) =>
              onChange({
                ...value,
                sort: e.target.value as ExchangeLedgerQuery["sort"],
              })
            }
            className="rounded-control border border-border bg-surface px-2 py-1 text-sm text-text focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="relative max-w-sm">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle">
          <Icon name="search" size={16} aria-hidden />
        </span>
        <Input
          type="search"
          aria-label="搜索模块名或主题"
          placeholder="搜索模块名或主题…"
          value={value.q ?? ""}
          onChange={(e) => onChange({ ...value, q: e.target.value, page: 1 })}
          className="pl-8"
        />
      </div>

      {topicOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topicOptions.map((t) => (
            <TopicChip
              key={t}
              label={t}
              selected={value.topic === t}
              onClick={() =>
                onChange({
                  ...value,
                  topic: value.topic === t ? undefined : t,
                  page: 1,
                })
              }
            />
          ))}
        </div>
      )}

      {typeof resultCount === "number" && (
        <p className="text-xs text-text-subtle" aria-live="polite">
          共 {resultCount} 条交换记录
        </p>
      )}
    </div>
  );
}
