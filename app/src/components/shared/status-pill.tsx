"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Icon } from "./icon";
import { SUBTLE_TONE, SOLID_TONE } from "./tone";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/types";

/*
  COMP-011 StatusPill（语义状态药丸）。状态非仅颜色（NFR-007）：色 + 文字（+ 可选图标）。
  label 必填，禁止纯色无文字（ASM-070）；空 label 兜底为 raw 占位并开发期告警。
*/
export interface StatusPillProps {
  tone: Tone;
  label: string;
  icon?: string;
  size?: "sm" | "md";
  variant?: "solid" | "subtle";
  onClick?: () => void;
  "aria-label"?: string;
}

export function StatusPill({
  tone,
  label,
  icon,
  size = "md",
  variant = "subtle",
  onClick,
  "aria-label": ariaLabel,
}: StatusPillProps) {
  // 强约束：label 必填（NFR-007 状态非仅颜色）。空则兜底，避免纯色无文字。
  const safeLabel = label?.trim() ? label : "未知状态";
  if (!label?.trim() && process.env.NODE_ENV !== "production") {
    console.warn("[StatusPill] label 为空，违反「状态非仅颜色」（NFR-007/ASM-070）。");
  }

  const toneClass = variant === "solid" ? SOLID_TONE[tone] : SUBTLE_TONE[tone];
  const sizeClass = size === "sm" ? "text-[11px] px-1.5 py-0" : "text-xs px-2 py-0.5";

  const content = (
    <>
      {icon && <Icon name={icon} size={size === "sm" ? 12 : 14} aria-hidden />}
      <span>{safeLabel}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel ?? safeLabel}
        className={cn(
          "inline-flex w-fit items-center gap-1 rounded-pill border border-transparent font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
          toneClass,
          sizeClass
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <Badge
      aria-label={ariaLabel}
      className={cn("gap-1 border-transparent font-medium", toneClass, sizeClass)}
    >
      {content}
    </Badge>
  );
}

/* 交换状态 → tone + 默认中文 label 映射（ENT-007 状态机）。供台账/详情统一调用。 */
export const EXCHANGE_STATUS_META: Record<
  string,
  { tone: Tone; label: string; icon?: string }
> = {
  Requested: { tone: "info", label: "已请求", icon: "hourglass_empty" },
  Accepted: { tone: "primary", label: "已接受", icon: "check_circle" },
  PrivatePreparing: { tone: "info", label: "准备交付", icon: "schedule" },
  Delivered: { tone: "info", label: "已交付", icon: "send" },
  Completed: { tone: "success", label: "已完成", icon: "check_circle" },
  WaitingForFeedback: { tone: "warning", label: "待反馈", icon: "forum" },
  Closed: { tone: "neutral", label: "已关闭" },
  Rejected: { tone: "neutral", label: "已拒绝", icon: "close" },
  Cancelled: { tone: "neutral", label: "已取消", icon: "close" },
  Expired: { tone: "neutral", label: "已过期", icon: "schedule" },
  Flagged: { tone: "danger", label: "已标记", icon: "flag" },
  InReview: { tone: "neutral", label: "审核中", icon: "fact_check" },
};

/* 隐私门 → tone + label（ENT-005，INV-02）。block 文字含「阻止」语义。 */
export const PRIVACY_RESULT_META: Record<
  string,
  { tone: Tone; label: string; icon: string }
> = {
  pass: { tone: "success", label: "通过", icon: "check_circle" },
  warn: { tone: "warning", label: "警告", icon: "warning" },
  block: { tone: "danger", label: "阻止发布", icon: "error" },
};
