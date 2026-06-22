import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/** 浏览器环境下的 MSW worker（开发/前端验证用）。 */
export const worker = setupWorker(...handlers);
