/*
  提交域（W-1：提交 → 隐私门 → 评审）契约 + 不变量测试（TDD：先红后绿）。
  覆盖 API-009/010/011/012/013，以及：
  - INV-01 平台不存原始内容（privacy-scan 拒绝原始私有值；submissions/privacy_scans 无原始内容列）
  - INV-02 block 态提交 → 409 不可绕过（TEST-002）
  - INV-08 缺 submit Consent → 422（TEST-007 类）；warn 需显式同意
  - INV-11 提交写 audit_log（TEST-010 类）
  - 提交生成 review_items（kind=submission，gate/riskLevel 来自扫描）
  - 限流（NFR-006）：超限 → 429
  - DEC-007 无经济字段
*/
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupHarness, schema, type Harness } from "../_harness";
import { eq } from "drizzle-orm";

// 被测路由处理器（实现后存在）。
import { GET as getNewDraft } from "@/app/api/submissions/draft/route";
import { GET as getDraftById } from "@/app/api/submissions/[id]/route";
import { GET as getSkills } from "@/app/api/submissions/skills/route";
import { POST as postPrivacyScan } from "@/app/api/submissions/privacy-scan/route";
import { POST as postSubmit } from "@/app/api/submissions/[id]/submit/route";

let h: Harness;

const OWNER = {
  login: "owner-one",
  avatarUrl: "https://avatars.example.com/owner-one.png",
  isAdmin: false,
  verified: true,
} as const;

const OTHER = {
  login: "other-two",
  avatarUrl: "https://avatars.example.com/other-two.png",
  isAdmin: false,
  verified: true,
} as const;

// 测试内用 h.db 插入用户/草稿种子（不依赖默认种子的身份）。
async function seedUser(login: string): Promise<string> {
  const [row] = await h.db
    .insert(schema.users)
    .values({
      githubId: `gh-${login}`,
      login,
      displayName: login,
      avatarUrl: `https://avatars.example.com/${login}.png`,
      githubVerified: true,
    })
    .returning({ id: schema.users.id });
  return row.id;
}

async function seedDraft(
  submitterId: string,
  opts: { step?: number; draftData?: unknown } = {}
): Promise<string> {
  const [row] = await h.db
    .insert(schema.submissions)
    .values({
      submitterId,
      status: "Draft",
      step: opts.step ?? 1,
      draftData: (opts.draftData ?? null) as never,
    })
    .returning({ id: schema.submissions.id });
  return row.id;
}

async function seedScan(
  submissionId: string,
  overall: "pass" | "warn" | "block"
): Promise<void> {
  await h.db.insert(schema.privacyScans).values({
    submissionId,
    overallStatus: overall,
    findings: [
      {
        ruleCategory: "long-excerpt",
        severity: overall,
        locationRef: "summary",
        suggestion: "x",
        explanation: "y",
      },
    ] as never,
    scannerVersion: "test@1",
  });
}

const sanitizedManifest = {
  id: "agent-memory-design-patterns",
  title: "Agent 记忆系统设计模式",
  summary: "脱敏摘要，无原始内容。",
  topics: ["个人 Agent", "记忆系统"],
  source_types: ["personal notes"],
  sensitivity: "medium",
  redaction_notes: "已移除姓名、私有仓库与逐字摘录。",
  updated_at: "2026-06-22",
  version: "1.0.0",
};

function req(path: string, init?: RequestInit): Request {
  return new Request(`http://localhost${path}`, init);
}

function postJson(path: string, body: unknown): Request {
  return req(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(async () => {
  // 不注入默认种子（避免身份/数据干扰），测试内用 h.db 自行播种。
  h = await setupHarness({ seed: false });
});

afterEach(async () => {
  await h.teardown();
});

// ── API-009 GET /api/submissions/draft（新建草稿，需认证写）──────────
describe("API-009 GET /api/submissions/draft", () => {
  it("匿名 → 401", async () => {
    h.setSession(null);
    const res = await getNewDraft();
    expect(res.status).toBe(401);
  });

  it("登录 → 创建 Draft（status=Draft, step=1），落库", async () => {
    await seedUser(OWNER.login);
    h.setSession(OWNER);
    const res = await getNewDraft();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("Draft");
    expect(body.step).toBe(1);
    expect(typeof body.id).toBe("string");
    // 已落库
    const rows = await h.db
      .select()
      .from(schema.submissions)
      .where(eq(schema.submissions.id, body.id));
    expect(rows.length).toBe(1);
    expect(rows[0].status).toBe("Draft");
  });
});

// ── API-010 GET /api/submissions/:id（恢复草稿，仅本人）──────────────
describe("API-010 GET /api/submissions/:id", () => {
  it("本人恢复自己的草稿", async () => {
    const uid = await seedUser(OWNER.login);
    const sid = await seedDraft(uid, { step: 2 });
    h.setSession(OWNER);
    const res = await getDraftById(req(`/api/submissions/${sid}`), {
      params: Promise.resolve({ id: sid }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(sid);
    expect(body.step).toBe(2);
  });

  it("非本人访问他人草稿 → 403（参与方本人校验）", async () => {
    const ownerId = await seedUser(OWNER.login);
    await seedUser(OTHER.login);
    const sid = await seedDraft(ownerId);
    h.setSession(OTHER);
    const res = await getDraftById(req(`/api/submissions/${sid}`), {
      params: Promise.resolve({ id: sid }),
    });
    expect(res.status).toBe(403);
  });

  it("匿名 → 401", async () => {
    const ownerId = await seedUser(OWNER.login);
    const sid = await seedDraft(ownerId);
    h.setSession(null);
    const res = await getDraftById(req(`/api/submissions/${sid}`), {
      params: Promise.resolve({ id: sid }),
    });
    expect(res.status).toBe(401);
  });

  it("未知 id → 404", async () => {
    await seedUser(OWNER.login);
    h.setSession(OWNER);
    const res = await getDraftById(req("/api/submissions/x"), {
      params: Promise.resolve({
        id: "00000000-0000-4000-8000-000000000000",
      }),
    });
    expect(res.status).toBe(404);
  });
});

// ── API-011 GET /api/submissions/skills（本机技能目录）──────────────
describe("API-011 GET /api/submissions/skills", () => {
  it("匿名 → 401", async () => {
    h.setSession(null);
    const res = await getSkills();
    expect(res.status).toBe(401);
  });

  it("登录返回本机技能目录 { items: AgentSkill[] }", async () => {
    await seedUser(OWNER.login);
    h.setSession(OWNER);
    const res = await getSkills();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
    const s = body.items[0];
    expect(s).toHaveProperty("name");
    expect(s).toHaveProperty("category");
    expect(s).toHaveProperty("privacyLevel");
  });
});

// ── API-012 POST /api/submissions/privacy-scan（上报脱敏 Manifest）──
describe("API-012 POST /api/submissions/privacy-scan", () => {
  it("匿名 → 401", async () => {
    h.setSession(null);
    const res = await postPrivacyScan(
      postJson("/api/submissions/privacy-scan", { manifest: sanitizedManifest })
    );
    expect(res.status).toBe(401);
  });

  it("上报脱敏 Manifest → 返回 PrivacyScanResult（findings/overallStatus/scannedAt/scannerVersion）", async () => {
    const uid = await seedUser(OWNER.login);
    const sid = await seedDraft(uid);
    h.setSession(OWNER);
    const res = await postPrivacyScan(
      postJson("/api/submissions/privacy-scan", {
        submissionId: sid,
        manifest: sanitizedManifest,
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(["pass", "warn", "block"]).toContain(body.overallStatus);
    expect(Array.isArray(body.findings)).toBe(true);
    expect(body).toHaveProperty("scannedAt");
    expect(body).toHaveProperty("scannerVersion");
    // findings 只指向字段，不回显原值
    for (const f of body.findings) {
      expect(f).toHaveProperty("locationRef");
    }
  });

  it("INV-01：含原始私有值（contact.value）→ 400 拒收，不落库", async () => {
    const uid = await seedUser(OWNER.login);
    const sid = await seedDraft(uid);
    h.setSession(OWNER);
    const res = await postPrivacyScan(
      postJson("/api/submissions/privacy-scan", {
        submissionId: sid,
        manifest: { ...sanitizedManifest, contact: { type: "email", value: "a@b.com" } },
      })
    );
    expect(res.status).toBe(400);
    const scans = await h.db
      .select()
      .from(schema.privacyScans)
      .where(eq(schema.privacyScans.submissionId, sid));
    expect(scans.length).toBe(0);
  });

  it("含触发关键字（secret/密钥）→ overallStatus=block，写 privacy_scans", async () => {
    const uid = await seedUser(OWNER.login);
    const sid = await seedDraft(uid);
    h.setSession(OWNER);
    const res = await postPrivacyScan(
      postJson("/api/submissions/privacy-scan", {
        submissionId: sid,
        manifest: {
          ...sanitizedManifest,
          summary: "包含 secret token 的描述",
        },
      })
    );
    const body = await res.json();
    expect(body.overallStatus).toBe("block");
    const scans = await h.db
      .select()
      .from(schema.privacyScans)
      .where(eq(schema.privacyScans.submissionId, sid));
    expect(scans.length).toBeGreaterThan(0);
    expect(scans[0].overallStatus).toBe("block");
    // INV-01：findings 不含原始命中值（不出现 "secret token" 全文回显）。
    expect(JSON.stringify(scans[0].findings)).not.toContain("token");
  });

  it("限流：超限 → 429（NFR-006）", async () => {
    const uid = await seedUser(OWNER.login);
    const sid = await seedDraft(uid);
    h.setSession(OWNER);
    let last = 200;
    for (let i = 0; i < 60; i++) {
      const res = await postPrivacyScan(
        postJson("/api/submissions/privacy-scan", {
          submissionId: sid,
          manifest: sanitizedManifest,
        })
      );
      last = res.status;
      if (last === 429) break;
    }
    expect(last).toBe(429);
  });
});

// ── API-013 POST /api/submissions/:id/submit（提交进评审）────────────
describe("API-013 POST /api/submissions/:id/submit", () => {
  it("匿名 → 401", async () => {
    const uid = await seedUser(OWNER.login);
    const sid = await seedDraft(uid);
    await seedScan(sid, "pass");
    h.setSession(null);
    const res = await postSubmit(
      postJson(`/api/submissions/${sid}/submit`, {
        consent: { actionType: "submit", scope: sid },
      }),
      { params: Promise.resolve({ id: sid }) }
    );
    expect(res.status).toBe(401);
  });

  it("非本人提交他人草稿 → 403", async () => {
    const ownerId = await seedUser(OWNER.login);
    await seedUser(OTHER.login);
    const sid = await seedDraft(ownerId);
    await seedScan(sid, "pass");
    h.setSession(OTHER);
    const res = await postSubmit(
      postJson(`/api/submissions/${sid}/submit`, {
        consent: { actionType: "submit", scope: sid },
      }),
      { params: Promise.resolve({ id: sid }) }
    );
    expect(res.status).toBe(403);
  });

  it("INV-08：缺 submit Consent → 422，不落库（TEST-007）", async () => {
    const uid = await seedUser(OWNER.login);
    const sid = await seedDraft(uid);
    await seedScan(sid, "pass");
    h.setSession(OWNER);
    const res = await postSubmit(
      postJson(`/api/submissions/${sid}/submit`, {}),
      { params: Promise.resolve({ id: sid }) }
    );
    expect(res.status).toBe(422);
    // 不落 consents / review_items
    const consents = await h.db.select().from(schema.consents);
    expect(consents.length).toBe(0);
    const reviews = await h.db.select().from(schema.reviewItems);
    expect(reviews.length).toBe(0);
    // 状态仍为 Draft
    const [sub] = await h.db
      .select()
      .from(schema.submissions)
      .where(eq(schema.submissions.id, sid));
    expect(sub.status).toBe("Draft");
  });

  it("INV-02：block 态提交 → 409 不可绕过，不落库（TEST-002）", async () => {
    const uid = await seedUser(OWNER.login);
    const sid = await seedDraft(uid);
    await seedScan(sid, "block");
    h.setSession(OWNER);
    const res = await postSubmit(
      postJson(`/api/submissions/${sid}/submit`, {
        consent: { actionType: "submit", scope: sid },
      }),
      { params: Promise.resolve({ id: sid }) }
    );
    expect(res.status).toBe(409);
    const reviews = await h.db.select().from(schema.reviewItems);
    expect(reviews.length).toBe(0);
    const [sub] = await h.db
      .select()
      .from(schema.submissions)
      .where(eq(schema.submissions.id, sid));
    expect(sub.status).toBe("Draft");
  });

  it("pass 态 + Consent → 提交成功，生成 review_item + consent + audit（InReview）", async () => {
    const uid = await seedUser(OWNER.login);
    const sid = await seedDraft(uid);
    await seedScan(sid, "pass");
    h.setSession(OWNER);
    const res = await postSubmit(
      postJson(`/api/submissions/${sid}/submit`, {
        consent: { actionType: "submit", scope: sid },
      }),
      { params: Promise.resolve({ id: sid }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(["Submitted", "InReview"]).toContain(body.status);
    expect(body.privacyOverall).toBe("pass");

    // 状态推进
    const [sub] = await h.db
      .select()
      .from(schema.submissions)
      .where(eq(schema.submissions.id, sid));
    expect(["Submitted", "InReview"]).toContain(sub.status);

    // INV-08：写 submit Consent
    const consents = await h.db
      .select()
      .from(schema.consents)
      .where(eq(schema.consents.userId, uid));
    expect(consents.some((c) => c.actionType === "submit")).toBe(true);

    // 生成 review_item（kind=submission，gate 来自扫描）
    const reviews = await h.db
      .select()
      .from(schema.reviewItems)
      .where(eq(schema.reviewItems.submissionId, sid));
    expect(reviews.length).toBe(1);
    expect(reviews[0].kind).toBe("submission");
    expect(reviews[0].gate).toBe("pass");

    // INV-11：写 audit_log
    const audits = await h.db
      .select()
      .from(schema.auditLog)
      .where(eq(schema.auditLog.targetId, sid));
    expect(audits.length).toBeGreaterThan(0);
  });

  it("warn 态需显式 submit Consent 方可提交（带 Consent → 通过，privacyOverall=warn）", async () => {
    const uid = await seedUser(OWNER.login);
    const sid = await seedDraft(uid);
    await seedScan(sid, "warn");
    h.setSession(OWNER);
    const res = await postSubmit(
      postJson(`/api/submissions/${sid}/submit`, {
        consent: { actionType: "submit", scope: sid },
      }),
      { params: Promise.resolve({ id: sid }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.privacyOverall).toBe("warn");
    const reviews = await h.db
      .select()
      .from(schema.reviewItems)
      .where(eq(schema.reviewItems.submissionId, sid));
    expect(reviews[0].gate).toBe("warn");
  });

  it("无扫描记录提交 → 409（必须先过隐私门）", async () => {
    const uid = await seedUser(OWNER.login);
    const sid = await seedDraft(uid);
    h.setSession(OWNER);
    const res = await postSubmit(
      postJson(`/api/submissions/${sid}/submit`, {
        consent: { actionType: "submit", scope: sid },
      }),
      { params: Promise.resolve({ id: sid }) }
    );
    expect(res.status).toBe(409);
  });

  it("限流：超限 → 429（NFR-006）", async () => {
    const uid = await seedUser(OWNER.login);
    h.setSession(OWNER);
    let last = 200;
    for (let i = 0; i < 60; i++) {
      const sid = await seedDraft(uid);
      await seedScan(sid, "pass");
      const res = await postSubmit(
        postJson(`/api/submissions/${sid}/submit`, {
          consent: { actionType: "submit", scope: sid },
        }),
        { params: Promise.resolve({ id: sid }) }
      );
      last = res.status;
      if (last === 429) break;
    }
    expect(last).toBe(429);
  });

  it("DEC-007：提交响应无任何经济字段", async () => {
    const uid = await seedUser(OWNER.login);
    const sid = await seedDraft(uid);
    await seedScan(sid, "pass");
    h.setSession(OWNER);
    const res = await postSubmit(
      postJson(`/api/submissions/${sid}/submit`, {
        consent: { actionType: "submit", scope: sid },
      }),
      { params: Promise.resolve({ id: sid }) }
    );
    const blob = JSON.stringify(await res.json()).toLowerCase();
    for (const f of ["price", "fee", "commission", "payment", "currency"]) {
      expect(blob).not.toContain(f);
    }
  });
});
