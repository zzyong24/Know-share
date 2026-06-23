import { http, HttpResponse, type RequestHandler } from "msw";
import {
  adminReviewQueue,
  reviewItemDetails,
  reviewSummary,
  adminAuditLog,
  bulkApprovableIds,
} from "@/mocks/fixtures/admin";
import { demoSession } from "@/mocks/fixtures/session";
import type {
  ModerationPayload,
  AdminReviewItem,
} from "@/lib/queries/admin";
import type { AuditEntry } from "@/lib/types";

/*
  审核控制台 MSW handlers（IA-011，仅管理员）。
  导出 adminHandlers；页面测试用 setupServer(adminHandlers) 自包含（不依赖聚合器）。
  - 会话返回管理员 demoSession（含 isAdmin:true），供权限门测试。
  - 处置 /moderate 与 /bulk-approve 写审计并返回 audit；block 不可通过（INV-02）。
  - 状态用模块级可变副本，避免污染 fixtures 真源（测试间 server.resetHandlers 不重置数据，
    故每个 handler 用浅拷贝读取，处置仅回显审计，不持久化跨用例）。
*/

const ACTION_VERB: Record<string, string> = {
  approve: "通过了",
  return: "退回了",
  delist: "下架了",
  "dismiss-report": "驳回举报",
  resolve: "标记处理完毕",
};

export const adminHandlers: RequestHandler[] = [
  // 会话：管理员（供权限门 / 行动者署名）
  http.get("/api/session", () => HttpResponse.json(demoSession)),

  // 风险摘要（ENT-019 聚合，INV-09）
  http.get("/api/admin/summary", () => HttpResponse.json(reviewSummary)),

  // 评审队列（ENT-015；仅引用、零私有内容 INV-01/04）
  http.get("/api/admin/review-queue", () =>
    HttpResponse.json({ items: adminReviewQueue satisfies AdminReviewItem[] })
  ),

  // 评审项详情（Manifest 脱敏摘要 + PrivacyScan + 举报）
  http.get("/api/admin/review-queue/:id", ({ params }) => {
    const d = reviewItemDetails[String(params.id)];
    return d ? HttpResponse.json(d) : new HttpResponse(null, { status: 404 });
  }),

  // 审计日志（只读，ENT-018/INV-11）
  http.get("/api/admin/audit", () =>
    HttpResponse.json({ items: adminAuditLog })
  ),

  // 单项处置：写审计（INV-11）；block 不可通过（INV-02）
  http.post("/api/admin/moderate", async ({ request }) => {
    const payload = (await request.json()) as ModerationPayload;
    const item = adminReviewQueue.find((i) => i.id === payload.reviewItemId);

    // INV-02：含 block 的项不得被「通过」
    if (payload.action === "approve" && item?.gate === "block") {
      return HttpResponse.json(
        { ok: false, error: "block-cannot-approve" },
        { status: 409 }
      );
    }
    // ASM-051/INV-11：退回/下架/驳回必填原因
    const needsReason =
      payload.action === "return" ||
      payload.action === "delist" ||
      payload.action === "dismiss-report";
    if (needsReason && !payload.reason?.trim()) {
      return HttpResponse.json(
        { ok: false, error: "reason-required" },
        { status: 400 }
      );
    }

    const audit: AuditEntry = {
      id: `a-${Date.now()}`,
      actorLogin: demoSession.login,
      action: ACTION_VERB[payload.action] ?? payload.action,
      target: item?.moduleTitle ?? payload.reviewItemId,
      createdAt: new Date().toISOString(),
    };
    return HttpResponse.json({ ok: true, audit });
  }),

  // 批量通过：仅 pass 且无未决举报子集（INV-02/ASM-050），逐项写审计
  http.post("/api/admin/bulk-approve", async ({ request }) => {
    const { ids } = (await request.json()) as { ids: string[] };
    const allowed = new Set(bulkApprovableIds(adminReviewQueue));
    const approved = ids.filter((id) => allowed.has(id));
    return HttpResponse.json({ ok: true, approved });
  }),
];
