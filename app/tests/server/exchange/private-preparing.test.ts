/*
  交换私下准备阶段的用户侧端点（闭合 FLOW-003 已知缺口）：
  - POST /api/exchanges/:id/start-preparing —— 任一参与方把 Accepted→PrivatePreparing。
  - mark-delivered 扩展：PrivatePreparing→Delivered（记录该方确认；双方确认后 Delivered→Completed 不变）。
  守则：参与方校验（非参与方 403 / 未登录 401）；非法迁移 409（HARD-02）；写 audit（INV-11）。
*/
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupHarness, schema, type Harness } from "../_harness";
import { eq } from "drizzle-orm";

import { POST as startPreparing } from "@/app/api/exchanges/[id]/start-preparing/route";
import { POST as markDelivered } from "@/app/api/exchanges/[id]/mark-delivered/route";

let h: Harness;
let requesterId = "";
let targetModuleId = "";

const ALICE = { login: "alice", avatarUrl: "a", isAdmin: false, verified: true } as const; // 请求方
const BOB = { login: "bob", avatarUrl: "b", isAdmin: false, verified: true } as const; // 模块所有者
const CAROL = { login: "carol", avatarUrl: "c", isAdmin: false, verified: true } as const; // 旁观者

async function seedUser(login: string): Promise<string> {
  const [u] = await h.db
    .insert(schema.users)
    .values({
      githubId: `gh-${login}`,
      login,
      displayName: login,
      avatarUrl: login,
      githubVerified: true,
    })
    .returning({ id: schema.users.id });
  return u.id;
}

async function seedExchange(status: string): Promise<string> {
  const [row] = await h.db
    .insert(schema.exchanges)
    .values({
      publicRef: `EX-PP-${status}`,
      requesterId,
      targetModuleId,
      status,
    })
    .returning({ id: schema.exchanges.id });
  return row.id;
}

function post(path: string): Request {
  return new Request(`http://localhost${path}`, { method: "POST" });
}
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(async () => {
  h = await setupHarness({ seed: false });
  requesterId = await seedUser(ALICE.login);
  const bobId = await seedUser(BOB.login);
  await seedUser(CAROL.login);
  const [m] = await h.db
    .insert(schema.knowledgeModules)
    .values({ ownerId: bobId, title: "Bob 模块", summary: "s", status: "Published" })
    .returning({ id: schema.knowledgeModules.id });
  targetModuleId = m.id;
});

afterEach(async () => {
  await h.teardown();
});

describe("POST /api/exchanges/:id/start-preparing —— Accepted→PrivatePreparing", () => {
  it("请求方可推进 → 200，status=PrivatePreparing，写 audit", async () => {
    const id = await seedExchange("Accepted");
    h.setSession(ALICE);
    const res = await startPreparing(post(`/api/exchanges/${id}/start-preparing`), ctx(id));
    expect(res.status).toBe(200);

    const [row] = await h.db
      .select()
      .from(schema.exchanges)
      .where(eq(schema.exchanges.id, id));
    expect(row.status).toBe("PrivatePreparing");

    const audit = await h.db
      .select()
      .from(schema.auditLog)
      .where(eq(schema.auditLog.targetId, id));
    expect(audit.some((a) => a.action === "exchange.start-preparing")).toBe(true);
  });

  it("所有者也可推进（任一参与方）→ 200", async () => {
    const id = await seedExchange("Accepted");
    h.setSession(BOB);
    const res = await startPreparing(post(`/api/exchanges/${id}/start-preparing`), ctx(id));
    expect(res.status).toBe(200);
  });

  it("非参与方 → 403", async () => {
    const id = await seedExchange("Accepted");
    h.setSession(CAROL);
    const res = await startPreparing(post(`/api/exchanges/${id}/start-preparing`), ctx(id));
    expect(res.status).toBe(403);
  });

  it("非 Accepted 态（Requested）→ 409 非法迁移", async () => {
    const id = await seedExchange("Requested");
    h.setSession(ALICE);
    const res = await startPreparing(post(`/api/exchanges/${id}/start-preparing`), ctx(id));
    expect(res.status).toBe(409);
  });

  it("未登录 → 401", async () => {
    const id = await seedExchange("Accepted");
    h.setSession(null);
    const res = await startPreparing(post(`/api/exchanges/${id}/start-preparing`), ctx(id));
    expect(res.status).toBe(401);
  });
});

describe("mark-delivered 扩展：PrivatePreparing→Delivered", () => {
  it("PrivatePreparing 下首次标记交付 → Delivered（仅该方确认）", async () => {
    const id = await seedExchange("PrivatePreparing");
    h.setSession(ALICE);
    const res = await markDelivered(post(`/api/exchanges/${id}/mark-delivered`), ctx(id));
    expect(res.status).toBe(200);
    const [row] = await h.db
      .select()
      .from(schema.exchanges)
      .where(eq(schema.exchanges.id, id));
    expect(row.status).toBe("Delivered");
    expect(row.requesterConfirmedDelivery).toBe(true);
    expect(row.ownerConfirmedDelivery).toBe(false);
  });
});
