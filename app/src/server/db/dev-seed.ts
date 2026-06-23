/*
  开发联调种子（Task 2：前端↔真实后端）。
  仅在 `KNOWSHARE_DEV_DB==='pglite'` 的 dev 路径被 client.ts 调用，
  懒建内存 pglite + push schema + 注入与 `src/mocks/fixtures/*` 同形状的种子，
  经 deterministicUuid 对齐稳定主键。

  重要：本文件**只在 dev 标志下**被引用，不进入 prod（Neon）路径，也不被测试引用。
  测试自有 `tests/server/_harness.ts`（独立 setupHarness），与此互不影响。
  种子逻辑与 _harness 保持等价，避免前端联调与后端测试出现数据形状漂移。
*/
import type { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";
import type { Db } from "./client";

// 复用前端 fixtures 的数据形状（契约对齐）。
import {
  modules as seedModules,
  manifests as seedManifests,
  topics as seedTopics,
} from "@/mocks/fixtures/modules";
import { usageStats as seedUsageStats } from "@/mocks/fixtures/misc";

/** 把 fixture 的字符串 id（如 m-agent-memory）映射为确定性 uuid（与 _harness 同实现）。 */
export function deterministicUuid(seed: string): string {
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

/** 用 schema 生成全量建表 SQL（空快照 → 目标快照），等价于 db:push 首次建表。 */
export async function pushSchema(pg: PGlite): Promise<void> {
  // drizzle-kit/api 仅在 dev 联调路径懒加载。
  // 用变量化 specifier 阻止 Next 打包器静态跟踪进 drizzle-kit→postgres（postgres 未安装，
  // 静态 import 会触发 module-not-found 编译失败）；运行期由 Node 解析，仅 dev 走到。
  const mod = "drizzle-kit/api";
  const { generateDrizzleJson, generateMigration } = (await import(
    /* webpackIgnore: true */ /* @vite-ignore */ mod
  )) as typeof import("drizzle-kit/api");
  const prev = generateDrizzleJson({});
  const cur = generateDrizzleJson(schema as unknown as Record<string, unknown>);
  const statements = await generateMigration(prev, cur);
  for (const stmt of statements) {
    await pg.exec(stmt);
  }
}

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

async function seedModulesAndManifests(
  db: Db,
  userIds: Map<string, string>
): Promise<void> {
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
        id: deterministicUuid(m.id),
        ownerId,
        title: m.title,
        summary: m.summary,
        status: m.status,
        freshness: m.freshness,
      })
      .returning({ id: schema.knowledgeModules.id });

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

async function seedSignals(
  db: Db,
  userIds: Map<string, string>
): Promise<void> {
  const requesterId = userIds.get("newcomer") ?? userIds.values().next().value!;
  let exSeq = 8800;
  for (const m of seedModules) {
    const moduleId = deterministicUuid(m.id);
    if (m.trustLevel === "high") {
      await db.insert(schema.exchanges).values({
        publicRef: `EX-2024-${exSeq++}`,
        requesterId,
        targetModuleId: moduleId,
        status: "Completed",
      });
    } else if (m.trustLevel === "low") {
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
      window: s.label,
    });
  }
}

/** 在已 push schema 的 pglite drizzle 句柄上注入全量开发种子。 */
export async function seedDevDb(db: Db): Promise<void> {
  const userIds = await seedUsers(db, [
    ...seedModules.map((m) => m.ownerLogin),
    "newcomer",
  ]);
  await seedModulesAndManifests(db, userIds);
  await seedSignals(db, userIds);
  await seedStats(db);
}
