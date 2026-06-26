/*
  Owner 侧模块生命周期（个人中心写动作）。
  - delistOwnModule：本人把自己已发布的模块下架（Published/Updated → Delisted）。
    下架后 listModules（公开注册表）即不再暴露（discovery 仅暴露 Published/Updated）。
  守则：未登录 401 / 非本人 403 / 不存在 404 / 状态非法 409；写 audit（INV-11）。
  注：管理员的 delist（admin.ts）是治理处置，与此处「本人主动下架」分属不同权限路径。
*/
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import type { Session } from "@/lib/types";

export class OwnerModuleError extends Error {
  constructor(
    public status: number,
    public code: string,
    message?: string
  ) {
    super(message ?? code);
    this.name = "OwnerModuleError";
  }
}

async function requireUserId(session: Session | null): Promise<string> {
  if (!session?.login) {
    throw new OwnerModuleError(401, "unauthorized", "需登录后操作。");
  }
  const db = await getDb();
  const [u] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.login, session.login))
    .limit(1);
  if (!u) {
    throw new OwnerModuleError(401, "unauthorized", "会话用户不存在。");
  }
  return u.id;
}

const DELISTABLE = ["Published", "Updated"];

export async function delistOwnModule(
  session: Session | null,
  moduleId: string
): Promise<{ id: string; status: "Delisted" }> {
  const uid = await requireUserId(session);
  const db = await getDb();

  const [mod] = await db
    .select()
    .from(schema.knowledgeModules)
    .where(eq(schema.knowledgeModules.id, moduleId))
    .limit(1);
  if (!mod) {
    throw new OwnerModuleError(404, "not-found", "模块不存在。");
  }
  if (mod.ownerId !== uid) {
    throw new OwnerModuleError(403, "forbidden", "仅本人可下架该模块。");
  }
  if (!DELISTABLE.includes(mod.status)) {
    throw new OwnerModuleError(
      409,
      "not-delistable",
      "仅已发布的模块可下架。"
    );
  }

  await db
    .update(schema.knowledgeModules)
    .set({ status: "Delisted", updatedAt: new Date() })
    .where(eq(schema.knowledgeModules.id, moduleId));
  await db.insert(schema.auditLog).values({
    actorId: uid,
    action: "module.delist",
    targetType: "module",
    targetId: moduleId,
  });
  return { id: moduleId, status: "Delisted" };
}

/* 隐私门复核（与 submission.evaluateScan 同模式）：真实密钥赋值/token 形态/私钥块 → block。 */
function hasBlockingSecret(text: string): boolean {
  return (
    /(?:api[_-]?key|secret|password|token|密钥)\s*[:=]\s*\S+/i.test(text) ||
    /\b(?:ghp|gho|github_pat)_[A-Za-z0-9_]{20,}\b/i.test(text) ||
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/i.test(text)
  );
}

/**
  本人一键发布自己的草稿模块（DEC：作者自发布，无评审队列；NFR-005 同意由前端确认门兑现）。
  Draft → Published：服务端复核隐私门（block→409）、置 manifests.isCurrent、写 submit 同意 + audit、
  同步关联 submission 为 Published。仅本人、仅 Draft。
*/
export async function publishOwnModule(
  session: Session | null,
  moduleId: string
): Promise<{ id: string; status: "Published" }> {
  const uid = await requireUserId(session);
  const db = await getDb();

  const [mod] = await db
    .select()
    .from(schema.knowledgeModules)
    .where(eq(schema.knowledgeModules.id, moduleId))
    .limit(1);
  if (!mod) throw new OwnerModuleError(404, "not-found", "模块不存在。");
  if (mod.ownerId !== uid) throw new OwnerModuleError(403, "forbidden", "仅本人可发布该模块。");
  if (mod.status !== "Draft") {
    throw new OwnerModuleError(409, "not-draft", "仅草稿模块可发布（已发布/已下架的请用其它操作）。");
  }

  const [man] = await db
    .select()
    .from(schema.manifests)
    .where(eq(schema.manifests.moduleId, moduleId))
    .limit(1);

  // 隐私门复核（INV-02：block 不可绕过，即便走直发路径）。
  const blob = [
    mod.title,
    mod.summary,
    man?.summary,
    ...(Array.isArray(man?.coveredQuestions) ? (man!.coveredQuestions as string[]) : []),
  ]
    .map((x) => String(x ?? ""))
    .join(" ");
  if (hasBlockingSecret(blob)) {
    throw new OwnerModuleError(409, "privacy-block", "隐私门为 block，不可发布（INV-02）。");
  }

  const now = new Date();
  await db
    .update(schema.knowledgeModules)
    .set({ status: "Published", publishedAt: now, updatedAt: now })
    .where(eq(schema.knowledgeModules.id, moduleId));
  if (man) {
    await db
      .update(schema.manifests)
      .set({ isCurrent: true })
      .where(eq(schema.manifests.moduleId, moduleId));
  }
  // 关联 submission 同步为 Published（若存在）。
  await db
    .update(schema.submissions)
    .set({ status: "Published" })
    .where(eq(schema.submissions.moduleId, moduleId));
  // INV-08 同意 + INV-11 审计。
  await db.insert(schema.consents).values({
    userId: uid,
    actionType: "submit",
    scope: moduleId,
    relatedType: "module",
    relatedId: moduleId,
  });
  await db.insert(schema.auditLog).values({
    actorId: uid,
    action: "module.publish",
    targetType: "module",
    targetId: moduleId,
  });
  return { id: moduleId, status: "Published" };
}
