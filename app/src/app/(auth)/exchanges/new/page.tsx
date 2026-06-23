import { Suspense } from "react";
import { ExchangeNewClient } from "./ExchangeNewClient";
import { SkeletonBlock } from "@/components/shared/skeleton-block";

/*
  PAGE-031b 发起交换（route /exchanges/new，(auth) 段需登录 DEC-006/NFR-005）。
  从 ?module=<id> 预填目标模块；互惠 offeredModule 可选（DEC-009/INV-05）。
  外壳由 (auth)/layout.tsx 的 SiteShell 提供；表单取数/写在客户端（TanStack Query + MSW）。
*/
export default function ExchangeNewPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-text">
          发起交换
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          确认目标模块，可选互惠提供你的模块，并同意交换规则后发起请求。
        </p>
      </header>
      <Suspense fallback={<SkeletonBlock variant="card" count={2} />}>
        <ExchangeNewClient />
      </Suspense>
    </div>
  );
}
