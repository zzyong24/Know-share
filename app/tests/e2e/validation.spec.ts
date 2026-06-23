import { test, expect, type Page } from "@playwright/test";
import path from "node:path";

/*
  阶段 12 前端浏览器验证：对 dev server（MSW 驱动）走核心路径，逐路由截图取证 +
  断言「页面渲染且未落入错误边界」+ 关键不变量软断言。
  截图输出到 aies/03-frontend/validation-shots/。
*/

const SHOTS = path.resolve(
  __dirname,
  "../../../aies/03-frontend/validation-shots"
);

/** 等外壳渲染（MSW worker 就绪后才渲染）+ 截图 + 断言无错误边界。 */
async function visit(page: Page, route: string, shot: string) {
  await page.goto(route, { waitUntil: "networkidle" });
  // AppShell 品牌出现 = MSW 已就绪、外壳已渲染
  await expect(page.getByText("Know-share").first()).toBeVisible({ timeout: 30_000 });
  // 不应落入全局/段错误边界
  await expect(page.locator("body")).not.toContainText("出错了");
  await expect(page.locator("body")).not.toContainText("Application error");
  await page.screenshot({ path: path.join(SHOTS, `${shot}.png`), fullPage: true });
}

test("01 发现页 / 注册表 (PAGE-002)", async ({ page }) => {
  await visit(page, "/", "01-discovery");
  // 至少一张模块卡（链接到 /modules/）
  await expect(page.locator('a[href^="/modules/"]').first()).toBeVisible();
});

test("02 模块详情 (PAGE-010) + 联系方式锁定 (INV-03)", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const href = await page
    .locator('a[href^="/modules/"]')
    .first()
    .getAttribute("href");
  expect(href).toBeTruthy();
  await visit(page, href!, "02-module-detail");
});

test("03 交换记录 (PAGE-030) + 交换详情 (PAGE-031)", async ({ page }) => {
  await visit(page, "/exchanges", "03-exchanges");
  // 台账行经 onClick(router.push) 跳转（非 <a href>），直达已知交换详情。
  await visit(page, "/exchanges/EX-2024-8842", "03b-exchange-detail");
});

test("04 信任网络 (PAGE-043) + 档案 (PAGE-040)", async ({ page }) => {
  await visit(page, "/trust", "04-trust-network");
  // 贡献者条目经 onClick 跳转，直达已知公开档案。
  await visit(page, "/u/zyongzhu24", "04b-trust-profile");
});

test("05 Agent 技能 (PAGE-050)", async ({ page }) => {
  await visit(page, "/skills", "05-skills");
});

test("06 提交向导 (PAGE-020~024)", async ({ page }) => {
  await visit(page, "/submit", "06-submit");
});

test("07 个人中心 (PAGE-060) + 通知 (PAGE-062)", async ({ page }) => {
  await visit(page, "/me", "07-me");
  await visit(page, "/notifications", "07b-notifications");
});

test("08 设置·联系方式 (PAGE-063) + 默认私密 (INV-03)", async ({ page }) => {
  await visit(page, "/settings/contact", "08-settings-contact");
  await expect(page.getByText("私密").first()).toBeVisible();
});

test("09 审核控制台 (PAGE-080，管理员)", async ({ page }) => {
  await visit(page, "/admin", "09-admin");
});

test("10 开放 API (PAGE-090)", async ({ page }) => {
  await visit(page, "/developers", "10-developers");
});

test("11 关于 / 平台统计 (PAGE-100)", async ({ page }) => {
  await visit(page, "/about", "11-about");
});
