/*
  交换域端点契约 + 不变量测试（TDD：先红后绿）。
  覆盖 API-014~022；不变量 INV-03/05/06/08/11；TEST-003/004/005/007/011/015。

  - 公开台账脱敏（零私有内容；排除 Flagged；INV-04）。
  - 详情按调用者关系投影 + 披露门（viewerRole；INV-03）。
  - 创建/接受/拒绝/取消 状态机（合法迁移 + 非法→409；HARD-02/RISK-003/TEST-011）。
  - 披露门：未 Accepted→403、非参与方→403、缺 consent→422、成功写快照+audit（INV-03/08/TEST-003/007）。
  - 撤回披露只影响未来（ASM-013）。
  - 双方确认才 Completed（INV-06/TEST-005）。
  - 写端点限流 429（NFR-006/TEST-015）。

  域种子在测试内用 h.db 插（勿改 _harness/schema）。
*/
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupHarness,
  schema,
  type Harness,
} from "../_harness";
import { FORBIDDEN_PUBLIC_FIELDS } from "@/server/projection";
import { eq } from "drizzle-orm";

// 被测路由处理器（绿阶段实现后存在）。
import { GET as listExchanges } from "@/app/api/exchanges/route";
import { POST as createExchange } from "@/app/api/exchanges/route";
import { GET as getExchange } from "@/app/api/exchanges/[id]/route";
import { POST as acceptExchange } from "@/app/api/exchanges/[id]/accept/route";
import { POST as rejectExchange } from "@/app/api/exchanges/[id]/reject/route";
import { POST as cancelExchange } from "@/app/api/exchanges/[id]/cancel/route";
import { POST as discloseContacts } from "@/app/api/exchanges/[id]/disclose/route";
import { POST as revokeDisclosure } from "@/app/api/exchanges/[id]/revoke/route";
import { POST as markDelivered } from "@/app/api/exchanges/[id]/mark-delivered/route";

let h: Harness;

/** 测试主体的固定身份（种子在测试内插入，独立于 fixtures）。 */
let requesterId: string; // alice（请求方）
let ownerId: string; // bob（目标模块所有者）
let publishedModuleId: string; // bob 的已发布目标模块
let offeredModuleId: string; // alice 的可选自有模块

const SESS = {
  alice: { login: "alice", avatarUrl: "", isAdmin: false, verified: true },
  bob: { login: "bob", avatarUrl: "", isAdmin: false, verified: true },
  carol: { login: "carol", avatarUrl: "", isAdmin: false, verified: true },
};

function req(path: string, body?: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: body !== undefined ? "POST" : "GET",
    ...(body !== undefined
      ? { body: JSON.stringify(body), headers: { "content-type": "application/json" } }
      : {}),
  });
}

const params = (id: string) => ({ params: Promise.resolve({ id }) });

/** 递归断言不含禁止公开字段（INV-04）。 */
function expectNoForbidden(node: unknown): void {
  const visit = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(visit);
    if (n && typeof n === "object") {
      for (const [k, v] of Object.entries(n as Record<string, unknown>)) {
        expect(FORBIDDEN_PUBLIC_FIELDS).not.toContain(k);
        visit(v);
      }
    }
  };
  visit(node);
}

/** 在测试库插入交换域种子（独立 users/modules/contact_info）。 */
async function seedDomain(): Promise<void> {
  const db = h.db;
  const [alice] = await db
    .insert(schema.users)
    .values({ githubId: "gh-alice", login: "alice", displayName: "Alice", avatarUrl: "a", githubVerified: true })
    .returning({ id: schema.users.id });
  const [bob] = await db
    .insert(schema.users)
    .values({ githubId: "gh-bob", login: "bob", displayName: "Bob", avatarUrl: "b", githubVerified: true })
    .returning({ id: schema.users.id });
  await db
    .insert(schema.users)
    .values({ githubId: "gh-carol", login: "carol", displayName: "Carol", avatarUrl: "c", githubVerified: true });
  requesterId = alice.id;
  ownerId = bob.id;

  const [target] = await db
    .insert(schema.knowledgeModules)
    .values({ ownerId: bob.id, title: "Bob 的目标模块", summary: "s", status: "Published" })
    .returning({ id: schema.knowledgeModules.id });
  const [offered] = await db
    .insert(schema.knowledgeModules)
    .values({ ownerId: alice.id, title: "Alice 的自有模块", summary: "s", status: "Published" })
    .returning({ id: schema.knowledgeModules.id });
  publishedModuleId = target.id;
  offeredModuleId = offered.id;

  // 双方各自的联系方式（默认私密 INV-03）。
  await db.insert(schema.contactInfo).values([
    { userId: alice.id, type: "email", value: "alice@example.com", label: "邮箱" },
    { userId: alice.id, type: "github", value: "https://github.com/alice", label: "GitHub" },
    { userId: bob.id, type: "email", value: "bob@example.com", label: "邮箱" },
  ]);
}

/** 直接插入一条指定状态的交换，返回其 id + publicRef。 */
async function seedExchange(
  status: string,
  opts: { offered?: boolean; requesterConfirmed?: boolean; ownerConfirmed?: boolean } = {}
): Promise<{ id: string; publicRef: string }> {
  const publicRef = `EX-TEST-${Math.floor(Math.random() * 1e6)}`;
  const [row] = await h.db
    .insert(schema.exchanges)
    .values({
      publicRef,
      requesterId,
      targetModuleId: publishedModuleId,
      offeredModuleId: opts.offered ? offeredModuleId : null,
      status,
      requesterConfirmedDelivery: opts.requesterConfirmed ?? false,
      ownerConfirmedDelivery: opts.ownerConfirmed ?? false,
    })
    .returning({ id: schema.exchanges.id, publicRef: schema.exchanges.publicRef });
  return row;
}

beforeEach(async () => {
  h = await setupHarness({ seed: false });
  await seedDomain();
});

afterEach(async () => {
  await h.teardown();
});

/* ── API-014 GET /api/exchanges 公开台账 ─────────────────────── */
describe("API-014 GET /api/exchanges 公开脱敏台账", () => {
  it("返回 { items, total, topics }，行脱敏零私有内容（INV-04/TEST-001）", async () => {
    h.setSession(null);
    await seedExchange("Accepted", { offered: true });
    await seedExchange("Completed");
    const res = await listExchanges(req("/api/exchanges"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(typeof body.total).toBe("number");
    expect(Array.isArray(body.topics)).toBe(true);
    expect(body.items.length).toBe(2);
    expectNoForbidden(body);
    // 行形状对齐 ExchangeLedgerRow（脱敏号 + direction 派生）。
    const row = body.items[0];
    expect(row.exchangeId).toMatch(/^EX-/);
    expect(["reciprocal", "oneway"]).toContain(row.direction);
  });

  it("排除 Flagged（FLOW-005/ASM-032）", async () => {
    h.setSession(null);
    await seedExchange("Accepted");
    await seedExchange("Flagged");
    const res = await listExchanges(req("/api/exchanges"));
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.items.every((r: { status: string }) => r.status !== "Flagged")).toBe(true);
  });

  it("direction 由 offeredModule 是否存在派生（INV-05）", async () => {
    h.setSession(null);
    await seedExchange("Accepted", { offered: true });
    await seedExchange("Accepted", { offered: false });
    const res = await listExchanges(req("/api/exchanges"));
    const body = await res.json();
    const dirs = body.items.map((r: { direction: string }) => r.direction).sort();
    expect(dirs).toEqual(["oneway", "reciprocal"]);
  });
});

/* ── API-015 GET /api/exchanges/:id 详情 ─────────────────────── */
describe("API-015 GET /api/exchanges/:id 详情（按关系投影 + 披露门）", () => {
  it("未知 id → 404", async () => {
    h.setSession(null);
    const res = await getExchange(req("/api/exchanges/nope"), params("nope"));
    expect(res.status).toBe(404);
  });

  it("匿名旁观者 viewerRole=spectator，披露区无真实联系方式（INV-03）", async () => {
    h.setSession(null);
    const { id } = await seedExchange("Accepted");
    const res = await getExchange(req(`/api/exchanges/${id}`), params(id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.viewerRole).toBe("spectator");
    expect(body.disclosure.myContacts).toEqual([]);
    expectNoForbidden(body);
  });

  it("参与方 viewerRole 正确（requester/owner）", async () => {
    const { id } = await seedExchange("Accepted");
    h.setSession(SESS.alice);
    const r1 = await getExchange(req(`/api/exchanges/${id}`), params(id));
    expect((await r1.json()).viewerRole).toBe("requester");
    h.setSession(SESS.bob);
    const r2 = await getExchange(req(`/api/exchanges/${id}`), params(id));
    expect((await r2.json()).viewerRole).toBe("owner");
  });
});

/* ── API-019 POST /api/exchanges 创建 ────────────────────────── */
describe("API-019 POST /api/exchanges 创建交换请求", () => {
  it("成功创建 → { exchangeId, status:'Requested' } 并写 audit（INV-11）", async () => {
    h.setSession(SESS.alice);
    const res = await createExchange(
      req("/api/exchanges", {
        targetModuleId: publishedModuleId,
        offeredModuleId,
        consent: { actionType: "exchange" },
      })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.exchangeId).toBeTruthy();
    expect(body.status).toBe("Requested");
    const audits = await h.db.select().from(schema.auditLog);
    expect(audits.some((a) => a.action.includes("exchange"))).toBe(true);
    const consentRows = await h.db.select().from(schema.consents);
    expect(consentRows.some((c) => c.actionType === "exchange")).toBe(true);
  });

  it("创建单向交换（无 offeredModule）成功（INV-05/DEC-009/TEST-004）", async () => {
    h.setSession(SESS.alice);
    const res = await createExchange(
      req("/api/exchanges", {
        targetModuleId: publishedModuleId,
        consent: { actionType: "exchange" },
      })
    );
    expect(res.status).toBe(201);
  });

  it("缺 Consent → 422（INV-08/TEST-007）", async () => {
    h.setSession(SESS.alice);
    const res = await createExchange(
      req("/api/exchanges", { targetModuleId: publishedModuleId })
    );
    expect(res.status).toBe(422);
  });

  it("未登录 → 401", async () => {
    h.setSession(null);
    const res = await createExchange(
      req("/api/exchanges", {
        targetModuleId: publishedModuleId,
        consent: { actionType: "exchange" },
      })
    );
    expect(res.status).toBe(401);
  });

  it("目标模块非 Published → 409", async () => {
    h.setSession(SESS.alice);
    const [draft] = await h.db
      .insert(schema.knowledgeModules)
      .values({ ownerId, title: "草稿", summary: "s", status: "Draft" })
      .returning({ id: schema.knowledgeModules.id });
    const res = await createExchange(
      req("/api/exchanges", {
        targetModuleId: draft.id,
        consent: { actionType: "exchange" },
      })
    );
    expect(res.status).toBe(409);
  });
});

/* ── API-020/021/022 状态机迁移 ──────────────────────────────── */
describe("API-020 accept / 021 reject / 022 cancel 状态机", () => {
  it("目标所有者 accept：Requested→Accepted", async () => {
    const { id } = await seedExchange("Requested");
    h.setSession(SESS.bob);
    const res = await acceptExchange(req(`/api/exchanges/${id}/accept`, {}), params(id));
    expect(res.status).toBe(200);
    const [row] = await h.db.select().from(schema.exchanges).where(eq(schema.exchanges.id, id));
    expect(row.status).toBe("Accepted");
  });

  it("非目标所有者 accept → 403", async () => {
    const { id } = await seedExchange("Requested");
    h.setSession(SESS.alice); // 请求方非所有者
    const res = await acceptExchange(req(`/api/exchanges/${id}/accept`, {}), params(id));
    expect(res.status).toBe(403);
  });

  it("非法迁移 accept（已 Completed → Accepted）→ 409（TEST-011/HARD-02）", async () => {
    const { id } = await seedExchange("Completed");
    h.setSession(SESS.bob);
    const res = await acceptExchange(req(`/api/exchanges/${id}/accept`, {}), params(id));
    expect(res.status).toBe(409);
  });

  it("reject：Requested→Rejected（仅目标所有者）", async () => {
    const { id } = await seedExchange("Requested");
    h.setSession(SESS.bob);
    const res = await rejectExchange(req(`/api/exchanges/${id}/reject`, { reason: "暂不交换" }), params(id));
    expect(res.status).toBe(200);
    const [row] = await h.db.select().from(schema.exchanges).where(eq(schema.exchanges.id, id));
    expect(row.status).toBe("Rejected");
  });

  it("cancel：Accepted→Cancelled，必填原因（参与方）", async () => {
    const { id } = await seedExchange("Accepted");
    h.setSession(SESS.alice);
    const noReason = await cancelExchange(req(`/api/exchanges/${id}/cancel`, {}), params(id));
    expect(noReason.status).toBe(400);
    const ok = await cancelExchange(req(`/api/exchanges/${id}/cancel`, { reason: "改期" }), params(id));
    expect(ok.status).toBe(200);
    const [row] = await h.db.select().from(schema.exchanges).where(eq(schema.exchanges.id, id));
    expect(row.status).toBe("Cancelled");
    expect(row.cancelReason).toBe("改期");
  });

  it("非参与方 cancel → 403", async () => {
    const { id } = await seedExchange("Accepted");
    h.setSession(SESS.carol);
    const res = await cancelExchange(req(`/api/exchanges/${id}/cancel`, { reason: "x" }), params(id));
    expect(res.status).toBe(403);
  });
});

/* ── API-016 disclose 披露门（INV-03/08；TEST-003/007）─────────── */
describe("API-016 POST /api/exchanges/:id/disclose 披露门", () => {
  it("未 Accepted（Requested）披露 → 403（INV-03/TEST-003）", async () => {
    const { id } = await seedExchange("Requested");
    h.setSession(SESS.alice);
    const res = await discloseContacts(
      req(`/api/exchanges/${id}/disclose`, { types: ["email"], consent: true }),
      params(id)
    );
    expect(res.status).toBe(403);
  });

  it("非参与方披露 → 403（TEST-003）", async () => {
    const { id } = await seedExchange("Accepted");
    h.setSession(SESS.carol);
    const res = await discloseContacts(
      req(`/api/exchanges/${id}/disclose`, { types: ["email"], consent: true }),
      params(id)
    );
    expect(res.status).toBe(403);
  });

  it("缺 consent（consent!==true）→ 422（INV-08/TEST-007）", async () => {
    const { id } = await seedExchange("Accepted");
    h.setSession(SESS.alice);
    const res = await discloseContacts(
      req(`/api/exchanges/${id}/disclose`, { types: ["email"], consent: false }),
      params(id)
    );
    expect(res.status).toBe(422);
  });

  it("Accepted+ 参与方带 consent → 写 contact_disclosures 快照 + consent + audit（INV-03/08/11/TEST-003）", async () => {
    const { id } = await seedExchange("Accepted");
    h.setSession(SESS.alice);
    const res = await discloseContacts(
      req(`/api/exchanges/${id}/disclose`, { types: ["email"], consent: true }),
      params(id)
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    // 披露区含己方快照（真实值），响应整体仍是 ExchangeDetail。
    expect(body.disclosure.myDisclosure).toBeTruthy();
    expect(body.disclosure.myDisclosure.contacts[0].value).toBe("alice@example.com");

    const disc = await h.db
      .select()
      .from(schema.contactDisclosures)
      .where(eq(schema.contactDisclosures.exchangeId, id));
    expect(disc.length).toBe(1);
    expect(disc[0].discloserId).toBe(requesterId);
    expect(disc[0].recipientId).toBe(ownerId);
    const consentRows = await h.db
      .select()
      .from(schema.consents)
      .where(eq(schema.consents.actionType, "contact"));
    expect(consentRows.length).toBe(1);
    const audits = await h.db.select().from(schema.auditLog);
    expect(audits.some((a) => a.action.includes("disclose"))).toBe(true);
  });

  it("对方在详情中可见披露快照（recipient 视角 peerDisclosure）", async () => {
    const { id } = await seedExchange("Accepted");
    h.setSession(SESS.alice);
    await discloseContacts(
      req(`/api/exchanges/${id}/disclose`, { types: ["email"], consent: true }),
      params(id)
    );
    h.setSession(SESS.bob);
    const res = await getExchange(req(`/api/exchanges/${id}`), params(id));
    const body = await res.json();
    expect(body.disclosure.peerDisclosure).toBeTruthy();
    expect(body.disclosure.peerDisclosure.contacts[0].value).toBe("alice@example.com");
  });
});

/* ── API-017 revoke 撤回（ASM-013）──────────────────────────── */
describe("API-017 POST /api/exchanges/:id/revoke 撤回披露", () => {
  it("撤回只置 revokedForFuture，已披露快照不收回（ASM-013）", async () => {
    const { id } = await seedExchange("Accepted");
    h.setSession(SESS.alice);
    await discloseContacts(
      req(`/api/exchanges/${id}/disclose`, { types: ["email"], consent: true }),
      params(id)
    );
    const res = await revokeDisclosure(req(`/api/exchanges/${id}/revoke`, {}), params(id));
    expect(res.status).toBe(200);
    const disc = await h.db
      .select()
      .from(schema.contactDisclosures)
      .where(eq(schema.contactDisclosures.exchangeId, id));
    // 快照仍在，仅标记 revokedForFuture。
    expect(disc.length).toBe(1);
    expect(disc[0].revokedForFuture).toBe(true);
  });
});

/* ── API-018 mark-delivered 双方确认（INV-06/TEST-005）────────── */
describe("API-018 POST /api/exchanges/:id/mark-delivered 双方确认", () => {
  it("单方确认不迁移至 Completed（INV-06/TEST-005）", async () => {
    const { id } = await seedExchange("Delivered");
    h.setSession(SESS.alice);
    const res = await markDelivered(req(`/api/exchanges/${id}/mark-delivered`, {}), params(id));
    expect(res.status).toBe(200);
    const [row] = await h.db.select().from(schema.exchanges).where(eq(schema.exchanges.id, id));
    expect(row.requesterConfirmedDelivery).toBe(true);
    expect(row.status).toBe("Delivered"); // 尚未 Completed
  });

  it("双方各自确认后迁移至 Completed（INV-06/TEST-005）", async () => {
    const { id } = await seedExchange("Delivered");
    h.setSession(SESS.alice);
    await markDelivered(req(`/api/exchanges/${id}/mark-delivered`, {}), params(id));
    h.setSession(SESS.bob);
    const res = await markDelivered(req(`/api/exchanges/${id}/mark-delivered`, {}), params(id));
    expect(res.status).toBe(200);
    const [row] = await h.db.select().from(schema.exchanges).where(eq(schema.exchanges.id, id));
    expect(row.ownerConfirmedDelivery).toBe(true);
    expect(row.status).toBe("Completed");
  });

  it("非参与方 mark-delivered → 403", async () => {
    const { id } = await seedExchange("Delivered");
    h.setSession(SESS.carol);
    const res = await markDelivered(req(`/api/exchanges/${id}/mark-delivered`, {}), params(id));
    expect(res.status).toBe(403);
  });
});

/* ── 限流 429（NFR-006/TEST-015）─────────────────────────────── */
describe("写端点限流（NFR-006/TEST-015）", () => {
  it("创建超限 → 429", async () => {
    h.setSession(SESS.alice);
    let last: Response | undefined;
    for (let i = 0; i < 40; i++) {
      last = await createExchange(
        req("/api/exchanges", {
          targetModuleId: publishedModuleId,
          consent: { actionType: "exchange" },
        })
      );
      if (last.status === 429) break;
    }
    expect(last!.status).toBe(429);
  });
});
