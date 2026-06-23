"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SkeletonBlock } from "./skeleton-block";

/*
  COMP-026 Drawer（抽屉/侧滑面板）。基于 shadcn Sheet：role=dialog/aria-modal/aria-labelledby/
  焦点陷入/Esc 关闭/关闭后焦点归还（Radix 提供）。
*/
export interface DrawerProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  side?: "right" | "left";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
}

const SIZE = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
} as const;

export function Drawer({
  open,
  title,
  children,
  side = "right",
  size = "md",
  loading = false,
  onOpenChange,
}: DrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className={SIZE[size]}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-4">
          {loading ? <SkeletonBlock variant="text" count={4} /> : children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
