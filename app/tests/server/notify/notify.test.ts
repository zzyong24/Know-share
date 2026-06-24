/*
  FR-120 通知闭环：领域事件 → 站内通知（必达）+ 邮件旁路（best-effort，可降级）。
  以「接受交换 → 通知请求方」为代表链路验证 notifyUser 接线与邮件注入。
*/
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupHarness, schema, type Harness } from "../_harness";
import { eq } from "drizzle-orm";
import { setEmailSender, resetEmailSender, type EmailMessage } from "@/server/email";

import { POST as acceptExchange } from "@/app/api/exchanges/[id]/accept/route";

let h: Harness;
let aliceId = "";
let bobId = "";
let targetModuleId = "";

const ALICE = { login: "alice", avatarUrl: "a", isAdmin: false, verified: true } as const;
const BOB = { login: "bob", avatarUrl: "b", isAdmin: false, verified: true } as const;

async function seedUser(login: string): Promise<string> {
  const [u] = await h.db
    .insert(schema.users)
    .values({ githubId: `gh-${login}`, login, displayName: login, avatarUrl: login, githubVerified: true })
    .returning({ id: schema.users.id });
  return u.id;
}

function post(path: string): Request {
  return new Request(`http://localhost${path}`, { method: "POST" });
}
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(async () => {
  h = await setupHarness({ seed: false });
  aliceId = await seedUser(ALICE.login);
  bobId = await seedUser(BOB.login);
  // alice 账户邮箱（默认私密；自我提醒用，非披露）。
  await h.db.insert(schema.contactInfo).values({
    userId: aliceId,
    type: "email",
    value: "alice@example.com",
    label: "邮箱",
  });
  const [m] = await h.db
    .insert(schema.knowledgeModules)
    .values({ ownerId: bobId, title: "Bob 模块", summary: "s", status: "Published" })
    .returning({ id: schema.knowledgeModules.id });
  targetModuleId = m.id;
});

afterEach(async () => {
  resetEmailSender();
  await h.teardown();
});

async function seedRequested(): Promise<string> {
  const [row] = await h.db
    .insert(schema.exchanges)
    .values({ publicRef: "EX-NOTIF-1", requesterId: aliceId, targetModuleId, status: "Requested" })
    .returning({ id: schema.exchanges.id });
  return row.id;
}

describe("FR-120 接受交换 → 通知请求方", () => {
  it("站内通知必达：accept 后请求方多一条 exchange 类通知", async () => {
    setEmailSender(null); // 本用例只验证站内
    const id = await seedRequested();
    h.setSession(BOB); // 所有者接受
    const res = await acceptExchange(post(`/api/exchanges/${id}/accept`), ctx(id));
    expect(res.status).toBe(200);

    const notifs = await h.db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, aliceId));
    expect(notifs.length).toBe(1);
    expect(notifs[0].type).toBe("exchange");
    expect(notifs[0].read).toBe(false);
  });

  it("邮件旁路：请求方有邮箱时调用发送器（发到本人邮箱）", async () => {
    const sent: EmailMessage[] = [];
    setEmailSender(async (m) => {
      sent.push(m);
    });
    const id = await seedRequested();
    h.setSession(BOB);
    await acceptExchange(post(`/api/exchanges/${id}/accept`), ctx(id));

    expect(sent.length).toBe(1);
    expect(sent[0].to).toBe("alice@example.com");
  });

  it("降级：发送器抛错也不影响站内通知落库", async () => {
    setEmailSender(async () => {
      throw new Error("resend down");
    });
    const id = await seedRequested();
    h.setSession(BOB);
    const res = await acceptExchange(post(`/api/exchanges/${id}/accept`), ctx(id));
    expect(res.status).toBe(200);
    const notifs = await h.db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, aliceId));
    expect(notifs.length).toBe(1);
  });
});
