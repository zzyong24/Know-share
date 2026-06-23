/*
  MSW 请求处理器 — trust-feedback 模块（PAGE-040~043 / COMP-110~119）。
  导出 trustHandlers，供页面测试自包含 setupServer(trustHandlers) 使用；
  不改全局聚合器（src/mocks/handlers.ts）。接口形状为占位，阶段 15 对齐 SERVICE_CONTRACT（ASM-067）。
  零私有内容（INV-04）；统计无 PII（INV-09）；无经济元素（DEC-007）。
*/
import { http, HttpResponse, type RequestHandler } from "msw";
import {
  trustProfileAggregate,
  trustNetwork,
  feedbackEligibility,
} from "../fixtures/trust-feedback";

export const trustHandlers: RequestHandler[] = [
  // PAGE-040 信任档案聚合（公开匿名可看，INV-04）
  http.get("/api/trust-profiles/:login", ({ params }) => {
    const login = String(params.login);
    const profile = trustProfileAggregate(login);
    return profile
      ? HttpResponse.json(profile)
      : new HttpResponse(null, { status: 404 });
  }),

  // PAGE-043 信任网络索引（筛选/排序；topic/minTier/verifiedOnly/q/empty）
  http.get("/api/trust-network", ({ request }) =>
    HttpResponse.json(trustNetwork(new URL(request.url)))
  ),

  // PAGE-042 反馈资格/上下文（仅 WaitingForFeedback 参与方可提交）。
  // GET 资格上下文为前端表单专用（后端无对应 GET，MSW 提供演示语境）。
  http.get("/api/exchanges/:id/feedback", ({ params }) =>
    HttpResponse.json(feedbackEligibility(String(params.id)))
  ),

  // PAGE-042 提交结构化反馈（FLOW-004；统一契约 API-013 POST /api/feedback，body 带 exchangeId）。
  // 服务端二次校验资格/唯一性/状态（NFR-006）。
  http.post("/api/feedback", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      exchangeId?: string;
      scores?: Record<string, number>;
    };
    const id = String(body.exchangeId ?? "");
    if (!id) {
      return HttpResponse.json(
        { error: "invalid-payload", missing: ["exchangeId"] },
        { status: 400 }
      );
    }
    const eligibility = feedbackEligibility(id);
    // 资格守卫：仅 editable 可写（NFR-006）
    if (eligibility.submissionState !== "editable") {
      return HttpResponse.json(
        { error: "INELIGIBLE", message: "当前交换不可提交反馈。" },
        { status: 409 }
      );
    }
    const scores = body.scores ?? {};
    // 五维必填校验（与前端一致；后端为权威）
    const REQUIRED = [
      "checklistConsistency",
      "privacyBoundary",
      "structureClarity",
      "usefulness",
      "rebuyIntent",
    ];
    const missing = REQUIRED.filter((k) => scores[k] == null);
    if (missing.length) {
      return HttpResponse.json(
        { error: "VALIDATION", missing },
        { status: 422 }
      );
    }
    return HttpResponse.json({ ok: true, exchangeId: id });
  }),
];
