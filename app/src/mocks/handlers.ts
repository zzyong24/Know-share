import { http, HttpResponse, type RequestHandler } from "msw";
import { modules, manifests, topics } from "./fixtures/modules";
import { exchanges } from "./fixtures/exchanges";
import { users } from "./fixtures/users";
import {
  trustProfiles,
  agentSkills,
  notifications,
  usageStats,
  reviewQueue,
  auditLog,
} from "./fixtures/misc";
import type { SearchSuggestion } from "@/lib/types";

/*
  MSW 请求处理器（MOCK_DATA_SPEC / MOCK-001~020）。
  代表性 handlers，返回上面 fixtures；接口形状为占位，阶段 15 对齐 SERVICE_CONTRACT（ASM-067/111）。
  单一真源：所有页面/组件从同一 mocks 取数，禁止各模块内联自造（守跨模块一致）。
*/
export const handlers: RequestHandler[] = [
  // 模块（MOCK-001/002）
  http.get("/api/modules", () =>
    HttpResponse.json({ items: modules, total: modules.length })
  ),
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
];
