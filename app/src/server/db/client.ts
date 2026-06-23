/*
  数据库客户端（DEC-017 零氪 serverless 栈）。
  - prod：Neon serverless（@neondatabase/serverless + drizzle-orm/neon-http），按 DATABASE_URL 懒建。
  - test/local：pglite（@electric-sql/pglite + drizzle-orm/pglite），内存库，测试夹具注入。
  懒建（lazy）：模块顶层**不连真实 DB**，避免 `next build` 构建期触网/失败（缺 env 也能 build）。
*/
import type { PgliteDatabase } from "drizzle-orm/pglite";
import * as schema from "./schema";

/**
  统一 DB 句柄类型。pglite（测试）与 neon-http（prod）的 Drizzle 查询构建器
  在本项目用法下结构兼容；为让 .insert().values() 等方法类型可解析，
  统一以 PgliteDatabase<typeof schema> 作为契约类型，neon 实例在 getDb 内强转。
*/
export type Db = PgliteDatabase<typeof schema>;

let cached: Db | null = null;
// dev pglite 真库的单例 promise（KNOWSHARE_DEV_DB=pglite）；memoize 确保仅建一次。
let devDbPromise: Promise<Db> | null = null;

/** 测试夹具直接注入已建好的 pglite drizzle 句柄（_harness 用）。 */
export function setDb(db: Db): void {
  cached = db;
}

/** 测试清理：重置缓存句柄。 */
export function resetDb(): void {
  cached = null;
}

/**
  dev 联调真库（opt-in，仅 `KNOWSHARE_DEV_DB==='pglite'`）。
  懒创建单例 pglite + push schema + 注入种子，仅一次（memoize）。
  绝不影响：测试路径（已用 setDb 注入，cached 提前命中）、prod 路径（有 DATABASE_URL）。
  种子/建表逻辑在 dev-seed.ts 中懒加载（drizzle-kit/api 不进 prod 包）。
*/
function getDevDb(): Promise<Db> {
  if (!devDbPromise) {
    devDbPromise = (async () => {
      const { PGlite } = await import("@electric-sql/pglite");
      const { drizzle } = await import("drizzle-orm/pglite");
      const { pushSchema, seedDevDb } = await import("./dev-seed");
      const pg = new PGlite();
      await pushSchema(pg);
      const db = drizzle(pg, { schema }) as unknown as Db;
      await seedDevDb(db);
      console.log("[dev-db] pglite 真库已就绪（push schema + 种子注入）。");
      return db;
    })();
  }
  return devDbPromise;
}

/**
  懒获取 DB 句柄。
  - 已注入（测试） → 直接返回。
  - dev 联调标志（KNOWSHARE_DEV_DB=pglite，非测试、无 DATABASE_URL） → 单例 pglite 真库。
  - 否则按 DATABASE_URL 建 Neon serverless 句柄（仅在首个请求时连）。
  - 缺 DATABASE_URL → 抛错（仅运行期触发，不影响 build）。
*/
export async function getDb(): Promise<Db> {
  if (cached) return cached;

  const url = process.env.DATABASE_URL;
  if (
    process.env.KNOWSHARE_DEV_DB === "pglite" &&
    process.env.NODE_ENV !== "test" &&
    !url
  ) {
    return getDevDb();
  }
  if (!url) {
    throw new Error(
      "DATABASE_URL 未配置：生产/本地运行需 Neon 连接串；测试请用 _harness 注入 pglite。"
    );
  }
  const { neon } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-http");
  // neon-http 实例与 pglite 查询构建器结构兼容（本项目用法）；强转为统一 Db 类型。
  cached = drizzle(neon(url), { schema }) as unknown as Db;
  return cached;
}

export { schema };
