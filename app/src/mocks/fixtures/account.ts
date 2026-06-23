/*
  MOCK 种子：account 集群（个人中心 / 设置·联系方式 / 账户 / 通知偏好）。
  复用既有 fixtures（modules / exchanges / misc.notifications / misc.contacts / users）；
  这里只补本集群特有的派生形状：dashboard 统计 + 子导航徽标、草稿（Submission Draft 态 ENT-006）、
  同意/披露记录（融合 ENT-021/009，ASM-046）、账户身份、通知偏好。
  全合成；不含他人 PII（INV-09）；联系方式默认私密（INV-03/DEC-010）。
*/
import type { ContactInfo } from "@/lib/types";

// ── 个人中心概览（PAGE-060 / COMP-150）派生统计 ──
export interface DashboardStats {
  myModulesCount: number;
  activeExchangesCount: number;
  trustScore: number;
  unreadNotificationsCount: number;
}

export interface SubNavBadges {
  received: number; // 收到的交换待处理数
}

export interface DashboardData {
  currentUser: {
    displayName: string;
    githubHandle: string;
    avatarUrl: string;
    githubVerified: boolean;
  };
  stats: DashboardStats;
  subNavBadges: SubNavBadges;
  welcomeSummary: string;
}

export const dashboard: DashboardData = {
  currentUser: {
    displayName: "钟（本人视角）",
    githubHandle: "zyongzhu24",
    avatarUrl: "https://avatars.example.com/zyongzhu24.png",
    githubVerified: true,
  },
  stats: {
    myModulesCount: 6,
    activeExchangesCount: 3,
    trustScore: 824,
    unreadNotificationsCount: 5,
  },
  subNavBadges: { received: 2 },
  welcomeSummary: "今天有 2 个待处理的交换请求",
};

// ── 草稿（ENT-006 Submission 的 Draft 态，ASM-044）──
export interface DraftItem {
  id: string;
  moduleTitle: string;
  lastEditedAt: string; // ISO
  privacyScanStatus?: "pass" | "warn" | "block" | "pending";
}

export const drafts: DraftItem[] = [
  {
    id: "sub-draft-1",
    moduleTitle: "私有 RAG 评测脚手架（草稿）",
    lastEditedAt: "2026-06-22T16:20:00Z",
    privacyScanStatus: "pending",
  },
  {
    id: "sub-draft-2",
    moduleTitle: "Agent 工具调用错误处理清单（草稿）",
    lastEditedAt: "2026-06-19T10:05:00Z",
    privacyScanStatus: "warn",
  },
];

// 空草稿态：测试 / 演示用（PAGE-061 drafts 空态）。
export const emptyDrafts: DraftItem[] = [];

// ── 同意 / 披露记录（融合 ENT-021 Consent + ENT-009 ContactDisclosure，ASM-046）──
export interface ConsentRecord {
  id: string;
  counterpartyHandle: string;
  disclosedMethods: string[]; // ["GitHub","邮箱"]
  date: string; // ISO 或日期
  exchangeRef?: string; // EX-2024-####
  source: string; // 「因交换自动授权」
  revocable: boolean;
  revoked?: boolean;
  actionType?: "generate" | "submit" | "contact" | "exchange";
}

// PAGE-063 披露记录（mode="disclosure"）。
export const disclosureRecords: ConsentRecord[] = [
  {
    id: "cd-1",
    counterpartyHandle: "knowledge-trader",
    disclosedMethods: ["GitHub", "邮箱"],
    date: "2024-10-12",
    exchangeRef: "EX-2024-8842",
    source: "因交换自动授权",
    revocable: true,
    actionType: "contact",
  },
  {
    id: "cd-2",
    counterpartyHandle: "bot-dev",
    disclosedMethods: ["GitHub"],
    date: "2024-10-05",
    exchangeRef: "EX-2024-7719",
    source: "因交换自动授权",
    revocable: true,
    actionType: "contact",
  },
];

// PAGE-064 隐私分区全量同意轨迹（mode="all-consent"，多 actionType）。
export const allConsentRecords: ConsentRecord[] = [
  ...disclosureRecords,
  {
    id: "cs-3",
    counterpartyHandle: "—",
    disclosedMethods: [],
    date: "2026-06-20",
    source: "提交模块时同意发布脱敏清单",
    revocable: false,
    actionType: "submit",
  },
  {
    id: "cs-4",
    counterpartyHandle: "—",
    disclosedMethods: [],
    date: "2026-06-18",
    source: "运行本地 Agent 技能生成清单的同意",
    revocable: false,
    actionType: "generate",
  },
];

// ── 联系方式（PAGE-063 / COMP-155）：复用 misc.contacts 形状，补 label/isSet/icon ──
export interface ContactMethod extends ContactInfo {
  id: string;
  label: string;
  isSet: boolean;
  icon: string;
}

export const contactMethods: ContactMethod[] = [
  {
    id: "cm-github",
    type: "github",
    label: "GitHub",
    maskedValue: "@zyongzhu24",
    visibility: "private", // 默认私密（INV-03/DEC-010）
    isSet: true,
    icon: "code",
  },
  {
    id: "cm-email",
    type: "email",
    label: "邮箱",
    maskedValue: "z****@example.com",
    visibility: "private",
    isSet: true,
    icon: "forum",
  },
  {
    id: "cm-custom",
    type: "custom",
    label: "自定义渠道",
    maskedValue: "Telegram（未设置）",
    visibility: "private",
    isSet: false,
    icon: "open_in_new",
  },
];

// ── 账户身份（PAGE-064 account，只读 DEC-006）──
export interface AccountIdentity {
  githubHandle: string;
  githubVerified: boolean;
  joinedAt: string;
  displayName: string;
  avatarUrl: string;
}

export const accountIdentity: AccountIdentity = {
  githubHandle: "zyongzhu24",
  githubVerified: true,
  joinedAt: "2023-05-12",
  displayName: "钟（本人视角）",
  avatarUrl: "https://avatars.example.com/zyongzhu24.png",
};

// ── 通知偏好（PAGE-064 notifications，站内开关 FR-120）──
export interface NotificationPrefs {
  exchange: boolean;
  review: boolean;
  feedback: boolean;
  community: boolean;
}

export const notificationPrefs: NotificationPrefs = {
  exchange: true,
  review: true,
  feedback: true,
  community: false,
};
