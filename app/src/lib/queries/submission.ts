/*
  提交向导 query / mutation hooks（PAGE-020~024 / COMP-070~078）。
  本文件「本地」承载提交模块的扩展领域类型（勿改 lib/types.ts）与 query-key（勿改 lib/query-keys.ts）。
  取数/提交统一走 TanStack Query + apiFetch（对接 MSW submissionHandlers，阶段 15 对齐 SERVICE_CONTRACT）。
  数据最小化：所有形状不含原始知识内容 / 私有路径 / 凭据（NFR-001/INV-01）。
*/
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { AgentSkill, PrivacyResult } from "@/lib/types";

// ── 本地 query-key（不写入全局 lib/query-keys.ts，ASM-027）──────────
export const submissionKeys = {
  all: ["submission"] as const,
  draft: (id: string | null) => ["submission", "draft", id ?? "new"] as const,
  skills: ["submission", "skills"] as const,
} as const;

// ── 第 1 步：来源类型（ENT-003 草稿字段；对齐 LIGHT_DOMAIN_MODEL 外部引用）──
export type SourceType =
  | "obsidian"
  | "logseq"
  | "notion"
  | "markdown"
  | "yuque"
  | "feishu-doc"
  | "local-folder"
  | "custom";

export interface Step1Value {
  title: string;
  oneLineIntent: string;
  moduleType: string;
  sourceTypes: SourceType[];
}

// ── 第 2 步：Manifest 草稿（ENT-004；对齐 examples/knowledge-module.manifest.json）──
export interface ManifestDraft {
  id: string;
  title: string;
  summary: string;
  topics: string[];
  tags?: string[];
  language?: string;
  owner_handle?: string;
  /** DEC-010：联系方式默认私密，公开面从不展示；仅在校验时标注 */
  contact?: { type: string; value: string };
  exchange_intent?: string;
  sensitivity: string;
  covered_questions?: string[];
  source_types: string[];
  freshness?: string;
  redaction_notes: string;
  private_exchange_options?: string[];
  license?: string;
  updated_at: string;
  version?: string;
}

// ── 第 3 步：隐私扫描（ENT-005；HARD-01 规则类别；INV-01/02）──────────
export type FindingSeverity = PrivacyResult; // pass | warn | block

export type RuleCategory =
  | "secret/credential"
  | "email"
  | "path"
  | "private-url"
  | "long-excerpt"
  | "third-party-pii"
  | "contact-exposure";

export interface PrivacyFindingDetail {
  ruleCategory: RuleCategory;
  severity: FindingSeverity;
  /** 指向 Manifest 字段 / 位置，绝不回显原始私有值全文（INV-01/INV-04） */
  locationRef: string;
  suggestion: string;
  explanation: string;
}

export interface PrivacyScanResult {
  findings: PrivacyFindingDetail[];
  sensitivityDeclaration: string;
  overallStatus: FindingSeverity; // 取最严重级别
  scannedAt: string;
  scannerVersion: string;
}

// ── 同意门（ENT-021；三同意门 ASM-029/INV-08）────────────────────────
export type ConsentAction = "generate" | "submit" | "contact" | "exchange";

export interface ConsentRef {
  id?: string;
  actionType: ConsentAction;
  scope: string;
  at?: string;
}

// ── 提交草稿（ENT-006 Submission；外壳跨步状态）──────────────────────
export interface SubmissionDraft {
  id: string;
  status: "Draft";
  step: 1 | 2 | 3 | 4 | 5;
  module: Step1Value;
  manifest: ManifestDraft | null;
  privacyScan: PrivacyScanResult | null;
  consents: {
    generateScope?: ConsentRef;
    privacy?: ConsentRef;
    publicSubmit?: ConsentRef;
  };
  /** gate-stale 检测：隐私门后 Manifest 改动则旧扫描/同意失效（ASM-083） */
  manifestHashAtScan?: string;
  updatedAt: string;
}

export interface SubmitResult {
  id: string;
  status: "Submitted" | "InReview";
  privacyOverall: "pass" | "warn";
  submittedAt: string;
}

// ── 草稿：恢复 / 新建（COMP-070）────────────────────────────────────
export function useSubmissionDraft(submissionId: string | null) {
  return useQuery({
    queryKey: submissionKeys.draft(submissionId),
    queryFn: () =>
      apiFetch<SubmissionDraft>(
        submissionId ? `/api/submissions/${submissionId}` : "/api/submissions/draft"
      ),
  });
}

// ── 本机可用 Agent 技能 / MCP（ENT-016；COMP-073）──────────────────
export function useSubmissionSkills() {
  return useQuery({
    queryKey: submissionKeys.skills,
    queryFn: () => apiFetch<{ items: AgentSkill[] }>("/api/submissions/skills"),
  });
}

// ── 隐私扫描（本机执行，平台仅收脱敏 findings，ASM-028/INV-01）────────
export function useRunPrivacyScan() {
  return useMutation({
    mutationFn: (manifest: ManifestDraft) =>
      apiFetch<PrivacyScanResult>("/api/submissions/privacy-scan", {
        method: "POST",
        // 仅发送脱敏 Manifest；原始私有值从不离开本机（INV-01）
        body: JSON.stringify({ manifest }),
      }),
  });
}

// ── 提交（写 Consent + AuditLog；Draft→Submitted；INV-08/INV-11/NFR-006）─
export function useSubmitSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { submissionId: string; consent: ConsentRef }) =>
      apiFetch<SubmitResult>(`/api/submissions/${payload.submissionId}/submit`, {
        method: "POST",
        body: JSON.stringify({ consent: payload.consent }),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: submissionKeys.draft(vars.submissionId) });
    },
  });
}

// ── 客户端结构校验（client schema，不等同隐私门；PAGE-021）────────────
const REQUIRED_MANIFEST_FIELDS = [
  "id",
  "title",
  "summary",
  "topics",
  "source_types",
  "sensitivity",
  "redaction_notes",
  "updated_at",
] as const;

export interface StructureResult {
  valid: boolean;
  fieldErrors: Record<string, string>;
  /** 含 contact.value 时给出「默认私密」提示（DEC-010/INV-03），不阻断校验 */
  contactNotice?: string;
}

/** 解析 + 结构校验 Manifest JSON 文本（PAGE-021 验收）。 */
export function validateManifestStructure(jsonText: string): {
  parsed: ManifestDraft | null;
  result: StructureResult;
} {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonText) as Record<string, unknown>;
  } catch {
    return {
      parsed: null,
      result: { valid: false, fieldErrors: { _json: "JSON 解析失败：请检查语法。" } },
    };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      parsed: null,
      result: { valid: false, fieldErrors: { _json: "Manifest 必须是 JSON 对象。" } },
    };
  }

  const fieldErrors: Record<string, string> = {};
  for (const f of REQUIRED_MANIFEST_FIELDS) {
    const v = parsed[f];
    if (v === undefined || v === null || v === "") {
      fieldErrors[f] = `缺少必填字段「${f}」。`;
    } else if ((f === "topics" || f === "source_types") && !Array.isArray(v)) {
      fieldErrors[f] = `字段「${f}」需为数组。`;
    } else if (
      (f === "topics" || f === "source_types") &&
      Array.isArray(v) &&
      v.length === 0
    ) {
      fieldErrors[f] = `字段「${f}」至少需要一项。`;
    }
  }

  const contact = parsed.contact as { value?: string } | undefined;
  const contactNotice =
    contact && contact.value
      ? "联系方式默认私密，仅在交换被接受后对对方披露，不随公开清单展示（DEC-010）。"
      : undefined;

  const valid = Object.keys(fieldErrors).length === 0;
  return {
    parsed: valid ? (parsed as unknown as ManifestDraft) : null,
    result: { valid, fieldErrors, contactNotice },
  };
}
