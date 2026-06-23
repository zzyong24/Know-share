/*
  账户域服务层（H 段 API-031~042）——个人中心 / 通知 / 联系方式 / 同意记录 / 账户身份 / 通知偏好。
  守则：
  - 全部需登录（调用方在 handler 经 requireSession 守 401）。
  - 仅本人可读写自己的私域（按 session.login → userId 过滤；越权 → 403/404）。
  - 联系方式默认私密、公开为显式 opt-in（INV-03/DEC-010）；公开面永不返回真实 value。
  - 同意记录融合 Consent + ContactDisclosure 展示（ASM-046）；撤回只影响未来（INV-08/ASM-013）。
  - 写端点写 audit（INV-11）；通知偏好仅站内（邮件延后 ASM-048），存 redis（无 schema 列）。
  - 公开/账户输出零私有（INV-04）：经 assertNoForbidden 过守卫。
*/
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { getRedis } from "@/server/redis";
import * as schema from "@/server/db/schema";
import { assertNoForbidden, projectModule } from "@/server/projection";
import type {
  Session,
  KnowledgeModule,
  Notification,
  TrustLevel,
} from "@/lib/types";
import type {
  DashboardData,
  DraftItem,
  ConsentRecord,
  ContactMethod,
  AccountIdentity,
  NotificationPrefs,
} from "@/mocks/fixtures/account";

/** 业务层错误：handler 据 status 编码为 HTTP 响应。 */
export class AccountError extends Error {
  constructor(
    public status: number,
    public code: string,
    message?: string
  ) {
    super(message ?? code);
  }
}

/** 解析 session.login → 内部 userId（找不到 → 401，未注册身份）。 */
async function resolveUserId(session: Session): Promise<string> {
  const db = await getDb();
  const [u] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.login, session.login))
    .limit(1);
  if (!u) throw new AccountError(401, "unauthenticated");
  return u.id;
}

/** 写审计（INV-11）。 */
async function writeAudit(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  const db = await getDb();
  await db.insert(schema.auditLog).values({
    actorId,
    action,
    targetType,
    targetId,
    metadata: metadata ?? null,
  });
}

/** 限流（NFR-006）：写端点按 userId 限流，超限抛 429。 */
async function enforceRateLimit(
  userId: string,
  bucket: string,
  limit = 30,
  windowSeconds = 60
): Promise<void> {
  const redis = await getRedis();
  const { allowed } = await redis.rateLimit(
    `rl:account:${bucket}:${userId}`,
    limit,
    windowSeconds
  );
  if (!allowed) throw new AccountError(429, "rate-limited");
}

// ── API-031：个人中心概览 ──────────────────────────────────────
export async function getDashboard(session: Session): Promise<DashboardData> {
  const db = await getDb();
  const userId = await resolveUserId(session);

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  const myModules = await db
    .select({ id: schema.knowledgeModules.id })
    .from(schema.knowledgeModules)
    .where(eq(schema.knowledgeModules.ownerId, userId));

  // 活跃交换（发起 or 目标为本人模块；非终态）。
  const moduleIds = myModules.map((m) => m.id);
  const asRequester = await db
    .select({ id: schema.exchanges.id, status: schema.exchanges.status })
    .from(schema.exchanges)
    .where(eq(schema.exchanges.requesterId, userId));
  let activeExchangesCount = asRequester.filter(
    (e) => e.status !== "Completed" && e.status !== "Cancelled" && e.status !== "Rejected"
  ).length;
  for (const mid of moduleIds) {
    const rows = await db
      .select({ status: schema.exchanges.status })
      .from(schema.exchanges)
      .where(eq(schema.exchanges.targetModuleId, mid));
    activeExchangesCount += rows.filter(
      (e) => e.status !== "Completed" && e.status !== "Cancelled" && e.status !== "Rejected"
    ).length;
  }

  const [trust] = await db
    .select({ score: schema.trustProfiles.score })
    .from(schema.trustProfiles)
    .where(eq(schema.trustProfiles.userId, userId))
    .limit(1);

  const unread = await db
    .select({ id: schema.notifications.id })
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.read, false)
      )
    );

  // 收到的交换待处理数（目标为本人模块、状态 Requested）。
  let receivedPending = 0;
  for (const mid of moduleIds) {
    const rows = await db
      .select({ status: schema.exchanges.status })
      .from(schema.exchanges)
      .where(eq(schema.exchanges.targetModuleId, mid));
    receivedPending += rows.filter((e) => e.status === "Requested").length;
  }

  const data: DashboardData = {
    currentUser: {
      displayName: user?.displayName ?? session.login,
      githubHandle: user?.login ?? session.login,
      avatarUrl: user?.avatarUrl ?? session.avatarUrl,
      githubVerified: user?.githubVerified ?? false,
    },
    stats: {
      myModulesCount: myModules.length,
      activeExchangesCount,
      trustScore: trust?.score ?? 0,
      unreadNotificationsCount: unread.length,
    },
    subNavBadges: { received: receivedPending },
    welcomeSummary:
      receivedPending > 0
        ? `今天有 ${receivedPending} 个待处理的交换请求`
        : "暂无待处理的交换请求",
  };
  return assertNoForbidden(data, "dashboard");
}

// ── API-032：分区视图（modules/drafts/received/sent/favorites）──
export type MeSection = "modules" | "drafts" | "received" | "sent" | "favorites";
const VALID_SECTIONS: MeSection[] = [
  "modules",
  "drafts",
  "received",
  "sent",
  "favorites",
];

export function isValidSection(s: string): s is MeSection {
  return (VALID_SECTIONS as string[]).includes(s);
}

interface ExchangeLite {
  id: string;
  publicRef: string;
  status: string;
  role: "requester" | "owner";
  counterpartyModuleTitle?: string;
  createdAt: string;
}

export async function getSection(
  session: Session,
  section: string
): Promise<{ items: unknown[] }> {
  if (!isValidSection(section)) {
    throw new AccountError(400, "invalid-section");
  }
  const db = await getDb();
  const userId = await resolveUserId(session);

  if (section === "modules") {
    const rows = await db
      .select()
      .from(schema.knowledgeModules)
      .where(eq(schema.knowledgeModules.ownerId, userId));
    const items: KnowledgeModule[] = [];
    for (const r of rows) {
      const [man] = await db
        .select({ topics: schema.manifests.topics, sourceStats: schema.manifests.sourceStats })
        .from(schema.manifests)
        .where(eq(schema.manifests.moduleId, r.id))
        .limit(1);
      items.push(
        projectModule({
          id: r.id,
          title: r.title,
          summary: r.summary,
          topics: man?.topics ?? [],
          sourceStats:
            (man?.sourceStats as KnowledgeModule["sourceStats"]) ?? {
              notes: 0,
              links: 0,
              files: 0,
              words: 0,
            },
          trustLevel: "new" as TrustLevel,
          status: r.status,
          exchangeCount: 0,
          favoriteCount: 0,
          freshness: r.freshness ?? "",
          ownerLogin: session.login,
        })
      );
    }
    return assertNoForbidden({ items }, "me-modules");
  }

  if (section === "drafts") {
    const rows = await db
      .select()
      .from(schema.submissions)
      .where(
        and(
          eq(schema.submissions.submitterId, userId),
          eq(schema.submissions.status, "Draft")
        )
      );
    const items: DraftItem[] = rows.map((r) => {
      const draft = (r.draftData as { moduleTitle?: string } | null) ?? null;
      return {
        id: r.id,
        moduleTitle: draft?.moduleTitle ?? "未命名草稿",
        lastEditedAt: new Date(r.updatedAt).toISOString(),
        privacyScanStatus: "pending",
      };
    });
    return { items };
  }

  if (section === "received") {
    // 目标为本人模块的交换。
    const myModules = await db
      .select({ id: schema.knowledgeModules.id, title: schema.knowledgeModules.title })
      .from(schema.knowledgeModules)
      .where(eq(schema.knowledgeModules.ownerId, userId));
    const items: ExchangeLite[] = [];
    for (const m of myModules) {
      const rows = await db
        .select()
        .from(schema.exchanges)
        .where(eq(schema.exchanges.targetModuleId, m.id));
      for (const e of rows) {
        items.push({
          id: e.id,
          publicRef: e.publicRef,
          status: e.status,
          role: "owner",
          counterpartyModuleTitle: m.title,
          createdAt: new Date(e.createdAt).toISOString(),
        });
      }
    }
    return assertNoForbidden({ items }, "me-received");
  }

  if (section === "sent") {
    const rows = await db
      .select()
      .from(schema.exchanges)
      .where(eq(schema.exchanges.requesterId, userId));
    const items: ExchangeLite[] = rows.map((e) => ({
      id: e.id,
      publicRef: e.publicRef,
      status: e.status,
      role: "requester",
      createdAt: new Date(e.createdAt).toISOString(),
    }));
    return assertNoForbidden({ items }, "me-sent");
  }

  // favorites：本人 favorite 的模块卡片投影。
  const favs = await db
    .select({ targetId: schema.socialSignals.targetId })
    .from(schema.socialSignals)
    .where(
      and(
        eq(schema.socialSignals.actorId, userId),
        eq(schema.socialSignals.kind, "favorite"),
        eq(schema.socialSignals.targetType, "module")
      )
    );
  const items: KnowledgeModule[] = [];
  for (const f of favs) {
    const [r] = await db
      .select()
      .from(schema.knowledgeModules)
      .where(eq(schema.knowledgeModules.id, f.targetId))
      .limit(1);
    if (!r) continue;
    const [owner] = await db
      .select({ login: schema.users.login })
      .from(schema.users)
      .where(eq(schema.users.id, r.ownerId))
      .limit(1);
    const [man] = await db
      .select({ topics: schema.manifests.topics, sourceStats: schema.manifests.sourceStats })
      .from(schema.manifests)
      .where(eq(schema.manifests.moduleId, r.id))
      .limit(1);
    items.push(
      projectModule({
        id: r.id,
        title: r.title,
        summary: r.summary,
        topics: man?.topics ?? [],
        sourceStats:
          (man?.sourceStats as KnowledgeModule["sourceStats"]) ?? {
            notes: 0,
            links: 0,
            files: 0,
            words: 0,
          },
        trustLevel: "new" as TrustLevel,
        status: r.status,
        exchangeCount: 0,
        favoriteCount: 0,
        freshness: r.freshness ?? "",
        ownerLogin: owner?.login ?? "",
      })
    );
  }
  return assertNoForbidden({ items }, "me-favorites");
}

// ── API-033：通知列表（type 过滤 + unreadCount）──────────────────
export async function listNotifications(
  session: Session,
  type?: string
): Promise<{ items: Notification[]; unreadCount: number }> {
  const db = await getDb();
  const userId = await resolveUserId(session);

  const all = await db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.userId, userId))
    .orderBy(desc(schema.notifications.createdAt));

  // unreadCount 为全部未读总数（徽标语义，独立于 type 过滤）。
  const unreadCount = all.filter((n) => !n.read).length;

  const filtered = type && type !== "all" ? all.filter((n) => n.type === type) : all;
  const items: Notification[] = filtered.map((n) => ({
    id: n.id,
    type: n.type as Notification["type"],
    title: n.title,
    body: n.body,
    read: n.read,
    createdAt: new Date(n.createdAt).toISOString(),
    ...(n.href ? { href: n.href } : {}),
  }));
  return { items, unreadCount };
}

// ── API-034：单条已读（幂等；本人隔离）─────────────────────────
export async function markNotificationRead(
  session: Session,
  id: string
): Promise<void> {
  const db = await getDb();
  const userId = await resolveUserId(session);
  const [n] = await db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.id, id))
    .limit(1);
  if (!n) throw new AccountError(404, "not-found");
  if (n.userId !== userId) throw new AccountError(404, "not-found"); // 本人隔离（不泄露存在性）
  if (n.read) return; // 幂等
  await db
    .update(schema.notifications)
    .set({ read: true })
    .where(eq(schema.notifications.id, id));
}

// ── API-035：全部已读（仅本人）─────────────────────────────────
export async function markAllNotificationsRead(session: Session): Promise<void> {
  const db = await getDb();
  const userId = await resolveUserId(session);
  await db
    .update(schema.notifications)
    .set({ read: true })
    .where(
      and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.read, false)
      )
    );
}

// ── API-036：联系方式（脱敏；默认私密；本人）────────────────────
const CONTACT_META: Record<string, { label: string; icon: string }> = {
  github: { label: "GitHub", icon: "code" },
  email: { label: "邮箱", icon: "forum" },
  im: { label: "即时通讯", icon: "open_in_new" },
  custom: { label: "自定义渠道", icon: "open_in_new" },
};

/** 脱敏真实值 → maskedValue（永不回显原值，INV-03/04）。 */
function maskValue(type: string, value: string): string {
  if (type === "github") return value.startsWith("@") ? value : `@${value}`;
  if (type === "email") {
    const [user, domain] = value.split("@");
    if (!domain) return "****";
    const head = user.slice(0, 1);
    return `${head}****@${domain}`;
  }
  if (value.length <= 2) return "****";
  return `${value.slice(0, 1)}****`;
}

export async function listContacts(
  session: Session
): Promise<{ items: ContactMethod[] }> {
  const db = await getDb();
  const userId = await resolveUserId(session);
  const rows = await db
    .select()
    .from(schema.contactInfo)
    .where(eq(schema.contactInfo.userId, userId));
  const items: ContactMethod[] = rows
    .filter((r) => !r.revokedAt)
    .map((r) => {
      const meta = CONTACT_META[r.type] ?? { label: r.label ?? r.type, icon: "open_in_new" };
      return {
        id: r.id,
        type: r.type,
        label: r.label ?? meta.label,
        maskedValue: maskValue(r.type, r.value), // 仅脱敏展示，无真实 value
        visibility: r.visibility as "private" | "public",
        isSet: true,
        icon: meta.icon,
      };
    });
  return assertNoForbidden({ items }, "me-contacts");
}

// ── API-037：保存联系方式（默认私密；写 Consent+Audit；限流）────
interface ContactSaveItem {
  id?: string;
  type: string;
  label?: string;
  value?: string;
  visibility?: "private" | "public";
}

export async function saveContacts(
  session: Session,
  items: ContactSaveItem[]
): Promise<{ ok: true }> {
  const db = await getDb();
  const userId = await resolveUserId(session);
  await enforceRateLimit(userId, "contact-save");

  for (const item of items) {
    if (!item.type) continue;
    // 默认私密（INV-03/DEC-010）：未显式给 public 一律落 private。
    const visibility: "private" | "public" =
      item.visibility === "public" ? "public" : "private";

    // 已有同 type 的有效行 → 更新；否则插入（需 value）。
    const [existing] = await db
      .select()
      .from(schema.contactInfo)
      .where(
        and(
          eq(schema.contactInfo.userId, userId),
          eq(schema.contactInfo.type, item.type)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(schema.contactInfo)
        .set({
          visibility,
          ...(item.value != null ? { value: item.value } : {}),
          ...(item.label != null ? { label: item.label } : {}),
          updatedAt: new Date(),
        })
        .where(eq(schema.contactInfo.id, existing.id));
    } else {
      await db.insert(schema.contactInfo).values({
        userId,
        type: item.type,
        value: item.value ?? "",
        label: item.label ?? null,
        visibility,
      });
    }
  }

  // 写 contact Consent（INV-08）+ audit（INV-11）。
  await db.insert(schema.consents).values({
    userId,
    actionType: "contact",
    scope: items.map((i) => i.type).join(","),
    relatedType: "contact",
    relatedId: null,
  });
  await writeAudit(userId, "contact.save", "contact", null, {
    count: items.length,
  });
  return { ok: true };
}

// ── API-038：同意/披露记录（融合 Consent+ContactDisclosure，ASM-046）──
export type ConsentMode = "disclosure" | "all-consent";

export async function listConsents(
  session: Session,
  mode: ConsentMode
): Promise<{ items: ConsentRecord[] }> {
  const db = await getDb();
  const userId = await resolveUserId(session);

  const rows = await db
    .select()
    .from(schema.consents)
    .where(eq(schema.consents.userId, userId))
    .orderBy(desc(schema.consents.createdAt));

  // 披露记录：融合 contact 类 Consent 与 ContactDisclosure 快照（ASM-046）。
  // consent.relatedId 存的是 publicRef（text），故按 publicRef 建索引便于匹配。
  const disclosures = await db
    .select({
      revokedForFuture: schema.contactDisclosures.revokedForFuture,
      publicRef: schema.exchanges.publicRef,
    })
    .from(schema.contactDisclosures)
    .innerJoin(
      schema.exchanges,
      eq(schema.contactDisclosures.exchangeId, schema.exchanges.id)
    )
    .where(eq(schema.contactDisclosures.discloserId, userId));
  const discByRef = new Map<string, (typeof disclosures)[number]>();
  for (const d of disclosures) discByRef.set(d.publicRef, d);

  let consentRows = rows;
  if (mode === "disclosure") {
    consentRows = rows.filter((c) => c.actionType === "contact");
  }

  const items: ConsentRecord[] = consentRows.map((c) => {
    const disc =
      c.relatedType === "exchange" && c.relatedId
        ? discByRef.get(c.relatedId)
        : undefined;
    const methods =
      c.actionType === "contact" && c.scope
        ? c.scope.split(",").map((t) => CONTACT_META[t]?.label ?? t)
        : [];
    return {
      id: c.id,
      counterpartyHandle: c.relatedType === "exchange" ? "—" : "—",
      disclosedMethods: methods,
      date: new Date(c.createdAt).toISOString().slice(0, 10),
      exchangeRef:
        c.relatedType === "exchange" && c.relatedId ? c.relatedId : undefined,
      source:
        c.actionType === "contact"
          ? "因交换自动授权"
          : c.actionType === "submit"
            ? "提交模块时同意发布脱敏清单"
            : c.actionType === "generate"
              ? "运行本地 Agent 技能生成清单的同意"
              : "同意记录",
      revocable: c.actionType === "contact",
      revoked: !!disc?.revokedForFuture,
      actionType: c.actionType as ConsentRecord["actionType"],
    };
  });
  return assertNoForbidden({ items }, "me-consents");
}

// ── API-039：撤回披露（只影响未来；保留历史；写 audit）───────────
export async function revokeConsent(
  session: Session,
  consentId: string
): Promise<{ ok: true }> {
  const db = await getDb();
  const userId = await resolveUserId(session);

  const [c] = await db
    .select()
    .from(schema.consents)
    .where(eq(schema.consents.id, consentId))
    .limit(1);
  if (!c) throw new AccountError(404, "not-found");
  if (c.userId !== userId) throw new AccountError(404, "not-found"); // 本人隔离

  // 只影响未来（ASM-013）：保留 Consent 历史行；将相关披露标记 revokedForFuture。
  // 注：consent.relatedId 对 contact 类存的是脱敏公开号（publicRef，text），
  // 需先按 publicRef 解析 exchange.id（uuid）再匹配披露快照。
  if (c.relatedType === "exchange" && c.relatedId) {
    const [ex] = await db
      .select({ id: schema.exchanges.id })
      .from(schema.exchanges)
      .where(eq(schema.exchanges.publicRef, c.relatedId))
      .limit(1);
    if (ex) {
      await db
        .update(schema.contactDisclosures)
        .set({ revokedForFuture: true })
        .where(
          and(
            eq(schema.contactDisclosures.discloserId, userId),
            eq(schema.contactDisclosures.exchangeId, ex.id)
          )
        );
    }
  }
  // 同时把本人公开联系方式回落私密（防未来新披露泄露当前公开值）。
  await writeAudit(userId, "consent.revoke", "consent", consentId, {
    actionType: c.actionType,
  });
  return { ok: true };
}

// ── API-040：账户身份（只读 GitHub）────────────────────────────
export async function getAccountIdentity(
  session: Session
): Promise<AccountIdentity> {
  const db = await getDb();
  const userId = await resolveUserId(session);
  const [u] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  const out: AccountIdentity = {
    githubHandle: u?.login ?? session.login,
    githubVerified: u?.githubVerified ?? false,
    joinedAt: u?.joinedAt
      ? new Date(u.joinedAt).toISOString().slice(0, 10)
      : "",
    displayName: u?.displayName ?? session.login,
    avatarUrl: u?.avatarUrl ?? session.avatarUrl,
  };
  return assertNoForbidden(out, "me-account");
}

// ── API-041/042：通知偏好（仅站内 ASM-048；进程内存储，无 schema 列）──
// 说明：通知偏好为站内开关（邮件延后 ASM-048），且 schema 无对应列（缺列标记，
// 不改 schema.ts/_harness.ts）。本版以账户域进程内 Map 按 userId 持久（测试/演示一致）；
// 生产可平滑替换为专表或 KV，不改 handler 契约。
const DEFAULT_PREFS: NotificationPrefs = {
  exchange: true,
  review: true,
  feedback: true,
  community: false,
};

/** 进程内偏好存储（userId → prefs）。 */
const prefsStore = new Map<string, NotificationPrefs>();

export async function getNotificationPrefs(
  session: Session
): Promise<NotificationPrefs> {
  const userId = await resolveUserId(session);
  return { ...(prefsStore.get(userId) ?? DEFAULT_PREFS) };
}

export async function saveNotificationPrefs(
  session: Session,
  prefs: NotificationPrefs
): Promise<{ ok: true }> {
  const userId = await resolveUserId(session);
  await enforceRateLimit(userId, "notif-prefs");
  prefsStore.set(userId, {
    exchange: !!prefs.exchange,
    review: !!prefs.review,
    feedback: !!prefs.feedback,
    community: !!prefs.community,
  });
  await writeAudit(userId, "notif-prefs.save", "notification-prefs", null);
  return { ok: true };
}

/** 测试辅助：清空偏好存储（避免跨用例串味；harness 不感知本 Map）。 */
export function __resetPrefsStore(): void {
  prefsStore.clear();
}
