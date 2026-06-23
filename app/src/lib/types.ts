/*
  领域类型（对齐 LIGHT_DOMAIN_MODEL.md 的 ENT-* 字段形状）。
  注意：这些是「公开投影 / 前端消费」形状的占位类型；最终字段以阶段 15 SERVICE_CONTRACT 为准（ASM-067/ASM-111）。
  守则：公开类型不含原始知识内容（INV-01）、不含私有 URL/联系方式（INV-03/INV-04）。
*/

// ── 通用 ────────────────────────────────────────────────
export type TrustLevel = "high" | "medium" | "low" | "new";
export type Tone =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "accent"
  | "neutral";

// ── ENT-001 User（公开投影）────────────────────────────
export interface User {
  id: string;
  login: string; // GitHub handle（合成）
  displayName: string;
  avatarUrl: string;
  verified: boolean; // GitHub Verified
  isAdmin?: boolean;
  domains: string[]; // 领域标签
  joinedAt: string; // ISO
  trustScore?: number; // 派生信用分（/1000）
}

/** 会话（登录态）—— AppShell / Auth 用 */
export interface Session {
  login: string;
  avatarUrl: string;
  isAdmin: boolean;
  verified?: boolean;
}

// ── ENT-020 Topic/Tag ──────────────────────────────────
export interface Topic {
  id: string;
  label: string;
  moduleCount?: number;
}

// ── ENT-004 Manifest（脱敏摘要；屏蔽 contact，INV-03）──
export interface SourceStats {
  notes: number;
  links: number;
  files: number;
  words: number; // 词数（如 18700）
}

export interface Manifest {
  moduleId: string;
  summary: string; // 脱敏摘要
  topics: string[];
  freshness: string; // 新鲜度（相对文本）
  sourceStats: SourceStats;
  contentCommitment?: string; // 内容承诺（ASM-023，可选）
  privacyBoundary?: string; // 隐私边界说明
  version: string;
  // 永不含：contact / 原始内容 / 私有 URL（INV-01/03/04）
}

// ── ENT-003 KnowledgeModule（公开目录卡片投影）────────
export type ModuleStatus = "Draft" | "Published" | "Updated" | "Delisted";

export interface KnowledgeModule {
  id: string;
  title: string;
  summary: string;
  topics: string[];
  sourceStats: SourceStats;
  trustLevel: TrustLevel;
  status: ModuleStatus;
  exchangeCount: number;
  favoriteCount: number;
  freshness: string;
  ownerLogin: string;
}

// ── ENT-007 Exchange（脱敏台账投影；不含内容，INV-01/04）─
export type ExchangeStatus =
  | "Requested"
  | "Accepted"
  | "PrivatePreparing"
  | "Delivered"
  | "Completed"
  | "WaitingForFeedback"
  | "Closed"
  | "Rejected"
  | "Cancelled"
  | "Expired"
  | "Flagged"
  | "InReview"; // 审核中（中性态，ASM-032）

export interface Exchange {
  id: string; // 脱敏交换号 EX-2024-####
  targetModuleId: string;
  targetModuleTitle: string;
  offeredModuleId?: string; // 互惠可选（DEC-009/INV-05）
  requesterLogin: string;
  providerLogin: string;
  status: ExchangeStatus;
  createdAt: string;
  updatedAt: string;
}

// ── ENT-005 PrivacyScan（隐私门）──────────────────────
export type PrivacyResult = "pass" | "warn" | "block";

export interface PrivacyFinding {
  level: PrivacyResult;
  message: string;
  suggestion?: string;
}

export interface PrivacyScan {
  result: PrivacyResult;
  findings: PrivacyFinding[];
}

// ── ENT-011 TrustProfile（派生）+ ENT-012 Badge ───────
export interface TrustBadgeItem {
  type: string;
  label: string;
}

export interface TrustBreakdown {
  source: "exchange" | "feedback" | "verification" | "report";
  label: string;
  value: number;
}

export interface TrustProfile {
  login: string;
  score: number; // /1000
  level: TrustLevel;
  trend: { x: string; y: number }[];
  breakdown: TrustBreakdown[];
  badges: TrustBadgeItem[];
}

// ── ENT-010 Feedback（结构化维度）─────────────────────
export interface FeedbackDimension {
  key: string;
  label: string;
  description?: string;
}

// ── ENT-016 AgentSkill ────────────────────────────────
export interface AgentSkill {
  id: string;
  name: string;
  category: string;
  description: string;
  privacyLevel: "local" | "remote";
  docsUrl?: string;
}

// ── ENT-017 Notification ──────────────────────────────
export type NotificationType = "exchange" | "review" | "feedback" | "community";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  href?: string;
}

// ── ENT-019 UsageStat（聚合，无 PII，INV-09）─────────
export interface UsageStat {
  key: string;
  label: string;
  value: number;
  trend?: { x: string; y: number }[];
}

// ── ENT-015 ReviewItem / ENT-014 Report（审核台）──────
export interface ReviewItem {
  id: string;
  kind: "submission" | "report";
  subject: string;
  risk: PrivacyResult;
  riskSummary: string;
  reporterLogin?: string;
  status: "pending" | "approved" | "rejected" | "changes-requested";
  createdAt: string;
}

// ── ENT-018 AuditLog ──────────────────────────────────
export interface AuditEntry {
  id: string;
  actorLogin: string;
  action: string;
  target: string;
  createdAt: string;
}

// ── ENT-008 ContactInfo（偏好；值脱敏）────────────────
export type ContactVisibility = "private" | "public";

export interface ContactInfo {
  type: string; // 如 github / email
  maskedValue: string; // 脱敏展示，如 z****@example.com
  visibility: ContactVisibility; // 默认 private（INV-03/DEC-010）
}

// ── 搜索联想（COMP-003）───────────────────────────────
export interface SearchSuggestion {
  type: "module" | "topic" | "user" | "exchange";
  id: string;
  label: string;
  href: string;
}
