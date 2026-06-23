import { test, expect, type Page } from "@playwright/test";
import path from "node:path";

/*
  Task 2 前端↔真实后端联调（非 MSW）。
  服务以 `dev:real` 起（playwright.config 在 PW_REAL_API=1 时切 webServer 命令：
  KNOWSHARE_DEV_DB=pglite + NEXT_PUBLIC_KNOWSHARE_REAL_API=1 + KNOWSHARE_DEV_SESSION=demo，端口 3120）。
  即：pglite 真库 + 真实 Route Handlers + 注入开发会话（zyongzhu24 / admin / verified），关 MSW。
  逐路由对真实 /api/* 走核心路径 + 截图取证 + 断言无错误边界、关键内容出现。
  截图输出 aies/05-release/integration-shots/。
*/

const SHOTS = path.resolve(
  __dirname,
  "../../../aies/05-release/integration-shots"
);

/** 访问路由：等外壳渲染（真实 API 模式无 MSW 等待）+ 截图 + 断言无错误边界。 */
async function visit(page: Page, route: string, shot: string) {
  await page.goto(route, { waitUntil: "networkidle" });
  await expect(page.getByText("Know-share").first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator("body")).not.toContainText("出错了");
  await expect(page.locator("body")).not.toContainText("Application error");
  await page.screenshot({
    path: path.join(SHOTS, `${shot}.png`),
    fullPage: true,
  });
}

test("01 发现页 / 从真实 /api/modules 出模块卡（仅 Published）", async ({
  page,
}) => {
  await visit(page, "/", "01-discovery");
  // 至少一张模块卡（链接到 /modules/）。
  await expect(page.locator('a[href^="/modules/"]').first()).toBeVisible();
  // 直接校验真实 API 契约：返回 items 且全为 Published（INV-04 零私有）。
  const api = await page.request.get("/api/modules");
  expect(api.ok()).toBeTruthy();
  const body = await api.json();
  expect(Array.isArray(body.items)).toBeTruthy();
  expect(body.items.length).toBeGreaterThan(0);
  for (const m of body.items) {
    expect(m.status).toBe("Published");
    // 脱敏：列表项不得含 contact / 原始内容。
    expect(m).not.toHaveProperty("contact");
  }
});

test("02 模块详情 真实 /api/modules/:id/detail（脱敏、无 contact）", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const href = await page
    .locator('a[href^="/modules/"]')
    .first()
    .getAttribute("href");
  expect(href).toBeTruthy();
  await visit(page, href!, "02-module-detail");

  // 真实 detail 端点：脱敏、无 contact 字段。
  const id = href!.split("/").pop()!;
  const api = await page.request.get(`/api/modules/${id}/detail`);
  expect(api.ok()).toBeTruthy();
  const detail = await api.json();
  expect(JSON.stringify(detail)).not.toContain("contact");
  expect(JSON.stringify(detail)).not.toMatch(/微信|telegram|@gmail/i);
});

test("03 交换台账 /exchanges + 详情 真实数据", async ({ page }) => {
  await visit(page, "/exchanges", "03-exchanges");
  // 真实 GET /api/exchanges：返回 items（脱敏台账，排除 Flagged）。
  const api = await page.request.get("/api/exchanges");
  expect(api.ok()).toBeTruthy();
  const body = await api.json();
  expect(Array.isArray(body.items)).toBeTruthy();
  expect(body.items.length).toBeGreaterThan(0);
  for (const ex of body.items) {
    expect(ex.status).not.toBe("Flagged");
  }
  // 取一条真实 exchangeId（公开台账脱敏引用，如 EX-2024-8803）直达详情页。
  const ref = body.items[0].exchangeId as string;
  expect(ref).toBeTruthy();
  await visit(page, `/exchanges/${ref}`, "03b-exchange-detail");
});

test("04 登录态私域 /me（注入开发会话）", async ({ page }) => {
  await visit(page, "/me", "04-me");
  // 真实 GET /api/session：返回注入的开发会话（zyongzhu24 / admin）。
  const api = await page.request.get("/api/session");
  expect(api.ok()).toBeTruthy();
  const session = await api.json();
  expect(session).not.toBeNull();
  expect(session.login).toBe("zyongzhu24");
});

test("05 设置·联系方式 /settings/contact（默认私密 INV-03）", async ({
  page,
}) => {
  await visit(page, "/settings/contact", "05-settings-contact");
  await expect(page.getByText("私密").first()).toBeVisible();
});

test("06 写往返：真实 POST /api/modules/:id/favorite（收藏计数持久）", async ({
  page,
}) => {
  // 取一个真实模块 id。
  const list = await page.request.get("/api/modules");
  const items = (await list.json()).items as Array<{ id: string }>;
  const moduleId = items[0].id;

  // 收藏前真实 detail 的收藏数。
  const before = await (
    await page.request.get(`/api/modules/${moduleId}/detail`)
  ).json();
  const beforeCount = readFavoriteCount(before);

  // 写：真实 POST favorite（dev 会话已登录，无需 OAuth）。
  const post = await page.request.post(
    `/api/modules/${moduleId}/favorite`,
    { data: {} }
  );
  expect(post.ok()).toBeTruthy();
  const result = await post.json();
  expect(result.favorited).toBe(true);
  expect(typeof result.favoriteCount).toBe("number");

  // 持久化：再读 detail，收藏数应反映写入（+1 或幂等保持 ≥ before）。
  const after = await (
    await page.request.get(`/api/modules/${moduleId}/detail`)
  ).json();
  const afterCount = readFavoriteCount(after);
  expect(afterCount).toBeGreaterThanOrEqual(beforeCount + 1);

  // 截图：收藏后的模块详情页。
  await visit(page, `/modules/${moduleId}`, "06-favorite-roundtrip");
});

/** 从 detail 响应中鲁棒地取收藏计数（兼容 socialCounts.favorites / favoriteCount）。 */
function readFavoriteCount(detail: unknown): number {
  const d = detail as Record<string, unknown>;
  const trust = d.trust as Record<string, unknown> | undefined;
  if (trust && typeof trust.favorites === "number") return trust.favorites;
  const mod = d.module as Record<string, unknown> | undefined;
  if (mod && typeof mod.favoriteCount === "number") return mod.favoriteCount;
  if (typeof d.favoriteCount === "number") return d.favoriteCount;
  return 0;
}
