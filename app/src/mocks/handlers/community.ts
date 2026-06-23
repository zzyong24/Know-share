/*
  社交信号 + 举报 MSW handlers（W-7 / API-049~051；ASM-120 写端点 mock 可用）。
  导出 communityHandlers；页面测试可 setupServer(communityHandlers) 自包含。
  形状对齐后端 route handlers：
  - POST /api/modules/:id/favorite → { favorited, favoriteCount }（toggle 幂等，INV-07）
  - POST /api/users/:login/endorse → { endorsed, endorsementCount }（不能认可自己 → 400）
  - POST /api/reports → { id, status:"pending" }（201；缺字段/非法 targetType → 400）
  零私有内容（INV-04）；演示用内存计数，守唯一/幂等语义（可简化但不违背）。
*/
import { http, HttpResponse, type RequestHandler } from "msw";

/** 运行期收藏态/计数（仅本进程；toggle 幂等演示 INV-07）。 */
const favoriteState = new Map<string, { favorited: boolean; count: number }>();
/** 运行期认可态/计数（仅本进程；唯一演示 INV-07）。 */
const endorseState = new Map<string, { endorsed: boolean; count: number }>();
/** 演示用举报号自增。 */
let reportSeq = 1;

/** 演示登录身份（不能认可自己用）。 */
const SELF_LOGIN = "knowledge-trader";

/** 测试间重置（afterEach 可调用）。 */
export function __resetCommunityRuntime() {
  favoriteState.clear();
  endorseState.clear();
  reportSeq = 1;
}

const VALID_REPORT_TARGETS = new Set(["module", "user", "exchange"]);

export const communityHandlers: RequestHandler[] = [
  // 收藏 / 取消收藏（API-049）：body { toggle?: boolean }。toggle=true 切换；缺省确保收藏（幂等）。
  http.post("/api/modules/:id/favorite", async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json().catch(() => ({}))) as {
      toggle?: boolean;
    };
    const prev = favoriteState.get(id) ?? { favorited: false, count: 12 };
    // toggle=true 切换；缺省/false 确保收藏（幂等不增）。
    const favorited = body.toggle ? !prev.favorited : true;
    let count = prev.count;
    if (favorited && !prev.favorited) count = prev.count + 1;
    else if (!favorited && prev.favorited) count = Math.max(0, prev.count - 1);
    favoriteState.set(id, { favorited, count });
    return HttpResponse.json({ favorited, favoriteCount: count });
  }),

  // 认可（API-050）：不能认可自己 → 400；唯一信号（INV-07/INV-10）。
  http.post("/api/users/:login/endorse", ({ params }) => {
    const login = String(params.login);
    if (login === SELF_LOGIN) {
      return HttpResponse.json(
        { error: "cannot-endorse-self" },
        { status: 400 }
      );
    }
    const prev = endorseState.get(login) ?? { endorsed: false, count: 8 };
    const endorsed = !prev.endorsed;
    const count = endorsed ? prev.count + 1 : Math.max(0, prev.count - 1);
    endorseState.set(login, { endorsed, count });
    return HttpResponse.json({ endorsed, endorsementCount: count });
  }),

  // 举报（API-051）：body { targetType, targetId, reason } → reports(pending) + 入评审队列。
  http.post("/api/reports", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      targetType?: string;
      targetId?: string;
      reason?: string;
    };
    if (
      !body.targetType ||
      !VALID_REPORT_TARGETS.has(body.targetType) ||
      !body.targetId ||
      !body.reason?.trim()
    ) {
      return HttpResponse.json(
        { error: "invalid-report" },
        { status: 400 }
      );
    }
    return HttpResponse.json(
      { id: `rpt-${reportSeq++}`, status: "pending" },
      { status: 201 }
    );
  }),
];
