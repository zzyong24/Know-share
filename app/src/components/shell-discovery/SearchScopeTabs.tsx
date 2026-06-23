"use client";

import { FilterTabs, type FilterTab } from "@/components/shared/filter-tabs";
import type { SearchScope } from "@/lib/types";

/*
  COMP-046 SearchScopeTabs（搜索结果分类 Tab）。PAGE-003。
  基于共享 COMP-027 FilterTabs：{全部|模块|主题|用户|交换}，切换更新 ?type=（FR-001）。
  当前态非仅颜色（FilterTabs/Radix data-state 提供下划线/加重）；计数徽标可读。
  非法 value → 渲染回退 all。
*/
const SCOPE_ORDER: SearchScope[] = ["all", "modules", "topics", "users", "exchanges"];
const SCOPE_LABEL: Record<SearchScope, string> = {
  all: "全部",
  modules: "模块",
  topics: "主题",
  users: "用户",
  exchanges: "交换",
};

export interface SearchScopeTabsProps {
  value: SearchScope;
  counts?: Partial<Record<Exclude<SearchScope, "all">, number>>;
  onChange: (next: SearchScope) => void;
}

export function SearchScopeTabs({ value, counts, onChange }: SearchScopeTabsProps) {
  const safe = SCOPE_ORDER.includes(value) ? value : "all";
  const tabs: FilterTab[] = SCOPE_ORDER.map((scope) => ({
    key: scope,
    label: SCOPE_LABEL[scope],
    count: scope === "all" ? undefined : counts?.[scope],
  }));

  return (
    <div className="overflow-x-auto">
      <FilterTabs
        tabs={tabs}
        activeKey={safe}
        aria-label="搜索分类"
        onChange={(k) => onChange(k as SearchScope)}
      />
    </div>
  );
}
