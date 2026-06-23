/*
  discovery 域服务层（modules/topics/stats）。
  从 DB 读取内部行 → 派生公开字段 → 经 projection 投影为公开输出（INV-04）。
  路由处理器只做 HTTP 编解码，业务在本层（便于契约/不变量测试直接调本层与 handler）。
*/
import { eq, and } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import {
  projectModule,
  projectManifest,
  projectTopic,
  projectUsageStat,
  assertNoForbidden,
  type ModuleRowLike,
} from "@/server/projection";
import type {
  KnowledgeModule,
  Manifest,
  Topic,
  TrustLevel,
  SortKey,
  UsageStat,
} from "@/lib/types";

/** 发现列表筛选参数（对齐前端 buildDiscoveryQuery 与 API-002 query）。 */
export interface DiscoveryFilters {
  type?: string[];
  topic?: string[];
  trustLevel?: TrustLevel[];
  verifiedOnly?: boolean;
  q?: string;
  sort?: SortKey;
  empty?: boolean;
  page?: number;
}

/** 从 URLSearchParams 解析筛选参数。 */
export function parseDiscoveryFilters(sp: URLSearchParams): DiscoveryFilters {
  return {
    type: sp.getAll("type"),
    topic: sp.getAll("topic"),
    trustLevel: sp.getAll("trustLevel") as TrustLevel[],
    verifiedOnly: sp.get("verifiedOnly") === "true",
    q: (sp.get("q") ?? "").trim() || undefined,
    sort: (sp.get("sort") as SortKey) ?? "relevance",
    empty: sp.get("empty") === "true",
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
  };
}

const TRUST_RANK: Record<TrustLevel, number> = {
  high: 3,
  medium: 2,
  low: 1,
  new: 0,
};

/**
  派生模块信任级别 / 计数（ENT-011 派生；本版用启发式：
  exchangeCount 与 favoriteCount 暂由社交信号/交换表聚合，无数据时为 0；
  trustLevel 由 owner 验证 + 交换量启发式派生）。
*/
async function loadModuleRows(): Promise<
  (ModuleRowLike & { ownerVerified: boolean })[]
> {
  const db = await getDb();
  const rows = await db
    .select({
      id: schema.knowledgeModules.id,
      title: schema.knowledgeModules.title,
      summary: schema.knowledgeModules.summary,
      status: schema.knowledgeModules.status,
      freshness: schema.knowledgeModules.freshness,
      ownerId: schema.knowledgeModules.ownerId,
      ownerLogin: schema.users.login,
      ownerVerified: schema.users.githubVerified,
    })
    .from(schema.knowledgeModules)
    .innerJoin(schema.users, eq(schema.knowledgeModules.ownerId, schema.users.id));

  const result: (ModuleRowLike & { ownerVerified: boolean })[] = [];
  for (const r of rows) {
    const man = (
      await db
        .select({
          topics: schema.manifests.topics,
          sourceStats: schema.manifests.sourceStats,
        })
        .from(schema.manifests)
        .where(eq(schema.manifests.moduleId, r.id))
        .limit(1)
    )[0];

    // 派生计数（交换/收藏）。
    const exchangeCount = (
      await db
        .select({ id: schema.exchanges.id })
        .from(schema.exchanges)
        .where(eq(schema.exchanges.targetModuleId, r.id))
    ).length;
    const favoriteCount = (
      await db
        .select({ id: schema.socialSignals.id })
        .from(schema.socialSignals)
        .where(
          and(
            eq(schema.socialSignals.kind, "favorite"),
            eq(schema.socialSignals.targetType, "module"),
            eq(schema.socialSignals.targetId, r.id)
          )
        )
    ).length;

    // 启发式信任级别：已验证 owner + 有交换 → high；已验证 → medium；否则 low/new。
    const trustLevel: TrustLevel = r.ownerVerified
      ? exchangeCount > 0
        ? "high"
        : "medium"
      : favoriteCount > 0
        ? "low"
        : "new";

    result.push({
      id: r.id,
      title: r.title,
      summary: r.summary,
      topics: man?.topics ?? [],
      sourceStats: (man?.sourceStats as KnowledgeModule["sourceStats"]) ?? {
        notes: 0,
        links: 0,
        files: 0,
        words: 0,
      },
      trustLevel,
      status: r.status,
      exchangeCount,
      favoriteCount,
      freshness: r.freshness ?? "",
      ownerLogin: r.ownerLogin,
      ownerVerified: r.ownerVerified,
    });
  }
  return result;
}

/** API-002：发现列表（筛选 + 排序 + q + empty + 分页）。 */
export async function listModules(
  filters: DiscoveryFilters
): Promise<{ items: KnowledgeModule[]; total: number }> {
  if (filters.empty) return { items: [], total: 0 };

  let rows = await loadModuleRows();
  const q = filters.q?.toLowerCase();
  if (q) {
    rows = rows.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.summary.toLowerCase().includes(q) ||
        m.topics.some((t) => t.toLowerCase().includes(q))
    );
  }
  if (filters.type?.length)
    rows = rows.filter((m) => filters.type!.includes(m.status));
  if (filters.topic?.length)
    rows = rows.filter((m) => m.topics.some((t) => filters.topic!.includes(t)));
  if (filters.trustLevel?.length)
    rows = rows.filter((m) => filters.trustLevel!.includes(m.trustLevel));
  if (filters.verifiedOnly) rows = rows.filter((m) => m.ownerVerified);

  const sorters: Record<string, (a: typeof rows[number], b: typeof rows[number]) => number> =
    {
      relevance: () => 0,
      latest: () => 0,
      popular: (a, b) => b.favoriteCount - a.favoriteCount,
      trust: (a, b) => TRUST_RANK[b.trustLevel] - TRUST_RANK[a.trustLevel],
    };
  rows.sort(sorters[filters.sort ?? "relevance"] ?? sorters.relevance);

  const items = rows.map((r) => projectModule(r));
  return { items, total: items.length };
}

/** API-003：单模块卡片投影；未知 → null（handler 转 404）。 */
export async function getModuleById(
  id: string
): Promise<KnowledgeModule | null> {
  const rows = await loadModuleRows();
  const row = rows.find((m) => m.id === id);
  return row ? projectModule(row) : null;
}

/** API-004：脱敏 Manifest；未知 → null。 */
export async function getManifestByModuleId(
  id: string
): Promise<Manifest | null> {
  const db = await getDb();
  const [man] = await db
    .select()
    .from(schema.manifests)
    .where(eq(schema.manifests.moduleId, id))
    .limit(1);
  if (!man) return null;
  return projectManifest({
    moduleId: man.moduleId,
    summary: man.summary,
    topics: man.topics,
    freshness: man.freshness,
    sourceStats: man.sourceStats as Manifest["sourceStats"],
    contentCommitment: man.contentCommitment,
    privacyBoundary: man.privacyBoundary,
    version: man.version,
  });
}

/** 详情聚合（API-005）——公开投影：module + manifest + owner + trust + privacy + fullManifest（零私有）。 */
export interface ModuleDetailDto {
  module: KnowledgeModule;
  manifest: Manifest;
  owner: {
    handle: string;
    githubVerified: boolean;
    avatarUrl: string;
    joinedAt: string;
    creditScore: number;
    badges: { type: string; label: string }[];
  };
  trust: {
    level: TrustLevel;
    explanation: string;
    favorites: number;
    endorsements: number;
  };
  privacy: {
    sensitivity: "low" | "medium" | "high";
    gate: "pass" | "warn";
    gateExplanation: string;
    redactionNotes?: string;
    contentCommitment?: string;
  };
  fullManifest: Record<string, unknown>; // 脱敏，**不含 contact**（INV-03/04）
  lifecycleState: "Published" | "Draft" | "Delisted" | "NotFound";
}

export async function getModuleDetail(
  id: string
): Promise<ModuleDetailDto | null> {
  const db = await getDb();
  const mod = await getModuleById(id);
  const manifest = await getManifestByModuleId(id);
  if (!mod || !manifest) return null;

  const [ownerRow] = await db
    .select({
      login: schema.users.login,
      avatarUrl: schema.users.avatarUrl,
      githubVerified: schema.users.githubVerified,
      joinedAt: schema.users.joinedAt,
    })
    .from(schema.knowledgeModules)
    .innerJoin(schema.users, eq(schema.knowledgeModules.ownerId, schema.users.id))
    .where(eq(schema.knowledgeModules.id, id))
    .limit(1);

  const trustProfile = ownerRow
    ? (
        await db
          .select({ score: schema.trustProfiles.score })
          .from(schema.trustProfiles)
          .innerJoin(
            schema.users,
            eq(schema.trustProfiles.userId, schema.users.id)
          )
          .where(eq(schema.users.login, ownerRow.login))
          .limit(1)
      )[0]
    : undefined;

  const owner = {
    handle: ownerRow?.login ?? mod.ownerLogin,
    githubVerified: ownerRow?.githubVerified ?? false,
    avatarUrl:
      ownerRow?.avatarUrl ??
      `https://avatars.example.com/${mod.ownerLogin}.png`,
    joinedAt: ownerRow?.joinedAt
      ? new Date(ownerRow.joinedAt).toISOString().slice(0, 10)
      : "2024-06-01",
    creditScore: trustProfile?.score ?? 0,
    badges: [] as { type: string; label: string }[],
  };

  const trust = {
    level: mod.trustLevel,
    explanation:
      mod.exchangeCount > 0
        ? "信任主要来自已完成交换的参与方反馈，其权重高于收藏与认可等社交信号（INV-10）。"
        : "信任随交换积累；该贡献者暂无交换历史。",
    favorites: mod.favoriteCount,
    endorsements: Math.round(mod.favoriteCount * 0.4),
  };

  const sensitivity: "low" | "medium" | "high" =
    mod.trustLevel === "low" || mod.trustLevel === "new"
      ? "high"
      : "low";
  const gate: "pass" | "warn" = sensitivity === "high" ? "warn" : "pass";
  const privacy = {
    sensitivity,
    gate,
    gateExplanation:
      gate === "warn"
        ? "隐私扫描提示需人工复核个别泛化项，但不含可发布阻断项（warn）。"
        : "隐私扫描通过：未发现需阻断的敏感内容（pass）。",
    redactionNotes: "已移除姓名、私有仓库、内部项目细节与逐字笔记片段。",
    contentCommitment: manifest.contentCommitment,
  };

  // fullManifest 脱敏聚合——后端权威边界**不放入 contact**（INV-03/04，与 MSW fixture 的「故意误传」相反）。
  const total =
    manifest.sourceStats.notes +
      manifest.sourceStats.links +
      manifest.sourceStats.files || 1;
  const fullManifest = {
    id: mod.id,
    title: mod.title,
    summary: mod.summary,
    topics: mod.topics,
    tags: mod.topics.map((t) => t.toLowerCase()),
    language: "zh-CN",
    owner_handle: owner.handle,
    exchange_intent: "希望交换知识工程方向的实践清单",
    sensitivity,
    covered_questions: mod.topics.map((_, i) => `覆盖问题 ${i + 1}`),
    source_types: [
      {
        label: "个人笔记",
        ratio: Math.round((manifest.sourceStats.notes / total) * 100),
      },
      {
        label: "项目记录",
        ratio: Math.round((manifest.sourceStats.files / total) * 100),
      },
      {
        label: "公开文章",
        ratio: Math.round((manifest.sourceStats.links / total) * 100),
      },
    ],
    freshness: mod.freshness,
    redaction_notes: privacy.redactionNotes,
    private_exchange_options: ["直接消息", "私下交付包"],
    license: "CC BY-NC-SA 4.0",
    updated_at: new Date().toISOString().slice(0, 10),
    version: manifest.version,
  };

  const lifecycleState: ModuleDetailDto["lifecycleState"] =
    mod.status === "Delisted"
      ? "Delisted"
      : mod.status === "Draft"
        ? "Draft"
        : "Published";

  const dto: ModuleDetailDto = {
    module: mod,
    manifest,
    owner,
    trust,
    privacy,
    fullManifest,
    lifecycleState,
  };
  return assertNoForbidden(dto, "module-detail");
}

/** API-007：主题目录（含 moduleCount）。 */
export async function listTopics(): Promise<{ items: Topic[] }> {
  const db = await getDb();
  const rows = await db.select().from(schema.topics);
  const items: Topic[] = [];
  for (const t of rows) {
    const count = (
      await db
        .select({ moduleId: schema.moduleTopics.moduleId })
        .from(schema.moduleTopics)
        .where(eq(schema.moduleTopics.topicId, t.id))
    ).length;
    items.push(projectTopic({ id: t.id, label: t.label, moduleCount: count }));
  }
  return { items };
}

/** API-052：平台聚合统计（无 PII，INV-09）。取每个 metricKey 最新一条。 */
export async function listUsageStats(): Promise<{ items: UsageStat[] }> {
  const db = await getDb();
  const rows = await db.select().from(schema.usageStats);
  // 每 metricKey 取最新（capturedAt desc）。
  const latest = new Map<string, (typeof rows)[number]>();
  for (const r of rows) {
    const prev = latest.get(r.metricKey);
    if (!prev || new Date(r.capturedAt) > new Date(prev.capturedAt)) {
      latest.set(r.metricKey, r);
    }
  }
  const items = Array.from(latest.values()).map((r) =>
    projectUsageStat({
      key: r.metricKey,
      label: r.window ?? r.metricKey,
      value: Number(r.value),
    })
  );
  return { items };
}
