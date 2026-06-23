import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "@/mocks/handlers";
import {
  communityHandlers,
  __resetCommunityRuntime,
} from "@/mocks/handlers/community";
import {
  exchangeHandlers,
  __resetExchangeRuntime,
} from "@/mocks/handlers/exchange";
import { trustHandlers } from "@/mocks/handlers/trust-feedback";

/*
  阶段16 MSW 契约对齐回归（DEC-018 / ASM-120）。
  覆盖：
  - 读端点形状对齐（/api/exchanges 含 topics；/api/notifications 含 unreadCount）。
  - 写端点 MSW 可用（创建/接受/拒绝/中止交换、收藏、认可、举报、反馈统一端点）。
  - 守语义不变量（披露门、非法迁移 409、缺 consent 422、不能认可自己 400）。
*/

async function json(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

describe("读端点形状对齐（聚合器，API-014 / API-033）", () => {
  const server = setupServer(...handlers);
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterAll(() => server.close());

  it("/api/exchanges 返回 { items, total, topics }", async () => {
    const { status, body } = await json("/api/exchanges");
    expect(status).toBe(200);
    expect(Array.isArray(body.items)).toBe(true);
    expect(typeof body.total).toBe("number");
    expect(Array.isArray(body.topics)).toBe(true);
    // 公开台账排除 Flagged/InReview（ASM-032）。
    expect(
      body.items.every(
        (r: { status: string }) =>
          r.status !== "Flagged" && r.status !== "InReview"
      )
    ).toBe(true);
  });

  it("/api/notifications 返回 { items, unreadCount }", async () => {
    const { status, body } = await json("/api/notifications");
    expect(status).toBe(200);
    expect(Array.isArray(body.items)).toBe(true);
    expect(typeof body.unreadCount).toBe("number");
    const expected = body.items.filter((n: { read: boolean }) => !n.read).length;
    expect(body.unreadCount).toBe(expected);
  });

  it("弃用旧路径 /api/trust/:login 与 /api/skills 已无 handler（RISK-004 收敛）", async () => {
    // onUnhandledRequest:"error" 会让未注册路由抛错 → fetch reject。
    await expect(fetch("/api/trust/zyongzhu24")).rejects.toThrow();
    await expect(fetch("/api/skills")).rejects.toThrow();
  });
});

describe("交换写端点（API-019~022 / ASM-120）", () => {
  const server = setupServer(...exchangeHandlers);
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => {
    server.resetHandlers();
    __resetExchangeRuntime();
  });
  afterAll(() => server.close());

  it("创建交换：携带 consent → 201 { exchangeId, status:'Requested' }", async () => {
    const { status, body } = await json("/api/exchanges", {
      method: "POST",
      body: JSON.stringify({
        targetModuleId: "m-agent-memory",
        consent: { actionType: "exchange" },
      }),
    });
    expect(status).toBe(201);
    expect(body.status).toBe("Requested");
    expect(body.exchangeId).toMatch(/^EX-\d{4}-\d+$/);
  });

  it("创建交换：缺 consent → 422（INV-08）", async () => {
    const { status } = await json("/api/exchanges", {
      method: "POST",
      body: JSON.stringify({ targetModuleId: "m-agent-memory" }),
    });
    expect(status).toBe(422);
  });

  it("接受（Requested→Accepted）：返回更新后的详情", async () => {
    // EX-2024-8843 初始为 Requested。
    const { status, body } = await json("/api/exchanges/EX-2024-8843/accept", {
      method: "POST",
    });
    expect(status).toBe(200);
    expect(body.status).toBe("Accepted");
  });

  it("非法迁移（已 Accepted 的交换再 accept）→ 409", async () => {
    // EX-2024-8842 初始为 Accepted。
    const { status } = await json("/api/exchanges/EX-2024-8842/accept", {
      method: "POST",
    });
    expect(status).toBe(409);
  });

  it("中止：缺原因 → 400；带原因 → Cancelled", async () => {
    const miss = await json("/api/exchanges/EX-2024-8843/cancel", {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(miss.status).toBe(400);
    const ok = await json("/api/exchanges/EX-2024-8843/cancel", {
      method: "POST",
      body: JSON.stringify({ reason: "不再需要" }),
    });
    expect(ok.status).toBe(200);
    expect(ok.body.status).toBe("Cancelled");
  });
});

describe("社交信号 + 举报写端点（API-049~051）", () => {
  const server = setupServer(...communityHandlers);
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => {
    server.resetHandlers();
    __resetCommunityRuntime();
  });
  afterAll(() => server.close());

  it("收藏 toggle：{ favorited, favoriteCount } 且计数随切换变化", async () => {
    const on = await json("/api/modules/m-agent-memory/favorite", {
      method: "POST",
      body: JSON.stringify({ toggle: true }),
    });
    expect(on.body.favorited).toBe(true);
    const off = await json("/api/modules/m-agent-memory/favorite", {
      method: "POST",
      body: JSON.stringify({ toggle: true }),
    });
    expect(off.body.favorited).toBe(false);
    expect(off.body.favoriteCount).toBe(on.body.favoriteCount - 1);
  });

  it("认可：{ endorsed, endorsementCount }", async () => {
    const { status, body } = await json("/api/users/rag-builder/endorse", {
      method: "POST",
    });
    expect(status).toBe(200);
    expect(body.endorsed).toBe(true);
    expect(typeof body.endorsementCount).toBe("number");
  });

  it("不能认可自己 → 400", async () => {
    const { status } = await json("/api/users/knowledge-trader/endorse", {
      method: "POST",
    });
    expect(status).toBe(400);
  });

  it("举报：合法 → 201 { id, status:'pending' }；缺字段 → 400", async () => {
    const ok = await json("/api/reports", {
      method: "POST",
      body: JSON.stringify({
        targetType: "module",
        targetId: "m-agent-memory",
        reason: "疑似含敏感内容",
      }),
    });
    expect(ok.status).toBe(201);
    expect(ok.body.status).toBe("pending");
    const bad = await json("/api/reports", {
      method: "POST",
      body: JSON.stringify({ targetType: "module" }),
    });
    expect(bad.status).toBe(400);
  });
});

describe("反馈端点统一到 POST /api/feedback（API-013 / DEC-018）", () => {
  const server = setupServer(...trustHandlers);
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterAll(() => server.close());

  it("editable 资格 + 五维齐全 → { ok:true, exchangeId }", async () => {
    const { status, body } = await json("/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        exchangeId: "EX-2024-9001",
        scores: {
          checklistConsistency: 5,
          privacyBoundary: 5,
          structureClarity: 5,
          usefulness: 5,
          rebuyIntent: 5,
        },
      }),
    });
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.exchangeId).toBe("EX-2024-9001");
  });

  it("五维缺失 → 422 { missing }", async () => {
    const { status, body } = await json("/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        exchangeId: "EX-2024-9001",
        scores: { usefulness: 5 },
      }),
    });
    expect(status).toBe(422);
    expect(Array.isArray(body.missing)).toBe(true);
    expect(body.missing.length).toBeGreaterThan(0);
  });

  it("缺 exchangeId → 400", async () => {
    const { status } = await json("/api/feedback", {
      method: "POST",
      body: JSON.stringify({ scores: {} }),
    });
    expect(status).toBe(400);
  });
});
