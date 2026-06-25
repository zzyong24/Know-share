/*
  跨域端到端集成测试（阶段17）。
  目的：不重复单域测试，而是把后端 6 域（exchange / submission / trust / account /
  admin / community + discovery）串成跨域生命周期跑，证明它们真正组合工作，且不变量
  端到端贯穿。

  覆盖四类场景：
    场景1 交换完整生命周期（exchange + account/contact + trust + audit）
    场景2 提交→审核→发布（submission + admin + discovery）
    场景3 隐私不变量端到端（INV-01/03/04）
    场景4 契约形状一致性（route handler ⇄ 前端 query hooks 期望）

  约束：只调既有 route handler / service，只用 h.db 在测试内播种，不改 src/ 与 _harness。
*/
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupHarness, schema, type Harness } from "../_harness";
import { FORBIDDEN_PUBLIC_FIELDS } from "@/server/projection";
import { eq } from "drizzle-orm";

// ── exchange 域 route handlers ──
import { GET as listExchanges, POST as createExchange } from "@/app/api/exchanges/route";
import { GET as getExchange } from "@/app/api/exchanges/[id]/route";
import { POST as acceptExchange } from "@/app/api/exchanges/[id]/accept/route";
import { POST as discloseContacts } from "@/app/api/exchanges/[id]/disclose/route";
import { POST as markDelivered } from "@/app/api/exchanges/[id]/mark-delivered/route";
// ── trust 域 ──
import { POST as postFeedback } from "@/app/api/feedback/route";
import { GET as getTrustProfile } from "@/app/api/trust-profiles/[login]/route";
import { GET as getTrustNetwork } from "@/app/api/trust-network/route";
// ── submission 域 ──
import { POST as postPrivacyScan } from "@/app/api/submissions/privacy-scan/route";
import { POST as postSubmit } from "@/app/api/submissions/[id]/submit/route";
// ── admin 域 ──
import { GET as getQueue } from "@/app/api/admin/review-queue/route";
import { POST as moderate } from "@/app/api/admin/moderate/route";
import { GET as getAudit } from "@/app/api/admin/audit/route";
// ── discovery 域 ──
import { GET as listModules } from "@/app/api/modules/route";
import { GET as getModule } from "@/app/api/modules/[id]/route";
import { GET as getManifest } from "@/app/api/modules/[id]/manifest/route";
import { GET as getModuleDetail } from "@/app/api/modules/[id]/detail/route";
// ── account 域 ──
import { GET as listNotifications } from "@/app/api/notifications/route";

let h: Harness;

const SESS = {
  alice: { login: "alice", avatarUrl: "", isAdmin: false, verified: true },
  bob: { login: "bob", avatarUrl: "", isAdmin: false, verified: true },
  carol: { login: "carol", avatarUrl: "", isAdmin: false, verified: true },
  admin: { login: "root", avatarUrl: "", isAdmin: true, verified: true },
} as const;

function getReq(path: string): Request {
  return new Request(`http://localhost${path}`);
}
function postReq(path: string, body?: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    ...(body !== undefined
      ? { body: JSON.stringify(body), headers: { "content-type": "application/json" } }
      : {}),
  });
}
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const loginParams = (login: string) => ({ params: Promise.resolve({ login }) });

/** 递归断言整个响应体无任何禁止公开字段（INV-01/03/04）。 */
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

/** 断言序列化后的响应体不含某个真实私有值（联系方式不外泄）。 */
function expectNoLeak(body: unknown, secret: string): void {
  expect(JSON.stringify(body)).not.toContain(secret);
}

interface World {
  aliceId: string;
  bobId: string;
  carolId: string;
  adminId: string;
  /** bob 拥有的已发布目标模块。 */
  targetModuleId: string;
  /** alice 拥有的可互惠模块。 */
  offeredModuleId: string;
}

/** 播种 4 个用户 + bob 的目标模块 + alice 的互惠模块 + 双方联系方式（默认私密）。 */
async function seedWorld(): Promise<World> {
  const db = h.db;
  const mkUser = async (
    login: string,
    opts: { verified?: boolean; admin?: boolean } = {}
  ) => {
    const [u] = await db
      .insert(schema.users)
      .values({
        githubId: `gh-${login}`,
        login,
        displayName: login,
        avatarUrl: `https://avatars.example.com/${login}.png`,
        githubVerified: opts.verified ?? true,
        isAdmin: opts.admin ?? false,
        domains: [],
      })
      .returning({ id: schema.users.id });
    return u.id;
  };
  const aliceId = await mkUser("alice");
  const bobId = await mkUser("bob");
  const carolId = await mkUser("carol");
  const adminId = await mkUser("root", { admin: true });

  const [target] = await db
    .insert(schema.knowledgeModules)
    .values({ ownerId: bobId, title: "Bob 的记忆系统模块", summary: "脱敏摘要", status: "Published", publishedAt: new Date() })
    .returning({ id: schema.knowledgeModules.id });
  const [offered] = await db
    .insert(schema.knowledgeModules)
    .values({ ownerId: aliceId, title: "Alice 的 RAG 模块", summary: "脱敏摘要", status: "Published", publishedAt: new Date() })
    .returning({ id: schema.knowledgeModules.id });

  await db.insert(schema.manifests).values([
    { moduleId: target.id, summary: "Manifest 摘要", topics: ["记忆系统"], sourceStats: { notes: 3, links: 2, files: 1, words: 1200 }, version: "v1" },
    { moduleId: offered.id, summary: "Manifest 摘要", topics: ["RAG"], sourceStats: { notes: 2, links: 1, files: 0, words: 800 }, version: "v1" },
  ]);

  // 默认私密联系方式（INV-03）。
  await db.insert(schema.contactInfo).values([
    { userId: aliceId, type: "email", value: "alice-secret@example.com", label: "邮箱" },
    { userId: bobId, type: "email", value: "bob-secret@example.com", label: "邮箱" },
  ]);

  return { aliceId, bobId, carolId, adminId, targetModuleId: target.id, offeredModuleId: offered.id };
}

beforeEach(async () => {
  h = await setupHarness({ seed: false });
}, 30000);

afterEach(async () => {
  await h.teardown();
}, 30000);

/* ════════════════════════════════════════════════════════════════════
   场景1：交换完整生命周期（exchange + account/contact + trust + audit）
   链路：create(API-019) → accept(API-020) → 状态机推进 → disclose(API-016)
   → mark-delivered ×2 → Completed(INV-06) → feedback(API-013) → 被评方信任
   分重算上升(W-3/INV-10) → 全程关键动作写 audit_log(INV-11)。
   ════════════════════════════════════════════════════════════════════ */
describe("场景1 交换完整生命周期（跨 exchange+account+trust+audit）", () => {
  it("互惠交换：create→accept→disclose→双方确认 Completed→feedback→信任上升，audit 贯穿", async () => {
    const w = await seedWorld();

    // ── API-019 alice 创建互惠交换请求（写 consent + audit）──
    h.setSession(SESS.alice);
    const createRes = await createExchange(
      postReq("/api/exchanges", {
        targetModuleId: w.targetModuleId,
        offeredModuleId: w.offeredModuleId,
        consent: { actionType: "exchange" },
      })
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.status).toBe("Requested");
    const publicRef: string = created.exchangeId;
    expect(publicRef).toMatch(/^EX-/);

    // 取内部 id（后续直接 DB 推进 Accepted→Delivered 用，路由无 prepare/deliver 端点）。
    const [exRow] = await h.db
      .select()
      .from(schema.exchanges)
      .where(eq(schema.exchanges.publicRef, publicRef));
    const exId = exRow.id;

    // consent + audit 已写（INV-08/INV-11）。
    const consentsAfterCreate = await h.db.select().from(schema.consents).where(eq(schema.consents.actionType, "exchange"));
    expect(consentsAfterCreate.length).toBe(1);

    // ── INV-03 守卫：未 Accepted（Requested）就披露 → 403 ──
    const earlyDisclose = await discloseContacts(
      postReq(`/api/exchanges/${exId}/disclose`, { types: ["email"], consent: true }),
      params(exId)
    );
    expect(earlyDisclose.status).toBe(403);

    // ── 非法迁移：尚未 accept 直接 mark-delivered（Requested 非 Delivered）不应 Completed ──
    // mark-delivered 只在 Delivered 态推进；Requested 态确认不会 Completed（INV-06 守卫）。
    h.setSession(SESS.alice);
    const premature = await markDelivered(postReq(`/api/exchanges/${exId}/mark-delivered`), params(exId));
    expect(premature.status).toBe(200);
    const [stillRequested] = await h.db.select().from(schema.exchanges).where(eq(schema.exchanges.id, exId));
    expect(stillRequested.status).toBe("Requested"); // 未 Completed

    // ── API-020 bob（目标所有者）接受 → Accepted ──
    h.setSession(SESS.bob);
    const acceptRes = await acceptExchange(postReq(`/api/exchanges/${exId}/accept`), params(exId));
    expect(acceptRes.status).toBe(200);
    const [accepted] = await h.db.select().from(schema.exchanges).where(eq(schema.exchanges.id, exId));
    expect(accepted.status).toBe("Accepted");

    // ── INV-03 + INV-08：alice 披露邮箱（带 consent）→ 写 contact_disclosures 快照 + audit ──
    h.setSession(SESS.alice);
    const noConsent = await discloseContacts(
      postReq(`/api/exchanges/${exId}/disclose`, { types: ["email"], consent: false }),
      params(exId)
    );
    expect(noConsent.status).toBe(422); // 缺 consent → 422

    const discloseRes = await discloseContacts(
      postReq(`/api/exchanges/${exId}/disclose`, { types: ["email"], consent: true }),
      params(exId)
    );
    expect(discloseRes.status).toBe(200);
    const disc = await h.db.select().from(schema.contactDisclosures).where(eq(schema.contactDisclosures.exchangeId, exId));
    expect(disc.length).toBe(1);
    expect(disc[0].discloserId).toBe(w.aliceId);
    expect(disc[0].recipientId).toBe(w.bobId); // 仅披露给该次对方（INV-03）

    // bob（对方）能在详情里看到 alice 的披露快照真实值；carol（旁观者）看不到。
    h.setSession(SESS.bob);
    const bobDetail = await (await getExchange(getReq(`/api/exchanges/${exId}`), params(exId))).json();
    expect(bobDetail.disclosure.peerDisclosure.contacts[0].value).toBe("alice-secret@example.com");
    h.setSession(SESS.carol);
    const carolDetail = await (await getExchange(getReq(`/api/exchanges/${exId}`), params(exId))).json();
    expect(carolDetail.viewerRole).toBe("spectator");
    expect(carolDetail.disclosure.myContacts).toEqual([]);
    expectNoLeak(carolDetail, "alice-secret@example.com"); // 旁观者零泄漏

    // ── 推进至 Delivered（路由无该端点，按既有单域测试约定用 h.db 直推；合法链路）──
    await h.db.update(schema.exchanges).set({ status: "Delivered" }).where(eq(schema.exchanges.id, exId));

    // ── INV-06：单方确认不 Completed，双方各确认后才 Completed ──
    h.setSession(SESS.alice);
    await markDelivered(postReq(`/api/exchanges/${exId}/mark-delivered`), params(exId));
    const [oneSide] = await h.db.select().from(schema.exchanges).where(eq(schema.exchanges.id, exId));
    expect(oneSide.status).toBe("Delivered"); // 仅一方确认
    h.setSession(SESS.bob);
    await markDelivered(postReq(`/api/exchanges/${exId}/mark-delivered`), params(exId));
    const [bothSide] = await h.db.select().from(schema.exchanges).where(eq(schema.exchanges.id, exId));
    expect(bothSide.status).toBe("Completed"); // 双方确认 → Completed（INV-06）

    // ── W-3 / INV-10：bob 对 alice 提交反馈 → 被评方（alice）信任分重算 ──
    h.setSession(SESS.bob);
    const fbRes = await postFeedback(
      postReq("/api/feedback", {
        exchangeId: publicRef,
        scores: { usefulness: 5, clarity: 5, accuracy: 5, responsiveness: 5, reciprocity: 5 },
        publicComment: "非常清晰",
      })
    );
    expect(fbRes.status).toBe(200);
    expect((await fbRes.json()).ok).toBe(true);

    // 被评方 = 请求者 alice（bob 是 owner，提交方）。其信任档案被物化且分>0。
    const [aliceTrust] = await h.db.select().from(schema.trustProfiles).where(eq(schema.trustProfiles.userId, w.aliceId));
    expect(aliceTrust).toBeTruthy();
    expect(Number(aliceTrust.score)).toBeGreaterThan(0);

    // ── INV-11：全程关键动作均写 audit_log（create/accept/disclose/mark-delivered/feedback）──
    const audits = await h.db.select().from(schema.auditLog);
    const actions = audits.map((a) => a.action);
    for (const a of ["exchange.create", "exchange.accept", "exchange.disclose", "exchange.mark-delivered", "feedback.submitted"]) {
      expect(actions).toContain(a);
    }

    // ── 跨域读回：公开台账出现该交换且脱敏零私有，状态 Completed ──
    h.setSession(null);
    const ledger = await (await listExchanges(getReq("/api/exchanges"))).json();
    expect(Array.isArray(ledger.items)).toBe(true);
    expect(ledger.total).toBe(ledger.items.length);
    const ledgerRow = ledger.items.find((r: { exchangeId: string }) => r.exchangeId === publicRef);
    expect(ledgerRow).toBeTruthy();
    expect(ledgerRow.status).toBe("Completed");
    expect(ledgerRow.direction).toBe("reciprocal");
    expectNoForbidden(ledger);
    expectNoLeak(ledger, "alice-secret@example.com");
    expectNoLeak(ledger, "bob-secret@example.com");
  });

  it("非法状态迁移被拒：未接受的交换 accept 已 Completed 项 → 409", async () => {
    const w = await seedWorld();
    // 直接种一个 Completed 交换。
    const [ex] = await h.db
      .insert(schema.exchanges)
      .values({ publicRef: "EX-2024-5555", requesterId: w.aliceId, targetModuleId: w.targetModuleId, status: "Completed" })
      .returning({ id: schema.exchanges.id });
    h.setSession(SESS.bob);
    const res = await acceptExchange(postReq(`/api/exchanges/${ex.id}/accept`), params(ex.id));
    expect(res.status).toBe(409); // illegal-transition Completed→Accepted（FLOW-003/HARD-02）
  });

  it("W-3：被评方信任分随反馈上升（重算前后对比，单调不降）", async () => {
    const w = await seedWorld();
    // 种一个 WaitingForFeedback 交换（alice 请求 bob 的模块）。
    const [ex] = await h.db
      .insert(schema.exchanges)
      .values({ publicRef: "EX-2024-6001", requesterId: w.aliceId, targetModuleId: w.targetModuleId, status: "WaitingForFeedback" })
      .returning({ id: schema.exchanges.id });
    void ex;

    // 被评方 = bob（owner），由 alice（requester）评。先读基线（可能无 profile）。
    const before = (await h.db.select({ score: schema.trustProfiles.score }).from(schema.trustProfiles).where(eq(schema.trustProfiles.userId, w.bobId)))[0]?.score;

    h.setSession(SESS.alice);
    const res = await postFeedback(
      postReq("/api/feedback", {
        exchangeId: "EX-2024-6001",
        scores: { usefulness: 5, clarity: 5, accuracy: 5, responsiveness: 5, reciprocity: 5 },
      })
    );
    expect(res.status).toBe(200);

    const after = (await h.db.select({ score: schema.trustProfiles.score }).from(schema.trustProfiles).where(eq(schema.trustProfiles.userId, w.bobId)))[0]?.score;
    expect(Number(after)).toBeGreaterThan(0);
    if (before != null) expect(Number(after)).toBeGreaterThanOrEqual(Number(before));

    // 反馈可经 trust-profiles 端点读回（跨 trust 域聚合）。
    const profile = await (await getTrustProfile(getReq("/api/trust-profiles/bob"), loginParams("bob"))).json();
    expect(profile.login).toBe("bob");
    expect(profile.maxScore).toBe(1000);
    expectNoForbidden(profile);
  });
});

/* ════════════════════════════════════════════════════════════════════
   场景2：提交→审核→发布（submission + admin + discovery）
   privacy-scan(pass) → submit(API-013) → review_item pending → admin approve
   (API-047) → module Published → 出现在 discovery /api/modules。
   反例：privacy-scan block 的提交无法 approve（INV-02→409）。
   ════════════════════════════════════════════════════════════════════ */
describe("场景2 提交→审核→发布（跨 submission+admin+discovery）", () => {
  /** 种一个待提交草稿（含 Draft 模块 + manifest，便于 approve 时发布）。 */
  async function seedDraftWithModule(
    submitterId: string,
    title: string
  ): Promise<{ submissionId: string; moduleId: string }> {
    const db = h.db;
    const [mod] = await db
      .insert(schema.knowledgeModules)
      .values({ ownerId: submitterId, title, summary: "脱敏摘要", status: "Draft" })
      .returning({ id: schema.knowledgeModules.id });
    const [man] = await db
      .insert(schema.manifests)
      .values({ moduleId: mod.id, summary: "Manifest 摘要", topics: ["agent"], sourceStats: { notes: 3, links: 2, files: 1, words: 1200 }, version: "v1" })
      .returning({ id: schema.manifests.id });
    const [sub] = await db
      .insert(schema.submissions)
      .values({ moduleId: mod.id, manifestId: man.id, submitterId, status: "Draft", step: 4 })
      .returning({ id: schema.submissions.id });
    return { submissionId: sub.id, moduleId: mod.id };
  }

  const cleanManifest = {
    id: "clean-module",
    title: "干净模块",
    summary: "脱敏摘要，无原始内容。",
    topics: ["agent"],
    source_types: ["personal notes"],
    sensitivity: "low",
    redaction_notes: "已脱敏。",
    updated_at: "2026-06-22",
    version: "1.0.0",
  };

  it("pass 提交全链路：privacy-scan→submit→pending→admin approve→Published→discovery 可见", async () => {
    const w = await seedWorld();
    const { submissionId, moduleId } = await seedDraftWithModule(w.aliceId, "Alice 待发布模块");

    // ── API-012 隐私门扫描（pass）：写 privacy_scans ──
    h.setSession(SESS.alice);
    const scanRes = await postPrivacyScan(
      postReq("/api/submissions/privacy-scan", { submissionId, manifest: cleanManifest })
    );
    expect(scanRes.status).toBe(200);
    expect((await scanRes.json()).overallStatus).toBe("pass");

    // ── API-013 提交进评审：生成 review_item(pending) + consent + audit ──
    const submitRes = await postSubmit(
      postReq(`/api/submissions/${submissionId}/submit`, { consent: { actionType: "submit", scope: submissionId } }),
      params(submissionId)
    );
    expect(submitRes.status).toBe(200);
    const reviews = await h.db.select().from(schema.reviewItems).where(eq(schema.reviewItems.submissionId, submissionId));
    expect(reviews.length).toBe(1);
    expect(reviews[0].status).toBe("pending");
    expect(reviews[0].gate).toBe("pass");
    const reviewItemId = reviews[0].id;

    // 模块此刻尚未发布：状态仍 Draft（注：discovery 列表未按 status 过滤，见返回报告“域间缺口”，
    // 故这里断言权威状态，而非列表成员关系）。
    const [beforeMod] = await h.db.select().from(schema.knowledgeModules).where(eq(schema.knowledgeModules.id, moduleId));
    expect(beforeMod.status).toBe("Draft");
    // discovery 详情端点的 lifecycleState 应为 Draft（按 status 派生）。
    h.setSession(null);
    const beforeDetail = await (await getModuleDetail(getReq(`/api/modules/${moduleId}/detail`), params(moduleId))).json();
    expect(beforeDetail.privacy?.lifecycleState ?? beforeDetail.lifecycleState).not.toBe("Published");

    // ── 管理员队列可见该 pending 项（跨 admin 域）──
    h.setSession(SESS.admin);
    const queue = await (await getQueue(getReq("/api/admin/review-queue"))).json();
    expect(queue.items.some((r: { kind: string; gate?: string }) => r.kind === "submission" && r.gate === "pass")).toBe(true);

    // ── API-047 approve → module Published（admin 域写动作连锁 discovery 域可读）──
    const approveRes = await moderate(postReq("/api/admin/moderate", { reviewItemId, action: "approve" }));
    expect(approveRes.status).toBe(200);
    const [mod] = await h.db.select().from(schema.knowledgeModules).where(eq(schema.knowledgeModules.id, moduleId));
    expect(mod.status).toBe("Published");
    expect(mod.publishedAt).toBeTruthy();

    // ── discovery 域：已发布模块出现在 /api/modules，且零私有 ──
    h.setSession(null);
    const afterList = await (await listModules(getReq("/api/modules"))).json();
    const found = afterList.items.find((m: { id: string }) => m.id === moduleId);
    expect(found).toBeTruthy();
    expect(found.ownerLogin).toBe("alice");
    expectNoForbidden(afterList);

    // 详情/manifest 也可读且脱敏。
    const detail = await (await getModuleDetail(getReq(`/api/modules/${moduleId}/detail`), params(moduleId))).json();
    expect(detail.module).toBeTruthy();
    expectNoForbidden(detail);

    // ── INV-11：审计可读出 approve 动作（admin audit 端点）──
    h.setSession(SESS.admin);
    const audit = await (await getAudit(getReq("/api/admin/audit"))).json();
    expect(audit.items.some((e: { action: string }) => e.action.includes("approve"))).toBe(true);
    expectNoForbidden(audit);
  });

  it("INV-02 反例：privacy-scan block 的提交无法 approve 发布（submit→409；强行 review 项 approve→409）", async () => {
    const w = await seedWorld();
    const { submissionId, moduleId } = await seedDraftWithModule(w.bobId, "含敏感词模块");

    // 隐私门扫描命中关键字 → block。
    h.setSession(SESS.bob);
    const scanRes = await postPrivacyScan(
      postReq("/api/submissions/privacy-scan", { submissionId, manifest: { ...cleanManifest, summary: "示例 api_key: sk-live-deadbeef1234 的描述" } })
    );
    expect((await scanRes.json()).overallStatus).toBe("block");

    // INV-02：block 提交 → 409，不生成 review_item。
    const submitRes = await postSubmit(
      postReq(`/api/submissions/${submissionId}/submit`, { consent: { actionType: "submit", scope: submissionId } }),
      params(submissionId)
    );
    expect(submitRes.status).toBe(409);
    expect((await h.db.select().from(schema.reviewItems).where(eq(schema.reviewItems.submissionId, submissionId))).length).toBe(0);

    // 即便强行造一个 block 态 review_item（绕过提交门），admin approve 也 → 409（INV-02 第二道闸）。
    const [ri] = await h.db
      .insert(schema.reviewItems)
      .values({ kind: "submission", submissionId, gate: "block", riskLevel: "high", status: "pending" })
      .returning({ id: schema.reviewItems.id });
    h.setSession(SESS.admin);
    const approveRes = await moderate(postReq("/api/admin/moderate", { reviewItemId: ri.id, action: "approve" }));
    expect(approveRes.status).toBe(409);
    expect((await approveRes.json()).error).toBe("block-cannot-approve");

    // 模块始终未发布：权威状态停留在 Draft（INV-02 双闸均未放行）。
    const [mod] = await h.db.select().from(schema.knowledgeModules).where(eq(schema.knowledgeModules.id, moduleId));
    expect(mod.status).toBe("Draft");
    // discovery 详情 lifecycleState 仍非 Published。
    h.setSession(null);
    const detail = await (await getModuleDetail(getReq(`/api/modules/${moduleId}/detail`), params(moduleId))).json();
    expect(detail.lifecycleState).toBe("Draft");
  });
});

/* ════════════════════════════════════════════════════════════════════
   场景3：隐私不变量端到端（INV-01/03/04）
   公开输出（discovery 列表/详情/manifest、交换台账、信任档案/网络、提交扫描）
   全程经 expectNoForbidden 零私有；联系方式默认私密、仅披露后对该次对方可见。
   ════════════════════════════════════════════════════════════════════ */
describe("场景3 隐私不变量端到端（INV-01/03/04）", () => {
  it("所有公开读端点零私有字段；交换台账/信任网络不外泄联系方式", async () => {
    const w = await seedWorld();
    // 制造一笔含披露的 Accepted 交换：联系方式真实值进了 contact_disclosures。
    const [ex] = await h.db
      .insert(schema.exchanges)
      .values({ publicRef: "EX-2024-3001", requesterId: w.aliceId, targetModuleId: w.targetModuleId, status: "Accepted" })
      .returning({ id: schema.exchanges.id });
    h.setSession(SESS.alice);
    await discloseContacts(postReq(`/api/exchanges/${ex.id}/disclose`, { types: ["email"], consent: true }), params(ex.id));

    const SECRETS = ["alice-secret@example.com", "bob-secret@example.com"];

    // 匿名读各公开端点：均零私有 + 零联系方式泄漏。
    h.setSession(null);
    const endpoints: Array<[string, Promise<Response>]> = [
      ["modules-list", listModules(getReq("/api/modules"))],
      ["module-card", getModule(getReq(`/api/modules/${w.targetModuleId}`), params(w.targetModuleId))],
      ["module-manifest", getManifest(getReq(`/api/modules/${w.targetModuleId}/manifest`), params(w.targetModuleId))],
      ["module-detail", getModuleDetail(getReq(`/api/modules/${w.targetModuleId}/detail`), params(w.targetModuleId))],
      ["exchange-ledger", listExchanges(getReq("/api/exchanges"))],
      ["exchange-detail-spectator", getExchange(getReq(`/api/exchanges/${ex.id}`), params(ex.id))],
      ["trust-network", getTrustNetwork(getReq("/api/trust-network"))],
    ];
    for (const [name, p] of endpoints) {
      const res = await p;
      expect(res.status, name).toBe(200);
      const body = await res.json();
      expectNoForbidden(body);
      for (const s of SECRETS) expectNoLeak(body, s);
    }

    // manifest 不含 contact 键（INV-03/ASM-024）。
    const man = await (await getManifest(getReq(`/api/modules/${w.targetModuleId}/manifest`), params(w.targetModuleId))).json();
    expect(man).not.toHaveProperty("contact");

    // bob 的信任档案（已发布模块的 owner）公开零私有。
    const profile = await (await getTrustProfile(getReq("/api/trust-profiles/bob"), loginParams("bob"))).json();
    expectNoForbidden(profile);
    for (const s of SECRETS) expectNoLeak(profile, s);
  });

  it("INV-03：联系方式仅披露后对该次对方可见，旁观者与未披露方均不可见", async () => {
    const w = await seedWorld();
    const [ex] = await h.db
      .insert(schema.exchanges)
      .values({ publicRef: "EX-2024-3002", requesterId: w.aliceId, targetModuleId: w.targetModuleId, status: "Accepted" })
      .returning({ id: schema.exchanges.id });

    // 披露前：连参与方 bob 的详情里也看不到 alice 的真实邮箱（alice 尚未披露）。
    h.setSession(SESS.bob);
    const preBob = await (await getExchange(getReq(`/api/exchanges/${ex.id}`), params(ex.id))).json();
    expect(preBob.disclosure.peerDisclosure).toBeFalsy();
    expectNoLeak(preBob, "alice-secret@example.com");

    // alice 披露后：仅 bob（该次对方）可见真实值；carol（旁观者）不可见。
    h.setSession(SESS.alice);
    await discloseContacts(postReq(`/api/exchanges/${ex.id}/disclose`, { types: ["email"], consent: true }), params(ex.id));

    h.setSession(SESS.bob);
    const postBob = await (await getExchange(getReq(`/api/exchanges/${ex.id}`), params(ex.id))).json();
    expect(postBob.disclosure.peerDisclosure.contacts[0].value).toBe("alice-secret@example.com");

    h.setSession(SESS.carol);
    const postCarol = await (await getExchange(getReq(`/api/exchanges/${ex.id}`), params(ex.id))).json();
    expect(postCarol.disclosure.myContacts).toEqual([]);
    expect(postCarol.disclosure.peerDisclosure).toBeFalsy();
    expectNoLeak(postCarol, "alice-secret@example.com");
  });
});

/* ════════════════════════════════════════════════════════════════════
   场景4：契约形状一致性
   抽样多个端点，断言 route handler 返回形状与前端 query hooks 期望一致。
   （exchanges {items,total,topics}、notifications {items,unreadCount}、
   trust-network {overview,contributors,featured,total}、trust-profiles 聚合、
   modules {items,total}）。
   ════════════════════════════════════════════════════════════════════ */
describe("场景4 契约形状一致性（route handler ⇄ 前端 query hooks）", () => {
  it("GET /api/exchanges → { items, total, topics }（ExchangeLedgerRow 形状）", async () => {
    const w = await seedWorld();
    await h.db.insert(schema.exchanges).values({ publicRef: "EX-2024-4001", requesterId: w.aliceId, targetModuleId: w.targetModuleId, offeredModuleId: w.offeredModuleId, status: "Accepted" });
    h.setSession(null);
    const body = await (await listExchanges(getReq("/api/exchanges"))).json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(typeof body.total).toBe("number");
    expect(Array.isArray(body.topics)).toBe(true);
    expect(body.total).toBe(body.items.length);
    const row = body.items[0];
    for (const k of ["exchangeId", "requester", "target", "direction", "targetModuleName", "topics", "status", "createdAt", "updatedAt"]) {
      expect(row, `row.${k}`).toHaveProperty(k);
    }
    expect(["reciprocal", "oneway"]).toContain(row.direction);
  });

  it("GET /api/notifications → { items, unreadCount }", async () => {
    const w = await seedWorld();
    // 直接种一条通知给 alice（account 域形状）。
    await h.db.insert(schema.notifications).values({
      userId: w.aliceId,
      type: "exchange",
      title: "新交换请求",
      body: "你有一条新的交换请求",
      read: false,
    });
    h.setSession(SESS.alice);
    const res = await listNotifications(getReq("/api/notifications"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(typeof body.unreadCount).toBe("number");
    expect(body.unreadCount).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/trust-network → { overview, contributors, featured, total }（NetworkContributor 形状）", async () => {
    await seedWorld();
    const res = await getTrustNetwork(getReq("/api/trust-network"));
    expect(res.status).toBe(200);
    const body = await res.json();
    for (const k of ["overview", "contributors", "featured", "total"]) {
      expect(body).toHaveProperty(k);
    }
    expect(Array.isArray(body.contributors)).toBe(true);
    expect(body.total).toBe(body.contributors.length);
    if (body.contributors.length > 0) {
      const c = body.contributors[0];
      for (const k of ["login", "level", "score", "maxScore"]) expect(c).toHaveProperty(k);
      expect(c.maxScore).toBe(1000);
    }
  });

  it("GET /api/trust-profiles/:login → 聚合形状（TrustProfileAggregate）", async () => {
    await seedWorld();
    const res = await getTrustProfile(getReq("/api/trust-profiles/bob"), loginParams("bob"));
    expect(res.status).toBe(200);
    const p = await res.json();
    expect(p.login).toBe("bob");
    expect(p.maxScore).toBe(1000);
    expect(typeof p.score).toBe("number");
    expect(["high", "medium", "low", "new"]).toContain(p.level);
    for (const k of ["dimensions", "trend", "badges", "feedbackAverages", "publishedModules"]) {
      expect(Array.isArray(p[k]), `p.${k} is array`).toBe(true);
    }
  });

  it("GET /api/modules → { items, total }（ModuleCard 形状）", async () => {
    await seedWorld();
    h.setSession(null);
    const body = await (await listModules(getReq("/api/modules"))).json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.total).toBe(body.items.length);
    const m = body.items[0];
    for (const k of ["id", "title", "summary", "topics", "trustLevel", "ownerLogin"]) {
      expect(m, `module.${k}`).toHaveProperty(k);
    }
  });
});
