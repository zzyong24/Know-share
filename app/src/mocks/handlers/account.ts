/*
  MSW 请求处理器 · account 集群（个人中心 / 通知 / 设置·联系方式 / 账户 / 通知偏好）。
  导出 accountHandlers（不改聚合器 handlers.ts）。页面测试自带 setupServer(accountHandlers)。
  复用既有 fixtures（modules / exchanges / misc.notifications / misc.contacts）+ account.ts 派生形状。
  说明：handler 形状为占位，阶段 15 对齐 SERVICE_CONTRACT（ASM-067/111）。
*/
import { http, HttpResponse, type RequestHandler } from "msw";
import { modules } from "../fixtures/modules";
import { exchanges } from "../fixtures/exchanges";
import { notifications as notificationSeed } from "../fixtures/misc";
import {
  dashboard,
  drafts,
  disclosureRecords,
  allConsentRecords,
  contactMethods,
  accountIdentity,
  notificationPrefs,
} from "../fixtures/account";
import type { Notification, NotificationType } from "@/lib/types";

const MINE = "zyongzhu24"; // demoSession.login

// 通知：handler 内维护可变副本，支持乐观标记已读 / 全部已读（ASM-045）。
let notificationStore: Notification[] = notificationSeed.map((n) => ({ ...n }));

/** 重置通知存量（测试 afterEach 可调用，避免跨用例污染）。 */
export function __resetAccountStore() {
  notificationStore = notificationSeed.map((n) => ({ ...n }));
}

export const accountHandlers: RequestHandler[] = [
  // 会话：account 段需登录态，默认返回 demoSession 公开身份（无 PII，DEC-010）。
  http.get("/api/session", () =>
    HttpResponse.json({
      login: MINE,
      avatarUrl: "https://avatars.example.com/zyongzhu24.png",
      isAdmin: true,
      verified: true,
    })
  ),

  // 个人中心概览（PAGE-060 / COMP-150）：派生统计 + 子导航徽标 + 欢迎文案。
  http.get("/api/me/dashboard", ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get("error") === "true") {
      return new HttpResponse(null, { status: 500 });
    }
    return HttpResponse.json(dashboard);
  }),

  // 个人中心分区（PAGE-061）：按 section 返回对应列表/网格数据。
  http.get("/api/me/sections/:section", ({ params, request }) => {
    const section = params.section as string;
    const url = new URL(request.url);
    const forceEmpty = url.searchParams.get("empty") === "true";

    switch (section) {
      case "modules":
        return HttpResponse.json({
          items: forceEmpty ? [] : modules.filter((m) => m.ownerLogin === MINE),
        });
      case "favorites":
        // 收藏（ENT-013，INV-07）：复用公开模块投影作为收藏样本。
        return HttpResponse.json({
          items: forceEmpty ? [] : modules.slice(1, 3),
        });
      case "drafts":
        return HttpResponse.json({ items: forceEmpty ? [] : drafts });
      case "received":
        return HttpResponse.json({
          items: forceEmpty
            ? []
            : exchanges.filter((e) => e.providerLogin === MINE),
        });
      case "sent":
        return HttpResponse.json({
          items: forceEmpty
            ? []
            : exchanges.filter((e) => e.requesterLogin === MINE),
        });
      default:
        return new HttpResponse(null, { status: 404 });
    }
  }),

  // 通知列表（PAGE-062 / COMP-153）：支持 ?type= 过滤；error=true 触发错误态。
  http.get("/api/notifications", ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get("error") === "true") {
      return new HttpResponse(null, { status: 500 });
    }
    const type = url.searchParams.get("type") as NotificationType | "all" | null;
    const items =
      !type || type === "all"
        ? notificationStore
        : notificationStore.filter((n) => n.type === type);
    const unreadCount = notificationStore.filter((n) => !n.read).length;
    return HttpResponse.json({ items, unreadCount });
  }),

  // 单条标记已读（乐观，幂等）。
  http.post("/api/notifications/:id/read", ({ params }) => {
    const n = notificationStore.find((x) => x.id === params.id);
    if (n) n.read = true;
    return HttpResponse.json({ ok: true });
  }),

  // 全部标记已读（批量，失败回滚由前端控制）。
  http.post("/api/notifications/read-all", ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get("fail") === "true") {
      return new HttpResponse(null, { status: 500 });
    }
    notificationStore.forEach((n) => (n.read = true));
    return HttpResponse.json({ ok: true });
  }),

  // 联系方式（PAGE-063 / COMP-155）：默认私密渲染（INV-03）。
  http.get("/api/me/contacts", () =>
    HttpResponse.json({ items: contactMethods })
  ),
  http.put("/api/me/contacts", () =>
    // 保存：写 Consent + AuditLog（INV-08/11，服务侧）；此处仅回 ok。
    HttpResponse.json({ ok: true })
  ),

  // 同意 / 披露记录（PAGE-063 disclosure / PAGE-064 all-consent，COMP-157）。
  http.get("/api/me/consents", ({ request }) => {
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") ?? "disclosure";
    const forceEmpty = url.searchParams.get("empty") === "true";
    const items = forceEmpty
      ? []
      : mode === "all-consent"
        ? allConsentRecords
        : disclosureRecords;
    return HttpResponse.json({ items });
  }),
  // 撤回披露（只影响未来，ASM-013）。
  http.post("/api/me/consents/:id/revoke", () =>
    HttpResponse.json({ ok: true })
  ),

  // 账户身份（PAGE-064 account，只读 DEC-006）。
  http.get("/api/me/account", () => HttpResponse.json(accountIdentity)),

  // 通知偏好（PAGE-064 notifications，站内 FR-120）。
  http.get("/api/me/notification-prefs", () =>
    HttpResponse.json(notificationPrefs)
  ),
  http.put("/api/me/notification-prefs", () => HttpResponse.json({ ok: true })),
];
