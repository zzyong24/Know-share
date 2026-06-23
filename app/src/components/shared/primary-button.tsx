"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "./icon";
import { cn } from "@/lib/utils";

/*
  COMP-007 PrimaryButton（主色实心）。
  loading 时禁用点击防重复提交（aria-busy + 内联 spinner）；图标传规范名。
*/
export interface PrimaryButtonProps
  extends Omit<React.ComponentProps<"button">, "type"> {
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  iconLeft?: string;
  iconRight?: string;
  type?: "button" | "submit";
  fullWidth?: boolean;
}

const SIZE_MAP = { sm: "sm", md: "default", lg: "lg" } as const;

export function PrimaryButton({
  children,
  size = "md",
  loading = false,
  iconLeft,
  iconRight,
  type = "button",
  fullWidth,
  disabled,
  className,
  onClick,
  ...props
}: PrimaryButtonProps) {
  return (
    <Button
      type={type}
      variant="default"
      size={SIZE_MAP[size]}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={loading ? undefined : onClick}
      className={cn(fullWidth && "w-full", "focus-visible:ring-primary", className)}
      {...props}
    >
      {loading && (
        <span
          className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          aria-hidden="true"
        />
      )}
      {!loading && iconLeft && <Icon name={iconLeft} aria-hidden />}
      {children}
      {!loading && iconRight && <Icon name={iconRight} aria-hidden />}
    </Button>
  );
}
