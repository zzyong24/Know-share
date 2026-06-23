"use client";

import * as React from "react";
import {
  Card as UICard,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/*
  COMP-009 Card（基础卡片）。白底 + border + shadow-card + rounded-card。
  interactive 卡可点：键盘 Enter/Space 激活 + role=button + aria-label。
*/
export interface SharedCardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  interactive?: boolean;
  selected?: boolean;
  padding?: "sm" | "md";
  onClick?: () => void;
  "aria-label"?: string;
  className?: string;
  as?: "div" | "article" | "section";
}

export function Card({
  children,
  header,
  footer,
  interactive = false,
  selected = false,
  padding = "md",
  onClick,
  "aria-label": ariaLabel,
  className,
}: SharedCardProps) {
  const interactiveProps = interactive
    ? {
        role: "button" as const,
        tabIndex: 0,
        "aria-label": ariaLabel,
        onClick,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.();
          }
        },
      }
    : {};

  return (
    <UICard
      {...interactiveProps}
      className={cn(
        "rounded-card border-border bg-surface shadow-card",
        padding === "sm" ? "gap-3 py-4" : "gap-4 py-5",
        interactive &&
          "cursor-pointer transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
        selected && "border-primary ring-1 ring-primary",
        className
      )}
    >
      {header && <CardHeader>{header}</CardHeader>}
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </UICard>
  );
}
