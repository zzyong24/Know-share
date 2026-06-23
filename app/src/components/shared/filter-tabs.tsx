"use client";

import {
  Tabs as UITabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Icon } from "./icon";

/*
  COMP-027 Tabs（筛选/分区 Tab）。基于 shadcn Tabs：role=tablist/tab、aria-selected、箭头键导航。
  active 非仅颜色（含下划线/加粗，由 shadcn data-state 提供）。可选同步 URL 由调用方处理。
  命名为 FilterTabs 以免与 ui/tabs 冲突；内容面板由调用方自行渲染（受控 activeKey）。
*/
export interface FilterTab {
  key: string;
  label: string;
  count?: number;
  icon?: string;
}

export interface FilterTabsProps {
  tabs: FilterTab[];
  activeKey: string;
  onChange: (key: string) => void;
  "aria-label"?: string;
}

export function FilterTabs({
  tabs,
  activeKey,
  onChange,
  "aria-label": ariaLabel = "筛选",
}: FilterTabsProps) {
  return (
    <UITabs value={activeKey} onValueChange={onChange}>
      <TabsList aria-label={ariaLabel}>
        {tabs.map((t) => (
          <TabsTrigger key={t.key} value={t.key} className="gap-1">
            {t.icon && <Icon name={t.icon} size={14} aria-hidden />}
            {t.label}
            {typeof t.count === "number" && (
              <span className="ml-1 rounded-pill bg-muted px-1.5 text-xs tabular-nums text-text-muted">
                {t.count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </UITabs>
  );
}
