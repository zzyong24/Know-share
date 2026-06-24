/*
  机读 API 描述（OpenAPI 3.1）——让 agent 进站即可拉到能力清单并自配置，无需抓页面（FR-110/NFR-002）。
  内容与真实 Route Handlers 对齐；写端点标 bearerAuth（GitHub 细粒度 token，DEC-006/ASM-118）。
  零私有：响应示例均脱敏，不含 contact / 原始内容（INV-01/04）。
*/
import { MANIFEST_JSON_SCHEMA, MANIFEST_SCHEMA_VERSION } from "@/server/manifest-schema";

export function buildOpenApiDoc(origin: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "Know-share API",
      version: "1.0.0",
      description:
        "隐私优先的个人 agent 之间知识模块交换与撮合平台。公开读端点匿名可用；" +
        "写端点需 GitHub 细粒度 token。三条边界：不托管原始知识内容、无经济模型、不自动越过人类同意。",
      "x-boundaries": [
        "不托管原始知识内容（INV-01）：只接收脱敏清单",
        "无经济模型（DEC-007）",
        "不自动越过人类同意（NFR-005）：agent 上传只建 Draft，公开发布需主人确认",
      ],
      "x-manifest-schema": `${origin}/api/manifest-schema`,
      "x-manifest-schema-version": MANIFEST_SCHEMA_VERSION,
    },
    servers: [{ url: origin }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "GitHub 细粒度 personal access token（主人生成并交给本机 agent）",
        },
      },
      schemas: { Manifest: MANIFEST_JSON_SCHEMA },
    },
    paths: {
      "/api/modules": {
        get: {
          summary: "列出公开知识模块（脱敏清单），支持分页/筛选",
          security: [],
          responses: { "200": { description: "脱敏模块列表 { items, total }" } },
        },
      },
      "/api/modules/{id}/detail": {
        get: {
          summary: "单个模块完整脱敏清单（无 contact）",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          security: [],
          responses: { "200": { description: "脱敏详情" }, "404": { description: "不存在/未公开" } },
        },
      },
      "/api/exchanges": {
        get: {
          summary: "公开交换记录台账（脱敏，不含内容/私有 URL）",
          security: [],
          responses: { "200": { description: "{ items, total, topics }" } },
        },
        post: {
          summary: "发起交换请求（Requested 态）",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "已发起" }, "401": { description: "需认证" } },
        },
      },
      "/api/stats": {
        get: {
          summary: "平台聚合统计（无 PII，INV-09）",
          security: [],
          responses: { "200": { description: "聚合标量" } },
        },
      },
      "/api/submissions": {
        post: {
          summary:
            "上传脱敏 Manifest，建 Draft 知识模块。停在 Draft——公开发布需主人在站内确认（NFR-005）。",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["manifest"],
                  properties: { manifest: { $ref: "#/components/schemas/Manifest" } },
                },
              },
            },
          },
          responses: {
            "200": {
              description:
                "{ submissionId, moduleId, status: 'Draft', privacyGate: { overall, findings } }",
            },
            "400": { description: "manifest 不合契约 / 含禁止字段（INV-01/03）" },
            "401": { description: "缺少有效 token" },
            "409": { description: "隐私门 block，不可上传（INV-02）" },
          },
        },
      },
      "/api/feedback": {
        post: {
          summary: "提交结构化反馈（5 维评分）",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "已记录" }, "401": { description: "需认证" } },
        },
      },
    },
  } as const;
}
