/*
  线上 bug 复测（真实后端 pglite）：
  - 开发页统计走真实 /api/about/stats（不再写死 5,120 等假数）。
  - 技能页 /skills 正常渲染（不落错误边界）。
  PW_REAL_API=1 时跑（真实 /api，KNOWSHARE_DEV_DB=pglite）。
*/
import { test, expect } from "@playwright/test";

test("开发页统计走真实 /api/stats，不再显示写死的假数 5,120", async ({ page }) => {
  const statsCall = page.waitForResponse(
    (r) => r.url().includes("/api/about/stats") && r.status() === 200,
    { timeout: 15000 }
  );
  await page.goto("/developers");
  await statsCall; // 证明 teaser 接了真实统计端点（而非硬编码 mock）
  await page.waitForLoadState("networkidle");

  // 旧的写死假数 5,120（用户总数）不应出现。
  await expect(page.getByText("5,120")).toHaveCount(0);
  // 零泄露承诺横幅仍在。
  await expect(page.getByText("零私有内容泄露")).toBeVisible();
});

test("技能页 /skills 正常渲染并展示规范技能（非空、不报错）", async ({ page }) => {
  await page.goto("/skills");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("heading", { name: "Agent 技能" })).toBeVisible();
  // 不应出现错误边界/加载失败文案。
  await expect(page.getByText(/出错了|Application error|加载失败/)).toHaveCount(0);
  // 静态规范技能目录应展示（不再空白/「暂不可用」）。
  await expect(page.getByText("创建脱敏清单")).toBeVisible();
  await expect(page.getByText("验证清单合规")).toBeVisible();
});
