/*
  后端测试夹具（TDD harness）。
  - pglite 内存库 + 由 Drizzle schema 生成建表 SQL（pushSchema 等价：generateMigration 空→全量）。
  - 注入种子（复用前端 fixtures 的数据形状，契约对齐）。
  - 注入 mock session（auth.setTestSession）与内存 redis（redis.setRedis）。
  用法：
    const h = await setupHarness();
    ... 调 route handler ...
    await h.teardown();
*/
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { generateDrizzleJson, generateMigration } from "drizzle-kit/api";
import * as schema from "@/server/db/schema";
import { setDb, resetDb, type Db } from "@/server/db/client";
import {
  setTestSession,
  clearTestSession,
  setSessionResolver,
} from "@/server/auth";
import { setRedis, resetRedis, MemoryRedis } from "@/server/redis";
import type { Session } from "@/lib/types";

// 复用前端种子的数据形状（契约对齐；KnowledgeModule/Manifest/Topic/UsageStat 形状）。
import {
  modules as seedModules,
  manifests as seedManifests,
  topics as seedTopics,
} from "@/mocks/fixtures/modules";
import { usageStats as seedUsageStats } from "@/mocks/fixtures/misc";

export interface Harness {
  db: Db;
  redis: MemoryRedis;
  pg: PGlite;
  /** 切换当前会话身份（mock）。 */
  setSession(session: Session | null): void;
  teardown(): Promise<void>;
}

/** 用 schema 生成全量建表 SQL（空快照 → 目标快照），等价于 db:push 首次建表。 */
async function pushSchema(pg: PGlite): Promise<void> {
  const prev = generateDrizzleJson({});
  const cur = generateDrizzleJson(
    schema as unknown as Record<string, unknown>
  );
  const statements = await generateMigration(prev, cur);
  for (const stmt of statements) {
    await pg.exec(stmt);
  }
}

/** 把前端 fixture 的 owner login 解析/插入 users，返回 login→userId 映射。 */
async function seedUsers(
  db: Db,
  logins: string[]
): Promise<Map<string, string>> {
  const uniq = Array.from(new Set(logins));
  const map = new Map<string, string>();
  for (const login of uniq) {
    const [row] = await db
      .insert(schema.users)
      .values({
        githubId: `gh-${login}`,
        login,
        displayName: login,
        avatarUrl: `https://avatars.example.com/${login}.png`,
        githubVerified: login !== "ops-bot" && login !== "growth-lab",
        isAdmin: login === "zyongzhu24",
        domains: [],
      })
      .returning({ id: schema.users.id });
    map.set(login, row.id);
  }
  return map;
}

/** 派生 trustLevel→无需存列，但 fixture 已带；插入模块时映射 owner。 */
async function seedModulesAndManifests(
  db: Db,
  userIds: Map<string, string>
): Promise<void> {
  // 主题
  const topicIds = new Map<string, string>();
  for (const t of seedTopics) {
    const [row] = await db
      .insert(schema.topics)
      .values({ label: t.label })
      .returning({ id: schema.topics.id });
    topicIds.set(t.label, row.id);
  }

  for (const m of seedModules) {
    const ownerId = userIds.get(m.ownerLogin)!;
    const [mod] = await db
      .insert(schema.knowledgeModules)
      .values({
        // 用 fixture id 作为稳定主键，便于按 id 查询（pglite 接受任意 uuid 文本）。
        id: deterministicUuid(m.id),
        ownerId,
        title: m.title,
        summary: m.summary,
        status: m.status,
        freshness: m.freshness,
      })
      .returning({ id: schema.knowledgeModules.id });

    // module_topics 关联
    for (const label of m.topics) {
      const tid = topicIds.get(label);
      if (tid) {
        await db
          .insert(schema.moduleTopics)
          .values({ moduleId: mod.id, topicId: tid });
      }
    }

    const man = seedManifests.find((x) => x.moduleId === m.id);
    if (man) {
      await db.insert(schema.manifests).values({
        moduleId: mod.id,
        summary: man.summary,
        topics: man.topics,
        freshness: man.freshness,
        sourceStats: man.sourceStats,
        contentCommitment: man.contentCommitment ?? null,
        privacyBoundary: man.privacyBoundary ?? null,
        version: man.version,
      });
    }
  }
}

/**
  播种交换 + 收藏信号，使派生 trustLevel 贴近 fixture 的 trustLevel 分布
  （已验证 owner + 有交换 → high；有收藏的未验证 owner → low）。
  这样筛选/排序测试在派生模型下也成立（trustLevel 不存列、由事件派生）。
*/
async function seedSignals(
  db: Db,
  userIds: Map<string, string>
): Promise<void> {
  // 任取一个请求者（非 owner 即可）。
  const requesterId = userIds.get("newcomer") ?? userIds.values().next().value!;
  let exSeq = 8800;
  for (const m of seedModules) {
    const moduleId = deterministicUuid(m.id);
    if (m.trustLevel === "high") {
      // 有已完成交换 → 验证 owner 派生 high。
      await db.insert(schema.exchanges).values({
        publicRef: `EX-2024-${exSeq++}`,
        requesterId,
        targetModuleId: moduleId,
        status: "Completed",
      });
    } else if (m.trustLevel === "low") {
      // 未验证 owner + 收藏 → 派生 low。
      await db.insert(schema.socialSignals).values({
        actorId: requesterId,
        kind: "favorite",
        targetType: "module",
        targetId: moduleId,
      });
    }
  }
}

async function seedStats(db: Db): Promise<void> {
  for (const s of seedUsageStats) {
    await db.insert(schema.usageStats).values({
      metricKey: s.key,
      value: String(s.value),
      window: s.label, // 复用 label 作展示口径
    });
  }
}

/** 把 fixture 的字符串 id（如 m-agent-memory）映射为确定性 uuid。 */
export function deterministicUuid(seed: string): string {
  // 朴素 FNV-ish hash → 填充成 uuid v4 形态（仅测试用，稳定可复现）。
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, "0");
  const a = hex(h);
  const b = hex(Math.imul(h, 0x85ebca6b));
  const c = hex(Math.imul(h ^ 0x9e3779b9, 0xc2b2ae35));
  const d = hex(Math.imul(h + seed.length, 0x27d4eb2f));
  const raw = (a + b + c + d).slice(0, 32);
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-4${raw.slice(13, 16)}-8${raw.slice(
    17,
    20
  )}-${raw.slice(20, 32)}`;
}

export interface SetupOptions {
  /** 初始会话（默认匿名 null）。 */
  session?: Session | null;
  /** 是否注入默认种子（默认 true）。 */
  seed?: boolean;
}

export async function setupHarness(opts: SetupOptions = {}): Promise<Harness> {
  const pg = new PGlite();
  await pushSchema(pg);
  const db = drizzle(pg, { schema }) as unknown as Db;
  setDb(db);

  const redis = new MemoryRedis();
  setRedis(redis);

  setTestSession(opts.session ?? null);

  if (opts.seed !== false) {
    const userIds = await seedUsers(db, [
      ...seedModules.map((m) => m.ownerLogin),
      "newcomer", // 请求者（驱动交换/收藏信号派生）
    ]);
    await seedModulesAndManifests(db, userIds);
    await seedSignals(db, userIds);
    await seedStats(db);
  }

  return {
    db,
    redis,
    pg,
    setSession(session) {
      setTestSession(session);
    },
    async teardown() {
      clearTestSession();
      resetDb();
      resetRedis();
      await pg.close();
    },
  };
}

export { schema, setSessionResolver, setTestSession };
