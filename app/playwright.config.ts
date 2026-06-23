import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PW_PORT ?? "3100";
const BASE = process.env.PW_BASE_URL ?? `http://localhost:${PORT}`;

/** 阶段 12 前端验证：对 dev server（含 MSW worker）走核心路径。 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  reporter: [["list"]],
  timeout: 60_000,
  use: { baseURL: BASE, trace: "on-first-retry", screenshot: "only-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- -p ${PORT}`,
    url: BASE,
    reuseExistingServer: true,
    timeout: 180_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
