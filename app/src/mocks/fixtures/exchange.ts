/*
  MOCK 种子：exchange 模块详情/台账投影（PAGE-030/031）。
  复用已有 src/mocks/fixtures/exchanges.ts（ENT-007 基础台账）+ users.ts（公开身份）。
  本文件只补「详情聚合」与「台账行脱敏投影」所需派生数据；零私有内容（INV-01/04）。
  联系方式真实值仅在 Accepted+ 且为参与方时由 handler 注入披露区（INV-03/ASM-086）。
*/
import { exchanges } from "./exchanges";
import { users } from "./users";
import type { TrustLevel } from "@/lib/types";
import type {
  ExchangeContactInfo,
  ExchangeDeliveryChannel,
  ExchangeDetail,
  ExchangeDisclosureSnapshot,
  ExchangeLedgerRow,
  ExchangePartyDetail,
  ExchangePartyLite,
  ExchangeTimelineStep,
  ExchangeVerificationItem,
} from "@/lib/queries/exchange";
import type { Exchange } from "@/lib/types";

const userByLogin = new Map(users.map((u) => [u.login, u]));

function trustLevelFor(login: string): TrustLevel {
  const score = userByLogin.get(login)?.trustScore ?? 0;
  if (score >= 750) return "high";
  if (score >= 600) return "medium";
  if (score > 0) return "low";
  return "new";
}

function partyLite(login: string): ExchangePartyLite {
  const u = userByLogin.get(login);
  return {
    login,
    avatarUrl: u?.avatarUrl,
    verified: !!u?.verified,
    trustLevel: trustLevelFor(login),
  };
}

/** 每个交换的目标/可选提供模块主题（脱敏元数据 ENT-020）。 */
const TOPICS_BY_MODULE: Record<string, string[]> = {
  "m-agent-memory": ["Agent 架构", "记忆系统"],
  "m-multimodal-rag": ["检索增强", "多模态"],
  "m-km-system": ["知识管理"],
  "m-privacy-redact": ["隐私脱敏"],
  "m-growth-lib": ["AI 产品", "增长"],
};

const SUMMARY_BY_MODULE: Record<string, string> = {
  "m-agent-memory":
    "长短期记忆管理、向量数据库接入层与上下文修剪算法，适用于生产级 LLM 应用。",
  "m-multimodal-rag":
    "支持 PDF、表格、图表联合索引与多路召回重排序，含端到端评测套件。",
  "m-km-system": "个人知识库的目录治理、标签体系与新鲜度维护方法论。",
  "m-privacy-redact": "知识脱敏与隐私边界识别的可复用实践清单。",
  "m-growth-lib": "AI 产品增长实验设计与指标拆解模板库。",
};

/** Exchange（ENT-007）→ 公开台账行（脱敏投影）。 */
export function toLedgerRow(ex: Exchange): ExchangeLedgerRow {
  return {
    exchangeId: ex.id,
    requester: partyLite(ex.requesterLogin),
    target: partyLite(ex.providerLogin),
    direction: ex.offeredModuleId ? "reciprocal" : "oneway",
    targetModuleName: ex.targetModuleTitle,
    offeredModuleName: ex.offeredModuleId
      ? OFFERED_TITLE[ex.offeredModuleId] ?? ex.offeredModuleId
      : undefined,
    topics: TOPICS_BY_MODULE[ex.targetModuleId] ?? [],
    status: ex.status,
    createdAt: ex.createdAt,
    updatedAt: ex.updatedAt,
  };
}

const OFFERED_TITLE: Record<string, string> = {
  "m-multimodal-rag": "多模态 RAG 检索流水线",
  "m-growth-lib": "AI 产品增长实验库",
};

export const ledgerRows: ExchangeLedgerRow[] = exchanges.map(toLedgerRow);

/** 公开台账可筛主题集合。 */
export const ledgerTopics: string[] = Array.from(
  new Set(ledgerRows.flatMap((r) => r.topics))
);

/* ── 时间线：按状态推进生成可视步骤（FLOW-003；ASM-087）──────── */
function timelineFor(ex: Exchange): ExchangeTimelineStep[] {
  const order = [
    "Requested",
    "Accepted",
    "PrivatePreparing",
    "Delivered",
    "Completed",
    "WaitingForFeedback",
    "Closed",
  ];
  const isTerminal = ["Rejected", "Cancelled", "Expired"].includes(ex.status);
  const isFlagged = ex.status === "Flagged" || ex.status === "InReview";
  const reachedIdx = order.indexOf(ex.status);

  const steps: ExchangeTimelineStep[] = [
    {
      key: "requested",
      label: "已发起交换",
      status: "completed",
      timestamp: ex.createdAt,
      actorLogin: ex.requesterLogin,
    },
    {
      key: "accepted",
      label: "已接受交换请求·等待双方交付",
      status: "pending",
      note: "等待双方交付模块",
    },
    { key: "delivered", label: "待交付/已交付", status: "pending" },
    { key: "completed", label: "完成交换", status: "pending" },
  ];

  if (isFlagged) {
    // 审核中：中性说明，不泄私有原因（ASM-032/FLOW-005）。
    steps[1] = {
      ...steps[1],
      status: "terminated",
      note: "该交换进入审核流程，详情暂不公开。",
    };
    return steps;
  }
  if (isTerminal) {
    steps[1] = {
      ...steps[1],
      label:
        ex.status === "Rejected"
          ? "交换请求被拒绝"
          : ex.status === "Cancelled"
            ? "交换已取消"
            : "交换请求已过期",
      status: "terminated",
      timestamp: ex.updatedAt,
      note: "流程已终止。",
    };
    return steps;
  }

  // 正常推进：标记已达成的步骤为 completed，当前态为 active。
  if (reachedIdx >= 1)
    steps[1] = {
      ...steps[1],
      status: reachedIdx === 1 || reachedIdx === 2 ? "active" : "completed",
      timestamp: ex.updatedAt,
    };
  if (reachedIdx >= 3)
    steps[2] = {
      ...steps[2],
      status: reachedIdx === 3 ? "active" : "completed",
      timestamp: ex.updatedAt,
    };
  if (reachedIdx >= 4)
    steps[3] = { ...steps[3], status: "completed", timestamp: ex.updatedAt };
  return steps;
}

function verificationFor(ex: Exchange): ExchangeVerificationItem[] {
  const delivered = ["Completed", "WaitingForFeedback", "Closed"].includes(
    ex.status
  );
  return [
    {
      key: "identity",
      label: "身份已核实",
      status: "verified",
      note: "双方 GitHub 认证已通过。",
    },
    {
      key: "ownership",
      label: "模块所有权",
      status: "verified",
      note: "系统检测到双方账号拥有对应模块的发布或贡献权限。",
    },
    {
      key: "delivery",
      label: "交付物完整性",
      status: delivered ? "verified" : "pending",
      // 仅状态占位，不读交付物内容（INV-01/ASM-034）。
      note: delivered
        ? "双方已在私有通道完成交付。"
        : "待双方在私有通道交付。",
    },
  ];
}

function moduleSummary(moduleId: string, title: string, signal?: string) {
  return {
    moduleId,
    title,
    summary: SUMMARY_BY_MODULE[moduleId] ?? "脱敏摘要暂缺。",
    topics: TOPICS_BY_MODULE[moduleId] ?? [],
    signal,
  };
}

function partyDetail(
  login: string,
  role: "requester" | "owner"
): ExchangePartyDetail {
  const successByLogin: Record<string, number> = {
    zyongzhu24: 42,
    "knowledge-trader": 28,
    "rag-builder": 31,
    "growth-lab": 19,
    "bot-dev": 12,
    "sec-researcher": 24,
    newcomer: 0,
  };
  return {
    ...partyLite(login),
    role,
    successfulExchanges: successByLogin[login] ?? 5,
  };
}

/** 本人（参与方）可披露的联系方式（脱敏占位；真实值由披露动作产生 ASM-086）。 */
export const myContactsSeed: ExchangeContactInfo[] = [
  { type: "github", label: "GitHub", masked: "@zyongzhu24" },
  { type: "email", label: "邮箱", masked: "z****@example.com" },
  { type: "im", label: "IM（Telegram）", masked: "@zy****" },
];

/** 对方已对我披露的快照（ENT-009；含 IM → 启用「在线沟通」）。 */
const peerDisclosureSeed: ExchangeDisclosureSnapshot = {
  contacts: [
    { type: "github", label: "GitHub", value: "@knowledge-trader" },
    { type: "im", label: "IM（Telegram）", value: "@kt_handle" },
  ],
  disclosedAt: "2026-06-21",
};

function channelFor(): {
  channel: ExchangeDeliveryChannel;
  channelLabel: string;
  deliveryHint: string;
} {
  return {
    channel: "github_private_repo",
    channelLabel: "GitHub 私有仓库邀请",
    deliveryHint: "请在交付后于本页点击「标记为已交付」以开启评价。",
  };
}

/**
  构建交换详情（PAGE-031）。
  viewerLogin 决定 viewerRole 与披露区可见性（INV-03）：
  - 非参与方/匿名 → spectator：披露区锁定、不含真实联系方式。
  - 参与方且 Accepted+ → 含本人可披露清单；若对方已披露则含对方快照。
*/
export function buildExchangeDetail(
  ex: Exchange,
  viewerLogin: string | null
): ExchangeDetail {
  const isRequester = viewerLogin === ex.requesterLogin;
  const isOwner = viewerLogin === ex.providerLogin;
  const viewerRole: ExchangeDetail["viewerRole"] = isRequester
    ? "requester"
    : isOwner
      ? "owner"
      : "spectator";
  const isParticipant = isRequester || isOwner;
  const acceptedPlus = [
    "Accepted",
    "PrivatePreparing",
    "Delivered",
    "Completed",
    "WaitingForFeedback",
    "Closed",
  ].includes(ex.status);

  // 披露区：仅参与方且 Accepted+ 才注入真实清单/对方快照（INV-03/ASM-086）。
  const disclosure: ExchangeDetail["disclosure"] =
    isParticipant && acceptedPlus
      ? {
          myContacts: myContactsSeed,
          myDisclosure: undefined,
          peerDisclosure: peerDisclosureSeed,
        }
      : { myContacts: [], myDisclosure: undefined, peerDisclosure: undefined };

  const feedbackWindow: "open" | "closed" =
    ex.status === "Closed" ? "closed" : "open";

  return {
    exchangeId: ex.id,
    status: ex.status,
    createdAt: ex.createdAt,
    viewerRole,
    isAuthenticated: !!viewerLogin,
    direction: ex.offeredModuleId ? "reciprocal" : "oneway",
    requester: partyDetail(ex.requesterLogin, "requester"),
    target: partyDetail(ex.providerLogin, "owner"),
    targetModule: moduleSummary(ex.targetModuleId, ex.targetModuleTitle, "4.8 分"),
    offeredModule: ex.offeredModuleId
      ? moduleSummary(
          ex.offeredModuleId,
          OFFERED_TITLE[ex.offeredModuleId] ?? ex.offeredModuleId,
          "高信任度"
        )
      : undefined,
    timeline: timelineFor(ex),
    verification: verificationFor(ex),
    delivery: channelFor(),
    disclosure,
    feedbackWindow,
  };
}
