/*
  GitHub 身份回填（DEC-006）单测：upsertUserFromGitHub。
  覆盖登录路径对 users 行的副作用与权限语义：
  - 新用户默认非管理员、未验证；
  - KNOWSHARE_ADMIN_LOGINS 白名单命中 → 提升管理员；
  - 幂等：同 githubId 二次登录刷新资料、不新增行、不擅自改 githubVerified；
  - 登录不降级既有管理员（误配白名单不踢人）。
*/
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupHarness, schema, type Harness } from "../_harness";
import { eq } from "drizzle-orm";
import { upsertUserFromGitHub } from "@/server/users";

describe("upsertUserFromGitHub —— GitHub 身份回填（DEC-006）", () => {
  let h: Harness;
  const prevAdmins = process.env.KNOWSHARE_ADMIN_LOGINS;

  beforeEach(async () => {
    h = await setupHarness({ seed: false });
    delete process.env.KNOWSHARE_ADMIN_LOGINS;
  });

  afterEach(async () => {
    if (prevAdmins === undefined) delete process.env.KNOWSHARE_ADMIN_LOGINS;
    else process.env.KNOWSHARE_ADMIN_LOGINS = prevAdmins;
    await h.teardown();
  });

  it("新用户：非白名单 → isAdmin/verified 默认 false，建一行", async () => {
    const u = await upsertUserFromGitHub({
      githubId: "gh-1",
      login: "alice",
      displayName: "Alice",
      avatarUrl: "https://a.example/alice.png",
    });
    expect(u.login).toBe("alice");
    expect(u.isAdmin).toBe(false);
    expect(u.githubVerified).toBe(false);
    const rows = await h.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.githubId, "gh-1"));
    expect(rows).toHaveLength(1);
  });

  it("白名单命中（含空格容错）→ isAdmin=true", async () => {
    process.env.KNOWSHARE_ADMIN_LOGINS = "carol, alice ,dave";
    const u = await upsertUserFromGitHub({
      githubId: "gh-2",
      login: "alice",
      displayName: "Alice",
      avatarUrl: "https://a.example/alice.png",
    });
    expect(u.isAdmin).toBe(true);
  });

  it("幂等：二次登录刷新资料、不新增行、保留平台已置的 verified", async () => {
    await upsertUserFromGitHub({
      githubId: "gh-3",
      login: "bob",
      displayName: "Bob",
      avatarUrl: "https://a.example/old.png",
    });
    // 平台验证流程把该用户标为已验证（登录路径之外）。
    await h.db
      .update(schema.users)
      .set({ githubVerified: true })
      .where(eq(schema.users.githubId, "gh-3"));

    const u = await upsertUserFromGitHub({
      githubId: "gh-3",
      login: "bob",
      displayName: "Bob Smith",
      avatarUrl: "https://a.example/new.png",
    });
    expect(u.avatarUrl).toBe("https://a.example/new.png");
    expect(u.githubVerified).toBe(true); // 登录不擅自改 verified

    const rows = await h.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.githubId, "gh-3"));
    expect(rows).toHaveLength(1);
    expect(rows[0].displayName).toBe("Bob Smith");
  });

  it("非白名单登录不降级既有管理员", async () => {
    await h.db.insert(schema.users).values({
      githubId: "gh-4",
      login: "root",
      displayName: "Root",
      avatarUrl: "https://a.example/root.png",
      isAdmin: true,
      domains: [],
    });
    const u = await upsertUserFromGitHub({
      githubId: "gh-4",
      login: "root",
      displayName: "Root",
      avatarUrl: "https://a.example/root.png",
    });
    expect(u.isAdmin).toBe(true);
  });
});
