"use client";

import { useId } from "react";
import { Switch } from "@/components/ui/switch";
import { Icon } from "./icon";
import type { ContactVisibility } from "@/lib/types";

/*
  COMP-031 VisibilityToggle（可见性开关）。INV-03 的关键 UI 落点：默认私密。
  value 未提供时按 private 渲染（ASM-072）；状态有文字（私密/公开）非仅开关位置/颜色（NFR-007）。
  改为 public 显示后果提示（公开须显式 opt-in）。
*/
export interface VisibilityToggleProps {
  /** 未提供时默认 private（INV-03/ASM-072） */
  value?: ContactVisibility;
  label: string;
  disclosurePolicyHint?: string;
  disabled?: boolean;
  onChange?: (value: ContactVisibility) => void;
}

export function VisibilityToggle({
  value = "private", // 默认私密（INV-03）
  label,
  disclosurePolicyHint,
  disabled = false,
  onChange,
}: VisibilityToggleProps) {
  const id = useId();
  const isPublic = value === "public";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-text">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-text-muted">
            <Icon name={isPublic ? "visibility" : "lock"} size={14} aria-hidden />
            {isPublic ? "公开" : "私密"}
          </span>
          <Switch
            id={id}
            checked={isPublic}
            disabled={disabled}
            aria-label={`${label}：当前${isPublic ? "公开" : "私密"}`}
            onCheckedChange={(checked) =>
              onChange?.(checked ? "public" : "private")
            }
          />
        </div>
      </div>
      {isPublic && (
        <p className="text-xs text-warning">
          公开后任何人可见此联系方式；仅在你显式开启时公开。
        </p>
      )}
      {disclosurePolicyHint && (
        <p className="text-xs text-text-subtle">{disclosurePolicyHint}</p>
      )}
    </div>
  );
}
