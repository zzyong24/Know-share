import type { RequestHandler } from "msw";

/*
  MSW 请求处理器。Task Zero 阶段为空数组（仅证明 MSW 接线可用）。
  阶段 11 实现期按 MOCK_DATA_SPEC（MOCK-001~020）逐模块填充种子 handlers，
  接口形状最终以阶段 15 SERVICE_CONTRACT 为准（ASM-067/ASM-111）。
*/
export const handlers: RequestHandler[] = [];
