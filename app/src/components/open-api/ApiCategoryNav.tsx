"use client";

import { Icon } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { ApiCategory, ApiCategoryId } from "@/mocks/fixtures/open-api";

/*
  COMP-191 ApiCategoryNav（API 分类导航）。256px 侧栏（窄屏横向滚动）。
  发现/模块/交换/反馈/统计，锚点跳转右侧端点分组（ASM-054）。
  当前项高亮：主色 + 左侧条 + aria-current（非仅颜色，NFR-007 / PAGE-090 验收 6）。
  全键盘可达（链接 Tab/Enter）。分类清单为静态配置（ASM-103，无 loading/error）。
*/
const CATEGORY_ICON: Record<ApiCategoryId, string> = {
  discovery: "search",
  modules: "inventory_2",
  exchanges: "swap_horiz",
  feedback: "forum",
  stats: "monitoring",
};

export interface ApiCategoryNavProps {
  categories: ApiCategory[];
  activeId?: ApiCategoryId;
  onNavigate?: (categoryId: ApiCategoryId) => void;
}

export function ApiCategoryNav({
  categories,
  activeId,
  onNavigate,
}: ApiCategoryNavProps) {
  return (
    <nav aria-label="API 分类">
      <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-text-subtle">
        API 分类
      </p>
      <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {categories.map((cat) => {
          const active = cat.id === activeId;
          return (
            <li key={cat.id} className="shrink-0">
              <a
                href={cat.anchor}
                aria-current={active ? "true" : undefined}
                onClick={() => onNavigate?.(cat.id)}
                className={cn(
                  "flex items-center gap-2 rounded-control border-l-2 px-2 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                  active
                    ? "border-primary bg-primary-subtle font-semibold text-primary"
                    : "border-transparent text-text-muted hover:text-primary"
                )}
              >
                <Icon name={CATEGORY_ICON[cat.id]} size={16} aria-hidden />
                <span>{cat.label}</span>
                {cat.count > 0 && (
                  <span className="ml-auto text-xs text-text-subtle">
                    {cat.count}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
