"use client";

import { useEffect, useState } from "react";

/*
  开发环境启用 MSW worker（FRONTEND_SPEC §8 / MOCK_DATA_SPEC）。
  仅 NODE_ENV !== production 时动态 import 并 start，避免进生产包。
  worker 文件由 `npx msw init public --save` 生成（public/mockServiceWorker.js）。

  稳健性（修复白屏）：worker 就绪前显示品牌化「加载中」而非裸 null；
  worker 启动失败或超时（3s）也照常渲染子树，避免永久白屏（此时请求走真实网络/各页错误态）。
*/
function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-bg">
      <div className="flex items-center gap-3 text-text-muted">
        <span className="flex h-8 w-8 items-center justify-center rounded-control bg-primary text-base font-bold text-white">
          K
        </span>
        <span className="text-sm">Know-share 加载中…</span>
      </div>
    </div>
  );
}

export function MswInit({ children }: { children: React.ReactNode }) {
  // 生产环境直接放行；开发环境等待 worker 就绪（或超时/失败兜底）后再渲染。
  const [ready, setReady] = useState(process.env.NODE_ENV === "production");

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    let active = true;
    const done = () => {
      if (active) setReady(true);
    };
    // 兜底：3s 内 worker 未就绪也渲染，避免永久白屏。
    const timer = setTimeout(done, 3000);
    (async () => {
      try {
        const { worker } = await import("@/mocks/browser");
        await worker.start({ onUnhandledRequest: "bypass" });
      } catch (err) {
        // 启动失败不阻塞渲染（请求将走真实网络 / 各页错误态）。
        console.error("[MSW] worker 启动失败，跳过 mock：", err);
      } finally {
        clearTimeout(timer);
        done();
      }
    })();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  if (!ready) return <LoadingScreen />;
  return <>{children}</>;
}
