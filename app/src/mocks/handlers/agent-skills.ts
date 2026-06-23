/*
  MSW 请求处理器（agent-skills 模块特有）。导出 agentSkillsHandlers 数组，由编排者接入聚合器（不改聚合器）。
  端点：
    GET /api/skills/catalog            —— 技能目录全集（ENT-016 全字段；PAGE-050）。
    GET /api/skills/catalog/:slug      —— 单个技能详情（PAGE-051 深链 /skills/:skillId）。
    GET /api/skills/catalog?empty=true —— 空目录（PAGE-050 空态演示/测试）。
  返回平台只读目录数据，零私有内容（INV-01/INV-04）；命令/配置仅占位路径，不含真实路径/密钥/私有 URL。
  注：聚合器已有 GET /api/skills（最小投影）；本模块用 /api/skills/catalog 承载完整目录，互不覆盖。
*/
import { http, HttpResponse, type RequestHandler } from "msw";
import {
  agentSkillCatalog,
  findSkillBySlug,
  supportedSources,
  privacyFlowSteps,
  exampleCommands,
  MCP_CONFIG_JSON,
  SKILL_INSTALL_TEXT,
  corePrinciple,
} from "../fixtures/agent-skills";

export const agentSkillsHandlers: RequestHandler[] = [
  http.get("/api/skills/catalog", ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get("empty") === "true") {
      return HttpResponse.json({
        skills: [],
        sources: supportedSources,
        flowSteps: privacyFlowSteps,
        exampleCommands,
        install: { mcpConfig: MCP_CONFIG_JSON, skillInstallText: SKILL_INSTALL_TEXT },
        corePrinciple,
      });
    }
    if (url.searchParams.get("error") === "true") {
      return new HttpResponse(null, { status: 500 });
    }
    return HttpResponse.json({
      skills: agentSkillCatalog,
      sources: supportedSources,
      flowSteps: privacyFlowSteps,
      exampleCommands,
      install: { mcpConfig: MCP_CONFIG_JSON, skillInstallText: SKILL_INSTALL_TEXT },
      corePrinciple,
    });
  }),

  http.get("/api/skills/catalog/:slug", ({ params }) => {
    const skill = findSkillBySlug(String(params.slug));
    return skill
      ? HttpResponse.json(skill)
      : new HttpResponse(null, { status: 404 });
  }),
];
