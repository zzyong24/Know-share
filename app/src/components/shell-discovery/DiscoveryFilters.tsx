"use client";

import { useState } from "react";
import { SecondaryButton } from "@/components/shared/secondary-button";
import { Drawer } from "@/components/shared/drawer";
import { Icon } from "@/components/shared/icon";
import { TrustBadge } from "@/components/shared/trust-badge";
import { SkeletonBlock } from "@/components/shared/skeleton-block";
import { cn } from "@/lib/utils";
import type {
  FilterValue,
  FilterOptions,
  ModuleType,
  TrustLevel,
} from "@/lib/types";

/*
  COMP-042 DiscoveryFilters（发现筛选器）。PAGE-002 区域②。
  维度（ASM-017）：模块类型 / 信任级别 / 是否 GitHub Verified。主题维度由 TopicChipRow 承载。
  受控（value 来自 URL searchParams），onChange/onClear 上抛；窄屏折叠为抽屉。
  选中态非仅颜色：勾选图标 + 文字（NFR-007）。未知值按白名单忽略（不报错）。
*/

const TYPE_LABEL: Record<ModuleType, string> = {
  Draft: "草稿",
  Published: "已发布",
  Updated: "已更新",
  Delisted: "已下架",
};

const TRUST_LABEL: Record<TrustLevel, string> = {
  high: "高信任",
  medium: "中等信任",
  low: "较低信任",
  new: "新用户",
};

export interface DiscoveryFiltersProps {
  value: FilterValue;
  options: FilterOptions;
  loading?: boolean;
  compact?: boolean;
  onChange: (next: FilterValue) => void;
  onClear: () => void;
}

function toggle<T>(list: T[] | undefined, item: T): T[] {
  const arr = list ?? [];
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

function CheckOption({
  label,
  checked,
  onToggle,
  disabled,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-pill border px-2.5 py-1 text-xs",
        checked
          ? "border-primary bg-primary-subtle font-semibold text-primary"
          : "border-border bg-surface text-text-muted",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
      />
      {checked && <Icon name="check" size={12} aria-hidden />}
      <span>{label}</span>
    </label>
  );
}

function FilterGroups({
  value,
  options,
  loading,
  onChange,
}: Omit<DiscoveryFiltersProps, "onClear" | "compact">) {
  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="mb-1.5 text-xs font-medium text-text-subtle">类型</legend>
        <div className="flex flex-wrap gap-1.5">
          {options.types.map((t) => (
            <CheckOption
              key={t}
              label={TYPE_LABEL[t] ?? t}
              checked={!!value.type?.includes(t)}
              disabled={loading}
              onToggle={() => onChange({ ...value, type: toggle(value.type, t) })}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-xs font-medium text-text-subtle">信任级别</legend>
        <div className="flex flex-wrap gap-1.5">
          {options.trustLevels.map((lvl) => (
            <CheckOption
              key={lvl}
              label={TRUST_LABEL[lvl] ?? lvl}
              checked={!!value.trustLevel?.includes(lvl)}
              disabled={loading}
              onToggle={() =>
                onChange({ ...value, trustLevel: toggle(value.trustLevel, lvl) })
              }
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-xs font-medium text-text-subtle">身份</legend>
        <CheckOption
          label="仅 GitHub Verified"
          checked={!!value.verifiedOnly}
          disabled={loading}
          onToggle={() => onChange({ ...value, verifiedOnly: !value.verifiedOnly })}
        />
      </fieldset>
    </div>
  );
}

export function DiscoveryFilters({
  value,
  options,
  loading = false,
  compact = false,
  onChange,
  onClear,
}: DiscoveryFiltersProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hasActive =
    !!value.type?.length ||
    !!value.topic?.length ||
    !!value.trustLevel?.length ||
    !!value.verifiedOnly;

  if (loading && !options.types.length) {
    return <SkeletonBlock variant="row" />;
  }

  if (compact) {
    return (
      <>
        <SecondaryButton
          iconLeft="tune"
          onClick={() => setDrawerOpen(true)}
          aria-label="打开筛选"
        >
          筛选
          {hasActive && (
            <span className="ml-1 inline-flex size-1.5 rounded-full bg-primary" aria-hidden />
          )}
        </SecondaryButton>
        <Drawer open={drawerOpen} title="筛选" onOpenChange={setDrawerOpen}>
          <FilterGroups
            value={value}
            options={options}
            loading={loading}
            onChange={onChange}
          />
          {hasActive && (
            <div className="mt-4">
              <SecondaryButton variant="ghost" onClick={onClear}>
                清除筛选
              </SecondaryButton>
            </div>
          )}
        </Drawer>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <FilterGroups
        value={value}
        options={options}
        loading={loading}
        onChange={onChange}
      />
      {hasActive && (
        <div>
          <SecondaryButton variant="ghost" size="sm" iconLeft="close" onClick={onClear}>
            清除筛选
          </SecondaryButton>
        </div>
      )}
      {/* 信任级别图例（说明非仅颜色）。 */}
      <div className="sr-only">
        <TrustBadge level="high" size="sm" />
      </div>
    </div>
  );
}
