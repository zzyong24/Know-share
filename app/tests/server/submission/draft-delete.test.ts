/*
  草稿删除（个人中心写动作接线）契约 + 不变量：DELETE /api/submissions/:id。
  语义：
  - 仅本人可删自己的草稿（越权 → 403、未登录 → 401）。
  - 仅 Draft 态可删；已提交（InReview 等）→ 409（不可绕过评审/已公开记录）。
  - 不存在 → 404。
  - 删除写 audit_log（INV-11）。
*/
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupHarness, schema, type Harness } from "../_harness";
import { eq } from "drizzle-orm";

import { DELETE as deleteDraftRoute } from "@/app/api/submissions/[id]/route";

let h: Harness;

const OWNER = {
  login: "owner-del",
  avatarUrl: "https://avatars.example.com/owner-del.png",
  isAdmin: false,
  verified: true,
} as const;

const OTHER = {
  login: "other-del",
  avatarUrl: "https://avatars.example.com/other-del.png",
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

async function seedSubmission(
  submitterId: string,
  status = "Draft"
): Promise<string> {
  const [row] = await h.db
    .insert(schema.submissions)
    .values({ submitterId, status, step: 1 })
    .returning({ id: schema.submissions.id });
  return row.id;
}

function req(path: string): Request {
  return new Request(`http://localhost${path}`, { method: "DELETE" });
}

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(async () => {
  h = await setupHarness({ seed: false });
});

afterEach(async () => {
  await h.teardown();
});

describe("DELETE /api/submissions/:id —— 草稿删除", () => {
  it("本人删除自己的 Draft → 200，行被移除，写 audit", async () => {
    const uid = await seedUser(OWNER.login);
    const id = await seedSubmission(uid);
    h.setSession(OWNER);

    const res = await deleteDraftRoute(req(`/api/submissions/${id}`), ctx(id));
    expect(res.status).toBe(200);

    const rows = await h.db
      .select()
      .from(schema.submissions)
      .where(eq(schema.submissions.id, id));
    expect(rows).toHaveLength(0);

    const audit = await h.db
      .select()
      .from(schema.auditLog)
      .where(eq(schema.auditLog.targetId, id));
    expect(audit.some((a) => a.action === "submission.delete-draft")).toBe(true);
  });

  it("非本人删除 → 403，行保留", async () => {
    const ownerId = await seedUser(OWNER.login);
    await seedUser(OTHER.login);
    const id = await seedSubmission(ownerId);
    h.setSession(OTHER);

    const res = await deleteDraftRoute(req(`/api/submissions/${id}`), ctx(id));
    expect(res.status).toBe(403);
    const rows = await h.db
      .select()
      .from(schema.submissions)
      .where(eq(schema.submissions.id, id));
    expect(rows).toHaveLength(1);
  });

  it("已提交（非 Draft）草稿不可删 → 409", async () => {
    const uid = await seedUser(OWNER.login);
    const id = await seedSubmission(uid, "InReview");
    h.setSession(OWNER);

    const res = await deleteDraftRoute(req(`/api/submissions/${id}`), ctx(id));
    expect(res.status).toBe(409);
  });

  it("不存在 → 404", async () => {
    await seedUser(OWNER.login);
    h.setSession(OWNER);
    const ghost = "00000000-0000-4000-8000-000000000000";
    const res = await deleteDraftRoute(req(`/api/submissions/${ghost}`), ctx(ghost));
    expect(res.status).toBe(404);
  });

  it("未登录 → 401", async () => {
    const uid = await seedUser(OWNER.login);
    const id = await seedSubmission(uid);
    h.setSession(null);
    const res = await deleteDraftRoute(req(`/api/submissions/${id}`), ctx(id));
    expect(res.status).toBe(401);
  });
});
