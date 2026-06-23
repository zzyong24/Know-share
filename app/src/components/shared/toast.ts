"use client";

import { toast as sonnerToast } from "sonner";

/*
  COMP-029 Toast（瞬时通知）。封装 shadcn Sonner，统一 tone → 图标/语义。
  容器 aria-live 由 Toaster（providers.tsx）提供；非仅颜色（含图标 + 文字）。
*/
export type ToastTone = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  description?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

export function notify(
  message: string,
  tone: ToastTone = "info",
  opts?: ToastOptions
) {
  const common = {
    description: opts?.description,
    // error 停留更久（NFR-007）
    duration: opts?.duration ?? (tone === "error" ? 6000 : 4000),
    action: opts?.action,
  };
  switch (tone) {
    case "success":
      return sonnerToast.success(message, common);
    case "error":
      return sonnerToast.error(message, common);
    case "warning":
      return sonnerToast.warning(message, common);
    default:
      return sonnerToast.info(message, common);
  }
}
