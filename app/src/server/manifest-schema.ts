/*
  Know-share Manifest 上传契约（know-share-manifest@1）—— Agent 原生发布的格式规范单一真源。

  两份产物，配对维护：
  - `manifestUploadSchema`（zod，.strict()）：写 API 的服务端校验。strict 拒绝任何额外键
    —— 这是 INV-01/03 的 schema 边界：contact / 原始内容 / 私有 URL 等字段一律不被接受。
  - `MANIFEST_JSON_SCHEMA`：对 agent 发布的 JSON Schema（GET /api/manifest-schema），
    供本机 Skill 的 validate 与自描述使用。与 zod 同字段，保持同步。

  设计不变量：
  - 平台只接收「脱敏清单」：计数（source_stats）、要点、主题、脱敏说明，绝无原始知识内容（INV-01）。
  - 联系方式从不进 manifest（默认私密、披露仅在 Accepted 后对该次对方，DEC-010/INV-03）。
  - 无任何经济字段（DEC-007）。
*/
import { z } from "zod";

export const MANIFEST_SCHEMA_VERSION = "know-share-manifest@1";

/** 来源计数（非内容）：笔记/链接/文件/字数的规模信号。 */
const sourceStatsSchema = z
  .object({
    notes: z.number().int().nonnegative().optional(),
    links: z.number().int().nonnegative().optional(),
    files: z.number().int().nonnegative().optional(),
    words: z.number().int().nonnegative().optional(),
  })
  .strict();

/** 上传清单契约（strict：多余键即拒，守 INV-01/03 边界）。 */
export const manifestUploadSchema = z
  .object({
    /** 可选 slug（仅引用；平台另发 uuid 主键） */
    id: z.string().trim().max(120).optional(),
    title: z.string().trim().min(1).max(200),
    summary: z.string().trim().min(1).max(2000),
    topics: z.array(z.string().trim().min(1).max(60)).min(1).max(20),
    tags: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
    language: z.string().trim().max(20).optional(),
    source_types: z.array(z.string().trim().min(1).max(60)).min(1).max(20),
    source_stats: sourceStatsSchema.optional(),
    freshness: z.string().trim().max(60).optional(),
    sensitivity: z.enum(["low", "medium", "high"]),
    covered_questions: z.array(z.string().trim().min(1).max(300)).max(30).optional(),
    redaction_notes: z.string().trim().min(1).max(2000),
    content_commitment: z.string().trim().max(2000).optional(),
    privacy_boundary: z.string().trim().max(2000).optional(),
    exchange_intent: z.string().trim().max(60).optional(),
    license: z.string().trim().max(120).optional(),
    updated_at: z.string().trim().max(40).optional(),
    version: z.string().trim().min(1).max(40),
  })
  .strict();

export type ManifestUpload = z.infer<typeof manifestUploadSchema>;

/** 对 agent 发布的 JSON Schema（draft-07）。与 manifestUploadSchema 同字段。 */
export const MANIFEST_JSON_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://know-share/schema/know-share-manifest-1.json",
  title: "Know-share Manifest",
  description:
    "脱敏知识模块清单上传契约。平台只接收脱敏清单（计数/要点/主题/脱敏说明），" +
    "绝无原始内容（INV-01）；联系方式从不进 manifest（DEC-010/INV-03）；无经济字段（DEC-007）。",
  type: "object",
  additionalProperties: false,
  required: ["title", "summary", "topics", "source_types", "sensitivity", "redaction_notes", "version"],
  properties: {
    id: { type: "string", maxLength: 120, description: "可选 slug，仅引用" },
    title: { type: "string", minLength: 1, maxLength: 200 },
    summary: { type: "string", minLength: 1, maxLength: 2000, description: "脱敏摘要，非原始内容" },
    topics: { type: "array", minItems: 1, maxItems: 20, items: { type: "string", minLength: 1, maxLength: 60 } },
    tags: { type: "array", maxItems: 30, items: { type: "string", minLength: 1, maxLength: 60 } },
    language: { type: "string", maxLength: 20 },
    source_types: { type: "array", minItems: 1, maxItems: 20, items: { type: "string", minLength: 1, maxLength: 60 } },
    source_stats: {
      type: "object",
      additionalProperties: false,
      description: "来源计数（非内容）",
      properties: {
        notes: { type: "integer", minimum: 0 },
        links: { type: "integer", minimum: 0 },
        files: { type: "integer", minimum: 0 },
        words: { type: "integer", minimum: 0 },
      },
    },
    freshness: { type: "string", maxLength: 60 },
    sensitivity: { type: "string", enum: ["low", "medium", "high"] },
    covered_questions: { type: "array", maxItems: 30, items: { type: "string", minLength: 1, maxLength: 300 } },
    redaction_notes: { type: "string", minLength: 1, maxLength: 2000, description: "已做的脱敏说明" },
    content_commitment: { type: "string", maxLength: 2000 },
    privacy_boundary: { type: "string", maxLength: 2000 },
    exchange_intent: { type: "string", maxLength: 60 },
    license: { type: "string", maxLength: 120 },
    updated_at: { type: "string", maxLength: 40 },
    version: { type: "string", minLength: 1, maxLength: 40 },
  },
} as const;
