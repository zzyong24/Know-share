/*
  Owner 侧模块管理（个人中心写动作接线）：
  - POST /api/modules/:id/delist —— 本人下架自己已发布的模块（Published/Updated → Delisted）。
  - POST /api/modules/:id/edit-draft —— 本人对自己模块发起「编辑」：建一个 moduleId 指向原模块的
    Draft 草稿（提交审核通过后更新原模块为新版本，不产生重复模块）。
  守则：未登录 401 / 非本人 403 / 不存在 404 / 状态非法 409；写动作落 audit（INV-11）。
*/
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupHarness, schema, type Harness } from "../_harness";
import { eq } from "drizzle-orm";

import { POST as delistRoute } from "@/app/api/modules/[id]/delist/route";
import { POST as editDraftRoute } from "@/app/api/modules/[id]/edit-draft/route";

let h: Harness;

const OWNER = {
  login: "owner-mod",
  avatarUrl: "https://avatars.example.com/owner-mod.png",
  isAdmin: false,
  verified: true,
} as const;
const OTHER = {
  login: "other-mod",
  avatarUrl: "https://avatars.example.com/other-mod.png",
  isAdmin: false,
  verified: true,
} as const;

async function seedUser(login: string): Promise<string> {
  const [row] = await h.db
    .insert(schema.users)
    .values({
      githubId: `gh-${login}`,
      login,
      displayName: login,
      avatarUrl: `https://avatars.example.com/${login}.png`,
      githubVerified: true,
    })
    .returning({ id: schema.users.id });
  return row.id;
}

async function seedModule(
  ownerId: string,
  status = "Published"
): Promise<string> {
  const [row] = await h.db
    .insert(schema.knowledgeModules)
    .values({
      ownerId,
      title: "Agent 记忆模式",
      summary: "脱敏摘要。",
      status,
    })
    .returning({ id: schema.knowledgeModules.id });
  const moduleId = row.id;
  await h.db.insert(schema.manifests).values({
    moduleId,
    summary: "脱敏摘要。",
    topics: ["个人 Agent", "记忆系统"],
    freshness: "本月更新",
    sourceStats: { total: 12 } as never,
    version: "1.0.0",
  });
  return moduleId;
}

function post(path: string): Request {
  return new Request(`http://localhost${path}`, { method: "POST" });
}
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(async () => {
  h = await setupHarness({ seed: false });
});
afterEach(async () => {
  await h.teardown();
});

describe("POST /api/modules/:id/delist —— 本人下架", () => {
  it("本人下架已发布模块 → 200，status=Delisted，写 audit", async () => {
    const uid = await seedUser(OWNER.login);
    const id = await seedModule(uid, "Published");
    h.setSession(OWNER);

    const res = await delistRoute(post(`/api/modules/${id}/delist`), ctx(id));
    expect(res.status).toBe(200);

    const [mod] = await h.db
      .select()
      .from(schema.knowledgeModules)
      .where(eq(schema.knowledgeModules.id, id));
    expect(mod.status).toBe("Delisted");

    const audit = await h.db
      .select()
      .from(schema.auditLog)
      .where(eq(schema.auditLog.targetId, id));
    expect(audit.some((a) => a.action === "module.delist")).toBe(true);
  });

  it("非本人 → 403，状态不变", async () => {
    const ownerId = await seedUser(OWNER.login);
    await seedUser(OTHER.login);
    const id = await seedModule(ownerId, "Published");
    h.setSession(OTHER);
    const res = await delistRoute(post(`/api/modules/${id}/delist`), ctx(id));
    expect(res.status).toBe(403);
    const [mod] = await h.db
      .select()
      .from(schema.knowledgeModules)
      .where(eq(schema.knowledgeModules.id, id));
    expect(mod.status).toBe("Published");
  });

  it("非已发布态（Draft）不可下架 → 409", async () => {
    const uid = await seedUser(OWNER.login);
    const id = await seedModule(uid, "Draft");
    h.setSession(OWNER);
    const res = await delistRoute(post(`/api/modules/${id}/delist`), ctx(id));
    expect(res.status).toBe(409);
  });

  it("不存在 → 404 / 未登录 → 401", async () => {
    const uid = await seedUser(OWNER.login);
    const id = await seedModule(uid, "Published");
    const ghost = "00000000-0000-4000-8000-000000000000";
    h.setSession(OWNER);
    expect(
      (await delistRoute(post(`/api/modules/${ghost}/delist`), ctx(ghost))).status
    ).toBe(404);
    h.setSession(null);
    expect(
      (await delistRoute(post(`/api/modules/${id}/delist`), ctx(id))).status
    ).toBe(401);
  });
});

describe("POST /api/modules/:id/edit-draft —— 本人发起编辑", () => {
  it("本人编辑自己模块 → 建 Draft 草稿，moduleId 指向原模块，draftData 取自 manifest", async () => {
    const uid = await seedUser(OWNER.login);
    const id = await seedModule(uid, "Published");
    h.setSession(OWNER);

    const res = await editDraftRoute(post(`/api/modules/${id}/edit-draft`), ctx(id));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string };
    expect(body.id).toBeTruthy();

    const [draft] = await h.db
      .select()
      .from(schema.submissions)
      .where(eq(schema.submissions.id, body.id));
    expect(draft.status).toBe("Draft");
    expect(draft.moduleId).toBe(id);
    expect(draft.submitterId).toBe(uid);
  });

  it("非本人编辑 → 403", async () => {
    const ownerId = await seedUser(OWNER.login);
    await seedUser(OTHER.login);
    const id = await seedModule(ownerId, "Published");
    h.setSession(OTHER);
    const res = await editDraftRoute(post(`/api/modules/${id}/edit-draft`), ctx(id));
    expect(res.status).toBe(403);
  });

  it("模块不存在 → 404 / 未登录 → 401", async () => {
    const uid = await seedUser(OWNER.login);
    const id = await seedModule(uid, "Published");
    const ghost = "00000000-0000-4000-8000-000000000000";
    h.setSession(OWNER);
    expect(
      (await editDraftRoute(post(`/api/modules/${ghost}/edit-draft`), ctx(ghost)))
        .status
    ).toBe(404);
    h.setSession(null);
    expect(
      (await editDraftRoute(post(`/api/modules/${id}/edit-draft`), ctx(id))).status
    ).toBe(401);
  });
});
