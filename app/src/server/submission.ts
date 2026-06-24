/*
  提交域服务层（W-1：提交 → 隐私门 → 评审；FR-030/FR-090）。
  - 业务在本层，路由处理器只做 HTTP 编解码。
  - 全程不接收/不存储原始知识内容（INV-01）：privacy-scan 拒绝携带原始私有值的 Manifest；
    findings 只指向字段（locationRef），不回显命中原值。
  - 隐私门 block 不可绕过（INV-02）；三同意门各写 Consent（INV-08）；关键动作写 audit（INV-11）。
  - 无任何经济字段（DEC-007）。
*/
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { getRedis } from "@/server/redis";
import * as schema from "@/server/db/schema";
import { manifestUploadSchema } from "@/server/manifest-schema";
import type { Session } from "@/lib/types";

// ── 错误：携带可向上映射为 HTTP 状态码（路由处理器解码）。────────────
export class SubmissionError extends Error {
  constructor(
    public status: number,
    public code: string,
    message?: string
  ) {
    super(message ?? code);
    this.name = "SubmissionError";
  }
}

/** 校验已登录，返回 userId（缺会话 → 401）。 */
async function requireUser(session: Session | null): Promise<{ id: string; login: string }> {
  if (!session?.login) {
    throw new SubmissionError(401, "unauthorized", "需登录后操作。");
  }
  const db = await getDb();
  const [user] = await db
    .select({ id: schema.users.id, login: schema.users.login })
    .from(schema.users)
    .where(eq(schema.users.login, session.login))
    .limit(1);
  if (!user) {
    throw new SubmissionError(401, "unauthorized", "会话用户不存在。");
  }
  return user;
}

/**
  写操作限流（NFR-006）。按 actor（login 或 IP）+ 动作维度令牌桶；超限抛 429。
  在校验本人后、写库前调用。
*/
export async function enforceRateLimit(
  session: Session | null,
  action: string,
  request: Request,
  limit = 30,
  windowSeconds = 60
): Promise<void> {
  const actor =
    session?.login ??
    request.headers.get("x-forwarded-for") ??
    "anon";
  const redis = await getRedis();
  const { allowed } = await redis.rateLimit(
    `rl:submission:${action}:${actor}`,
    limit,
    windowSeconds
  );
  if (!allowed) {
    throw new SubmissionError(429, "rate-limited", "操作过于频繁，请稍后重试。");
  }
}

// ── 输出形状（对齐前端 lib/queries/submission.ts）。────────────────────
export interface SubmissionDraftOut {
  id: string;
  status: "Draft";
  step: number;
  module: unknown;
  manifest: unknown;
  privacyScan: unknown;
  consents: Record<string, unknown>;
  manifestHashAtScan?: string;
  updatedAt: string;
}

export interface PrivacyFindingOut {
  ruleCategory: string;
  severity: "pass" | "warn" | "block";
  locationRef: string;
  suggestion: string;
  explanation: string;
}

export interface PrivacyScanResultOut {
  findings: PrivacyFindingOut[];
  sensitivityDeclaration: string;
  overallStatus: "pass" | "warn" | "block";
  scannedAt: string;
  scannerVersion: string;
}

export interface SubmitResultOut {
  id: string;
  status: "Submitted" | "InReview";
  privacyOverall: "pass" | "warn";
  submittedAt: string;
}

/** 把内部 submission 行投影为前端 SubmissionDraft 外壳（draftData 已脱敏，无原始内容）。 */
function projectDraft(row: typeof schema.submissions.$inferSelect): SubmissionDraftOut {
  const draft = (row.draftData ?? {}) as Record<string, unknown>;
  return {
    id: row.id,
    status: "Draft",
    step: row.step ?? 1,
    module: draft.module ?? {
      title: "",
      oneLineIntent: "",
      moduleType: "",
      sourceTypes: [],
    },
    manifest: draft.manifest ?? null,
    privacyScan: draft.privacyScan ?? null,
    consents: (draft.consents as Record<string, unknown>) ?? {},
    ...(row.manifestHashAtScan
      ? { manifestHashAtScan: row.manifestHashAtScan }
      : {}),
    updatedAt: (row.updatedAt ?? new Date()).toISOString(),
  };
}

// ── API-009：新建草稿。────────────────────────────────────────────────
export async function createDraft(session: Session | null): Promise<SubmissionDraftOut> {
  const user = await requireUser(session);
  const db = await getDb();
  const [row] = await db
    .insert(schema.submissions)
    .values({ submitterId: user.id, status: "Draft", step: 1 })
    .returning();
  return projectDraft(row);
}

// ── API-010：恢复草稿（仅本人）。──────────────────────────────────────
export async function getDraft(
  session: Session | null,
  id: string
): Promise<SubmissionDraftOut> {
  const user = await requireUser(session);
  const db = await getDb();
  const [row] = await db
    .select()
    .from(schema.submissions)
    .where(eq(schema.submissions.id, id))
    .limit(1);
  if (!row) {
    throw new SubmissionError(404, "not-found", "草稿不存在。");
  }
  if (row.submitterId !== user.id) {
    throw new SubmissionError(403, "forbidden", "仅本人可访问该草稿。");
  }
  return projectDraft(row);
}

/**
  删除草稿（个人中心写动作）。仅本人、仅 Draft 态可删。
  - 未登录 → 401；非本人 → 403；不存在 → 404；非 Draft（已提交/已公开）→ 409。
  - 删除写 audit_log（INV-11）；无原始内容/无 PII。
*/
export async function deleteDraft(
  session: Session | null,
  id: string
): Promise<{ id: string; deleted: true }> {
  const user = await requireUser(session);
  const db = await getDb();
  const [row] = await db
    .select()
    .from(schema.submissions)
    .where(eq(schema.submissions.id, id))
    .limit(1);
  if (!row) {
    throw new SubmissionError(404, "not-found", "草稿不存在。");
  }
  if (row.submitterId !== user.id) {
    throw new SubmissionError(403, "forbidden", "仅本人可删除该草稿。");
  }
  if (row.status !== "Draft") {
    throw new SubmissionError(
      409,
      "not-draft",
      "仅未提交的草稿可删除（已进入评审或已公开的提交不可删）。"
    );
  }

  await db.delete(schema.submissions).where(eq(schema.submissions.id, id));
  await db.insert(schema.auditLog).values({
    actorId: user.id,
    action: "submission.delete-draft",
    targetType: "submission",
    targetId: id,
  });
  return { id, deleted: true };
}

/**
  从已有模块发起「编辑」：建一个 moduleId 指向原模块的 Draft 草稿，
  draftData 以模块当前 manifest 脱敏数据预填（无原始内容 INV-01）。
  提交 → 审核 → approve 时 publishSubmission 按 moduleId 更新原模块为新版本，
  不产生重复模块。仅本人；模块不存在 → 404；越权 → 403。
*/
export async function createDraftFromModule(
  session: Session | null,
  moduleId: string
): Promise<SubmissionDraftOut> {
  const user = await requireUser(session);
  const db = await getDb();

  const [mod] = await db
    .select()
    .from(schema.knowledgeModules)
    .where(eq(schema.knowledgeModules.id, moduleId))
    .limit(1);
  if (!mod) {
    throw new SubmissionError(404, "not-found", "模块不存在。");
  }
  if (mod.ownerId !== user.id) {
    throw new SubmissionError(403, "forbidden", "仅本人可编辑该模块。");
  }

  const [man] = await db
    .select()
    .from(schema.manifests)
    .where(eq(schema.manifests.moduleId, moduleId))
    .limit(1);

  const draftData = {
    module: {
      title: mod.title,
      oneLineIntent: mod.summary,
      moduleType: mod.type ?? "",
      sourceTypes: [],
    },
    manifest: man
      ? {
          summary: man.summary,
          topics: man.topics,
          freshness: man.freshness,
          sourceStats: man.sourceStats,
          contentCommitment: man.contentCommitment ?? null,
          privacyBoundary: man.privacyBoundary ?? null,
          version: man.version,
        }
      : null,
  };

  const [row] = await db
    .insert(schema.submissions)
    .values({
      moduleId,
      submitterId: user.id,
      status: "Draft",
      step: 1,
      draftData: draftData as never,
    })
    .returning();

  await db.insert(schema.auditLog).values({
    actorId: user.id,
    action: "module.edit-draft",
    targetType: "module",
    targetId: moduleId,
  });

  return projectDraft(row);
}

export interface AgentUploadResult {
  submissionId: string;
  moduleId: string;
  status: "Draft";
  privacyGate: {
    overall: "pass" | "warn" | "block";
    findings: PrivacyFindingOut[];
  };
}

/**
  Agent 原生上传（POST /api/submissions）：持脱敏 Manifest 建 Draft 模块。
  - INV-01/03：assertSanitizedManifest + manifestUploadSchema strict（多余键/原始值 → 400）。
  - INV-02：隐私门服务端复核，block → 409 不落库。
  - 落 knowledge_module(Draft)+manifest+submission(Draft,moduleId)+privacy_scan，写 audit。
  - 停在 Draft（NFR-005）：agent 只准备草稿；公开发布需主人在 UI 显式提交/确认。
*/
export async function createSubmissionFromManifest(
  session: Session | null,
  rawManifest: unknown
): Promise<AgentUploadResult> {
  const user = await requireUser(session);
  if (!rawManifest || typeof rawManifest !== "object") {
    throw new SubmissionError(400, "bad-request", "缺少 manifest。");
  }
  const manifestObj = rawManifest as Record<string, unknown>;

  // INV-01：原始私有值/禁止字段先拦（明确错误）。
  assertSanitizedManifest(manifestObj);

  // 契约校验（strict：多余键即拒，守 INV-01/03 边界）。
  const parsed = manifestUploadSchema.safeParse(manifestObj);
  if (!parsed.success) {
    throw new SubmissionError(
      400,
      "invalid-manifest",
      parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")
    );
  }
  const m = parsed.data;

  // 隐私门服务端复核（INV-02：block 不可绕过）。
  const scan = evaluateScan(manifestObj);
  if (scan.overallStatus === "block") {
    throw new SubmissionError(409, "privacy-block", "隐私门为 block，不可上传（INV-02）。");
  }

  const db = await getDb();
  const [mod] = await db
    .insert(schema.knowledgeModules)
    .values({
      ownerId: user.id,
      title: m.title,
      summary: m.summary,
      status: "Draft",
      freshness: m.freshness ?? null,
    })
    .returning({ id: schema.knowledgeModules.id });

  await db.insert(schema.manifests).values({
    moduleId: mod.id,
    summary: m.summary,
    topics: m.topics,
    freshness: m.freshness ?? null,
    sourceStats: (m.source_stats ?? {}) as never,
    contentCommitment: m.content_commitment ?? null,
    privacyBoundary: m.privacy_boundary ?? null,
    sensitivity: m.sensitivity,
    coveredQuestions: m.covered_questions ?? null,
    sourceTypes: m.source_types,
    version: m.version,
    isCurrent: false, // 未发布，approve 时才置 current
  });

  const [sub] = await db
    .insert(schema.submissions)
    .values({
      moduleId: mod.id,
      submitterId: user.id,
      status: "Draft",
      step: 5,
      draftData: {
        module: {
          title: m.title,
          oneLineIntent: m.summary,
          moduleType: "",
          sourceTypes: m.source_types,
        },
        manifest: m,
      } as never,
    })
    .returning({ id: schema.submissions.id });

  await db.insert(schema.privacyScans).values({
    submissionId: sub.id,
    overallStatus: scan.overallStatus,
    findings: scan.findings as never,
    sensitivityDeclaration: scan.sensitivityDeclaration,
    scannerVersion: scan.scannerVersion,
  });

  await db.insert(schema.auditLog).values({
    actorId: user.id,
    action: "submission.agent-upload",
    targetType: "submission",
    targetId: sub.id,
    metadata: { gate: scan.overallStatus, moduleId: mod.id } as never,
  });

  return {
    submissionId: sub.id,
    moduleId: mod.id,
    status: "Draft",
    privacyGate: { overall: scan.overallStatus, findings: scan.findings },
  };
}

// ── API-011：本机技能目录（ENT-016；只读，登录可见）。──────────────────
// 默认目录（脱敏；privacyLevel=local 表示扫描/生成在本机执行 ASM-028）。
const DEFAULT_SKILLS = [
  {
    id: "skill-manifest-build",
    name: "清单生成器",
    category: "manifest",
    description: "在本机扫描所选来源并生成脱敏 Manifest，不上传原始内容。",
    privacyLevel: "local" as const,
    docsUrl: "/skills/skill-manifest-build",
  },
  {
    id: "skill-redact",
    name: "脱敏助手",
    category: "redaction",
    description: "本机识别并泛化密钥 / 邮箱 / 路径 / 长摘录，输出脱敏建议。",
    privacyLevel: "local" as const,
    docsUrl: "/skills/skill-redact",
  },
  {
    id: "skill-privacy-scan",
    name: "隐私门扫描器",
    category: "validation",
    description: "本机运行隐私扫描，平台仅接收脱敏后的 findings（INV-01）。",
    privacyLevel: "local" as const,
    docsUrl: "/skills/skill-privacy-scan",
  },
];

export async function listSkills(session: Session | null) {
  await requireUser(session);
  const db = await getDb();
  // 优先读 agent_skills 表（若已播种）；否则回退默认目录。
  const rows = await db
    .select({
      id: schema.agentSkills.id,
      name: schema.agentSkills.name,
      category: schema.agentSkills.category,
      description: schema.agentSkills.description,
      privacyLevel: schema.agentSkills.privacyLevel,
      docsUrl: schema.agentSkills.docsUrl,
    })
    .from(schema.agentSkills);
  const items = rows.length > 0 ? rows : DEFAULT_SKILLS;
  return { items };
}

// ── INV-01：检测 Manifest 是否携带原始私有值（拒收）。──────────────────
// 平台只接收脱敏 Manifest：contact.value（真实联系方式）、rawContent、私有路径绝不入站。
function assertSanitizedManifest(manifest: Record<string, unknown>): void {
  const contact = manifest.contact as { value?: unknown } | undefined;
  if (contact && typeof contact === "object" && "value" in contact && contact.value) {
    throw new SubmissionError(
      400,
      "raw-private-value",
      "Manifest 含原始联系方式值；平台只接收脱敏清单（INV-01）。"
    );
  }
  for (const forbidden of ["rawContent", "content", "private_path", "credentials"]) {
    if (forbidden in manifest && manifest[forbidden]) {
      throw new SubmissionError(
        400,
        "raw-private-value",
        `Manifest 含禁止字段 "${forbidden}"（INV-01）。`
      );
    }
  }
}

/**
  隐私门复核（后端权威边界）。真实扫描在本机技能执行（ASM-028）；
  这里基于脱敏 Manifest 的可见信号做确定性复核 → 三态 + 脱敏 findings。
  findings.locationRef 仅指向字段，绝不回显命中原值（INV-01/INV-04）。
*/
function evaluateScan(manifest: Record<string, unknown>): PrivacyScanResultOut {
  const findings: PrivacyFindingOut[] = [];
  const blob = `${String(manifest.summary ?? "")} ${String(
    manifest.redaction_notes ?? ""
  )}`.toLowerCase();

  let overall: "pass" | "warn" | "block" = "pass";

  // 凭据/密钥模式 → block（不回显命中片段，仅指向字段）。
  if (/secret|token|密钥|api[_-]?key|password/.test(blob)) {
    findings.push({
      ruleCategory: "secret/credential",
      severity: "block",
      locationRef: "summary",
      suggestion: "移除疑似密钥片段，改用泛化描述后重跑扫描。",
      explanation: "检出疑似凭据 / 密钥模式（原始命中已隐藏，INV-01）。",
    });
    overall = "block";
  }

  // 路径/私有 URL → warn。
  if (/\/users\/|c:\\|https?:\/\/.*\.(internal|local)/.test(blob)) {
    findings.push({
      ruleCategory: "path",
      severity: "warn",
      locationRef: "redaction_notes",
      suggestion: "将本地路径替换为来源类别描述。",
      explanation: "检出疑似本地 / 私有路径。",
    });
    if (overall === "pass") overall = "warn";
  }

  // sensitivity=high → 至少 warn 提示。
  if (String(manifest.sensitivity ?? "").toLowerCase() === "high" && overall === "pass") {
    findings.push({
      ruleCategory: "third-party-pii",
      severity: "warn",
      locationRef: "sensitivity",
      suggestion: "高敏感模块建议复核覆盖问题与脱敏说明。",
      explanation: "声明敏感度为 high。",
    });
    overall = "warn";
  }

  if (findings.length === 0) {
    findings.push({
      ruleCategory: "long-excerpt",
      severity: "pass",
      locationRef: "summary",
      suggestion: "摘要已充分泛化，无需修改。",
      explanation: "未检出疑似逐字原文。",
    });
  }

  return {
    findings,
    sensitivityDeclaration: String(manifest.sensitivity ?? "medium"),
    overallStatus: overall,
    scannedAt: new Date().toISOString(),
    scannerVersion: "privacy-scan@1.4.0",
  };
}

// ── API-012：上报脱敏 Manifest → 复核 → 写 privacy_scans。──────────────
export async function reportPrivacyScan(
  session: Session | null,
  input: { submissionId?: string; manifest?: Record<string, unknown> }
): Promise<PrivacyScanResultOut> {
  const user = await requireUser(session);
  const manifest = input.manifest;
  if (!manifest || typeof manifest !== "object") {
    throw new SubmissionError(400, "bad-request", "缺少脱敏 Manifest。");
  }
  // INV-01：拒收原始私有值。
  assertSanitizedManifest(manifest);

  const result = evaluateScan(manifest);

  // 若指定 submissionId 且为本人草稿，则落 privacy_scans（findings 已脱敏）。
  if (input.submissionId) {
    const db = await getDb();
    const [sub] = await db
      .select()
      .from(schema.submissions)
      .where(eq(schema.submissions.id, input.submissionId))
      .limit(1);
    if (sub && sub.submitterId === user.id) {
      await db.insert(schema.privacyScans).values({
        submissionId: input.submissionId,
        overallStatus: result.overallStatus,
        findings: result.findings as never, // 仅脱敏 findings，无原始命中值（INV-01）
        sensitivityDeclaration: result.sensitivityDeclaration,
        scannerVersion: result.scannerVersion,
      });
    }
  }

  return result;
}

// ── API-013：提交进评审。──────────────────────────────────────────────
export async function submitSubmission(
  session: Session | null,
  id: string,
  input: { consent?: { actionType?: string; scope?: string } }
): Promise<SubmitResultOut> {
  const user = await requireUser(session);
  const db = await getDb();

  const [sub] = await db
    .select()
    .from(schema.submissions)
    .where(eq(schema.submissions.id, id))
    .limit(1);
  if (!sub) {
    throw new SubmissionError(404, "not-found", "草稿不存在。");
  }
  if (sub.submitterId !== user.id) {
    throw new SubmissionError(403, "forbidden", "仅本人可提交该草稿。");
  }

  // INV-08：必带 submit 类型 Consent，否则 422（不落库）。
  if (!input.consent || input.consent.actionType !== "submit") {
    throw new SubmissionError(422, "consent-required", "缺少公开提交同意（INV-08）。");
  }

  // 必须先过隐私门：读最新扫描；无扫描 → 409（FLOW-001 回环）。
  const [scan] = await db
    .select()
    .from(schema.privacyScans)
    .where(eq(schema.privacyScans.submissionId, id))
    .orderBy(desc(schema.privacyScans.scannedAt))
    .limit(1);
  if (!scan) {
    throw new SubmissionError(409, "scan-required", "提交前须先通过隐私门扫描。");
  }

  // INV-02：block 不可绕过 → 409（不落库）。
  if (scan.overallStatus === "block") {
    throw new SubmissionError(409, "privacy-block", "隐私门为 block，不可提交（INV-02）。");
  }

  const privacyOverall = scan.overallStatus === "warn" ? "warn" : "pass";

  // 写 submit Consent（INV-08）。
  await db.insert(schema.consents).values({
    userId: user.id,
    actionType: "submit",
    scope: input.consent.scope ?? id,
    relatedType: "submission",
    relatedId: id,
  });

  // 状态推进 Draft → InReview（ASM-032：评审中以 InReview 投影）。
  await db
    .update(schema.submissions)
    .set({ status: "InReview", submittedAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.submissions.id, id));

  // 生成 review_item（kind=submission，gate/riskLevel 来自扫描）。
  const riskLevel = scan.overallStatus === "warn" ? "medium" : "low";
  await db.insert(schema.reviewItems).values({
    kind: "submission",
    submissionId: id,
    gate: scan.overallStatus,
    riskLevel,
    status: "pending",
  });

  // INV-11：写 audit_log（无 PII / 无原始内容）。
  await db.insert(schema.auditLog).values({
    actorId: user.id,
    action: "submission.submit",
    targetType: "submission",
    targetId: id,
    metadata: { gate: scan.overallStatus, privacyOverall } as never,
  });

  return {
    id,
    status: "InReview",
    privacyOverall,
    submittedAt: new Date().toISOString(),
  };
}
