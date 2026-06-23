import { defineConfig, devices } from "@playwright/test";

// PW_REAL_API=1：真实后端联调模式（pglite 真库 + 真实 /api，关 MSW，注入 dev 会话）。
// 默认：MSW dev server（阶段 12 前端验证）。
const REAL_API = process.env.PW_REAL_API === "1";
const PORT = process.env.PW_PORT ?? (REAL_API ? "3120" : "3100");
const BASE = process.env.PW_BASE_URL ?? `http://localhost:${PORT}`;

/** 阶段 12 前端验证：对 dev server（含 MSW worker）走核心路径；PW_REAL_API=1 时改打真实后端。 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  reporter: [["list"]],
  timeout: 60_000,
  use: { baseURL: BASE, trace: "on-first-retry", screenshot: "only-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: REAL_API
      ? `KNOWSHARE_DEV_DB=pglite NEXT_PUBLIC_KNOWSHARE_REAL_API=1 KNOWSHARE_DEV_SESSION=demo npm run dev -- -p ${PORT}`
      : `npm run dev -- -p ${PORT}`,
    url: BASE,
    reuseExistingServer: true,
    timeout: 180_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
