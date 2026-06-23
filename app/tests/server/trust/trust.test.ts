/*
  信任反馈域读写端点契约 + 工作流不变量测试（TDD：先红后绿）。
  覆盖：
  - API-023 GET /api/trust-profiles/:login（信任分/趋势/拆解四来源/徽章/反馈质量，可解释 HARD-03）
  - GET /api/trust-network（可信贡献者索引；非付费榜 DEC-007）
  - API-013 POST /api/feedback（参与方资格校验 + 触发信任重算 W-3）
  不变量：
  - INV-04 公开档案零私有（contact/原始内容/私有 URL）
  - 信任拆解四来源（exchange/feedback/github/report）可解释（HARD-03）
  - INV-10 交换参与方反馈权重 > 社交信号（TEST-009）
  - 反馈资格：非参与方 → 403；非 Completed/WaitingForFeedback → 403/409（TEST-012）
  - 重算后分值变化（W-3 反馈→信任重算）
  - 限流 → 429（NFR-006）
  - INV-11 写 audit
  - DEC-007 无付费排名字段
  满分基准 1000（ASM-037）。
*/
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupHarness, deterministicUuid, type Harness } from "../_harness";
import { schema } from "../_harness";
import { eq, and } from "drizzle-orm";
import { FORBIDDEN_PUBLIC_FIELDS } from "@/server/projection";

// 被测路由处理器（实现后存在）。
import { GET as getTrustProfile } from "@/app/api/trust-profiles/[login]/route";
import { GET as getTrustNetwork } from "@/app/api/trust-network/route";
import { POST as postFeedback } from "@/app/api/feedback/route";

let h: Harness;

// 每用例独立 harness（多数用例会写 exchanges/feedback，需隔离）。
// 并行整套运行时 pglite 重建在负载下偏慢，放宽 hook 超时避免假阴性。
beforeEach(async () => {
  h = await setupHarness();
}, 30000);

afterEach(async () => {
  await h.teardown();
}, 30000);

/** 递归断言对象不含任何禁止公开字段（INV-04）。 */
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

function getReq(path: string): Request {
  return new Request(`http://localhost${path}`);
}

function postReq(path: string, body: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
  播种一组完整的信任场景：
  - owner（zyongzhu24，已验证）拥有模块 m-agent-memory，已有一笔 Completed 交换。
  - requester（newcomer）是该交换的请求者（参与方）。
  - outsider（drive-by）非参与方。
  返回常用 id。
*/
async function seedExchange(opts?: {
  status?: string;
  ownerLogin?: string;
}): Promise<{
  ownerId: string;
  requesterId: string;
  outsiderId: string;
  moduleId: string;
  exchangeId: string;
  exchangePublicRef: string;
}> {
  const db = h.db;
  const ownerLogin = opts?.ownerLogin ?? "zyongzhu24";
  const moduleId = deterministicUuid("m-agent-memory");

  const ownerId = (
    await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.login, ownerLogin))
      .limit(1)
  )[0].id;
  const requesterId = (
    await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.login, "newcomer"))
      .limit(1)
  )[0].id;

  // outsider 需要新建（fixtures 里不存在 drive-by）。
  const [outsider] = await db
    .insert(schema.users)
    .values({
      githubId: "gh-drive-by",
      login: "drive-by",
      displayName: "drive-by",
      avatarUrl: "https://avatars.example.com/drive-by.png",
      githubVerified: false,
      domains: [],
    })
    .returning({ id: schema.users.id });

  const publicRef = "EX-2024-9001";
  const [ex] = await db
    .insert(schema.exchanges)
    .values({
      publicRef,
      requesterId,
      targetModuleId: moduleId,
      status: opts?.status ?? "WaitingForFeedback",
    })
    .returning({ id: schema.exchanges.id });

  return {
    ownerId,
    requesterId,
    outsiderId: outsider.id,
    moduleId,
    exchangeId: ex.id,
    exchangePublicRef: publicRef,
  };
}

const VALID_SCORES = {
  usefulness: 5,
  clarity: 4,
  accuracy: 5,
  responsiveness: 4,
  reciprocity: 5,
};

// ── API-023 GET /api/trust-profiles/:login ───────────────────────
describe("API-023 GET /api/trust-profiles/:login（信任档案）", () => {
  it("返回信任分/级别/趋势/拆解/徽章/反馈质量聚合（满分基准 1000，ASM-037）", async () => {
    const res = await getTrustProfile(getReq("/api/trust-profiles/zyongzhu24"), {
      params: Promise.resolve({ login: "zyongzhu24" }),
    });
    expect(res.status).toBe(200);
    const p = await res.json();
    expect(p.login).toBe("zyongzhu24");
    expect(p.maxScore).toBe(1000);
    expect(typeof p.score).toBe("number");
    expect(["high", "medium", "low", "new"]).toContain(p.level);
    expect(Array.isArray(p.dimensions)).toBe(true);
    expect(Array.isArray(p.trend)).toBe(true);
    expect(Array.isArray(p.badges)).toBe(true);
    expect(Array.isArray(p.feedbackAverages)).toBe(true);
    expect(Array.isArray(p.publishedModules)).toBe(true);
  });

  it("HARD-03：信任拆解含四类来源（exchange/feedback/github/report），且可解释", async () => {
    const res = await getTrustProfile(getReq("/api/trust-profiles/zyongzhu24"), {
      params: Promise.resolve({ login: "zyongzhu24" }),
    });
    const p = await res.json();
    const keys = p.dimensions.map((d: { key: string }) => d.key);
    for (const k of ["exchange", "feedback", "github", "report"]) {
      expect(keys).toContain(k);
    }
    // 每个维度都带可解释文字（HARD-03）。
    for (const d of p.dimensions) {
      expect(typeof d.explanation).toBe("string");
      expect(d.explanation.length).toBeGreaterThan(0);
    }
    expect(p.explanationAvailable).toBe(true);
  });

  it("INV-04：公开档案零私有（无 contact/email/phone/原始内容/私有 URL）", async () => {
    const res = await getTrustProfile(getReq("/api/trust-profiles/zyongzhu24"), {
      params: Promise.resolve({ login: "zyongzhu24" }),
    });
    const p = await res.json();
    expectNoForbidden(p);
  });

  it("未知 login → 404", async () => {
    const res = await getTrustProfile(getReq("/api/trust-profiles/nobody"), {
      params: Promise.resolve({ login: "nobody" }),
    });
    expect(res.status).toBe(404);
  });
});

// ── GET /api/trust-network ───────────────────────────────────────
describe("GET /api/trust-network（信任网络索引；DEC-007 非付费）", () => {
  it("返回 overview/contributors/featured/total 结构，贡献者带可解释信任字段", async () => {
    const res = await getTrustNetwork(getReq("/api/trust-network"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.overview)).toBe(true);
    expect(Array.isArray(body.contributors)).toBe(true);
    expect(Array.isArray(body.featured)).toBe(true);
    expect(body.total).toBe(body.contributors.length);
    expect(body.contributors.length).toBeGreaterThan(0);
    const c = body.contributors[0];
    expect(c).toHaveProperty("login");
    expect(c).toHaveProperty("level");
    expect(c).toHaveProperty("score");
    expect(c.maxScore).toBe(1000);
  });

  it("DEC-007：无付费排名字段（无 price/fee/paid/sponsored/promoted/rank...）", async () => {
    const res = await getTrustNetwork(getReq("/api/trust-network"));
    const raw = JSON.stringify(await res.json()).toLowerCase();
    for (const banned of ["price", "\"fee\"", "payment", "sponsored", "promoted", "paidrank"]) {
      expect(raw).not.toContain(banned);
    }
  });

  it("INV-04：网络索引零私有", async () => {
    const res = await getTrustNetwork(getReq("/api/trust-network"));
    expectNoForbidden(await res.json());
  });

  it("empty=true 返回空注册表", async () => {
    const res = await getTrustNetwork(getReq("/api/trust-network?empty=true"));
    const body = await res.json();
    expect(body.contributors).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("verifiedOnly=true 只返回已验证贡献者", async () => {
    const res = await getTrustNetwork(
      getReq("/api/trust-network?verifiedOnly=true")
    );
    const body = await res.json();
    expect(
      body.contributors.every((c: { verified: boolean }) => c.verified === true)
    ).toBe(true);
  });
});

// ── API-013 POST /api/feedback ───────────────────────────────────
describe("API-013 POST /api/feedback（提交反馈 + 重算 W-3）", () => {
  it("非参与方提交 → 403（资格校验 TEST-012）", async () => {
    const seed = await seedExchange();
    h.setSession({
      login: "drive-by",
      avatarUrl: "",
      isAdmin: false,
      verified: false,
    });
    const res = await postFeedback(
      postReq("/api/feedback", {
        exchangeId: seed.exchangePublicRef,
        scores: VALID_SCORES,
        publicComment: "很有帮助",
      })
    );
    expect(res.status).toBe(403);
  });

  it("匿名提交 → 401", async () => {
    const seed = await seedExchange();
    h.setSession(null);
    const res = await postFeedback(
      postReq("/api/feedback", {
        exchangeId: seed.exchangePublicRef,
        scores: VALID_SCORES,
      })
    );
    expect(res.status).toBe(401);
  });

  it("交换非 Completed/WaitingForFeedback → 409（TEST-012）", async () => {
    const seed = await seedExchange({ status: "Requested" });
    h.setSession({
      login: "newcomer",
      avatarUrl: "",
      isAdmin: false,
      verified: false,
    });
    const res = await postFeedback(
      postReq("/api/feedback", {
        exchangeId: seed.exchangePublicRef,
        scores: VALID_SCORES,
      })
    );
    expect(res.status).toBe(409);
  });

  it("参与方提交成功 → 200 { ok:true }，且写 ENT-010 feedback + 写 audit（INV-11）", async () => {
    const seed = await seedExchange();
    h.setSession({
      login: "newcomer",
      avatarUrl: "",
      isAdmin: false,
      verified: false,
    });
    const res = await postFeedback(
      postReq("/api/feedback", {
        exchangeId: seed.exchangePublicRef,
        scores: VALID_SCORES,
        publicComment: "非常清晰",
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    // 写了 feedback。
    const fbRows = await h.db
      .select()
      .from(schema.feedback)
      .where(eq(schema.feedback.exchangeId, seed.exchangeId));
    expect(fbRows.length).toBe(1);

    // 写了 audit（INV-11）。
    const audits = await h.db
      .select()
      .from(schema.auditLog)
      .where(eq(schema.auditLog.action, "feedback.submitted"));
    expect(audits.length).toBeGreaterThan(0);
  });

  it("W-3：提交反馈后触发信任重算，被评者信任分上升", async () => {
    const seed = await seedExchange();
    // 重算针对被评方（模块 owner = zyongzhu24）。
    h.setSession({
      login: "newcomer",
      avatarUrl: "",
      isAdmin: false,
      verified: false,
    });

    // 提交前 owner 信任分（可能尚无 profile → 视作基线）。
    const before = (
      await h.db
        .select({ score: schema.trustProfiles.score })
        .from(schema.trustProfiles)
        .where(eq(schema.trustProfiles.userId, seed.ownerId))
        .limit(1)
    )[0]?.score;

    const res = await postFeedback(
      postReq("/api/feedback", {
        exchangeId: seed.exchangePublicRef,
        scores: VALID_SCORES,
      })
    );
    expect(res.status).toBe(200);

    const after = (
      await h.db
        .select({ score: schema.trustProfiles.score })
        .from(schema.trustProfiles)
        .where(eq(schema.trustProfiles.userId, seed.ownerId))
        .limit(1)
    )[0]?.score;

    expect(after).toBeGreaterThan(0);
    if (before != null) {
      expect(after).toBeGreaterThanOrEqual(before);
    }
  });

  it("INV-10/TEST-009：参与方反馈对信任分的影响 > 同量社交信号", async () => {
    // 两个等价的已验证 owner，各拥有一个模块、各一笔 Completed 交换历史相同。
    // ownerA 收到一条参与方高分反馈；ownerB 收到等量社交认可（endorse）。
    // 重算后 ownerA 的信任分增量应严格大于 ownerB（参与方反馈权重 > 社交信号）。
    const db = h.db;

    const ids = (login: string) =>
      db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.login, login))
        .limit(1)
        .then((r) => r[0].id);

    const ownerAId = await ids("zyongzhu24"); // 已验证 owner，模块 m-agent-memory
    const ownerBId = await ids("rag-builder"); // 已验证 owner，模块 m-multimodal-rag
    const requesterId = await ids("newcomer");

    const moduleA = deterministicUuid("m-agent-memory");
    const moduleB = deterministicUuid("m-multimodal-rag");

    // 两笔等价交换。
    const [exA] = await db
      .insert(schema.exchanges)
      .values({
        publicRef: "EX-2024-7001",
        requesterId,
        targetModuleId: moduleA,
        status: "WaitingForFeedback",
      })
      .returning({ id: schema.exchanges.id });
    await db.insert(schema.exchanges).values({
      publicRef: "EX-2024-7002",
      requesterId,
      targetModuleId: moduleB,
      status: "Completed",
    });

    // ownerA：参与方高分反馈。
    h.setSession({
      login: "newcomer",
      avatarUrl: "",
      isAdmin: false,
      verified: false,
    });
    const resA = await postFeedback(
      postReq("/api/feedback", {
        exchangeId: "EX-2024-7001",
        scores: VALID_SCORES,
      })
    );
    expect(resA.status).toBe(200);

    // ownerB：等量社交信号（endorse 指向 ownerB 用户）。
    await db.insert(schema.socialSignals).values({
      actorId: requesterId,
      kind: "endorse",
      targetType: "user",
      targetId: ownerBId,
    });

    // 触发 ownerB 重算（通过读取其档案促使物化，或直接调服务）。
    const profB = await getTrustProfile(
      getReq("/api/trust-profiles/rag-builder"),
      { params: Promise.resolve({ login: "rag-builder" }) }
    );
    const bodyB = await profB.json();

    const profA = await getTrustProfile(
      getReq("/api/trust-profiles/zyongzhu24"),
      { params: Promise.resolve({ login: "zyongzhu24" }) }
    );
    const bodyA = await profA.json();

    // 参与方反馈来源的贡献 > 社交信号来源的贡献（两 owner 其他条件等价）。
    const feedbackDimA = bodyA.dimensions.find(
      (d: { key: string }) => d.key === "feedback"
    );
    expect(feedbackDimA).toBeTruthy();

    // 直接比较两 owner 总分：收到参与方反馈的 A 应高于仅有社交信号的 B。
    expect(bodyA.score).toBeGreaterThan(bodyB.score);
  });

  it("NFR-006：超过限流阈值 → 429", async () => {
    const seed = await seedExchange();
    h.setSession({
      login: "newcomer",
      avatarUrl: "",
      isAdmin: false,
      verified: false,
    });
    // 反复提交（唯一约束会在第二次后报冲突，但限流应先于业务返回 429）。
    let got429 = false;
    for (let i = 0; i < 12; i++) {
      const res = await postFeedback(
        postReq("/api/feedback", {
          exchangeId: seed.exchangePublicRef,
          scores: VALID_SCORES,
        })
      );
      if (res.status === 429) {
        got429 = true;
        break;
      }
    }
    expect(got429).toBe(true);
  });
});
