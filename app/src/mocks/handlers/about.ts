/*
  关于页 MSW handlers（PAGE-102 平台统计）。导出 aboutHandlers（不改聚合器 handlers.ts）。
  返回 about.ts fixture 的聚合统计 + 月度活跃序列；严格无 PII（INV-09）。
  接口形状占位，阶段 15 对齐 SERVICE_CONTRACT（ASM-067）。
*/
import { http, HttpResponse, type RequestHandler } from "msw";
import { aboutStats } from "../fixtures/about";

export const aboutHandlers: RequestHandler[] = [
  http.get("/api/about/stats", () => HttpResponse.json(aboutStats)),
];
