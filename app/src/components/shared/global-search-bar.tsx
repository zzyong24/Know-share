"use client";

import { useState, useRef } from "react";
import { Icon } from "./icon";
import { cn } from "@/lib/utils";
import type { SearchSuggestion } from "@/lib/types";

/*
  COMP-003 GlobalSearchBar（全局搜索框）。combobox 模式：input role=combobox/aria-expanded/
  aria-controls→listbox；选项 role=option/aria-selected；上下键移动、Enter 选择、Esc 关闭。
  联想类型不仅靠颜色（含类型文字）。取数由 props 注入（suggestions）。
*/
const TYPE_LABEL: Record<SearchSuggestion["type"], string> = {
  module: "模块",
  topic: "主题",
  user: "用户",
  exchange: "交换",
};

export interface GlobalSearchBarProps {
  placeholder?: string;
  suggestions?: SearchSuggestion[];
  loading?: boolean;
  defaultValue?: string;
  onChange?: (query: string) => void;
  onSubmit?: (query: string) => void;
  onSelectSuggestion?: (item: SearchSuggestion) => void;
}

export function GlobalSearchBar({
  placeholder = "搜索模块、主题、用户…",
  suggestions = [],
  loading = false,
  defaultValue = "",
  onChange,
  onSubmit,
  onSelectSuggestion,
}: GlobalSearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const listId = "global-search-listbox";
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (v: string) => {
    setQuery(v);
    setOpen(v.trim().length > 0);
    setActiveIdx(-1);
    onChange?.(v);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        onSelectSuggestion?.(suggestions[activeIdx]);
        setOpen(false);
      } else {
        onSubmit?.(query);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const hasSuggestions = open && suggestions.length > 0;
  const showEmpty = open && !loading && suggestions.length === 0 && query.trim();

  return (
    <div className="relative w-full max-w-md">
      <div className="flex items-center gap-2 rounded-pill border border-border bg-surface px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary">
        <Icon name="search" size={16} className="text-text-subtle" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="全局搜索"
          aria-expanded={hasSuggestions}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIdx >= 0 ? `gs-option-${activeIdx}` : undefined
          }
          value={query}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-subtle"
        />
        {loading && (
          <span className="size-3.5 animate-spin rounded-full border-2 border-text-subtle/30 border-t-text-subtle" aria-hidden />
        )}
      </div>

      {hasSuggestions && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-control border border-border bg-surface shadow-card"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              id={`gs-option-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelectSuggestion?.(s);
                setOpen(false);
              }}
              className={cn(
                "flex cursor-pointer items-center justify-between px-3 py-2 text-sm",
                i === activeIdx ? "bg-primary-subtle" : "hover:bg-muted"
              )}
            >
              <span className="truncate text-text">{s.label}</span>
              <span className="ml-2 shrink-0 text-xs text-text-subtle">
                {TYPE_LABEL[s.type]}
              </span>
            </li>
          ))}
        </ul>
      )}
      {showEmpty && (
        <div className="absolute z-20 mt-1 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text-muted shadow-card">
          按回车搜索「{query}」
        </div>
      )}
    </div>
  );
}
