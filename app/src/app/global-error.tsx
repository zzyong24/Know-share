"use client";

/*
  全局错误边界（root global-error）。捕获根布局级错误，必须自带 html/body。
*/
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold">发生了意外错误</h1>
        <p className="text-sm text-gray-500">请刷新页面或稍后重试。</p>
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-[#017A6E] px-4 py-2 text-sm font-medium text-white"
        >
          重试
        </button>
      </body>
    </html>
  );
}
