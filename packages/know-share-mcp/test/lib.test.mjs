import { test } from "node:test";
import assert from "node:assert/strict";
import {
  scanText,
  redactText,
  scanFiles,
  buildManifest,
  validateManifest,
  uploadManifest,
} from "../src/lib.mjs";

const SCHEMA = {
  required: ["title", "summary", "topics", "source_types", "sensitivity", "redaction_notes", "version"],
  additionalProperties: false,
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

test("scanText 检出密钥/邮箱，且 finding 不回显原始命中值（INV-01）", () => {
  const text = "联系 alice@example.com，api_key=SUPER_SECRET_123";
  const findings = scanText(text, "notes.md");
  const cats = findings.map((f) => f.ruleCategory);
  assert.ok(cats.includes("secret/credential"));
  assert.ok(cats.includes("email"));
  // 任一 finding 都不得包含原始命中值
  const serialized = JSON.stringify(findings);
  assert.ok(!serialized.includes("SUPER_SECRET_123"));
  assert.ok(!serialized.includes("alice@example.com"));
});

test("redactText 用占位符替换敏感片段", () => {
  const red = redactText("token=ABC123 邮箱 bob@x.com 路径 /Users/bob/notes");
  assert.ok(red.includes("[REDACTED:secret/credential]"));
  assert.ok(red.includes("[REDACTED:email]"));
  assert.ok(red.includes("[REDACTED:path]"));
  assert.ok(!red.includes("ABC123"));
});

test("scanFiles 汇总计数 + 含密钥时 overall=block", () => {
  const r = scanFiles([
    { name: "a.md", text: "一些 笔记 内容 http://x.com/page" },
    { name: "b.md", text: "password: hunter2" },
  ]);
  assert.equal(r.sourceStats.files, 2);
  assert.ok(r.sourceStats.words > 0);
  assert.equal(r.sourceStats.links, 1);
  assert.equal(r.overall, "block");
});

test("buildManifest 派生 source_stats/redaction_notes，且无 contact 字段", () => {
  const scan = scanFiles([{ name: "a.md", text: "bob@x.com" }]);
  const m = buildManifest(
    { title: "T", summary: "脱敏摘要", topics: ["a"], source_types: ["notes"], sensitivity: "low" },
    scan,
    "2026-06-24"
  );
  assert.equal(m.title, "T");
  assert.deepEqual(m.source_stats, scan.sourceStats);
  assert.ok(m.redaction_notes.includes("脱敏") || m.redaction_notes.includes("敏感"));
  assert.ok(!("contact" in m));
  assert.equal(m.updated_at, "2026-06-24");
});

test("validateManifest：合法通过；缺必填/多余字段（contact）被拒", () => {
  const base = {
    title: "T",
    summary: "S",
    topics: ["a"],
    source_types: ["notes"],
    sensitivity: "low",
    redaction_notes: "已脱敏",
    version: "1.0.0",
  };
  assert.equal(validateManifest(base, SCHEMA).valid, true);

  const missing = { ...base };
  delete missing.summary;
  assert.equal(validateManifest(missing, SCHEMA).valid, false);

  const extra = { ...base, contact: { type: "email", value: "a@b.com" } };
  const r = validateManifest(extra, SCHEMA);
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => e.includes("contact")));

  const badEnum = { ...base, sensitivity: "ultra" };
  assert.equal(validateManifest(badEnum, SCHEMA).valid, false);
});

test("uploadManifest 发 Bearer + { manifest } 到 /api/submissions", async () => {
  let captured;
  const fakeFetch = async (url, init) => {
    captured = { url, init };
    return { json: async () => ({ submissionId: "s1", moduleId: "m1", status: "Draft" }) , status: 200 };
  };
  const r = await uploadManifest(
    { title: "T" },
    { apiBase: "https://ks.app/", token: "tok123", fetchImpl: fakeFetch }
  );
  assert.equal(captured.url, "https://ks.app/api/submissions");
  assert.equal(captured.init.headers.authorization, "Bearer tok123");
  assert.deepEqual(JSON.parse(captured.init.body), { manifest: { title: "T" } });
  assert.equal(r.status, 200);
  assert.equal(r.body.status, "Draft");
});

test("uploadManifest 缺 token/apiBase 报错", async () => {
  await assert.rejects(() => uploadManifest({}, { apiBase: "x" }));
  await assert.rejects(() => uploadManifest({}, { token: "t" }));
});
