import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/** Node 环境（Vitest）下的 MSW 服务器。 */
export const server = setupServer(...handlers);
