"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "./icon";
import { cn } from "@/lib/utils";

/*
  COMP-008 SecondaryButton（次要/描边/幽灵）。与 PrimaryButton 区分主次。
*/
export interface SecondaryButtonProps
  extends Omit<React.ComponentProps<"button">, "type"> {
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  iconLeft?: string;
  iconRight?: string;
  variant?: "outline" | "ghost" | "subtle";
  type?: "button" | "submit";
  fullWidth?: boolean;
}

const SIZE_MAP = { sm: "sm", md: "default", lg: "lg" } as const;
const VARIANT_MAP = {
  outline: "outline",
  ghost: "ghost",
  subtle: "secondary",
} as const;

export function SecondaryButton({
  children,
  size = "md",
  loading = false,
  iconLeft,
  iconRight,
  variant = "outline",
  type = "button",
  fullWidth,
  disabled,
  className,
  onClick,
  ...props
}: SecondaryButtonProps) {
  return (
    <Button
      type={type}
      variant={VARIANT_MAP[variant]}
      size={SIZE_MAP[size]}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={loading ? undefined : onClick}
      className={cn(fullWidth && "w-full", "focus-visible:ring-primary", className)}
      {...props}
    >
      {loading && (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
          aria-hidden="true"
        />
      )}
      {!loading && iconLeft && <Icon name={iconLeft} aria-hidden />}
      {children}
      {!loading && iconRight && <Icon name={iconRight} aria-hidden />}
    </Button>
  );
}
