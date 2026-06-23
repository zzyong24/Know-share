/*
  community 域服务层（社交信号 + 举报）。
  端点：API-049 收藏、API-050 认可、API-051 举报。
  守则在本层兑现：
  - 社交/举报需登录（调用方在 handler 校验 session）；
  - INV-07：每 (User, Module) 至多一条有效 favorite（DB 唯一约束 favorite_uniq + toggle 幂等）；
  - INV-10：认可写 social_signals(endorse) 低权重信号，**不写 feedback**（不直接拉高信任）；
  - INV-11：写端点写 audit_log（无 PII / 无原始内容，INV-01/09）；
  - 限流由 handler 经 getRedis().rateLimit 兑现（NFR-006 / TEST-015）。
*/
import { and, eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import * as schema from "@/server/db/schema";

/** 举报合法目标类型（ENT-014）。 */
export const REPORT_TARGET_TYPES = ["module", "user", "exchange"] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

/** 写一条 audit（INV-11）。metadata 仅聚合标量/标签，无 PII / 无原始内容（INV-01/09）。 */
export async function writeAudit(input: {
  actorId: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const db = await getDb();
  await db.insert(schema.auditLog).values({
    actorId: input.actorId ?? null,
    action: input.action,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    metadata: input.metadata ?? null,
  });
}

/** 按 login 解析 userId；未知 → null。 */
export async function resolveUserId(login: string): Promise<string | null> {
  const db = await getDb();
  const [row] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.login, login))
    .limit(1);
  return row?.id ?? null;
}

/** 模块是否存在。 */
async function moduleExists(moduleId: string): Promise<boolean> {
  const db = await getDb();
  const [row] = await db
    .select({ id: schema.knowledgeModules.id })
    .from(schema.knowledgeModules)
    .where(eq(schema.knowledgeModules.id, moduleId))
    .limit(1);
  return !!row;
}

export interface FavoriteResult {
  favorited: boolean;
  /** 该模块当前 favorite 计数（聚合标量）。 */
  favoriteCount: number;
}

/**
  API-049 收藏 / 取消收藏（INV-07：唯一约束 + toggle 幂等）。
  - 默认（toggle 未显式 false）：若已收藏则取消，否则收藏（前端按钮 toggle 语义）。
  - 但「重复收藏（toggle:false 或 add 语义）」必须幂等：不新增第二条（TEST-006）。
  这里以 `toggle` 显式控制：
    toggle=true  → 切换（已收藏→取消；未收藏→收藏）
    toggle=false → 确保收藏（幂等 upsert，重复不增）
  约定缺省 toggle=false（确保收藏、幂等），保证 INV-07 在「重复点击收藏」时不破。
*/
export async function toggleFavorite(input: {
  actorId: string;
  moduleId: string;
  toggle?: boolean;
}): Promise<FavoriteResult> {
  const db = await getDb();
  const where = and(
    eq(schema.socialSignals.actorId, input.actorId),
    eq(schema.socialSignals.kind, "favorite"),
    eq(schema.socialSignals.targetType, "module"),
    eq(schema.socialSignals.targetId, input.moduleId)
  );

  const existing = await db.select().from(schema.socialSignals).where(where);
  const has = existing.length > 0;

  let favorited: boolean;
  if (input.toggle && has) {
    // 切换取消。
    await db.delete(schema.socialSignals).where(where);
    favorited = false;
  } else if (has) {
    // 已收藏且非取消 → 幂等，不新增（INV-07 / TEST-006）。
    favorited = true;
  } else {
    // 新增；唯一约束 favorite_uniq 兜底并发幂等。
    await db.insert(schema.socialSignals).values({
      actorId: input.actorId,
      kind: "favorite",
      targetType: "module",
      targetId: input.moduleId,
    });
    favorited = true;
  }

  const count = (
    await db
      .select({ id: schema.socialSignals.id })
      .from(schema.socialSignals)
      .where(
        and(
          eq(schema.socialSignals.kind, "favorite"),
          eq(schema.socialSignals.targetType, "module"),
          eq(schema.socialSignals.targetId, input.moduleId)
        )
      )
  ).length;

  return { favorited, favoriteCount: count };
}

/** API-049 服务入口：校验模块存在 → toggle → audit。未知模块 → 抛 NOT_FOUND。 */
export async function favoriteModule(input: {
  actorId: string;
  moduleId: string;
  toggle?: boolean;
}): Promise<FavoriteResult> {
  if (!(await moduleExists(input.moduleId))) {
    throw new CommunityError("NOT_FOUND", "module-not-found");
  }
  const result = await toggleFavorite(input);
  await writeAudit({
    actorId: input.actorId,
    action: "favorite",
    targetType: "module",
    targetId: input.moduleId,
    metadata: { favorited: result.favorited },
  });
  return result;
}

export interface EndorseResult {
  endorsed: boolean;
  endorsementCount: number;
}

/**
  API-050 认可（INV-10：低权重社交信号；写 social_signals(endorse)，**不写 feedback**）。
  - 不能认可自己（400）。
  - target=user；唯一约束 favorite_uniq 覆盖 (actor, endorse, user, target) 幂等。
*/
export async function endorseUser(input: {
  actorId: string;
  actorLogin: string;
  targetLogin: string;
}): Promise<EndorseResult> {
  if (input.actorLogin === input.targetLogin) {
    throw new CommunityError("BAD_REQUEST", "cannot-endorse-self");
  }
  const targetId = await resolveUserId(input.targetLogin);
  if (!targetId) {
    throw new CommunityError("NOT_FOUND", "user-not-found");
  }
  const db = await getDb();
  const where = and(
    eq(schema.socialSignals.actorId, input.actorId),
    eq(schema.socialSignals.kind, "endorse"),
    eq(schema.socialSignals.targetType, "user"),
    eq(schema.socialSignals.targetId, targetId)
  );
  const existing = await db.select().from(schema.socialSignals).where(where);
  if (existing.length === 0) {
    await db.insert(schema.socialSignals).values({
      actorId: input.actorId,
      kind: "endorse",
      targetType: "user",
      targetId,
    });
  }
  const count = (
    await db
      .select({ id: schema.socialSignals.id })
      .from(schema.socialSignals)
      .where(
        and(
          eq(schema.socialSignals.kind, "endorse"),
          eq(schema.socialSignals.targetType, "user"),
          eq(schema.socialSignals.targetId, targetId)
        )
      )
  ).length;

  await writeAudit({
    actorId: input.actorId,
    action: "endorse",
    targetType: "user",
    targetId,
    metadata: { weight: "social-low" }, // INV-10：标注低权重，无 PII。
  });

  return { endorsed: true, endorsementCount: count };
}

export interface ReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
}

export interface ReportResult {
  id: string;
  status: "pending";
}

/** 校验举报输入；非法 → 抛 BAD_REQUEST。 */
export function validateReport(body: unknown): ReportInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const targetType = b.targetType;
  const targetId = b.targetId;
  const reason = b.reason;
  if (
    typeof targetType !== "string" ||
    !(REPORT_TARGET_TYPES as readonly string[]).includes(targetType) ||
    typeof targetId !== "string" ||
    !targetId.trim() ||
    typeof reason !== "string" ||
    !reason.trim()
  ) {
    throw new CommunityError("BAD_REQUEST", "invalid-report");
  }
  return {
    targetType: targetType as ReportTargetType,
    targetId,
    reason: reason.trim(),
  };
}

/** API-051 举报（写 ENT-014 reports，pending；INV-11 audit）。 */
export async function createReport(input: {
  reporterId: string;
  report: ReportInput;
}): Promise<ReportResult> {
  const db = await getDb();
  const [row] = await db
    .insert(schema.reports)
    .values({
      reporterId: input.reporterId,
      targetType: input.report.targetType,
      targetId: input.report.targetId,
      reason: input.report.reason,
      status: "pending",
    })
    .returning({ id: schema.reports.id });

  await writeAudit({
    actorId: input.reporterId,
    action: "report",
    targetType: input.report.targetType,
    targetId: input.report.targetId,
    metadata: { status: "pending" }, // 不记录 reason 原文，避免落 PII（INV-01/09）。
  });

  return { id: row.id, status: "pending" };
}

/** 业务错误（handler 映射为 HTTP 状态）。 */
export class CommunityError extends Error {
  constructor(
    public code: "NOT_FOUND" | "BAD_REQUEST" | "UNAUTHORIZED",
    message: string
  ) {
    super(message);
    this.name = "CommunityError";
  }
}

/** code → HTTP 状态。 */
export function communityErrorStatus(code: CommunityError["code"]): number {
  switch (code) {
    case "NOT_FOUND":
      return 404;
    case "BAD_REQUEST":
      return 400;
    case "UNAUTHORIZED":
      return 401;
  }
}
