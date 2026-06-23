/*
  modules/discovery 读端点契约 + 不变量测试（TDD：先红后绿）。
  覆盖：API-001/002/003/004/005/007/052；
  TEST-001（公开输出零私有）、TEST-008（统计无 PII）、筛选/排序、manifest 屏蔽 contact、未知 id→404。
*/
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupHarness, deterministicUuid, type Harness } from "./_harness";
import { FORBIDDEN_PUBLIC_FIELDS } from "@/server/projection";

// 被测路由处理器（实现后存在）。
import { GET as getSession } from "@/app/api/session/route";
import { GET as listModules } from "@/app/api/modules/route";
import { GET as getModule } from "@/app/api/modules/[id]/route";
import { GET as getManifest } from "@/app/api/modules/[id]/manifest/route";
import { GET as getDetail } from "@/app/api/modules/[id]/detail/route";
import { GET as getTopics } from "@/app/api/topics/route";
import { GET as getUsage } from "@/app/api/stats/usage/route";

let h: Harness;

beforeAll(async () => {
  h = await setupHarness();
});

afterAll(async () => {
  await h.teardown();
});

/** 递归断言对象不含任何禁止公开字段（TEST-001/INV-04）。 */
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

function req(path: string): Request {
  return new Request(`http://localhost${path}`);
}

const MEM_ID = deterministicUuid("m-agent-memory");

describe("API-001 GET /api/session", () => {
  it("匿名时返回 null（降级匿名 ASM-019）", async () => {
    h.setSession(null);
    const res = await getSession();
    expect(res.status).toBe(200);
    expect(await res.json()).toBeNull();
  });

  it("登录时返回 Session 投影（login/avatarUrl/isAdmin）", async () => {
    h.setSession({
      login: "zyongzhu24",
      avatarUrl: "https://avatars.example.com/zyongzhu24.png",
      isAdmin: true,
      verified: true,
    });
    const res = await getSession();
    const body = await res.json();
    expect(body.login).toBe("zyongzhu24");
    expect(body.isAdmin).toBe(true);
    h.setSession(null);
  });
});

describe("API-002 GET /api/modules（发现列表）", () => {
  it("无筛选返回全部已播种模块 + total，形状对齐 { items, total }", async () => {
    const res = await listModules(req("/api/modules"));
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.total).toBe(body.items.length);
    expect(body.items.length).toBeGreaterThan(0);
    const m = body.items[0];
    expect(m).toHaveProperty("id");
    expect(m).toHaveProperty("title");
    expect(m).toHaveProperty("summary");
    expect(m).toHaveProperty("topics");
    expect(m).toHaveProperty("trustLevel");
    expect(m).toHaveProperty("ownerLogin");
  });

  it("TEST-001：列表输出零私有（无 contact/原始内容/私有 URL）", async () => {
    const res = await listModules(req("/api/modules"));
    expectNoForbidden(await res.json());
  });

  it("empty=true 返回空注册表", async () => {
    const res = await listModules(req("/api/modules?empty=true"));
    const body = await res.json();
    expect(body.items).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("q 关键字筛选命中标题", async () => {
    const res = await listModules(req("/api/modules?q=记忆"));
    const body = await res.json();
    expect(body.items.length).toBeGreaterThan(0);
    expect(
      body.items.every(
        (m: { title: string; summary: string; topics: string[] }) =>
          m.title.includes("记忆") ||
          m.summary.includes("记忆") ||
          m.topics.some((t) => t.includes("记忆"))
      )
    ).toBe(true);
  });

  it("trustLevel 筛选只返回匹配级别", async () => {
    const res = await listModules(req("/api/modules?trustLevel=high"));
    const body = await res.json();
    expect(body.items.length).toBeGreaterThan(0);
    expect(
      body.items.every((m: { trustLevel: string }) => m.trustLevel === "high")
    ).toBe(true);
  });

  it("sort=popular 按 favoriteCount 降序", async () => {
    const res = await listModules(req("/api/modules?sort=popular"));
    const body = await res.json();
    const favs = body.items.map((m: { favoriteCount: number }) => m.favoriteCount);
    const sorted = [...favs].sort((a, b) => b - a);
    expect(favs).toEqual(sorted);
  });

  it("verifiedOnly 只返回已验证 owner 的模块", async () => {
    const res = await listModules(req("/api/modules?verifiedOnly=true"));
    const body = await res.json();
    // ops-bot / growth-lab 未验证，其模块应被排除。
    expect(
      body.items.every(
        (m: { ownerLogin: string }) =>
          m.ownerLogin !== "ops-bot" && m.ownerLogin !== "growth-lab"
      )
    ).toBe(true);
  });
});

describe("API-003 GET /api/modules/:id", () => {
  it("返回模块卡片投影", async () => {
    const res = await getModule(req(`/api/modules/${MEM_ID}`), {
      params: Promise.resolve({ id: MEM_ID }),
    });
    expect(res.status).toBe(200);
    const m = await res.json();
    expect(m.title).toContain("记忆");
    expectNoForbidden(m);
  });

  it("未知 id → 404", async () => {
    const res = await getModule(req("/api/modules/unknown"), {
      params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000000" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("API-004 GET /api/modules/:id/manifest", () => {
  it("返回脱敏 Manifest，屏蔽 contact（INV-03/04/ASM-024）", async () => {
    const res = await getManifest(req(`/api/modules/${MEM_ID}/manifest`), {
      params: Promise.resolve({ id: MEM_ID }),
    });
    expect(res.status).toBe(200);
    const man = await res.json();
    expect(man.moduleId).toBe(MEM_ID);
    expect(man).toHaveProperty("sourceStats");
    expect(man).not.toHaveProperty("contact");
    expectNoForbidden(man);
  });

  it("未知 id → 404", async () => {
    const res = await getManifest(req("/api/modules/x/manifest"), {
      params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000000" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("API-005 GET /api/modules/:id/detail", () => {
  it("聚合返回 module+manifest+owner+trust+privacy，且零私有（contact 被屏蔽）", async () => {
    const res = await getDetail(req(`/api/modules/${MEM_ID}/detail`), {
      params: Promise.resolve({ id: MEM_ID }),
    });
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.module).toBeTruthy();
    expect(d.manifest).toBeTruthy();
    expect(d.owner).toBeTruthy();
    expect(d.trust).toBeTruthy();
    expect(d.privacy).toBeTruthy();
    // 详情聚合（含 fullManifest）必须零私有：后端是权威脱敏边界（INV-04）。
    expectNoForbidden(d);
  });

  it("未知 id → 404", async () => {
    const res = await getDetail(req("/api/modules/x/detail"), {
      params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000000" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("API-007 GET /api/topics", () => {
  it("返回主题目录 { items }", async () => {
    const res = await getTopics();
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items[0]).toHaveProperty("label");
  });
});

describe("API-052 GET /api/stats/usage", () => {
  it("TEST-008：统计聚合无 PII，形状 { items: UsageStat[] }", async () => {
    const res = await getUsage();
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
    for (const s of body.items) {
      expect(s).toHaveProperty("key");
      expect(s).toHaveProperty("value");
      expect(typeof s.value).toBe("number");
    }
    expectNoForbidden(body);
  });
});
