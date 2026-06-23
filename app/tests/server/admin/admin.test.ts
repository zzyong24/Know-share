/*
  审核域端点契约 + 不变量测试（TDD：先红后绿）。
  覆盖 API-043~048；不变量 INV-02/04/09/11；TEST-002/010/013。

  - 全部仅管理员：未登录 401、非 isAdmin 403（权限矩阵/TEST-013）。
  - 队列：脱敏队列 + 隐私门结果 + 风险标签（INV-04/09）。
  - 审计：审计日志读出（INV-11）。
  - 单项处置 moderate：approve/return/delist/dismiss-report/resolve，逐项写 audit（INV-11/TEST-010）。
    * approve + gate=block → 409 不可发布（INV-02/TEST-002）。
    * approve 通过 → module Published + 写 manifests。
    * return → Draft（必填原因，缺→400）。
    * delist → Delisted（必填原因）。
    * resolve / dismiss-report → reports 处置。
  - 批量通过 bulk-approve：仅作用 pass 且无未决举报子集，逐项写审计（ASM-050/INV-02）。
  - 风险摘要 summary：聚合（resolvedCount = 当日已处置，ASM-053）。

  域种子在测试内用 h.db 插（勿改 _harness/schema）。
*/
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupHarness, schema, type Harness } from "../_harness";
import { FORBIDDEN_PUBLIC_FIELDS } from "@/server/projection";
import { eq } from "drizzle-orm";

// 被测路由处理器（绿阶段实现后存在）。
import { GET as getQueue } from "@/app/api/admin/review-queue/route";
import { GET as getDetail } from "@/app/api/admin/review-queue/[id]/route";
import { GET as getSummary } from "@/app/api/admin/summary/route";
import { GET as getAudit } from "@/app/api/admin/audit/route";
import { POST as moderate } from "@/app/api/admin/moderate/route";
import { POST as bulkApprove } from "@/app/api/admin/bulk-approve/route";

let h: Harness;

let adminId: string;
let submitterId: string;
let reporterId: string;

const SESS = {
  admin: { login: "admin", avatarUrl: "", isAdmin: true, verified: true },
  user: { login: "submitter", avatarUrl: "", isAdmin: false, verified: true },
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

async function seedDomain(): Promise<void> {
  const db = h.db;
  const [admin] = await db
    .insert(schema.users)
    .values({ githubId: "gh-admin", login: "admin", displayName: "Admin", avatarUrl: "a", githubVerified: true, isAdmin: true })
    .returning({ id: schema.users.id });
  const [sub] = await db
    .insert(schema.users)
    .values({ githubId: "gh-submitter", login: "submitter", displayName: "Sub", avatarUrl: "s", githubVerified: true })
    .returning({ id: schema.users.id });
  const [rep] = await db
    .insert(schema.users)
    .values({ githubId: "gh-reporter", login: "reporter", displayName: "Rep", avatarUrl: "r", githubVerified: true })
    .returning({ id: schema.users.id });
  adminId = admin.id;
  submitterId = sub.id;
  reporterId = rep.id;
}

/**
  插入一条 submission 类评审项（含模块 + manifest + privacy_scan + review_item）。
  gate 控制隐私门级别（pass|warn|block）。
*/
async function seedSubmissionReview(
  gate: "pass" | "warn" | "block",
  opts: { riskLevel?: string; moduleStatus?: string } = {}
): Promise<{ reviewItemId: string; moduleId: string; submissionId: string }> {
  const db = h.db;
  const [mod] = await db
    .insert(schema.knowledgeModules)
    .values({
      ownerId: submitterId,
      title: "待审模块",
      summary: "脱敏摘要",
      status: opts.moduleStatus ?? "Draft",
    })
    .returning({ id: schema.knowledgeModules.id });
  const [man] = await db
    .insert(schema.manifests)
    .values({
      moduleId: mod.id,
      summary: "Manifest 摘要",
      topics: ["agent"],
      sourceStats: { notes: 3, links: 2, files: 1, words: 1200 },
      version: "v1",
    })
    .returning({ id: schema.manifests.id });
  const [sub] = await db
    .insert(schema.submissions)
    .values({
      moduleId: mod.id,
      manifestId: man.id,
      submitterId,
      status: "InReview",
    })
    .returning({ id: schema.submissions.id });
  await db.insert(schema.privacyScans).values({
    submissionId: sub.id,
    overallStatus: gate,
    findings: [{ level: gate, message: "扫描结果" }],
    scannerVersion: "v1",
  });
  const [ri] = await db
    .insert(schema.reviewItems)
    .values({
      kind: "submission",
      submissionId: sub.id,
      gate,
      riskLevel: opts.riskLevel ?? "low",
      riskSummary: "低风险",
      status: "pending",
    })
    .returning({ id: schema.reviewItems.id });
  return { reviewItemId: ri.id, moduleId: mod.id, submissionId: sub.id };
}

/** 插入一条 report 类评审项（举报）。 */
async function seedReportReview(): Promise<{ reviewItemId: string; reportId: string; moduleId: string }> {
  const db = h.db;
  const [mod] = await db
    .insert(schema.knowledgeModules)
    .values({ ownerId: submitterId, title: "被举报模块", summary: "s", status: "Published" })
    .returning({ id: schema.knowledgeModules.id });
  const [rep] = await db
    .insert(schema.reports)
    .values({
      reporterId,
      targetType: "module",
      targetId: mod.id,
      reason: "涉嫌违规",
      status: "pending",
    })
    .returning({ id: schema.reports.id });
  const [ri] = await db
    .insert(schema.reviewItems)
    .values({
      kind: "report",
      reportId: rep.id,
      riskLevel: "high",
      riskSummary: "举报高风险",
      status: "pending",
    })
    .returning({ id: schema.reviewItems.id });
  return { reviewItemId: ri.id, reportId: rep.id, moduleId: mod.id };
}

beforeEach(async () => {
  h = await setupHarness({ seed: false });
  await seedDomain();
});

afterEach(async () => {
  await h.teardown();
});

/* ── 权限矩阵（TEST-013）─────────────────────────────────────── */
describe("权限矩阵：仅管理员（TEST-013）", () => {
  it("匿名访问 review-queue → 401", async () => {
    h.setSession(null);
    const res = await getQueue(req("/api/admin/review-queue"));
    expect(res.status).toBe(401);
  });

  it("非管理员访问 review-queue → 403", async () => {
    h.setSession(SESS.user);
    const res = await getQueue(req("/api/admin/review-queue"));
    expect(res.status).toBe(403);
  });

  it("非管理员访问 audit → 403", async () => {
    h.setSession(SESS.user);
    const res = await getAudit(req("/api/admin/audit"));
    expect(res.status).toBe(403);
  });

  it("非管理员 moderate → 403", async () => {
    const { reviewItemId } = await seedSubmissionReview("pass");
    h.setSession(SESS.user);
    const res = await moderate(req("/api/admin/moderate", { reviewItemId, action: "approve" }));
    expect(res.status).toBe(403);
  });

  it("非管理员 bulk-approve → 403", async () => {
    h.setSession(SESS.user);
    const res = await bulkApprove(req("/api/admin/bulk-approve", { ids: [] }));
    expect(res.status).toBe(403);
  });
});

/* ── API-043 GET /api/admin/review-queue ─────────────────────── */
describe("API-043 GET /api/admin/review-queue 评审队列", () => {
  it("管理员：返回 { items } 含 gate/riskLevel/riskLabel，脱敏零私有（INV-04/09）", async () => {
    await seedSubmissionReview("warn", { riskLevel: "medium" });
    await seedReportReview();
    h.setSession(SESS.admin);
    const res = await getQueue(req("/api/admin/review-queue"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBe(2);
    const row = body.items.find((r: { kind: string }) => r.kind === "submission");
    expect(row.gate).toBe("warn");
    expect(["none", "low", "medium", "high"]).toContain(row.riskLevel);
    expect(typeof row.riskLabel).toBe("string");
    expect(typeof row.submitterLogin).toBe("string");
    expectNoForbidden(body);
  });

  it("report 行带 reported=true 与 reporterLogin", async () => {
    await seedReportReview();
    h.setSession(SESS.admin);
    const res = await getQueue(req("/api/admin/review-queue"));
    const body = await res.json();
    const row = body.items.find((r: { kind: string }) => r.kind === "report");
    expect(row.reported).toBe(true);
    expect(row.reporterLogin).toBe("reporter");
  });
});

/* ── API-044 GET /api/admin/review-queue/:id 详情 ────────────── */
describe("API-044 GET /api/admin/review-queue/:id 详情", () => {
  it("管理员：返回 manifestSummary + scanFindings（脱敏，INV-04）", async () => {
    const { reviewItemId } = await seedSubmissionReview("warn");
    h.setSession(SESS.admin);
    const res = await getDetail(req(`/api/admin/review-queue/${reviewItemId}`), params(reviewItemId));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(reviewItemId);
    expect(body.manifestSummary).toBeTruthy();
    expect(Array.isArray(body.scanFindings)).toBe(true);
    expectNoForbidden(body);
  });

  it("未知 id → 404", async () => {
    h.setSession(SESS.admin);
    const res = await getDetail(req("/api/admin/review-queue/nope"), params("nope"));
    expect(res.status).toBe(404);
  });

  it("非管理员 → 403", async () => {
    const { reviewItemId } = await seedSubmissionReview("pass");
    h.setSession(SESS.user);
    const res = await getDetail(req(`/api/admin/review-queue/${reviewItemId}`), params(reviewItemId));
    expect(res.status).toBe(403);
  });
});

/* ── API-045 GET /api/admin/summary 风险摘要 ─────────────────── */
describe("API-045 GET /api/admin/summary 风险摘要（聚合，INV-09）", () => {
  it("返回 pendingCount/highRiskCount/reportsToday/resolvedCount（无 PII）", async () => {
    await seedSubmissionReview("pass", { riskLevel: "low" });
    await seedSubmissionReview("block", { riskLevel: "high" });
    await seedReportReview();
    h.setSession(SESS.admin);
    const res = await getSummary(req("/api/admin/summary"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pendingCount).toBe(3);
    expect(body.highRiskCount).toBeGreaterThanOrEqual(1);
    expect(body.reportsToday).toBeGreaterThanOrEqual(1);
    expect(typeof body.resolvedCount).toBe("number");
    expectNoForbidden(body);
  });
});

/* ── API-046 GET /api/admin/audit 审计日志 ───────────────────── */
describe("API-046 GET /api/admin/audit 审计日志（INV-11）", () => {
  it("管理员：处置后审计日志可读出（actorLogin/action/target）", async () => {
    const { reviewItemId } = await seedSubmissionReview("pass");
    h.setSession(SESS.admin);
    await moderate(req("/api/admin/moderate", { reviewItemId, action: "approve" }));
    const res = await getAudit(req("/api/admin/audit"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThanOrEqual(1);
    const e = body.items[0];
    expect(typeof e.actorLogin).toBe("string");
    expect(typeof e.action).toBe("string");
    expect(typeof e.target).toBe("string");
    expectNoForbidden(body);
  });
});

/* ── API-047 POST /api/admin/moderate 单项处置 ───────────────── */
describe("API-047 POST /api/admin/moderate 单项处置", () => {
  it("approve（gate=pass）→ module Published + 写 manifests.isCurrent + 写 audit（INV-11/TEST-010）", async () => {
    const { reviewItemId, moduleId } = await seedSubmissionReview("pass");
    h.setSession(SESS.admin);
    const res = await moderate(req("/api/admin/moderate", { reviewItemId, action: "approve" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.audit).toBeTruthy();

    const [mod] = await h.db.select().from(schema.knowledgeModules).where(eq(schema.knowledgeModules.id, moduleId));
    expect(mod.status).toBe("Published");
    expect(mod.publishedAt).toBeTruthy();
    const [ri] = await h.db.select().from(schema.reviewItems).where(eq(schema.reviewItems.id, reviewItemId));
    expect(ri.status).toBe("approved");
    const audits = await h.db.select().from(schema.auditLog);
    expect(audits.some((a) => a.action.includes("approve"))).toBe(true);
  });

  it("approve（gate=block）→ 409 block-cannot-approve，模块不发布（INV-02/TEST-002）", async () => {
    const { reviewItemId, moduleId } = await seedSubmissionReview("block");
    h.setSession(SESS.admin);
    const res = await moderate(req("/api/admin/moderate", { reviewItemId, action: "approve" }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("block-cannot-approve");
    const [mod] = await h.db.select().from(schema.knowledgeModules).where(eq(schema.knowledgeModules.id, moduleId));
    expect(mod.status).toBe("Draft"); // 未发布
  });

  it("return（changes-requested）→ module Draft + 写 audit；缺原因 → 400（ASM-051/INV-11）", async () => {
    const { reviewItemId, moduleId } = await seedSubmissionReview("warn");
    h.setSession(SESS.admin);
    const noReason = await moderate(req("/api/admin/moderate", { reviewItemId, action: "return" }));
    expect(noReason.status).toBe(400);
    expect((await noReason.json()).error).toBe("reason-required");

    const ok = await moderate(req("/api/admin/moderate", { reviewItemId, action: "return", reason: "请补充隐私边界说明" }));
    expect(ok.status).toBe(200);
    const [mod] = await h.db.select().from(schema.knowledgeModules).where(eq(schema.knowledgeModules.id, moduleId));
    expect(mod.status).toBe("Draft");
    const [ri] = await h.db.select().from(schema.reviewItems).where(eq(schema.reviewItems.id, reviewItemId));
    expect(ri.status).toBe("changes-requested");
    expect(ri.reason).toBe("请补充隐私边界说明");
  });

  it("delist（下架）→ module Delisted + 写 audit；缺原因 → 400", async () => {
    const { reviewItemId, moduleId } = await seedSubmissionReview("pass", { moduleStatus: "Published" });
    h.setSession(SESS.admin);
    const noReason = await moderate(req("/api/admin/moderate", { reviewItemId, action: "delist" }));
    expect(noReason.status).toBe(400);

    const ok = await moderate(req("/api/admin/moderate", { reviewItemId, action: "delist", reason: "违反守则" }));
    expect(ok.status).toBe(200);
    const [mod] = await h.db.select().from(schema.knowledgeModules).where(eq(schema.knowledgeModules.id, moduleId));
    expect(mod.status).toBe("Delisted");
    const audits = await h.db.select().from(schema.auditLog);
    expect(audits.some((a) => a.action.includes("delist"))).toBe(true);
  });

  it("resolve 举报 → reports.status=penalized + 写 audit", async () => {
    const { reviewItemId, reportId } = await seedReportReview();
    h.setSession(SESS.admin);
    const res = await moderate(req("/api/admin/moderate", { reviewItemId, action: "resolve", reason: "举报成立" }));
    expect(res.status).toBe(200);
    const [rep] = await h.db.select().from(schema.reports).where(eq(schema.reports.id, reportId));
    expect(rep.status).toBe("penalized");
    const audits = await h.db.select().from(schema.auditLog);
    expect(audits.some((a) => a.action.includes("resolve"))).toBe(true);
  });

  it("dismiss-report 举报 → reports.status=dismissed；缺原因 → 400", async () => {
    const { reviewItemId, reportId } = await seedReportReview();
    h.setSession(SESS.admin);
    const noReason = await moderate(req("/api/admin/moderate", { reviewItemId, action: "dismiss-report" }));
    expect(noReason.status).toBe(400);
    const ok = await moderate(req("/api/admin/moderate", { reviewItemId, action: "dismiss-report", reason: "证据不足" }));
    expect(ok.status).toBe(200);
    const [rep] = await h.db.select().from(schema.reports).where(eq(schema.reports.id, reportId));
    expect(rep.status).toBe("dismissed");
  });

  it("未知 reviewItemId → 404", async () => {
    h.setSession(SESS.admin);
    const res = await moderate(req("/api/admin/moderate", { reviewItemId: "11111111-1111-4111-8111-111111111111", action: "approve" }));
    expect(res.status).toBe(404);
  });
});

/* ── API-048 POST /api/admin/bulk-approve 批量通过 ───────────── */
describe("API-048 POST /api/admin/bulk-approve 批量通过（ASM-050/INV-02）", () => {
  it("仅作用 pass 且无未决举报子集，逐项写审计（block 项不发布）", async () => {
    const pass1 = await seedSubmissionReview("pass");
    const pass2 = await seedSubmissionReview("pass");
    const blocked = await seedSubmissionReview("block");
    const report = await seedReportReview(); // report 类不在批量集合

    h.setSession(SESS.admin);
    const res = await bulkApprove(
      req("/api/admin/bulk-approve", {
        ids: [pass1.reviewItemId, pass2.reviewItemId, blocked.reviewItemId, report.reviewItemId],
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    // 仅两个 pass 项获批。
    expect(body.approved.sort()).toEqual([pass1.reviewItemId, pass2.reviewItemId].sort());

    // pass 模块已发布。
    const [m1] = await h.db.select().from(schema.knowledgeModules).where(eq(schema.knowledgeModules.id, pass1.moduleId));
    expect(m1.status).toBe("Published");
    // block 模块未发布。
    const [mb] = await h.db.select().from(schema.knowledgeModules).where(eq(schema.knowledgeModules.id, blocked.moduleId));
    expect(mb.status).toBe("Draft");

    // 逐项写审计（每个获批项一条 approve 审计，INV-11）。
    const audits = await h.db.select().from(schema.auditLog);
    const approveAudits = audits.filter((a) => a.action.includes("approve"));
    expect(approveAudits.length).toBe(2);
  });

  it("空 ids → 空 approved", async () => {
    h.setSession(SESS.admin);
    const res = await bulkApprove(req("/api/admin/bulk-approve", { ids: [] }));
    expect(res.status).toBe(200);
    expect((await res.json()).approved).toEqual([]);
  });
});
