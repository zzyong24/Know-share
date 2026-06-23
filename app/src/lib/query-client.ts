import { QueryClient } from "@tanstack/react-query";

/*
  TanStack Query 客户端工厂（FRONTEND_SPEC §8 / ASM-063）。
  服务端状态统一走 Query；写动作走 mutation + 失效相关 query。
  在 providers.tsx 中每次客户端创建一个实例（避免 SSR 间共享）。
*/
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 分钟，减少重复请求
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
