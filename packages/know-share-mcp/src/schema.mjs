/*
  Manifest 校验 schema 的本地副本（镜像平台 /api/manifest-schema，know-share-manifest@1）。
  validate 优先用 --api 拉取线上 schema（无漂移）；离线时回退本副本。
*/
export const MANIFEST_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Know-share Manifest",
  type: "object",
  additionalProperties: false,
  required: ["title", "summary", "topics", "source_types", "sensitivity", "redaction_notes", "version"],
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    summary: { type: "string" },
    topics: { type: "array" },
    tags: { type: "array" },
    language: { type: "string" },
    source_types: { type: "array" },
    source_stats: { type: "object" },
    freshness: { type: "string" },
    sensitivity: { type: "string", enum: ["low", "medium", "high"] },
    covered_questions: { type: "array" },
    redaction_notes: { type: "string" },
    content_commitment: { type: "string" },
    privacy_boundary: { type: "string" },
    exchange_intent: { type: "string" },
    license: { type: "string" },
    updated_at: { type: "string" },
    version: { type: "string" },
  },
};
