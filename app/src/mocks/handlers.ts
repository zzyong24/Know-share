import { http, HttpResponse, type RequestHandler } from "msw";
import { modules, manifests, topics } from "./fixtures/modules";
import { exchanges } from "./fixtures/exchanges";
import { users } from "./fixtures/users";
import { session, demoSession } from "./fixtures/session";
import {
  trustProfiles,
  agentSkills,
  notifications,
  usageStats,
  reviewQueue,
  auditLog,
} from "./fixtures/misc";
import type {
  KnowledgeModule,
  SearchSuggestion,
  TrustLevel,
} from "@/lib/types";
// 各模块 handlers（阶段11批次2 并行产出，集成 pass 在此汇总；单一真源）
import { moduleDetailHandlers } from "./handlers/module-detail";
import { submissionHandlers } from "./handlers/submission";
import { exchangeHandlers } from "./handlers/exchange";
import { trustHandlers } from "./handlers/trust-feedback";
import { agentSkillsHandlers } from "./handlers/agent-skills";
import { accountHandlers } from "./handlers/account";
import { adminHandlers } from "./handlers/admin";
import { aboutHandlers } from "./handlers/about";

/*
  MSW 请求处理器（MOCK_DATA_SPEC / MOCK-001~020）。
  代表性 handlers，返回上面 fixtures；接口形状为占位，阶段 15 对齐 SERVICE_CONTRACT（ASM-067/111）。
  单一真源：所有页面/组件从同一 mocks 取数，禁止各模块内联自造（守跨模块一致）。
*/

const TRUST_RANK: Record<TrustLevel, number> = { high: 3, medium: 2, low: 1, new: 0 };
const verifiedOwners = new Set(users.filter((u) => u.verified).map((u) => u.login));

/** 发现页服务端筛选 + 排序（MOCK-002 含空状态；ASM-017 维度）。 */
function filterAndSortModules(url: URL): KnowledgeModule[] {
  const sp = url.searchParams;
  const types = sp.getAll("type"); // ENT-003.type（这里以 status 占位类型枚举）
  const topicsSel = sp.getAll("topic");
  const trustLevels = sp.getAll("trustLevel") as TrustLevel[];
  const verifiedOnly = sp.get("verifiedOnly") === "true";
  const q = (sp.get("q") ?? "").trim().toLowerCase();
  const sort = sp.get("sort") ?? "relevance";
  const forceEmpty = sp.get("empty") === "true"; // 测试/演示空注册表（MOCK-002）

  if (forceEmpty) return [];

  let items = modules.slice();
  if (q) {
    items = items.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.summary.toLowerCase().includes(q) ||
        m.topics.some((t) => t.toLowerCase().includes(q))
    );
  }
  if (types.length) items = items.filter((m) => types.includes(m.status));
  if (topicsSel.length)
    items = items.filter((m) => m.topics.some((t) => topicsSel.includes(t)));
  if (trustLevels.length)
    items = items.filter((m) => trustLevels.includes(m.trustLevel));
  if (verifiedOnly) items = items.filter((m) => verifiedOwners.has(m.ownerLogin));

  const sorters: Record<string, (a: KnowledgeModule, b: KnowledgeModule) => number> = {
    relevance: () => 0,
    latest: (a, b) => modules.indexOf(a) - modules.indexOf(b),
    popular: (a, b) => b.favoriteCount - a.favoriteCount,
    trust: (a, b) => TRUST_RANK[b.trustLevel] - TRUST_RANK[a.trustLevel],
  };
  items.sort(sorters[sort] ?? sorters.relevance);
  return items;
}

export const handlers: RequestHandler[] = [
  // 会话：开发 mock 默认登录态（demoSession，含管理员角色），便于走通公开/私域/审核全站演示。
  // 真实身份以 GitHub 为准（DEC-006）；session=null 的匿名分支由各模块测试用自有 setupServer 覆盖。
  // 置于最前 → 覆盖各模块 handlers 内自带的 /api/session，保证全站会话一致。
  http.get("/api/session", () => HttpResponse.json(demoSession)),

  // 各模块 handlers 优先于下方通用占位（模块路由更丰富，如交换台账筛选/详情/披露）。
  ...moduleDetailHandlers,
  ...submissionHandlers,
  ...exchangeHandlers,
  ...trustHandlers,
  ...agentSkillsHandlers,
  ...accountHandlers,
  ...adminHandlers,
  ...aboutHandlers,

  // 模块（MOCK-001/002）：支持 type/topic/trustLevel/verifiedOnly/q/sort/empty
  http.get("/api/modules", ({ request }) => {
    const items = filterAndSortModules(new URL(request.url));
    return HttpResponse.json({ items, total: items.length });
  }),
  http.get("/api/modules/:id", ({ params }) => {
    const m = modules.find((x) => x.id === params.id);
    return m ? HttpResponse.json(m) : new HttpResponse(null, { status: 404 });
  }),
  http.get("/api/modules/:id/manifest", ({ params }) => {
    const man = manifests.find((x) => x.moduleId === params.id);
    return man ? HttpResponse.json(man) : new HttpResponse(null, { status: 404 });
  }),

  // 主题（发现筛选）
  http.get("/api/topics", () => HttpResponse.json({ items: topics })),

  // 交换（MOCK-005/006/007）
  http.get("/api/exchanges", () =>
    HttpResponse.json({ items: exchanges, total: exchanges.length })
  ),
  http.get("/api/exchanges/:id", ({ params }) => {
    const ex = exchanges.find((x) => x.id === params.id);
    return ex ? HttpResponse.json(ex) : new HttpResponse(null, { status: 404 });
  }),

  // 信任档案（MOCK-008/009）
  http.get("/api/trust/:login", ({ params }) => {
    const tp = trustProfiles.find((x) => x.login === params.login);
    return tp ? HttpResponse.json(tp) : new HttpResponse(null, { status: 404 });
  }),

  // 技能（MOCK-011）
  http.get("/api/skills", () => HttpResponse.json({ items: agentSkills })),

  // 通知（MOCK-014）
  http.get("/api/notifications", () =>
    HttpResponse.json({ items: notifications })
  ),

  // 平台统计（MOCK-018）
  http.get("/api/stats/usage", () => HttpResponse.json({ items: usageStats })),

  // 审核台（MOCK-016，仅管理员）
  http.get("/api/admin/review-queue", () =>
    HttpResponse.json({ items: reviewQueue })
  ),
  http.get("/api/admin/audit", () => HttpResponse.json({ items: auditLog })),

  // 搜索联想（COMP-003）
  http.get("/api/search/suggest", ({ request }) => {
    const q = (new URL(request.url).searchParams.get("q") ?? "").toLowerCase();
    const items: SearchSuggestion[] = [
      ...modules
        .filter((m) => m.title.toLowerCase().includes(q))
        .map((m) => ({
          type: "module" as const,
          id: m.id,
          label: m.title,
          href: `/modules/${m.id}`,
        })),
      ...users
        .filter((u) => u.login.toLowerCase().includes(q))
        .map((u) => ({
          type: "user" as const,
          id: u.id,
          label: `@${u.login}`,
          href: `/u/${u.login}`,
        })),
    ].slice(0, 8);
    return HttpResponse.json({ items });
  }),

  // 全局搜索结果（PAGE-003）：按 q 解析为四类实体分组（FR-001）。
  http.get("/api/search", ({ request }) => {
    const q = (new URL(request.url).searchParams.get("q") ?? "").trim().toLowerCase();
    if (!q) {
      return HttpResponse.json({
        modules: [],
        topics: [],
        users: [],
        exchanges: [],
        counts: { modules: 0, topics: 0, users: 0, exchanges: 0 },
      });
    }
    const moduleResults = modules.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.summary.toLowerCase().includes(q) ||
        m.topics.some((t) => t.toLowerCase().includes(q))
    );
    const topicResults = topics.filter((t) => t.label.toLowerCase().includes(q));
    const userResults = users
      .filter((u) => u.login.toLowerCase().includes(q) || u.domains.some((d) => d.toLowerCase().includes(q)))
      .map((u) => ({
        login: u.login,
        avatarUrl: u.avatarUrl,
        githubVerified: u.verified,
        trustScore: u.trustScore,
        domainTags: u.domains,
      }));
    const viewerLogin = session?.login ?? demoSession.login;
    const exchangeResults = exchanges
      .filter((e) => e.targetModuleTitle.toLowerCase().includes(q))
      .map((e) => ({
        id: e.id,
        direction:
          e.requesterLogin === viewerLogin
            ? ("outgoing" as const)
            : ("incoming" as const),
        status: e.status,
        updatedAt: e.updatedAt,
        targetModuleTitle: e.targetModuleTitle,
      }));
    return HttpResponse.json({
      modules: moduleResults,
      topics: topicResults,
      users: userResults,
      exchanges: exchangeResults,
      counts: {
        modules: moduleResults.length,
        topics: topicResults.length,
        users: userResults.length,
        exchanges: exchangeResults.length,
      },
    });
  }),
];
