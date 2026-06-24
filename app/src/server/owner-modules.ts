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
