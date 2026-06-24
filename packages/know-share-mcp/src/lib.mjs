/*
  know-share 本机 Skill 核心库（零依赖 ESM）。
  分工：语义部分（标题/摘要/主题）由调用方 agent 的 LLM 填；本库做确定性机械部分——
  本地扫描计数、正则隐私检测、脱敏、Manifest 组装/校验、上传。
  守 INV-01：findings 绝不回显命中的原始私有值（只给类别 + 文件位置）。
*/

/** 隐私规则（与平台 evaluateScan 对齐的本机前置）。severity：block 阻断、warn 提示。 */
export const PRIVACY_RULES = [
  { category: "secret/credential", severity: "block", re: /(?:api[_-]?key|secret|password|token|密钥)\s*[:=]\s*\S+/gi },
  { category: "secret/credential", severity: "block", re: /\b(?:ghp|gho|github_pat)_[A-Za-z0-9_]{20,}\b/g },
  { category: "secret/credential", severity: "block", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { category: "email", severity: "warn", re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  { category: "private-url", severity: "warn", re: /https?:\/\/[^\s]*\.(?:internal|local|corp)[^\s]*/gi },
  { category: "path", severity: "warn", re: /(?:\/Users\/|\/home\/|[A-Za-z]:\\)[^\s'"]+/g },
];

const SEVERITY_RANK = { pass: 0, warn: 1, block: 2 };

/** 扫描一段文本，返回脱敏 findings（无原始命中值）。locationRef 由调用方给（文件名）。 */
export function scanText(text, locationRef = "content") {
  const findings = [];
  for (const rule of PRIVACY_RULES) {
    const matches = text.match(rule.re);
    if (matches && matches.length) {
      findings.push({
        ruleCategory: rule.category,
        severity: rule.severity,
        locationRef,
        count: matches.length,
        suggestion:
          rule.severity === "block"
            ? "移除疑似凭据/密钥后再发布。"
            : "用类别描述替换具体值（如邮箱/路径/私有链接）。",
        explanation: `检出 ${matches.length} 处「${rule.category}」（原始命中已隐藏，INV-01）。`,
      });
    }
  }
  return findings;
}

/** 用占位符替换命中片段（本机脱敏；不改语义结构）。 */
export function redactText(text) {
  let out = text;
  for (const rule of PRIVACY_RULES) {
    out = out.replace(rule.re, `[REDACTED:${rule.category}]`);
  }
  return out;
}

function countWords(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  // 中英文混合：CJK 按字计、其余按空白分词。
  const cjk = (trimmed.match(/[一-鿿]/g) || []).length;
  const nonCjk = trimmed.replace(/[一-鿿]/g, " ").trim();
  const words = nonCjk ? nonCjk.split(/\s+/).filter(Boolean).length : 0;
  return cjk + words;
}

function countLinks(text) {
  return (text.match(/https?:\/\/\S+/g) || []).length;
}

/**
  扫描一组文件（{name, text}），汇总来源计数 + 脱敏 findings + 总体级别。
  纯函数（不读盘）：CLI 负责把目录读成 files 传入，便于测试。
*/
export function scanFiles(files) {
  let words = 0;
  let links = 0;
  const findings = [];
  for (const f of files) {
    words += countWords(f.text);
    links += countLinks(f.text);
    findings.push(...scanText(f.text, f.name));
  }
  const overall = findings.reduce(
    (acc, f) => (SEVERITY_RANK[f.severity] > SEVERITY_RANK[acc] ? f.severity : acc),
    "pass"
  );
  return {
    sourceStats: { files: files.length, words, links, notes: files.length },
    findings,
    overall,
  };
}

/**
  组装上传用 Manifest。语义字段（title/summary/topics/source_types/sensitivity）由 agent 给；
  source_stats / redaction_notes 由扫描结果派生。绝不放 contact/原文（守 INV-01/03）。
*/
export function buildManifest(semantic, scan, nowIso) {
  const redactedCount = scan.findings.filter((f) => f.severity !== "pass").length;
  const autoNote =
    redactedCount > 0
      ? `本机扫描检出并需脱敏 ${redactedCount} 处敏感片段（邮箱/路径/私有链接/疑似密钥）。`
      : "本机扫描未检出敏感片段；摘要为人工/agent 泛化产出。";
  return {
    title: semantic.title,
    summary: semantic.summary,
    topics: semantic.topics,
    source_types: semantic.source_types,
    source_stats: scan.sourceStats,
    sensitivity: semantic.sensitivity || "medium",
    redaction_notes: semantic.redaction_notes
      ? `${semantic.redaction_notes} ${autoNote}`.trim()
      : autoNote,
    version: semantic.version || "1.0.0",
    updated_at: nowIso || new Date().toISOString().slice(0, 10),
    ...(semantic.covered_questions ? { covered_questions: semantic.covered_questions } : {}),
    ...(semantic.tags ? { tags: semantic.tags } : {}),
    ...(semantic.language ? { language: semantic.language } : {}),
  };
}

/** 极简 JSON Schema 校验（required + additionalProperties:false + 基本 type/enum）。 */
export function validateManifest(manifest, schema) {
  const errors = [];
  if (typeof manifest !== "object" || manifest === null) {
    return { valid: false, errors: ["manifest 必须是对象"] };
  }
  for (const req of schema.required || []) {
    if (!(req in manifest) || manifest[req] == null || manifest[req] === "") {
      errors.push(`缺少必填字段：${req}`);
    }
  }
  if (schema.additionalProperties === false) {
    for (const key of Object.keys(manifest)) {
      if (!schema.properties[key]) {
        errors.push(`不允许的字段：${key}（守 INV-01/03 边界）`);
      }
    }
  }
  for (const [key, val] of Object.entries(manifest)) {
    const spec = schema.properties[key];
    if (!spec) continue;
    if (spec.enum && !spec.enum.includes(val)) {
      errors.push(`${key} 必须是 ${spec.enum.join("/")} 之一`);
    }
    if (spec.type === "array" && !Array.isArray(val)) {
      errors.push(`${key} 必须是数组`);
    }
    if (spec.type === "string" && typeof val !== "string") {
      errors.push(`${key} 必须是字符串`);
    }
  }
  return { valid: errors.length === 0, errors };
}

/** 上传 Manifest 到平台 POST /api/submissions（GitHub 细粒度 token）。 */
export async function uploadManifest(manifest, { apiBase, token, fetchImpl } = {}) {
  const doFetch = fetchImpl || fetch;
  if (!apiBase) throw new Error("缺少 apiBase（平台地址）");
  if (!token) throw new Error("缺少 token（GitHub 细粒度 token）");
  const res = await doFetch(`${apiBase.replace(/\/$/, "")}/api/submissions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ manifest }),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}
