/*
  MSW 请求处理器（module-detail 模块特有）。导出 moduleDetailHandlers 数组，由编排者接入聚合器。
  端点：GET /api/modules/:id/detail —— 详情页聚合（ENT-003 + ENT-004 + owner + trust + privacy）。
  返回零私有内容；contact 字段虽在 fullManifest 中（模拟 API 误传），前端 ManifestPreview 屏蔽（INV-03/ASM-024）。
*/
import { http, HttpResponse, type RequestHandler } from "msw";
import { buildModuleDetail } from "../fixtures/module-detail";

export const moduleDetailHandlers: RequestHandler[] = [
  http.get("/api/modules/:id/detail", ({ params }) => {
    const detail = buildModuleDetail(String(params.id));
    return detail
      ? HttpResponse.json(detail)
      : new HttpResponse(null, { status: 404 });
  }),
];
