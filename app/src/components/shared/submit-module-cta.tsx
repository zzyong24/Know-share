"use client";

import { PrimaryButton } from "./primary-button";
import type { Session } from "@/lib/types";

/*
  COMP-005 SubmitModuleCTA。全站常驻主色入口，跳提交向导（/submit）。
  匿名点击触发登录（onRequireAuth），不直接跳转。
*/
export interface SubmitModuleCTAProps {
  session?: Session | null;
  requiresAuth?: boolean;
  size?: "sm" | "md";
  onNavigate?: (href: string) => void;
  onRequireAuth?: () => void;
}

export function SubmitModuleCTA({
  session,
  requiresAuth = true,
  size = "md",
  onNavigate,
  onRequireAuth,
}: SubmitModuleCTAProps) {
  const handleClick = () => {
    if (requiresAuth && !session) {
      onRequireAuth?.();
      return;
    }
    onNavigate?.("/submit");
  };

  return (
    <PrimaryButton size={size} iconLeft="add" onClick={handleClick}>
      提交模块
    </PrimaryButton>
  );
}
