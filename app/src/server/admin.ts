/*
  审核域服务层（W-4 Moderation；管理员）。
  - 路由处理器只做 HTTP 编解码，业务在本层。
  - 全部仅管理员：未登录 401、非 isAdmin 403（权限矩阵/TEST-013）。
  - 队列/详情/摘要输出脱敏聚合（INV-04/09，过 assertNoForbidden）。
  - 处置：approve（发布：写 manifests.isCurrent + 置 knowledge_modules.status=Published）、
    return（→Draft）、delist（→Delisted）、resolve/dismiss-report（reports 处置）。
  - INV-02：隐私门 block 项不可被 approve 发布 → 409（TEST-002）。
  - 处置原因：return/delist/dismiss-report 必填（ASM-051，缺 → 400）。
  - 每个处置 / 批量逐项写 audit_log（INV-11/TEST-010）。
  - 统计「已处理」= 当日已处置（ASM-053）。无经济字段（DEC-007）。
*/
import { eq, inArray, gte } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { getSession } from "@/server/auth";
import { assertNoForbidden } from "@/server/projection";
import { notifyUser } from "@/server/notify";
import type { Session, AuditEntry } from "@/lib/types";
import type {
  AdminReviewItem,
  ReviewItemDetail,
  ReviewSummary,
  ModerationAction,
  RiskLevel,
} from "@/lib/queries/admin";

/* ── 错误类型（handler 据 status 编码）─────────────────────────── */
export class DomainError extends Error {
  constructor(
    public status: number,
    public code: string,
    public extra?: { missing?: string[]; message?: string }
  ) {
    super(code);
  }
}

/* ── 鉴权门：全部仅管理员 ──────────────────────────────────────── */
async function requireAdmin(): Promise<{ session: Session; actorId: string | null }> {
  const session = await getSession();
  if (!session) throw new DomainError(401, "unauthenticated");
  if (!session.isAdmin) throw new DomainError(403, "forbidden");
  const actorId = await userIdByLogin(session.login);
  return { session, actorId };
}

async function userIdByLogin(login: string): Promise<string | null> {
  const db = await getDb();
  const [u] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.login, login))
    .limit(1);
  return u?.id ?? null;
}

async function loginById(userId: string | null): Promise<string> {
  if (!userId) return "system";
  const db = await getDb();
  const [u] = await db
    .select({ login: schema.users.login })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  return u?.login ?? "unknown";
}

const RISK_LABELS: Record<string, string> = {
  none: "无风险",
  low: "低风险",
  medium: "中风险",
  high: "高风险",
};

function asRiskLevel(v: string | null): RiskLevel {
  return (["none", "low", "medium", "high"].includes(v ?? "") ? v : "none") as RiskLevel;
}

/* ── 评审项行（内部）──────────────────────────────────────────── */
interface ReviewRow {
  id: string;
  kind: string;
  submissionId: string | null;
  reportId: string | null;
  gate: string | null;
  riskLevel: string | null;
  riskSummary: string | null;
  status: string;
  reason: string | null;
  createdAt: Date;
}

async function loadReviewItem(id: string): Promise<ReviewRow | null> {
  const db = await getDb();
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(id)) return null; // 非 uuid → 404（不让 DB 抛解析错）
  const [row] = await db
    .select()
    .from(schema.reviewItems)
    .where(eq(schema.reviewItems.id, id))
    .limit(1);
  return (row as ReviewRow) ?? null;
}

/** submission 类评审项的关联：模块标题 / 提交者 login。 */
async function submissionContext(
  submissionId: string
): Promise<{ moduleId: string | null; moduleTitle: string; submitterLogin: string; manifestId: string | null }> {
  const db = await getDb();
  const [sub] = await db
    .select()
    .from(schema.submissions)
    .where(eq(schema.submissions.id, submissionId))
    .limit(1);
  if (!sub) return { moduleId: null, moduleTitle: "", submitterLogin: "unknown", manifestId: null };
  let moduleTitle = "";
  if (sub.moduleId) {
    const [mod] = await db
      .select({ title: schema.knowledgeModules.title })
      .from(schema.knowledgeModules)
      .where(eq(schema.knowledgeModules.id, sub.moduleId))
      .limit(1);
    moduleTitle = mod?.title ?? "";
  }
  const submitterLogin = await loginById(sub.submitterId);
  return {
    moduleId: sub.moduleId ?? null,
    moduleTitle,
    submitterLogin,
    manifestId: sub.manifestId ?? null,
  };
}

/** report 类评审项的关联：举报人 / 目标摘要。 */
async function reportContext(
  reportId: string
): Promise<{ reporterLogin: string; targetType: string; targetId: string; reason: string; status: string; targetTitle: string }> {
  const db = await getDb();
  const [rep] = await db
    .select()
    .from(schema.reports)
    .where(eq(schema.reports.id, reportId))
    .limit(1);
  if (!rep)
    return { reporterLogin: "unknown", targetType: "module", targetId: "", reason: "", status: "pending", targetTitle: "" };
  const reporterLogin = await loginById(rep.reporterId);
  let targetTitle = "";
  if (rep.targetType === "module") {
    const [mod] = await db
      .select({ title: schema.knowledgeModules.title })
      .from(schema.knowledgeModules)
      .where(eq(schema.knowledgeModules.id, rep.targetId))
      .limit(1);
    targetTitle = mod?.title ?? "";
  }
  return {
    reporterLogin,
    targetType: rep.targetType,
    targetId: rep.targetId,
    reason: rep.reason,
    status: rep.status,
    targetTitle,
  };
}

/* ════════════════════════════════════════════════════════════════
   API-043：评审队列（含隐私门结果 + 风险标签；脱敏）。
   ════════════════════════════════════════════════════════════════ */
export async function listReviewQueue(): Promise<{ items: AdminReviewItem[] }> {
  await requireAdmin();
  const db = await getDb();
  const rows = (await db
    .select()
    .from(schema.reviewItems)) as ReviewRow[];

  const items: AdminReviewItem[] = [];
  for (const r of rows) {
    let moduleTitle = "";
    let submitterLogin = "unknown";
    let reported = false;
    let reporterLogin: string | undefined;
    if (r.kind === "submission" && r.submissionId) {
      const ctx = await submissionContext(r.submissionId);
      moduleTitle = ctx.moduleTitle;
      submitterLogin = ctx.submitterLogin;
    } else if (r.kind === "report" && r.reportId) {
      const ctx = await reportContext(r.reportId);
      moduleTitle = ctx.targetTitle;
      submitterLogin = await loginById(null); // 举报无提交者
      reported = true;
      reporterLogin = ctx.reporterLogin;
    }
    items.push({
      id: r.id,
      kind: (r.kind === "report" ? "report" : "submission") as "submission" | "report",
      moduleTitle,
      submitterLogin,
      gate: (r.gate ?? "pass") as AdminReviewItem["gate"],
      riskLevel: asRiskLevel(r.riskLevel),
      riskLabel: r.riskSummary ?? RISK_LABELS[asRiskLevel(r.riskLevel)],
      submittedAt: new Date(r.createdAt).toISOString(),
      status: r.status as AdminReviewItem["status"],
      reported,
      reporterLogin,
    });
  }
  items.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  return assertNoForbidden({ items }, "admin-review-queue");
}

/* ════════════════════════════════════════════════════════════════
   API-044：评审项详情（Manifest 脱敏摘要 + 扫描发现 + 举报）。
   ════════════════════════════════════════════════════════════════ */
export async function getReviewDetail(id: string): Promise<ReviewItemDetail | null> {
  await requireAdmin();
  const row = await loadReviewItem(id);
  if (!row) return null;
  const db = await getDb();

  let title = "评审项";
  let manifestSummary: ReviewItemDetail["manifestSummary"] = {
    id: "",
    version: "",
    entry: "",
    env: [],
  };
  let scanFindings: ReviewItemDetail["scanFindings"] = [];
  let report: ReviewItemDetail["report"];

  if (row.kind === "submission" && row.submissionId) {
    const ctx = await submissionContext(row.submissionId);
    title = ctx.moduleTitle || "提交评审";
    if (ctx.manifestId) {
      const [man] = await db
        .select()
        .from(schema.manifests)
        .where(eq(schema.manifests.id, ctx.manifestId))
        .limit(1);
      if (man) {
        manifestSummary = {
          id: man.id,
          version: man.version,
          entry: man.summary, // 脱敏摘要作为入口说明（无原始内容，INV-04）
          env: man.sourceTypes ?? [],
        };
      }
    }
    // 隐私扫描发现（仅脱敏 findings，INV-01）。
    const scans = await db
      .select()
      .from(schema.privacyScans)
      .where(eq(schema.privacyScans.submissionId, row.submissionId));
    scanFindings = scans.flatMap((s, si) => {
      const fs = (s.findings as Array<{ level?: string; message?: string; suggestion?: string }>) ?? [];
      return fs.map((f, fi) => ({
        id: `${s.id}-${si}-${fi}`,
        description: f.message ?? "扫描发现",
        severity: (f.level ?? "pass") as ReviewItemDetail["scanFindings"][number]["severity"],
        suggestion: f.suggestion,
      }));
    });
  } else if (row.kind === "report" && row.reportId) {
    const ctx = await reportContext(row.reportId);
    title = ctx.targetTitle || "举报评审";
    report = {
      reporterHandle: ctx.reporterLogin,
      targetType: ctx.targetType as "module" | "user" | "exchange",
      targetRef: ctx.targetTitle || ctx.targetId,
      reason: ctx.reason,
      status: ctx.status as "pending" | "dismissed" | "penalized",
    };
  }

  const detail: ReviewItemDetail = {
    id: row.id,
    title,
    manifestSummary,
    scanFindings,
    report,
  };
  return assertNoForbidden(detail, "admin-review-detail");
}

/* ════════════════════════════════════════════════════════════════
   API-045：风险摘要（聚合，无 PII；resolvedCount = 当日已处置 ASM-053）。
   ════════════════════════════════════════════════════════════════ */
export async function getReviewSummary(): Promise<ReviewSummary> {
  await requireAdmin();
  const db = await getDb();
  const rows = (await db.select().from(schema.reviewItems)) as ReviewRow[];

  const pendingCount = rows.filter((r) => r.status === "pending").length;
  const highRiskCount = rows.filter((r) => r.riskLevel === "high").length;

  // 当日开始（本地 0 点）。
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  // 当日新增举报。
  const reportsToday = (
    await db
      .select({ id: schema.reports.id })
      .from(schema.reports)
      .where(gte(schema.reports.createdAt, dayStart))
  ).length;

  // 当日已处置（审计中处置类动作；ASM-053）。
  const todayAudits = await db
    .select({ action: schema.auditLog.action })
    .from(schema.auditLog)
    .where(gte(schema.auditLog.createdAt, dayStart));
  const resolvedCount = todayAudits.filter((a) =>
    /admin\.(approve|return|delist|resolve|dismiss-report)/.test(a.action)
  ).length;

  const summary: ReviewSummary = {
    pendingCount,
    highRiskCount,
    reportsToday,
    resolvedCount,
  };
  return assertNoForbidden(summary, "admin-summary");
}

/* ════════════════════════════════════════════════════════════════
   API-046：审计日志（脱敏；actorLogin/action/target；INV-11）。
   ════════════════════════════════════════════════════════════════ */
export async function listAudit(): Promise<{ items: AuditEntry[] }> {
  await requireAdmin();
  const db = await getDb();
  const rows = await db.select().from(schema.auditLog);
  rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const items: AuditEntry[] = [];
  for (const r of rows) {
    items.push({
      id: r.id,
      actorLogin: await loginById(r.actorId),
      action: r.action,
      target: `${r.targetType ?? ""}:${r.targetId ?? ""}`,
      createdAt: new Date(r.createdAt).toISOString(),
    });
  }
  return assertNoForbidden({ items }, "admin-audit");
}

/* ════════════════════════════════════════════════════════════════
   处置连锁（内部）：发布 / 退回 / 下架 / 举报处置。
   ════════════════════════════════════════════════════════════════ */
const REASON_REQUIRED: ModerationAction[] = ["return", "delist", "dismiss-report"];

/** approve 连锁：置模块 Published + manifests.isCurrent；返回模块 id（无则 null）。 */
async function publishSubmission(submissionId: string): Promise<string | null> {
  const db = await getDb();
  const [sub] = await db
    .select()
    .from(schema.submissions)
    .where(eq(schema.submissions.id, submissionId))
    .limit(1);
  if (!sub?.moduleId) return null;
  await db
    .update(schema.knowledgeModules)
    .set({ status: "Published", publishedAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.knowledgeModules.id, sub.moduleId));
  // 当前 Manifest 标记 isCurrent（发布版本）。
  await db
    .update(schema.manifests)
    .set({ isCurrent: true })
    .where(eq(schema.manifests.moduleId, sub.moduleId));
  await db
    .update(schema.submissions)
    .set({ status: "Published" })
    .where(eq(schema.submissions.id, submissionId));
  await notifyUser({
    userId: sub.submitterId,
    type: "review",
    title: "你的模块已通过审核并发布",
    body: "提交已通过隐私门与人工评审，现已在公开注册表可见。",
    href: "/me/modules",
  });
  return sub.moduleId;
}

async function returnSubmission(submissionId: string): Promise<string | null> {
  const db = await getDb();
  const [sub] = await db
    .select()
    .from(schema.submissions)
    .where(eq(schema.submissions.id, submissionId))
    .limit(1);
  if (!sub?.moduleId) return null;
  await db
    .update(schema.knowledgeModules)
    .set({ status: "Draft", updatedAt: new Date() })
    .where(eq(schema.knowledgeModules.id, sub.moduleId));
  await db
    .update(schema.submissions)
    .set({ status: "ChangesRequested" })
    .where(eq(schema.submissions.id, submissionId));
  await notifyUser({
    userId: sub.submitterId,
    type: "review",
    title: "你的提交需要修改",
    body: "评审建议你按反馈调整后重新提交。",
    href: "/me/drafts",
  });
  return sub.moduleId;
}

async function delistSubmission(submissionId: string): Promise<string | null> {
  const db = await getDb();
  const [sub] = await db
    .select()
    .from(schema.submissions)
    .where(eq(schema.submissions.id, submissionId))
    .limit(1);
  if (!sub?.moduleId) return null;
  await db
    .update(schema.knowledgeModules)
    .set({ status: "Delisted", updatedAt: new Date() })
    .where(eq(schema.knowledgeModules.id, sub.moduleId));
  return sub.moduleId;
}

async function resolveReport(reportId: string, status: "penalized" | "dismissed"): Promise<void> {
  const db = await getDb();
  await db
    .update(schema.reports)
    .set({ status })
    .where(eq(schema.reports.id, reportId));
}

async function writeAudit(
  actorId: string | null,
  action: string,
  targetType: string,
  targetId: string,
  metadata?: Record<string, unknown>
): Promise<AuditEntry> {
  const db = await getDb();
  const [row] = await db
    .insert(schema.auditLog)
    .values({ actorId, action, targetType, targetId, metadata: metadata ?? null })
    .returning();
  return {
    id: row.id,
    actorLogin: await loginById(actorId),
    action: row.action,
    target: `${row.targetType ?? ""}:${row.targetId ?? ""}`,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

/* ════════════════════════════════════════════════════════════════
   API-047：单项处置。
   ════════════════════════════════════════════════════════════════ */
export interface ModerateInput {
  reviewItemId?: string;
  action?: string;
  reason?: string;
}

const VALID_ACTIONS: ModerationAction[] = [
  "approve",
  "return",
  "delist",
  "dismiss-report",
  "resolve",
];

export async function moderate(input: ModerateInput): Promise<{ ok: true; audit: AuditEntry }> {
  const { actorId } = await requireAdmin();
  const db = await getDb();

  const action = input.action as ModerationAction;
  if (!input.reviewItemId || !VALID_ACTIONS.includes(action)) {
    throw new DomainError(400, "invalid-action", { missing: ["reviewItemId", "action"] });
  }
  const row = await loadReviewItem(input.reviewItemId);
  if (!row) throw new DomainError(404, "review-item-not-found");

  // 原因门（ASM-051）。
  const reason = input.reason?.trim();
  if (REASON_REQUIRED.includes(action) && !reason) {
    throw new DomainError(400, "reason-required", { missing: ["reason"] });
  }

  // INV-02：block 项不可 approve 发布。
  if (action === "approve" && row.gate === "block") {
    throw new DomainError(409, "block-cannot-approve", {
      message: "隐私门 block 项不可通过发布（INV-02）",
    });
  }

  const audit = await applyAction(row, action, reason, actorId);
  void db;
  return { ok: true, audit };
}

/** 执行单个处置动作（含连锁 + review_item 状态 + 审计），返回审计条目。 */
async function applyAction(
  row: ReviewRow,
  action: ModerationAction,
  reason: string | undefined,
  actorId: string | null
): Promise<AuditEntry> {
  const db = await getDb();
  let targetType = "review_item";
  let targetId = row.id;
  let nextStatus: ReviewRow["status"] = row.status;

  switch (action) {
    case "approve": {
      if (row.submissionId) {
        const moduleId = await publishSubmission(row.submissionId);
        if (moduleId) {
          targetType = "module";
          targetId = moduleId;
        }
      }
      nextStatus = "approved";
      break;
    }
    case "return": {
      if (row.submissionId) {
        const moduleId = await returnSubmission(row.submissionId);
        if (moduleId) {
          targetType = "module";
          targetId = moduleId;
        }
      }
      nextStatus = "changes-requested";
      break;
    }
    case "delist": {
      if (row.submissionId) {
        const moduleId = await delistSubmission(row.submissionId);
        if (moduleId) {
          targetType = "module";
          targetId = moduleId;
        }
      }
      nextStatus = "rejected";
      break;
    }
    case "resolve": {
      if (row.reportId) {
        await resolveReport(row.reportId, "penalized");
        targetType = "report";
        targetId = row.reportId;
      }
      nextStatus = "approved";
      break;
    }
    case "dismiss-report": {
      if (row.reportId) {
        await resolveReport(row.reportId, "dismissed");
        targetType = "report";
        targetId = row.reportId;
      }
      nextStatus = "rejected";
      break;
    }
  }

  await db
    .update(schema.reviewItems)
    .set({ status: nextStatus, resolution: action, reason: reason ?? null })
    .where(eq(schema.reviewItems.id, row.id));

  return writeAudit(actorId, `admin.${action}`, targetType, targetId, {
    reviewItemId: row.id,
    ...(reason ? { reason } : {}),
  });
}

/* ════════════════════════════════════════════════════════════════
   API-048：批量通过（仅 pass 且无未决举报子集；逐项写审计 ASM-050/INV-02）。
   ════════════════════════════════════════════════════════════════ */
export async function bulkApprove(ids: string[]): Promise<{ ok: true; approved: string[] }> {
  const { actorId } = await requireAdmin();
  if (!ids?.length) return { ok: true, approved: [] };

  const db = await getDb();
  const uniq = Array.from(new Set(ids));
  const rows = (await db
    .select()
    .from(schema.reviewItems)
    .where(inArray(schema.reviewItems.id, uniq))) as ReviewRow[];

  const approved: string[] = [];
  for (const row of rows) {
    // 仅 submission 类、gate=pass、pending（无未决举报项；INV-02/ASM-050）。
    if (row.kind !== "submission") continue;
    if (row.gate !== "pass") continue;
    if (row.status !== "pending") continue;
    await applyAction(row, "approve", undefined, actorId); // 逐项写审计（INV-11）
    approved.push(row.id);
  }
  return { ok: true, approved };
}
