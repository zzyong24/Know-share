import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import os from "node:os";

/*
  测试稳定性（打磨 Task 4·缺陷5）：
  server 套件（tests/server/**）每个测试文件各起一个 @electric-sql/pglite WASM 内存库实例；
  默认无上限并行时，多 pglite 实例争用 CPU/内存导致 setup hook 偶发超时 / 个别用例被跳过。
  对策（在「确定性全绿」与「不过度变慢」之间取平衡）：
  - pool 固定为 forks（进程级隔离，规避 setDb/setRedis 模块级单例被并发写串扰）；
  - maxWorkers 限制并发为 CPU 的一半（封顶 4），既消除资源踩踏又保留并行收益
    （Vitest 4 已将 poolOptions.forks.maxForks 收敛为顶层 maxWorkers）；
  - hookTimeout / testTimeout 放宽到 30s，吸收高负载下 pushSchema/seed 的尾延迟。
  默认命令 `vitest run` 即应用本配置，无需额外 flag。
*/
const maxWorkers = Math.max(1, Math.min(4, Math.floor(os.cpus().length / 2)));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "src/**/*.test.{ts,tsx}",
      "tests/unit/**/*.test.{ts,tsx}",
      "tests/server/**/*.test.{ts,tsx}",
    ],
    pool: "forks",
    maxWorkers,
    hookTimeout: 30_000,
    testTimeout: 30_000,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
