/*
  drizzle-kit 配置（迁移/建表）。
  `npm run db:push` 直接把 schema 同步到 DATABASE_URL（Neon）；
  生成式迁移用 `npx drizzle-kit generate`（输出到 ./drizzle）。
*/
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
