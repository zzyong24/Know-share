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

/** 测试夹具直接注入已建好的 pglite drizzle 句柄（_harness 用）。 */
export function setDb(db: Db): void {
  cached = db;
}

/** 测试清理：重置缓存句柄。 */
export function resetDb(): void {
  cached = null;
}

/**
  懒获取 DB 句柄。
  - 已注入（测试） → 直接返回。
  - 否则按 DATABASE_URL 建 Neon serverless 句柄（仅在首个请求时连）。
  - 缺 DATABASE_URL → 抛错（仅运行期触发，不影响 build）。
*/
export async function getDb(): Promise<Db> {
  if (cached) return cached;

  const url = process.env.DATABASE_URL;
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
