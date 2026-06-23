/*
  社交 + 技能 + 关于 域 契约 + 不变量测试（TDD：先红后绿）。
  覆盖：
    API-049 POST /api/modules/:id/favorite（收藏/取消，INV-07 唯一约束，TEST-006）
    API-050 POST /api/users/:login/endorse（认可，低权重社交信号，INV-10）
    API-051 POST /api/reports（举报，目标=模块/用户/交换，INV-11 audit）
    API-028 GET /api/skills/catalog（技能目录形状）+ /api/skills/catalog/:slug（详情）
    API-053 GET /api/about/stats（平台聚合统计 + 月度活跃序列，INV-09 无 PII）
  不变量：登录(401)、限流(429, TEST-015)、收藏唯一幂等(INV-07/TEST-006)、写 audit(INV-11)、聚合无 PII(INV-09)。
*/
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { setupHarness, deterministicUuid, schema, type Harness } from "../_harness";
import { eq, and } from "drizzle-orm";

// 被测路由处理器（实现后存在）。
import { POST as favorite } from "@/app/api/modules/[id]/favorite/route";
import { POST as endorse } from "@/app/api/users/[login]/endorse/route";
import { POST as createReport } from "@/app/api/reports/route";
import { GET as getSkillCatalog } from "@/app/api/skills/catalog/route";
import { GET as getSkillDetail } from "@/app/api/skills/catalog/[slug]/route";
import { GET as getAboutStats } from "@/app/api/about/stats/route";

let h: Harness;

const MEM_ID = deterministicUuid("m-agent-memory");

const SESSION = {
  login: "newcomer",
  avatarUrl: "https://avatars.example.com/newcomer.png",
  isAdmin: false,
  verified: false,
};

function postReq(path: string, body?: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body == null ? undefined : JSON.stringify(body),
  });
}

function getReq(path: string): Request {
  return new Request(`http://localhost${path}`);
}

/** 播种技能目录（agent_skills 表，harness 不默认插入）。 */
async function seedSkills() {
  await h.db.insert(schema.agentSkills).values([
    {
      slug: "create-manifest",
      name: "Create Manifest",
      category: "manifest",
      description: "从本地知识来源生成脱敏清单草稿。",
      privacyLevel: "local",
      docsUrl: "https://docs.example.com/skills/create-manifest",
      supportedSources: ["obsidian", "markdown"],
      installConfig: { command: "know-share create-manifest --notes ./my-notes" },
    },
    {
      slug: "submit-feedback",
      name: "Submit Feedback",
      category: "feedback",
      description: "交换完成后提交结构化反馈，更新对方信用分。",
      privacyLevel: "remote",
      docsUrl: "https://docs.example.com/skills/submit-feedback",
      supportedSources: null,
      installConfig: { command: "know-share submit-feedback --exchange-id EX123" },
    },
  ]);
}

// 单次建库（避免每用例重建 PGlite 导致组合运行下超时）；用例间清理可变表。
beforeAll(async () => {
  h = await setupHarness();
});

beforeEach(async () => {
  // 清理本域写入的可变表，保证用例隔离（社交/举报/审计/技能目录）。
  await h.db.delete(schema.socialSignals);
  await h.db.delete(schema.reports);
  await h.db.delete(schema.auditLog);
  await h.db.delete(schema.agentSkills);
  if (h.redis.reset) h.redis.reset();
  h.setSession(null);
});

afterAll(async () => {
  await h.teardown();
});

// ── API-049 收藏（INV-07 唯一约束，TEST-006）────────────────────
describe("API-049 POST /api/modules/:id/favorite", () => {
  it("未登录 → 401（社交需登录）", async () => {
    h.setSession(null);
    const res = await favorite(postReq(`/api/modules/${MEM_ID}/favorite`), {
      params: Promise.resolve({ id: MEM_ID }),
    });
    expect(res.status).toBe(401);
  });

  it("登录收藏 → 201/200 且 favorited=true，写入唯一社交信号", async () => {
    h.setSession(SESSION);
    const res = await favorite(postReq(`/api/modules/${MEM_ID}/favorite`), {
      params: Promise.resolve({ id: MEM_ID }),
    });
    expect([200, 201]).toContain(res.status);
    const body = await res.json();
    expect(body.favorited).toBe(true);

    const rows = await h.db
      .select()
      .from(schema.socialSignals)
      .where(
        and(
          eq(schema.socialSignals.kind, "favorite"),
          eq(schema.socialSignals.targetType, "module"),
          eq(schema.socialSignals.targetId, MEM_ID)
        )
      );
    expect(rows.length).toBe(1);
  });

  it("TEST-006 / INV-07：重复收藏幂等，不新增第二条（唯一约束）", async () => {
    h.setSession(SESSION);
    await favorite(postReq(`/api/modules/${MEM_ID}/favorite`), {
      params: Promise.resolve({ id: MEM_ID }),
    });
    // 第二次收藏（未取消）→ 仍 favorited=true，记录数仍为 1。
    const res2 = await favorite(postReq(`/api/modules/${MEM_ID}/favorite`), {
      params: Promise.resolve({ id: MEM_ID }),
    });
    expect(res2.status).toBeLessThan(300);
    const body2 = await res2.json();
    expect(body2.favorited).toBe(true);

    const rows = await h.db
      .select()
      .from(schema.socialSignals)
      .where(
        and(
          eq(schema.socialSignals.kind, "favorite"),
          eq(schema.socialSignals.targetType, "module"),
          eq(schema.socialSignals.targetId, MEM_ID)
        )
      );
    expect(rows.length).toBe(1);
  });

  it("再次收藏切换为取消 → favorited=false，删除记录（toggle 语义）", async () => {
    h.setSession(SESSION);
    // 第一次收藏。
    await favorite(postReq(`/api/modules/${MEM_ID}/favorite`, { toggle: true }), {
      params: Promise.resolve({ id: MEM_ID }),
    });
    // 第二次带 toggle 取消。
    const res = await favorite(
      postReq(`/api/modules/${MEM_ID}/favorite`, { toggle: true }),
      { params: Promise.resolve({ id: MEM_ID }) }
    );
    const body = await res.json();
    expect(body.favorited).toBe(false);

    const rows = await h.db
      .select()
      .from(schema.socialSignals)
      .where(
        and(
          eq(schema.socialSignals.kind, "favorite"),
          eq(schema.socialSignals.targetType, "module"),
          eq(schema.socialSignals.targetId, MEM_ID)
        )
      );
    expect(rows.length).toBe(0);
  });

  it("未知模块 → 404", async () => {
    h.setSession(SESSION);
    const res = await favorite(postReq(`/api/modules/x/favorite`), {
      params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000000" }),
    });
    expect(res.status).toBe(404);
  });

  it("INV-11：收藏写 audit 记录", async () => {
    h.setSession(SESSION);
    await favorite(postReq(`/api/modules/${MEM_ID}/favorite`), {
      params: Promise.resolve({ id: MEM_ID }),
    });
    const audits = await h.db
      .select()
      .from(schema.auditLog)
      .where(eq(schema.auditLog.action, "favorite"));
    expect(audits.length).toBeGreaterThan(0);
  });

  it("TEST-015：超过限流阈值 → 429", async () => {
    h.setSession(SESSION);
    let got429 = false;
    for (let i = 0; i < 60; i++) {
      const res = await favorite(
        postReq(`/api/modules/${MEM_ID}/favorite`, { toggle: true }),
        { params: Promise.resolve({ id: MEM_ID }) }
      );
      if (res.status === 429) {
        got429 = true;
        break;
      }
    }
    expect(got429).toBe(true);
  });
});

// ── API-050 认可（低权重社交信号，INV-10）───────────────────────
describe("API-050 POST /api/users/:login/endorse", () => {
  it("未登录 → 401", async () => {
    h.setSession(null);
    const res = await endorse(postReq(`/api/users/zyongzhu24/endorse`), {
      params: Promise.resolve({ login: "zyongzhu24" }),
    });
    expect(res.status).toBe(401);
  });

  it("认可写入 endorse 社交信号（target=user）", async () => {
    h.setSession(SESSION);
    const res = await endorse(postReq(`/api/users/zyongzhu24/endorse`), {
      params: Promise.resolve({ login: "zyongzhu24" }),
    });
    expect([200, 201]).toContain(res.status);
    const body = await res.json();
    expect(body.endorsed).toBe(true);

    const rows = await h.db
      .select()
      .from(schema.socialSignals)
      .where(
        and(
          eq(schema.socialSignals.kind, "endorse"),
          eq(schema.socialSignals.targetType, "user")
        )
      );
    expect(rows.length).toBe(1);
  });

  it("INV-10：认可不写 feedback 表（不直接拉高信任，权重低于参与方反馈）", async () => {
    h.setSession(SESSION);
    await endorse(postReq(`/api/users/zyongzhu24/endorse`), {
      params: Promise.resolve({ login: "zyongzhu24" }),
    });
    const fb = await h.db.select().from(schema.feedback);
    expect(fb.length).toBe(0);
  });

  it("不能认可自己 → 400", async () => {
    h.setSession(SESSION);
    const res = await endorse(postReq(`/api/users/newcomer/endorse`), {
      params: Promise.resolve({ login: "newcomer" }),
    });
    expect(res.status).toBe(400);
  });

  it("未知用户 → 404", async () => {
    h.setSession(SESSION);
    const res = await endorse(postReq(`/api/users/ghost/endorse`), {
      params: Promise.resolve({ login: "ghost" }),
    });
    expect(res.status).toBe(404);
  });
});

// ── API-051 举报（目标=模块/用户/交换，INV-11 audit）───────────
describe("API-051 POST /api/reports", () => {
  it("未登录 → 401", async () => {
    h.setSession(null);
    const res = await createReport(
      postReq(`/api/reports`, {
        targetType: "module",
        targetId: MEM_ID,
        reason: "spam",
      })
    );
    expect(res.status).toBe(401);
  });

  it("举报模块 → 写 report 记录（pending）+ audit（INV-11）", async () => {
    h.setSession(SESSION);
    const res = await createReport(
      postReq(`/api/reports`, {
        targetType: "module",
        targetId: MEM_ID,
        reason: "内容疑似含私有信息",
      })
    );
    expect([200, 201]).toContain(res.status);
    const body = await res.json();
    expect(body.status).toBe("pending");

    const reports = await h.db.select().from(schema.reports);
    expect(reports.length).toBe(1);
    expect(reports[0].targetType).toBe("module");
    expect(reports[0].status).toBe("pending");

    const audits = await h.db
      .select()
      .from(schema.auditLog)
      .where(eq(schema.auditLog.action, "report"));
    expect(audits.length).toBeGreaterThan(0);
  });

  it("缺少必填字段 → 400", async () => {
    h.setSession(SESSION);
    const res = await createReport(
      postReq(`/api/reports`, { targetType: "module" })
    );
    expect(res.status).toBe(400);
  });

  it("非法 targetType → 400", async () => {
    h.setSession(SESSION);
    const res = await createReport(
      postReq(`/api/reports`, {
        targetType: "planet",
        targetId: MEM_ID,
        reason: "x",
      })
    );
    expect(res.status).toBe(400);
  });

  it("TEST-015：超过限流阈值 → 429", async () => {
    h.setSession(SESSION);
    let got429 = false;
    for (let i = 0; i < 40; i++) {
      const res = await createReport(
        postReq(`/api/reports`, {
          targetType: "module",
          targetId: MEM_ID,
          reason: "spam",
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

// ── API-028 技能目录（DEC-018：旧 /api/skills 弃用，不实现）──────
describe("API-028 GET /api/skills/catalog", () => {
  it("返回技能目录聚合形状 { skills, sources, flowSteps, exampleCommands, install, corePrinciple }", async () => {
    await seedSkills();
    const res = await getSkillCatalog(getReq("/api/skills/catalog"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.skills)).toBe(true);
    expect(body.skills.length).toBeGreaterThan(0);
    expect(Array.isArray(body.sources)).toBe(true);
    expect(Array.isArray(body.flowSteps)).toBe(true);
    expect(Array.isArray(body.exampleCommands)).toBe(true);
    expect(body.install).toHaveProperty("mcpConfig");
    expect(body.install).toHaveProperty("skillInstallText");
    expect(body.corePrinciple).toHaveProperty("title");
    expect(Array.isArray(body.corePrinciple.points)).toBe(true);

    const s = body.skills[0];
    expect(s).toHaveProperty("slug");
    expect(s).toHaveProperty("name");
    expect(s).toHaveProperty("privacyLevel");
  });

  it("empty=true → 空目录 skills:[]，仍带静态区块", async () => {
    await seedSkills();
    const res = await getSkillCatalog(getReq("/api/skills/catalog?empty=true"));
    const body = await res.json();
    expect(body.skills).toEqual([]);
    expect(body.install).toHaveProperty("mcpConfig");
  });

  it("零私有内容：install 配置/命令不含密钥/私有 URL（INV-01/04）", async () => {
    await seedSkills();
    const res = await getSkillCatalog(getReq("/api/skills/catalog"));
    const txt = JSON.stringify(await res.json());
    expect(txt).not.toMatch(/AKIA|secret|password|token=/i);
  });
});

describe("API-028 GET /api/skills/catalog/:slug", () => {
  it("返回单个技能详情", async () => {
    await seedSkills();
    const res = await getSkillDetail(
      getReq("/api/skills/catalog/create-manifest"),
      { params: Promise.resolve({ slug: "create-manifest" }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slug).toBe("create-manifest");
  });

  it("未知 slug → 404", async () => {
    await seedSkills();
    const res = await getSkillDetail(getReq("/api/skills/catalog/ghost"), {
      params: Promise.resolve({ slug: "ghost" }),
    });
    expect(res.status).toBe(404);
  });
});

// ── API-053 关于页统计（INV-09 聚合无 PII）─────────────────────
describe("API-053 GET /api/about/stats", () => {
  it("返回聚合统计形状 { stats, monthlyActiveSeries, meta }", async () => {
    const res = await getAboutStats();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stats).toHaveProperty("modulesTotal");
    expect(body.stats).toHaveProperty("exchangesTotal");
    expect(body.stats).toHaveProperty("activeUsers");
    expect(body.stats).toHaveProperty("privacyGatePassRate");
    expect(Array.isArray(body.monthlyActiveSeries)).toBe(true);
    expect(body.meta).toHaveProperty("window");
    expect(body.meta).toHaveProperty("calibration");
  });

  it("stats 取值来自 usage_stats 聚合（modulesTotal 为数值标量）", async () => {
    const res = await getAboutStats();
    const body = await res.json();
    expect(typeof body.stats.modulesTotal).toBe("number");
    expect(typeof body.stats.privacyGatePassRate).toBe("number");
    // 月度序列点为 { month, value } 标量。
    for (const pt of body.monthlyActiveSeries) {
      expect(typeof pt.month).toBe("string");
      expect(typeof pt.value).toBe("number");
    }
  });

  it("INV-09 / TEST-008：聚合输出无 PII（无 login/email/avatarUrl 等个体字段）", async () => {
    const res = await getAboutStats();
    const txt = JSON.stringify(await res.json());
    expect(txt).not.toMatch(/login|email|avatarUrl|githubId|@/i);
  });
});
