/*
  交换域服务层（modules 交换关系/披露/交付确认；BACKEND_SPEC §交换域，W-2/W-2a）。
  - 路由处理器只做 HTTP 编解码，业务在本层。
  - 公开输出走脱敏投影（INV-04）；联系方式真实值仅 Accepted+ 参与方对该次对方返回（INV-03）。
  - 状态写动作服务端校验合法迁移（FLOW-003），非法 → DomainError(409)（HARD-02/RISK-003）。
  - 跨边界写 consents（INV-08）；关键动作写 audit_log（INV-11）。
*/
import { eq, and, ne } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { getSession } from "@/server/auth";
import { getRedis } from "@/server/redis";
import { assertNoForbidden } from "@/server/projection";
import type { Session, ExchangeStatus, TrustLevel } from "@/lib/types";
import type {
  ExchangeLedgerRow,
  ExchangeDetail,
  ExchangePartyDetail,
  ExchangeContactInfo,
  ExchangeDisclosureSnapshot,
  ExchangeTimelineStep,
  ExchangeVerificationItem,
  ExchangeModuleSummary,
  ExchangeDeliveryChannel,
} from "@/lib/queries/exchange";

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

/* ── 状态机（FLOW-003）：合法迁移表 ───────────────────────────── */
const LEGAL_TRANSITIONS: Record<string, ExchangeStatus[]> = {
  Requested: ["Accepted", "Rejected", "Cancelled", "Expired", "Flagged"],
  Accepted: ["PrivatePreparing", "Cancelled", "Flagged"],
  PrivatePreparing: ["Delivered", "Cancelled", "Flagged"],
  Delivered: ["Completed", "Flagged"],
  Completed: ["WaitingForFeedback", "Flagged"],
  WaitingForFeedback: ["Closed", "Flagged"],
  Closed: [],
  Rejected: [],
  Cancelled: [],
  Expired: [],
  Flagged: [],
  InReview: [],
};

function assertTransition(from: string, to: ExchangeStatus): void {
  if (!(LEGAL_TRANSITIONS[from] ?? []).includes(to)) {
    throw new DomainError(409, "illegal-transition", {
      message: `非法状态迁移 ${from} → ${to}（FLOW-003）`,
    });
  }
}

/** 台账不列出的状态（Flagged 及其中性投影 InReview；FLOW-005/ASM-032）。 */
const LEDGER_EXCLUDED: ExchangeStatus[] = ["Flagged", "InReview"];

const ACTIVE_OR_LATER: ExchangeStatus[] = [
  "Accepted",
  "PrivatePreparing",
  "Delivered",
  "Completed",
  "WaitingForFeedback",
  "Closed",
];

/* ── 限流配额 ─────────────────────────────────────────────────── */
const WRITE_LIMIT = 30;
const WRITE_WINDOW = 60;

async function rateLimit(scope: string, actorKey: string): Promise<void> {
  const redis = await getRedis();
  const { allowed } = await redis.rateLimit(
    `ratelimit:exchange:${scope}:${actorKey}`,
    WRITE_LIMIT,
    WRITE_WINDOW
  );
  if (!allowed) throw new DomainError(429, "rate-limited");
}

/* ── 会话/参与方解析 ──────────────────────────────────────────── */
async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new DomainError(401, "unauthenticated");
  return session;
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

interface ExchangeRow {
  id: string;
  publicRef: string;
  requesterId: string;
  targetModuleId: string;
  offeredModuleId: string | null;
  status: string;
  requesterConfirmedDelivery: boolean;
  ownerConfirmedDelivery: boolean;
  cancelReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
  按 id 加载交换。id 可为内部 uuid 或脱敏号 publicRef（EX-…）。
  非 uuid 且非已知 publicRef → null（handler 转 404），不让 DB 抛 uuid 解析错。
*/
async function loadExchange(id: string): Promise<ExchangeRow | null> {
  const db = await getDb();
  const where = UUID_RE.test(id)
    ? eq(schema.exchanges.id, id)
    : eq(schema.exchanges.publicRef, id);
  const [row] = await db
    .select()
    .from(schema.exchanges)
    .where(where)
    .limit(1);
  return (row as ExchangeRow) ?? null;
}

/** 目标模块所有者 id。 */
async function ownerIdOf(targetModuleId: string): Promise<string | null> {
  const db = await getDb();
  const [m] = await db
    .select({ ownerId: schema.knowledgeModules.ownerId })
    .from(schema.knowledgeModules)
    .where(eq(schema.knowledgeModules.id, targetModuleId))
    .limit(1);
  return m?.ownerId ?? null;
}

type ViewerRole = "requester" | "owner" | "spectator";

async function viewerRoleFor(
  row: ExchangeRow,
  session: Session | null
): Promise<{ role: ViewerRole; userId: string | null }> {
  if (!session) return { role: "spectator", userId: null };
  const uid = await userIdByLogin(session.login);
  if (!uid) return { role: "spectator", userId: null };
  if (uid === row.requesterId) return { role: "requester", userId: uid };
  const ownerId = await ownerIdOf(row.targetModuleId);
  if (uid === ownerId) return { role: "owner", userId: uid };
  return { role: "spectator", userId: uid };
}

async function assertParticipant(
  row: ExchangeRow,
  session: Session
): Promise<{ role: "requester" | "owner"; userId: string; ownerId: string }> {
  const ownerId = (await ownerIdOf(row.targetModuleId)) ?? "";
  const uid = await userIdByLogin(session.login);
  if (uid && uid === row.requesterId)
    return { role: "requester", userId: uid, ownerId };
  if (uid && uid === ownerId) return { role: "owner", userId: uid, ownerId };
  throw new DomainError(403, "not-participant");
}

/* ── 公开身份/信任派生（轻量；不读私有）──────────────────────── */
async function partyDetail(
  userId: string,
  role: "requester" | "owner"
): Promise<ExchangePartyDetail> {
  const db = await getDb();
  const [u] = await db
    .select({
      login: schema.users.login,
      avatarUrl: schema.users.avatarUrl,
      verified: schema.users.githubVerified,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  // 成功交换次数（公开信号）。
  const done = await db
    .select({ id: schema.exchanges.id })
    .from(schema.exchanges)
    .where(
      and(
        eq(schema.exchanges.requesterId, userId),
        eq(schema.exchanges.status, "Completed")
      )
    );
  const [tp] = await db
    .select({ level: schema.trustProfiles.level })
    .from(schema.trustProfiles)
    .where(eq(schema.trustProfiles.userId, userId))
    .limit(1);
  return {
    login: u?.login ?? "unknown",
    avatarUrl: u?.avatarUrl,
    verified: !!u?.verified,
    trustLevel: (tp?.level as TrustLevel) ?? "new",
    role,
    successfulExchanges: done.length,
  };
}

async function moduleSummary(
  moduleId: string | null
): Promise<ExchangeModuleSummary | undefined> {
  if (!moduleId) return undefined;
  const db = await getDb();
  const [m] = await db
    .select({
      id: schema.knowledgeModules.id,
      title: schema.knowledgeModules.title,
      summary: schema.knowledgeModules.summary,
    })
    .from(schema.knowledgeModules)
    .where(eq(schema.knowledgeModules.id, moduleId))
    .limit(1);
  if (!m) return undefined;
  const [man] = await db
    .select({ topics: schema.manifests.topics })
    .from(schema.manifests)
    .where(eq(schema.manifests.moduleId, moduleId))
    .limit(1);
  return {
    moduleId: m.id,
    title: m.title,
    summary: m.summary,
    topics: man?.topics ?? [],
  };
}

/* ── 披露快照读取（脱敏边界内）──────────────────────────────── */
async function disclosureByDiscloser(
  exchangeId: string,
  discloserId: string
): Promise<ExchangeDisclosureSnapshot | undefined> {
  const db = await getDb();
  const [d] = await db
    .select()
    .from(schema.contactDisclosures)
    .where(
      and(
        eq(schema.contactDisclosures.exchangeId, exchangeId),
        eq(schema.contactDisclosures.discloserId, discloserId)
      )
    )
    .limit(1);
  if (!d) return undefined;
  const snap = d.snapshot as ExchangeDisclosureSnapshot["contacts"];
  return { contacts: snap, disclosedAt: new Date(d.disclosedAt).toISOString() };
}

/** 己方可披露的联系方式（真实清单；仅参与方）。INV-03。 */
async function myContacts(userId: string): Promise<ExchangeContactInfo[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.contactInfo)
    .where(eq(schema.contactInfo.userId, userId));
  return rows.map((c) => ({
    type: c.type as ExchangeContactInfo["type"],
    label: c.label ?? c.type,
    masked: maskValue(c.value),
  }));
}

function maskValue(v: string): string {
  if (v.includes("@")) {
    const [u, d] = v.split("@");
    return `${u.slice(0, 2)}***@${d}`;
  }
  return v.length > 6 ? `${v.slice(0, 6)}***` : "***";
}

/* ── 时间线/验证派生（公开面；不读交付物 INV-01）──────────────── */
function buildTimeline(row: ExchangeRow): ExchangeTimelineStep[] {
  const order: ExchangeStatus[] = [
    "Requested",
    "Accepted",
    "PrivatePreparing",
    "Delivered",
    "Completed",
  ];
  const idx = order.indexOf(row.status as ExchangeStatus);
  return order.map((key, i) => ({
    key,
    label: key,
    status:
      i < idx ? "completed" : i === idx ? "active" : ("pending" as const),
  }));
}

function buildVerification(row: ExchangeRow): ExchangeVerificationItem[] {
  return [
    { key: "identity", label: "身份", status: "verified" },
    { key: "ownership", label: "所有权", status: "verified" },
    {
      key: "delivery",
      label: "交付",
      status: row.status === "Completed" ? "verified" : "pending",
    },
  ];
}

/* ════════════════════════════════════════════════════════════════
   API-014：公开脱敏台账。
   ════════════════════════════════════════════════════════════════ */
export interface LedgerFilters {
  status?: string;
  topic?: string;
  q?: string;
  sort?: string;
  page?: number;
  empty?: boolean;
}

export function parseLedgerFilters(sp: URLSearchParams): LedgerFilters {
  return {
    status: sp.get("status") ?? undefined,
    topic: sp.get("topic") ?? undefined,
    q: (sp.get("q") ?? "").trim() || undefined,
    sort: sp.get("sort") ?? "latest",
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    empty: sp.get("empty") === "true",
  };
}

const STATUS_GROUPS: Record<string, ExchangeStatus[]> = {
  active: ["Requested", "Accepted", "PrivatePreparing", "Delivered"],
  completed: ["Completed", "Closed", "WaitingForFeedback"],
  unfulfilled: ["Rejected", "Cancelled", "Expired"],
};

export async function listLedger(
  filters: LedgerFilters
): Promise<{ items: ExchangeLedgerRow[]; total: number; topics: string[] }> {
  if (filters.empty) return { items: [], total: 0, topics: [] };
  const db = await getDb();
  const rows = (await db.select().from(schema.exchanges)) as ExchangeRow[];

  const topicSet = new Set<string>();
  let items: ExchangeLedgerRow[] = [];
  for (const r of rows) {
    if (LEDGER_EXCLUDED.includes(r.status as ExchangeStatus)) continue; // 排除 Flagged（INV-04/FLOW-005）
    const ownerId = await ownerIdOf(r.targetModuleId);
    const requester = await partyDetail(r.requesterId, "requester");
    const target = ownerId
      ? await partyDetail(ownerId, "owner")
      : { login: "unknown", verified: false, trustLevel: "new" as TrustLevel };
    const targetMod = await moduleSummary(r.targetModuleId);
    const offeredMod = await moduleSummary(r.offeredModuleId);
    const topics = targetMod?.topics ?? [];
    topics.forEach((t) => topicSet.add(t));
    items.push({
      exchangeId: r.publicRef, // 脱敏号（ASM-031；不暴露内部 uuid）
      requester: {
        login: requester.login,
        avatarUrl: requester.avatarUrl,
        verified: requester.verified,
        trustLevel: requester.trustLevel,
      },
      target: {
        login: target.login,
        avatarUrl: (target as ExchangePartyDetail).avatarUrl,
        verified: target.verified,
        trustLevel: target.trustLevel,
      },
      direction: r.offeredModuleId ? "reciprocal" : "oneway", // INV-05
      targetModuleName: targetMod?.title ?? "",
      offeredModuleName: offeredMod?.title,
      topics,
      status: r.status as ExchangeStatus,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString(),
    });
  }

  // 状态分组筛选。
  if (filters.status && filters.status !== "all") {
    const grp = STATUS_GROUPS[filters.status];
    if (grp) items = items.filter((i) => grp.includes(i.status));
  }
  if (filters.topic) items = items.filter((i) => i.topics.includes(filters.topic!));
  if (filters.q) {
    const q = filters.q.toLowerCase();
    items = items.filter(
      (i) =>
        i.targetModuleName.toLowerCase().includes(q) ||
        i.topics.some((t) => t.toLowerCase().includes(q))
    );
  }
  if (filters.sort === "latest" || !filters.sort) {
    items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  assertNoForbidden(items, "exchange-ledger");
  return { items, total: items.length, topics: Array.from(topicSet).sort() };
}

/* ════════════════════════════════════════════════════════════════
   API-015：详情聚合（按调用者关系投影 + 披露门）。
   ════════════════════════════════════════════════════════════════ */
export async function getExchangeDetail(
  id: string,
  session: Session | null
): Promise<ExchangeDetail | null> {
  const row = await loadExchange(id);
  if (!row) return null;

  const { role, userId } = await viewerRoleFor(row, session);
  const ownerId = (await ownerIdOf(row.targetModuleId)) ?? "";
  const requester = await partyDetail(row.requesterId, "requester");
  const target = await partyDetail(ownerId, "owner");
  const targetModule = (await moduleSummary(row.targetModuleId))!;
  const offeredModule = await moduleSummary(row.offeredModuleId);

  // 披露门：仅参与方且 Accepted+ 才含真实联系方式（INV-03）。
  const isParticipant = role === "requester" || role === "owner";
  const accessible = isParticipant && ACTIVE_OR_LATER.includes(row.status as ExchangeStatus);

  let myContactList: ExchangeContactInfo[] = [];
  let myDisclosure: ExchangeDisclosureSnapshot | undefined;
  let peerDisclosure: ExchangeDisclosureSnapshot | undefined;
  if (accessible && userId) {
    myContactList = await myContacts(userId);
    myDisclosure = await disclosureByDiscloser(id, userId);
    const peerId = role === "requester" ? ownerId : row.requesterId;
    peerDisclosure = await disclosureByDiscloser(id, peerId);
  }

  const detail: ExchangeDetail = {
    exchangeId: row.publicRef,
    status: row.status as ExchangeStatus,
    createdAt: new Date(row.createdAt).toISOString(),
    viewerRole: role,
    isAuthenticated: !!session,
    direction: row.offeredModuleId ? "reciprocal" : "oneway",
    requester,
    target,
    targetModule,
    offeredModule,
    timeline: buildTimeline(row),
    verification: buildVerification(row),
    delivery: {
      channel: "github_private_repo" as ExchangeDeliveryChannel,
      channelLabel: "GitHub 私有仓库",
      deliveryHint: "通过平台外私有通道交付，平台仅记录状态（INV-04）。",
    },
    disclosure: {
      myContacts: myContactList,
      myDisclosure,
      peerDisclosure,
    },
    feedbackWindow: row.status === "WaitingForFeedback" ? "open" : "closed",
  };
  // 脱敏守卫：peerDisclosure/myDisclosure 含真实 value 是合法披露门内字段，
  // FORBIDDEN 列表不含 "value"/"contacts"，故守卫只拦 contact/email 等键名。
  return assertNoForbidden(detail, "exchange-detail");
}

/* ════════════════════════════════════════════════════════════════
   API-019：创建交换请求。
   ════════════════════════════════════════════════════════════════ */
export interface CreateExchangeInput {
  targetModuleId?: string;
  offeredModuleId?: string;
  consent?: { actionType?: string };
}

let refSeq = Date.now() % 100000;

export async function createExchange(
  input: CreateExchangeInput
): Promise<{ exchangeId: string; status: ExchangeStatus }> {
  const session = await requireSession();
  await rateLimit("create", session.login);

  if (!input.consent || input.consent.actionType !== "exchange") {
    throw new DomainError(422, "consent-required", { missing: ["consent"] });
  }
  if (!input.targetModuleId) {
    throw new DomainError(400, "target-required", { missing: ["targetModuleId"] });
  }

  const db = await getDb();
  const [mod] = await db
    .select({
      id: schema.knowledgeModules.id,
      status: schema.knowledgeModules.status,
    })
    .from(schema.knowledgeModules)
    .where(eq(schema.knowledgeModules.id, input.targetModuleId))
    .limit(1);
  if (!mod) throw new DomainError(404, "module-not-found");
  if (mod.status !== "Published")
    throw new DomainError(409, "module-not-published");

  const requesterId = (await userIdByLogin(session.login))!;
  const publicRef = `EX-${new Date().getFullYear()}-${(refSeq++).toString().padStart(5, "0")}`;
  const [created] = await db
    .insert(schema.exchanges)
    .values({
      publicRef,
      requesterId,
      targetModuleId: input.targetModuleId,
      offeredModuleId: input.offeredModuleId ?? null, // INV-05/DEC-009
      status: "Requested",
    })
    .returning({ id: schema.exchanges.id, publicRef: schema.exchanges.publicRef });

  // Consent（INV-08）+ Audit（INV-11）。
  await db.insert(schema.consents).values({
    userId: requesterId,
    actionType: "exchange",
    relatedType: "exchange",
    relatedId: created.id,
  });
  await db.insert(schema.auditLog).values({
    actorId: requesterId,
    action: "exchange.create",
    targetType: "exchange",
    targetId: created.id,
    metadata: { publicRef: created.publicRef },
  });
  const redis = await getRedis();
  await redis.incr("stat:exchanges_total");

  return { exchangeId: created.publicRef, status: "Requested" };
}

/* ── 通用状态迁移动作（accept/reject/cancel）──────────────────── */
async function transitionByOwner(
  id: string,
  to: ExchangeStatus,
  action: string
): Promise<ExchangeDetail> {
  const session = await requireSession();
  const row = await loadExchange(id);
  if (!row) throw new DomainError(404, "not-found");
  await rateLimit(action, session.login);

  const ownerId = await ownerIdOf(row.targetModuleId);
  const uid = await userIdByLogin(session.login);
  if (!uid || uid !== ownerId) throw new DomainError(403, "not-owner");

  assertTransition(row.status, to);
  const db = await getDb();
  await db
    .update(schema.exchanges)
    .set({ status: to, updatedAt: new Date() })
    .where(eq(schema.exchanges.id, id));
  await db.insert(schema.auditLog).values({
    actorId: uid,
    action: `exchange.${action}`,
    targetType: "exchange",
    targetId: id,
  });
  return (await getExchangeDetail(id, session))!;
}

export async function acceptExchange(id: string): Promise<ExchangeDetail> {
  return transitionByOwner(id, "Accepted", "accept");
}

export async function rejectExchange(
  id: string,
  reason?: string
): Promise<ExchangeDetail> {
  const session = await requireSession();
  const row = await loadExchange(id);
  if (!row) throw new DomainError(404, "not-found");
  await rateLimit("reject", session.login);
  const ownerId = await ownerIdOf(row.targetModuleId);
  const uid = await userIdByLogin(session.login);
  if (!uid || uid !== ownerId) throw new DomainError(403, "not-owner");
  assertTransition(row.status, "Rejected");
  const db = await getDb();
  await db
    .update(schema.exchanges)
    .set({ status: "Rejected", cancelReason: reason ?? null, updatedAt: new Date() })
    .where(eq(schema.exchanges.id, id));
  await db.insert(schema.auditLog).values({
    actorId: uid,
    action: "exchange.reject",
    targetType: "exchange",
    targetId: id,
  });
  return (await getExchangeDetail(id, session))!;
}

export async function cancelExchange(
  id: string,
  reason?: string
): Promise<ExchangeDetail> {
  const session = await requireSession();
  const row = await loadExchange(id);
  if (!row) throw new DomainError(404, "not-found");
  await rateLimit("cancel", session.login);
  await assertParticipant(row, session); // 参与方（任一方）
  if (!reason || !reason.trim())
    throw new DomainError(400, "reason-required", { missing: ["reason"] });
  assertTransition(row.status, "Cancelled");
  const db = await getDb();
  const uid = (await userIdByLogin(session.login))!;
  await db
    .update(schema.exchanges)
    .set({ status: "Cancelled", cancelReason: reason, updatedAt: new Date() })
    .where(eq(schema.exchanges.id, id));
  await db.insert(schema.auditLog).values({
    actorId: uid,
    action: "exchange.cancel",
    targetType: "exchange",
    targetId: id,
  });
  return (await getExchangeDetail(id, session))!;
}

/* ════════════════════════════════════════════════════════════════
   API-016：披露联系方式（W-2a；INV-03/08/11）。
   ════════════════════════════════════════════════════════════════ */
export interface DiscloseInput {
  types?: string[];
  consent?: boolean;
}

export async function discloseContacts(
  id: string,
  input: DiscloseInput
): Promise<ExchangeDetail> {
  const session = await requireSession();
  const row = await loadExchange(id);
  if (!row) throw new DomainError(404, "not-found");
  await rateLimit("disclose", session.login);

  // 参与方校验（非参与方 → 403）。
  const { userId, ownerId } = await assertParticipant(row, session);
  // 状态门：仅 Accepted+ 才允许披露（INV-03/TEST-003）。
  if (!ACTIVE_OR_LATER.includes(row.status as ExchangeStatus)) {
    throw new DomainError(403, "not-accepted");
  }
  // Consent 门（INV-08/TEST-007）。
  if (input.consent !== true) {
    throw new DomainError(422, "consent-required", { missing: ["consent"] });
  }

  const types = input.types?.length ? input.types : undefined;
  const db = await getDb();
  const contacts = await db
    .select()
    .from(schema.contactInfo)
    .where(eq(schema.contactInfo.userId, userId));
  const selected = contacts.filter((c) => !types || types.includes(c.type));
  const snapshot = selected.map((c) => ({
    type: c.type as ExchangeContactInfo["type"],
    label: c.label ?? c.type,
    value: c.value, // 披露时刻真实值快照（仅对该次对方；INV-03）
  }));

  const recipientId = userId === row.requesterId ? ownerId : row.requesterId;

  await db.insert(schema.contactDisclosures).values({
    exchangeId: id,
    discloserId: userId,
    recipientId,
    snapshot,
  });
  await db.insert(schema.consents).values({
    userId,
    actionType: "contact",
    relatedType: "exchange",
    relatedId: id,
  });
  await db.insert(schema.auditLog).values({
    actorId: userId,
    action: "exchange.disclose",
    targetType: "exchange",
    targetId: id,
    metadata: { types: selected.map((c) => c.type) }, // 仅类型，无真实值（INV-09）
  });

  return (await getExchangeDetail(id, session))!;
}

/* ════════════════════════════════════════════════════════════════
   API-017：撤回披露（只影响未来；ASM-013）。
   ════════════════════════════════════════════════════════════════ */
export async function revokeDisclosure(id: string): Promise<ExchangeDetail> {
  const session = await requireSession();
  const row = await loadExchange(id);
  if (!row) throw new DomainError(404, "not-found");
  await rateLimit("revoke", session.login);
  const { userId } = await assertParticipant(row, session);
  const db = await getDb();
  // 仅置 revokedForFuture，已披露快照不收回。
  await db
    .update(schema.contactDisclosures)
    .set({ revokedForFuture: true })
    .where(
      and(
        eq(schema.contactDisclosures.exchangeId, id),
        eq(schema.contactDisclosures.discloserId, userId)
      )
    );
  await db.insert(schema.auditLog).values({
    actorId: userId,
    action: "exchange.revoke",
    targetType: "exchange",
    targetId: id,
  });
  return (await getExchangeDetail(id, session))!;
}

/* ════════════════════════════════════════════════════════════════
   API-018：标记已交付 / 双方确认（INV-06/TEST-005）。
   ════════════════════════════════════════════════════════════════ */
export async function markDelivered(id: string): Promise<ExchangeDetail> {
  const session = await requireSession();
  const row = await loadExchange(id);
  if (!row) throw new DomainError(404, "not-found");
  await rateLimit("mark-delivered", session.login);
  const { role, userId } = await assertParticipant(row, session);

  const db = await getDb();
  const patch =
    role === "requester"
      ? { requesterConfirmedDelivery: true }
      : { ownerConfirmedDelivery: true };
  const reqConfirmed = role === "requester" ? true : row.requesterConfirmedDelivery;
  const ownConfirmed = role === "owner" ? true : row.ownerConfirmedDelivery;

  let nextStatus = row.status as ExchangeStatus;
  // 双方各自确认才迁移 Delivered→Completed（INV-06）。
  if (
    row.status === "Delivered" &&
    reqConfirmed &&
    ownConfirmed
  ) {
    assertTransition(row.status, "Completed");
    nextStatus = "Completed";
  }

  await db
    .update(schema.exchanges)
    .set({ ...patch, status: nextStatus, updatedAt: new Date() })
    .where(eq(schema.exchanges.id, id));
  await db.insert(schema.auditLog).values({
    actorId: userId,
    action: "exchange.mark-delivered",
    targetType: "exchange",
    targetId: id,
  });
  return (await getExchangeDetail(id, session))!;
}

// 抑制未用导入告警（保留 ne 以备扩展）。
void ne;
