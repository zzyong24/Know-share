"use client";

import { Icon } from "@/components/shared";
import { cn } from "@/lib/utils";

/*
  COMP-091 ExchangeDirectionMarker（互惠/单向方向标记）。
  互惠 = sync、单向 = arrow_forward，由 offeredModule 是否为空派生（INV-05/DEC-009）。
  纯展示基元；aria-label 表达方向（非仅图标形状，NFR-007）。单一图标族（DEC-012）。
*/
export interface ExchangeDirectionMarkerProps {
  direction: "reciprocal" | "oneway";
  size?: "sm" | "md";
  tone?: "muted" | "primary";
}

export function ExchangeDirectionMarker({
  direction,
  size = "sm",
  tone = "muted",
}: ExchangeDirectionMarkerProps) {
  const isReciprocal = direction === "reciprocal";
  const label = isReciprocal ? "互惠交换" : "单向请求";
  return (
    <Icon
      name={isReciprocal ? "swap_horiz" : "send"}
      size={size === "sm" ? 14 : 20}
      aria-label={label}
      className={cn(tone === "primary" ? "text-primary" : "text-text-muted")}
    />
  );
}
