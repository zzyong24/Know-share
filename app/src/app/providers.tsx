"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/query-client";
import { Toaster } from "@/components/ui/sonner";

/*
  全站 Provider（FRONTEND_SPEC §8）：
  - QueryClientProvider（服务端状态，ASM-063）
  - Toaster（COMP-029 Toast，shadcn Sonner）
  开发环境的 MSW worker 启动见 MswInit（避免阻塞首屏 + 仅 dev）。
*/
export function Providers({ children }: { children: React.ReactNode }) {
  // 每个浏览器会话一个实例（SSR 安全）
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
