/*
  exchange 模块 MSW handlers（PAGE-030 台账 + PAGE-031 详情 + 披露/交付写动作）。
  导出 exchangeHandlers，供本模块页面测试自包含 setupServer 使用；不改聚合器 handlers.ts。
  - 台账：匿名可看脱敏行（INV-04）；支持 status 分组 / topic / q / sort 筛选。
  - 详情：按会话身份派生 viewerRole + 披露区门控（INV-03）。
  - 会话：本模块演示登录态为参与方 @knowledge-trader（驱动 Accepted 后披露场景）。
*/
import { http, HttpResponse, type RequestHandler } from "msw";
import { exchanges } from "@/mocks/fixtures/exchanges";
import {
  buildExchangeDetail,
  ledgerRows,
  ledgerTopics,
  myContactsSeed,
} from "@/mocks/fixtures/exchange";
import { LEDGER_STATUS_GROUPS } from "@/lib/queries/exchange";
import type { Session } from "@/lib/types";
import type {
  ExchangeDetail,
  ExchangeDisclosureSnapshot,
  ExchangeLedgerRow,
} from "@/lib/queries/exchange";
import type { ExchangeStatus } from "@/lib/types";

/** 本模块演示会话：登录为 @knowledge-trader（EX-2024-8846 的请求方，可演示披露门控）。 */
const exchangeSession: Session = {
  login: "knowledge-trader",
  avatarUrl: "https://avatars.example.com/knowledge-trader.png",
  isAdmin: false,
  verified: true,
};

/** 运行期可变披露状态（仅本进程；演示「披露→撤回」语义 ASM-013）。 */
const disclosureState = new Map<string, ExchangeDisclosureSnapshot>();

/** 运行期状态覆盖（演示 accept/reject/cancel 写动作的状态迁移；仅本进程）。 */
const statusOverride = new Map<string, ExchangeStatus>();

/** 运行期新建交换计数（演示创建 → 生成脱敏号）。 */
let createSeq = 9100;

/** 合法状态迁移（W-2 子集；非法 → 409，ASM-120 守语义不违背）。 */
const ACCEPT_FROM: ExchangeStatus[] = ["Requested"];
const REJECT_FROM: ExchangeStatus[] = ["Requested"];
const CANCEL_FROM: ExchangeStatus[] = [
  "Requested",
  "Accepted",
  "PrivatePreparing",
];

/** 测试间重置运行期状态（afterEach 可调用，避免跨用例污染）。 */
export function __resetExchangeRuntime() {
  disclosureState.clear();
  statusOverride.clear();
  createSeq = 9100;
}

/** 应用运行期状态覆盖到 detail（accept/reject/cancel 后的展示态）。 */
function withRuntimeStatus(detail: ExchangeDetail): ExchangeDetail {
  const next = statusOverride.get(detail.exchangeId);
  return next ? { ...detail, status: next } : detail;
}

/**
  通用状态迁移（W-2）：校验当前有效态在 allowedFrom 内，否则 409；写运行期覆盖；
  返回更新后的 ExchangeDetail（含运行期披露/状态）。未知 id → 404。
*/
function transition(
  id: string,
  allowedFrom: ExchangeStatus[],
  next: ExchangeStatus
) {
  const ex = exchanges.find((x) => x.id === id);
  if (!ex) return new HttpResponse(null, { status: 404 });
  const current = statusOverride.get(id) ?? ex.status;
  if (!allowedFrom.includes(current)) {
    return HttpResponse.json(
      { error: "illegal-transition", message: `不可从 ${current} 迁移。` },
      { status: 409 }
    );
  }
  statusOverride.set(id, next);
  const detail = buildExchangeDetail(ex, exchangeSession.login);
  return HttpResponse.json(
    withRuntimeStatus(withRuntimeDisclosure(detail))
  );
}

function filterLedger(url: URL): ExchangeLedgerRow[] {
  const sp = url.searchParams;
  const status = sp.get("status"); // active|completed|unfulfilled
  const topic = sp.get("topic");
  const q = (sp.get("q") ?? "").trim().toLowerCase();
  const sort = sp.get("sort") ?? "latest";
  const forceEmpty = sp.get("empty") === "true";
  if (forceEmpty) return [];

  let rows = ledgerRows.slice();

  // 审核中/已标记交换：公开面隐藏争议明细——这里直接不在公开台账列出（ASM-032/FLOW-005）。
  rows = rows.filter((r) => r.status !== "Flagged" && r.status !== "InReview");

  if (status && LEDGER_STATUS_GROUPS[status]) {
    const allowed = new Set(LEDGER_STATUS_GROUPS[status]);
    rows = rows.filter((r) => allowed.has(r.status));
  }
  if (topic) rows = rows.filter((r) => r.topics.includes(topic));
  if (q)
    rows = rows.filter(
      (r) =>
        r.targetModuleName.toLowerCase().includes(q) ||
        r.topics.some((t) => t.toLowerCase().includes(q))
    );

  if (sort === "mostActive") {
    rows.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  } else {
    rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  return rows;
}

/** 注入运行期披露状态到详情。 */
function withRuntimeDisclosure(detail: ExchangeDetail): ExchangeDetail {
  const snap = disclosureState.get(detail.exchangeId);
  if (!snap) return detail;
  return {
    ...detail,
    disclosure: { ...detail.disclosure, myDisclosure: snap },
  };
}

export const exchangeHandlers: RequestHandler[] = [
  // 会话（详情私域动作的角色判断）。
  http.get("/api/session", () => HttpResponse.json(exchangeSession)),

  // 公开台账（PAGE-030）：脱敏行 + 可筛主题。匿名可看（INV-04）。
  http.get("/api/exchanges", ({ request }) => {
    const items = filterLedger(new URL(request.url));
    return HttpResponse.json({
      items,
      total: items.length,
      topics: ledgerTopics,
    });
  }),

  // 交换详情（PAGE-031）：按会话身份派生 viewerRole + 披露门控（INV-03）+ 运行期状态/披露覆盖。
  http.get("/api/exchanges/:id", ({ params }) => {
    const ex = exchanges.find((x) => x.id === params.id);
    if (!ex) return new HttpResponse(null, { status: 404 });
    const detail = buildExchangeDetail(ex, exchangeSession.login);
    return HttpResponse.json(withRuntimeStatus(withRuntimeDisclosure(detail)));
  }),

  // 创建交换请求（API-019 / ASM-120）：目标 Published + 可选自有模块；缺 consent → 422（INV-08）。
  // body: { targetModuleId, offeredModuleId?, consent: { actionType:"exchange" } }
  // 响应：{ exchangeId, status:"Requested" }（201）。
  http.post("/api/exchanges", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      targetModuleId?: string;
      offeredModuleId?: string;
      consent?: { actionType?: string };
    };
    if (!body.consent || body.consent.actionType !== "exchange") {
      return HttpResponse.json(
        { error: "consent-required", missing: ["consent"] },
        { status: 422 }
      );
    }
    if (!body.targetModuleId) {
      return HttpResponse.json(
        { error: "target-required", missing: ["targetModuleId"] },
        { status: 400 }
      );
    }
    const exchangeId = `EX-${new Date().getFullYear()}-${createSeq++}`;
    return HttpResponse.json(
      { exchangeId, status: "Requested" as ExchangeStatus },
      { status: 201 }
    );
  }),

  // 目标所有者接受（API-020）：Requested→Accepted；非法迁移 → 409（W-2）。
  http.post("/api/exchanges/:id/accept", ({ params }) =>
    transition(String(params.id), ACCEPT_FROM, "Accepted")
  ),

  // 目标所有者拒绝（API-021）：Requested→Rejected；非法 → 409。
  http.post("/api/exchanges/:id/reject", ({ params }) =>
    transition(String(params.id), REJECT_FROM, "Rejected")
  ),

  // 参与方中止（API-022）：必填原因；合法态 → Cancelled；非法 → 409。
  http.post("/api/exchanges/:id/cancel", async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as { reason?: string };
    if (!body.reason?.trim()) {
      return HttpResponse.json({ error: "reason-required" }, { status: 400 });
    }
    return transition(String(params.id), CANCEL_FROM, "Cancelled");
  }),

  // 披露联系方式（仅 Accepted+ 参与方；写 Consent → 生成快照 ENT-009）。
  http.post("/api/exchanges/:id/disclose", async ({ params, request }) => {
    const ex = exchanges.find((x) => x.id === params.id);
    if (!ex) return new HttpResponse(null, { status: 404 });
    const body = (await request.json().catch(() => ({}))) as {
      types?: string[];
      consent?: boolean;
    };
    if (!body.consent) return new HttpResponse(null, { status: 400 });
    const types = body.types ?? [];
    const contacts = myContactsSeed
      .filter((c) => types.includes(c.type))
      .map((c) => ({ type: c.type, label: c.label, value: c.masked }));
    disclosureState.set(String(params.id), {
      contacts,
      disclosedAt: new Date().toISOString().slice(0, 10),
    });
    const detail = buildExchangeDetail(ex, exchangeSession.login);
    return HttpResponse.json(withRuntimeDisclosure(detail));
  }),

  // 撤回披露（仅停止未来披露；已披露快照仍对对方可见 ASM-013）。
  http.post("/api/exchanges/:id/revoke", ({ params }) => {
    const ex = exchanges.find((x) => x.id === params.id);
    if (!ex) return new HttpResponse(null, { status: 404 });
    disclosureState.delete(String(params.id));
    const detail = buildExchangeDetail(ex, exchangeSession.login);
    return HttpResponse.json(detail);
  }),

  // 标记为已交付（己方确认；双方确认才转 Completed INV-06，此处仅记录）。
  http.post("/api/exchanges/:id/mark-delivered", ({ params }) => {
    const ex = exchanges.find((x) => x.id === params.id);
    if (!ex) return new HttpResponse(null, { status: 404 });
    const detail = buildExchangeDetail(ex, exchangeSession.login);
    return HttpResponse.json(detail);
  }),
];

/** 匿名会话变体（公开面测试用：spectator 无披露）。 */
export const anonymousSessionHandler: RequestHandler = http.get(
  "/api/session",
  () => HttpResponse.json(null)
);
