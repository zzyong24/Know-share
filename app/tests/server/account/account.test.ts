/*
  账户域读写端点契约 + 不变量测试（TDD：先红后绿）。
  覆盖 API-031~042（H 段）：个人中心 / 通知 / 联系方式 / 同意记录 / 账户身份 / 通知偏好。
  不变量：
    - 全部需登录（未登录 → 401）；
    - 本人隔离（仅本人可读写自己的私域）；
    - 联系方式默认私密、公开为显式 opt-in（INV-03/DEC-010，TEST-003 类）；
    - 通知 unreadCount 正确 + 标记已读幂等；
    - 同意撤回只影响未来（INV-08/ASM-013）；
    - 写端点写 audit（INV-11）；
    - 公开/账户输出零私有（INV-04）。
*/
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { setupHarness, deterministicUuid, schema, type Harness } from "../_harness";
import { eq, and } from "drizzle-orm";
import { __resetPrefsStore } from "@/server/account";
import type { Session } from "@/lib/types";

import { GET as getDashboard } from "@/app/api/me/dashboard/route";
import { GET as getSection } from "@/app/api/me/sections/[section]/route";
import { GET as getNotifications } from "@/app/api/notifications/route";
import { POST as readNotification } from "@/app/api/notifications/[id]/read/route";
import { POST as readAllNotifications } from "@/app/api/notifications/read-all/route";
import { GET as getContacts, PUT as putContacts } from "@/app/api/me/contacts/route";
import { GET as getConsents } from "@/app/api/me/consents/route";
import { POST as revokeConsent } from "@/app/api/me/consents/[id]/revoke/route";
import { GET as getAccount } from "@/app/api/me/account/route";
import {
  GET as getPrefs,
  PUT as putPrefs,
} from "@/app/api/me/notification-prefs/route";

let h: Harness;

const ME: Session = {
  login: "zyongzhu24",
  avatarUrl: "https://avatars.example.com/zyongzhu24.png",
  isAdmin: true,
  verified: true,
};
const OTHER: Session = {
  login: "rag-builder",
  avatarUrl: "https://avatars.example.com/rag-builder.png",
  isAdmin: false,
  verified: true,
};

function req(path: string, init?: RequestInit): Request {
  return new Request(`http://localhost${path}`, init);
}

const FORBIDDEN = ["value", "email", "phone", "privateUrl", "rawContent"];
function expectNoRawContact(node: unknown): void {
  const visit = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(visit);
    if (n && typeof n === "object") {
      for (const [k, v] of Object.entries(n as Record<string, unknown>)) {
        expect(FORBIDDEN).not.toContain(k);
        visit(v);
      }
    }
  };
  visit(node);
}

/** 取 me / other 的 userId。 */
async function userId(login: string): Promise<string> {
  const [u] = await h.db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.login, login))
    .limit(1);
  return u.id;
}

/** 种子：给 me 插通知、联系方式、同意/披露记录。 */
async function seedAccount(): Promise<void> {
  const meId = await userId("zyongzhu24");
  const otherId = await userId("rag-builder");

  // 通知：3 条未读 + 1 条已读（me）；另 1 条属 other（隔离）。
  await h.db.insert(schema.notifications).values([
    { id: deterministicUuid("n1"), userId: meId, type: "exchange", title: "新的交换请求", body: "knowledge-trader 想交换", read: false },
    { id: deterministicUuid("n2"), userId: meId, type: "review", title: "评审通过", body: "你的模块已发布", read: false },
    { id: deterministicUuid("n3"), userId: meId, type: "feedback", title: "收到反馈", body: "新的五维反馈", read: false },
    { id: deterministicUuid("n4"), userId: meId, type: "community", title: "被收藏", body: "有人收藏了你的模块", read: true },
    { id: deterministicUuid("no1"), userId: otherId, type: "exchange", title: "不该看到", body: "属于他人", read: false },
  ]);

  // 联系方式（me）：github 默认私密；email 私密。
  await h.db.insert(schema.contactInfo).values([
    { id: deterministicUuid("ci-gh"), userId: meId, type: "github", value: "@zyongzhu24", label: "GitHub", visibility: "private" },
    { id: deterministicUuid("ci-em"), userId: meId, type: "email", value: "zhong@example.com", label: "邮箱", visibility: "private" },
  ]);
  // other 的联系方式（隔离断言）。
  await h.db.insert(schema.contactInfo).values({
    id: deterministicUuid("ci-other"),
    userId: otherId,
    type: "email",
    value: "other@example.com",
    label: "邮箱",
    visibility: "public",
  });

  // 同意记录（me）：一条 contact（可撤回披露）、一条 submit（不可撤回）。
  await h.db.insert(schema.consents).values([
    { id: deterministicUuid("co-contact"), userId: meId, actionType: "contact", scope: "github,email", relatedType: "exchange", relatedId: "EX-2024-8842" },
    { id: deterministicUuid("co-submit"), userId: meId, actionType: "submit", scope: "publish", relatedType: "submission", relatedId: "sub-1" },
    { id: deterministicUuid("co-other"), userId: otherId, actionType: "contact", scope: "github", relatedType: "exchange", relatedId: "EX-2024-7000" },
  ]);
}

/** 清空账户域可变表（每个用例隔离；不触碰 users/modules 等 beforeAll 种子）。 */
async function resetAccountTables(): Promise<void> {
  await h.db.delete(schema.notifications);
  await h.db.delete(schema.contactInfo);
  await h.db.delete(schema.contactDisclosures);
  await h.db.delete(schema.consents);
  await h.db.delete(schema.auditLog);
  h.redis.reset();
  __resetPrefsStore();
}

// setupHarness（pglite 建表 + 全量种子）耗时约 14s，故仅在 beforeAll 跑一次；
// 写端点用例靠 resetAccountTables + 重播 seedAccount 实现隔离。
beforeAll(async () => {
  h = await setupHarness({ session: ME });
});

beforeEach(async () => {
  h.setSession(ME);
  await resetAccountTables();
  await seedAccount();
});

afterAll(async () => {
  await h.teardown();
});

// ── API-031 GET /api/me/dashboard ──────────────────────────────
describe("API-031 GET /api/me/dashboard", () => {
  it("未登录 → 401", async () => {
    h.setSession(null);
    const res = await getDashboard();
    expect(res.status).toBe(401);
  });

  it("返回概览（currentUser + StatBlock 统计 + unreadNotificationsCount）", async () => {
    const res = await getDashboard();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.currentUser.githubHandle).toBe("zyongzhu24");
    expect(body.stats).toHaveProperty("myModulesCount");
    expect(body.stats).toHaveProperty("activeExchangesCount");
    expect(body.stats).toHaveProperty("trustScore");
    // me 有 3 条未读。
    expect(body.stats.unreadNotificationsCount).toBe(3);
    expectNoRawContact(body);
  });
});

// ── API-032 GET /api/me/sections/:section ──────────────────────
describe("API-032 GET /api/me/sections/:section", () => {
  it("未登录 → 401", async () => {
    h.setSession(null);
    const res = await getSection(req("/api/me/sections/modules"), {
      params: Promise.resolve({ section: "modules" }),
    });
    expect(res.status).toBe(401);
  });

  it("modules 分区只返回本人模块（本人隔离）", async () => {
    const res = await getSection(req("/api/me/sections/modules"), {
      params: Promise.resolve({ section: "modules" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    // zyongzhu24 拥有 m-agent-memory。
    expect(body.items.length).toBeGreaterThan(0);
    expect(
      body.items.every((m: { ownerLogin: string }) => m.ownerLogin === "zyongzhu24")
    ).toBe(true);
    expectNoRawContact(body);
  });

  it("非法分区 → 400", async () => {
    const res = await getSection(req("/api/me/sections/bogus"), {
      params: Promise.resolve({ section: "bogus" }),
    });
    expect(res.status).toBe(400);
  });

  it("favorites 分区返回 { items }", async () => {
    const res = await getSection(req("/api/me/sections/favorites"), {
      params: Promise.resolve({ section: "favorites" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });
});

// ── API-033/034/035 通知 ────────────────────────────────────────
describe("API-033 GET /api/notifications", () => {
  it("未登录 → 401", async () => {
    h.setSession(null);
    const res = await getNotifications(req("/api/notifications"));
    expect(res.status).toBe(401);
  });

  it("返回 { items, unreadCount }（契约权威形状），仅本人通知", async () => {
    const res = await getNotifications(req("/api/notifications"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("items");
    expect(body).toHaveProperty("unreadCount");
    expect(body.unreadCount).toBe(3);
    // 4 条属于 me（隔离掉 other 那条）。
    expect(body.items.length).toBe(4);
    expect(body.items[0]).toHaveProperty("read");
  });

  it("type 过滤只返回该类型", async () => {
    const res = await getNotifications(req("/api/notifications?type=exchange"));
    const body = await res.json();
    expect(
      body.items.every((n: { type: string }) => n.type === "exchange")
    ).toBe(true);
    // unreadCount 仍为全部未读总数（徽标语义）。
    expect(body.unreadCount).toBe(3);
  });
});

describe("API-034 POST /api/notifications/:id/read", () => {
  const N1 = deterministicUuid("n1");

  it("未登录 → 401", async () => {
    h.setSession(null);
    const res = await readNotification(req(`/api/notifications/${N1}/read`, { method: "POST" }), {
      params: Promise.resolve({ id: N1 }),
    });
    expect(res.status).toBe(401);
  });

  it("标记单条已读 → unreadCount 递减；幂等再调不再减", async () => {
    const r1 = await readNotification(req(`/api/notifications/${N1}/read`, { method: "POST" }), {
      params: Promise.resolve({ id: N1 }),
    });
    expect(r1.status).toBe(200);
    let body = await (await getNotifications(req("/api/notifications"))).json();
    expect(body.unreadCount).toBe(2);

    // 幂等：再标记一次不再递减。
    await readNotification(req(`/api/notifications/${N1}/read`, { method: "POST" }), {
      params: Promise.resolve({ id: N1 }),
    });
    body = await (await getNotifications(req("/api/notifications"))).json();
    expect(body.unreadCount).toBe(2);
  });

  it("不能标记他人通知（本人隔离）→ 404/403", async () => {
    const NO1 = deterministicUuid("no1");
    const res = await readNotification(req(`/api/notifications/${NO1}/read`, { method: "POST" }), {
      params: Promise.resolve({ id: NO1 }),
    });
    expect([403, 404]).toContain(res.status);
  });
});

describe("API-035 POST /api/notifications/read-all", () => {
  it("未登录 → 401", async () => {
    h.setSession(null);
    const res = await readAllNotifications();
    expect(res.status).toBe(401);
  });

  it("全部已读 → unreadCount 归零，且不影响他人", async () => {
    const res = await readAllNotifications();
    expect(res.status).toBe(200);
    const body = await (await getNotifications(req("/api/notifications"))).json();
    expect(body.unreadCount).toBe(0);

    // other 的未读不应被清。
    const otherId = await userId("rag-builder");
    const [no] = await h.db
      .select()
      .from(schema.notifications)
      .where(and(eq(schema.notifications.userId, otherId), eq(schema.notifications.read, false)))
      .limit(1);
    expect(no).toBeTruthy();
  });
});

// ── API-036/037 联系方式 ────────────────────────────────────────
describe("API-036 GET /api/me/contacts", () => {
  it("未登录 → 401", async () => {
    h.setSession(null);
    const res = await getContacts();
    expect(res.status).toBe(401);
  });

  it("返回脱敏联系方式（默认私密，无真实 value）", async () => {
    const res = await getContacts();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    // 仅本人两条（other 的不返回）。
    expect(body.items.length).toBe(2);
    for (const c of body.items) {
      expect(c.visibility).toBe("private"); // 默认私密 INV-03
      expect(c).toHaveProperty("maskedValue");
      expect(c).not.toHaveProperty("value"); // 永不返回真实值
    }
    expectNoRawContact(body);
  });
});

describe("API-037 PUT /api/me/contacts（保存）", () => {
  it("未登录 → 401", async () => {
    h.setSession(null);
    const res = await putContacts(
      req("/api/me/contacts", { method: "PUT", body: JSON.stringify({ items: [] }) })
    );
    expect(res.status).toBe(401);
  });

  it("默认私密：新增不带 visibility 的项落库为 private（INV-03/DEC-010）", async () => {
    const res = await putContacts(
      req("/api/me/contacts", {
        method: "PUT",
        body: JSON.stringify({
          items: [{ type: "im", label: "Telegram", value: "@zhongtg" }],
        }),
      })
    );
    expect(res.status).toBe(200);
    const meId = await userId("zyongzhu24");
    const [row] = await h.db
      .select()
      .from(schema.contactInfo)
      .where(and(eq(schema.contactInfo.userId, meId), eq(schema.contactInfo.type, "im")))
      .limit(1);
    expect(row.visibility).toBe("private");
  });

  it("设为公开须显式 visibility=public", async () => {
    const res = await putContacts(
      req("/api/me/contacts", {
        method: "PUT",
        body: JSON.stringify({
          items: [{ type: "im", label: "Telegram", value: "@zhongtg", visibility: "public" }],
        }),
      })
    );
    expect(res.status).toBe(200);
    const meId = await userId("zyongzhu24");
    const [row] = await h.db
      .select()
      .from(schema.contactInfo)
      .where(and(eq(schema.contactInfo.userId, meId), eq(schema.contactInfo.type, "im")))
      .limit(1);
    expect(row.visibility).toBe("public");
  });

  it("保存写 audit（INV-11）+ 写 contact Consent（INV-08）", async () => {
    await putContacts(
      req("/api/me/contacts", {
        method: "PUT",
        body: JSON.stringify({ items: [{ type: "im", label: "TG", value: "@x" }] }),
      })
    );
    const audits = await h.db
      .select()
      .from(schema.auditLog)
      .where(eq(schema.auditLog.action, "contact.save"));
    expect(audits.length).toBeGreaterThan(0);
    const meId = await userId("zyongzhu24");
    const consents = await h.db
      .select()
      .from(schema.consents)
      .where(and(eq(schema.consents.userId, meId), eq(schema.consents.actionType, "contact")));
    // 原有 1 条 + 保存新增 1 条。
    expect(consents.length).toBeGreaterThanOrEqual(2);
  });

  it("超限 → 429（NFR-006）", async () => {
    let last: Response | undefined;
    for (let i = 0; i < 40; i++) {
      last = await putContacts(
        req("/api/me/contacts", {
          method: "PUT",
          body: JSON.stringify({ items: [{ type: "im", label: "TG", value: "@x" }] }),
        })
      );
    }
    expect(last!.status).toBe(429);
  });
});

// ── API-038/039 同意记录 ────────────────────────────────────────
describe("API-038 GET /api/me/consents", () => {
  it("未登录 → 401", async () => {
    h.setSession(null);
    const res = await getConsents(req("/api/me/consents?mode=disclosure"));
    expect(res.status).toBe(401);
  });

  it("mode=disclosure 仅返回披露类（contact）记录，融合 Consent+ContactDisclosure（ASM-046）", async () => {
    const res = await getConsents(req("/api/me/consents?mode=disclosure"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.every((r: { actionType: string }) => r.actionType === "contact")).toBe(true);
    expectNoRawContact(body);
  });

  it("mode=all-consent 返回全部 actionType 轨迹（仅本人）", async () => {
    const res = await getConsents(req("/api/me/consents?mode=all-consent"));
    const body = await res.json();
    const types = body.items.map((r: { actionType: string }) => r.actionType);
    expect(types).toContain("contact");
    expect(types).toContain("submit");
    // 不含 other 的记录。
    expect(body.items.every((r: { id: string }) => r.id !== deterministicUuid("co-other"))).toBe(true);
  });
});

describe("API-039 POST /api/me/consents/:id/revoke", () => {
  const CO = deterministicUuid("co-contact");

  it("未登录 → 401", async () => {
    h.setSession(null);
    const res = await revokeConsent(req(`/api/me/consents/${CO}/revoke`, { method: "POST" }), {
      params: Promise.resolve({ id: CO }),
    });
    expect(res.status).toBe(401);
  });

  it("撤回只影响未来（保留历史 Consent 行 + 标记 revokedForFuture / 写 audit）", async () => {
    const res = await revokeConsent(req(`/api/me/consents/${CO}/revoke`, { method: "POST" }), {
      params: Promise.resolve({ id: CO }),
    });
    expect(res.status).toBe(200);

    // 历史 Consent 行仍在（不删除既往同意，ASM-013）。
    const [stillThere] = await h.db
      .select()
      .from(schema.consents)
      .where(eq(schema.consents.id, CO))
      .limit(1);
    expect(stillThere).toBeTruthy();

    // 写 audit（INV-11）。
    const audits = await h.db
      .select()
      .from(schema.auditLog)
      .where(eq(schema.auditLog.action, "consent.revoke"));
    expect(audits.length).toBeGreaterThan(0);
  });

  it("不能撤回他人同意（本人隔离）→ 403/404", async () => {
    const CO_OTHER = deterministicUuid("co-other");
    const res = await revokeConsent(req(`/api/me/consents/${CO_OTHER}/revoke`, { method: "POST" }), {
      params: Promise.resolve({ id: CO_OTHER }),
    });
    expect([403, 404]).toContain(res.status);
  });
});

// ── API-040 账户身份 ────────────────────────────────────────────
describe("API-040 GET /api/me/account", () => {
  it("未登录 → 401", async () => {
    h.setSession(null);
    const res = await getAccount();
    expect(res.status).toBe(401);
  });

  it("返回只读 GitHub 身份（githubHandle/githubVerified/joinedAt），零私有", async () => {
    const res = await getAccount();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.githubHandle).toBe("zyongzhu24");
    expect(body).toHaveProperty("githubVerified");
    expect(body).toHaveProperty("joinedAt");
    expectNoRawContact(body);
  });
});

// ── API-041/042 通知偏好 ────────────────────────────────────────
describe("API-041/042 通知偏好", () => {
  it("GET 未登录 → 401", async () => {
    h.setSession(null);
    const res = await getPrefs();
    expect(res.status).toBe(401);
  });

  it("GET 返回四类站内开关（默认值）", async () => {
    const res = await getPrefs();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("exchange");
    expect(body).toHaveProperty("review");
    expect(body).toHaveProperty("feedback");
    expect(body).toHaveProperty("community");
  });

  it("PUT 保存后 GET 读回一致（仅站内 ASM-048）", async () => {
    const prefs = { exchange: false, review: true, feedback: false, community: true };
    const put = await putPrefs(req("/api/me/notification-prefs", { method: "PUT", body: JSON.stringify(prefs) }));
    expect(put.status).toBe(200);
    const body = await (await getPrefs()).json();
    expect(body.exchange).toBe(false);
    expect(body.community).toBe(true);
  });

  it("PUT 本人隔离：other 读回不受 me 保存影响", async () => {
    await putPrefs(req("/api/me/notification-prefs", { method: "PUT", body: JSON.stringify({ exchange: false, review: false, feedback: false, community: false }) }));
    h.setSession(OTHER);
    const body = await (await getPrefs()).json();
    // other 仍是默认（未被 me 的保存影响）。
    expect(body.exchange).toBe(true);
  });
});
