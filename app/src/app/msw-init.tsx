"use client";

import { useEffect, useState } from "react";

/*
  开发环境启用 MSW worker（FRONTEND_SPEC §8 / MOCK_DATA_SPEC）。
  仅 NODE_ENV !== production 时动态 import 并 start，避免进生产包。
  worker 文件由 `npx msw init public --save` 生成（public/mockServiceWorker.js）。
*/
export function MswInit({ children }: { children: React.ReactNode }) {
  // 生产环境直接放行；开发环境等待 worker 就绪后再渲染，保证首屏请求被拦截。
  const [ready, setReady] = useState(process.env.NODE_ENV === "production");

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    let active = true;
    (async () => {
      const { worker } = await import("@/mocks/browser");
      await worker.start({ onUnhandledRequest: "bypass" });
      if (active) setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
