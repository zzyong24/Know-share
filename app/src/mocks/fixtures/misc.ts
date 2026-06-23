/*
  MOCK 种子：信任档案 / 技能 / 通知 / 统计 / 审核台 / 隐私门 / 联系方式。
  全合成；统计无 PII（INV-09）；联系方式默认私密（INV-03）；隐私门 block 样本（INV-02）。
*/
import type {
  TrustProfile,
  AgentSkill,
  Notification,
  UsageStat,
  ReviewItem,
  AuditEntry,
  PrivacyScan,
  ContactInfo,
} from "@/lib/types";

// ── ENT-011 TrustProfile（MOCK-008 资深 / MOCK-009 新人）──
export const trustProfiles: TrustProfile[] = [
  {
    login: "zyongzhu24",
    score: 824,
    level: "high",
    trend: [
      { x: "1 月", y: 760 },
      { x: "2 月", y: 778 },
      { x: "3 月", y: 795 },
      { x: "4 月", y: 808 },
      { x: "5 月", y: 824 },
    ],
    breakdown: [
      { source: "exchange", label: "交换历史", value: 340 },
      { source: "feedback", label: "反馈质量", value: 280 },
      { source: "verification", label: "GitHub 验证", value: 160 },
      { source: "report", label: "举报记录（扣分）", value: 44 },
    ],
    badges: [
      { type: "verified", label: "GitHub 已验证" },
      { type: "top-contributor", label: "高贡献者" },
    ],
  },
  {
    login: "newcomer",
    score: 0,
    level: "new",
    trend: [],
    breakdown: [],
    badges: [],
  },
];

// ── ENT-016 AgentSkill（MOCK-011）──
export const agentSkills: AgentSkill[] = [
  {
    id: "sk-create-manifest",
    name: "Create Manifest",
    category: "清单",
    description: "从本地知识来源生成脱敏清单草稿。",
    privacyLevel: "local",
    docsUrl: "https://docs.example.com/skills/create-manifest",
  },
  {
    id: "sk-reduct-manifest",
    name: "Reduct Manifest",
    category: "隐私",
    description: "对清单做隐私脱敏与泛化。",
    privacyLevel: "local",
  },
  {
    id: "sk-validate-manifest",
    name: "Validate Manifest",
    category: "校验",
    description: "校验清单字段与隐私边界一致性。",
    privacyLevel: "local",
  },
  {
    id: "sk-package-repo",
    name: "Package Private Repo",
    category: "交付",
    description: "打包私有仓库供 Accepted 交换交付（仅引用）。",
    privacyLevel: "local",
  },
  {
    id: "sk-submit-feedback",
    name: "Submit Feedback",
    category: "反馈",
    description: "交换后提交结构化反馈。",
    privacyLevel: "remote",
  },
];

// ── ENT-017 Notification（MOCK-014 混合已读未读）──
export const notifications: Notification[] = [
  {
    id: "n-1",
    type: "exchange",
    title: "交换请求已接受",
    body: "rag-builder 接受了你对「多模态 RAG 检索流水线」的交换请求。",
    read: false,
    createdAt: "2026-06-22T09:00:00Z",
    href: "/exchanges/EX-2024-8842",
  },
  {
    id: "n-2",
    type: "review",
    title: "提交进入评审",
    body: "你的「私有部署脚本集」已进入隐私评审。",
    read: false,
    createdAt: "2026-06-21T14:30:00Z",
  },
  {
    id: "n-3",
    type: "feedback",
    title: "收到新反馈",
    body: "growth-lab 对一次已完成交换提交了反馈。",
    read: true,
    createdAt: "2026-06-20T08:15:00Z",
  },
  {
    id: "n-4",
    type: "community",
    title: "模块被收藏",
    body: "你的「Agent 记忆系统设计模式」被收藏了。",
    read: true,
    createdAt: "2026-06-19T11:00:00Z",
  },
];

// ── ENT-019 UsageStat（MOCK-018 聚合、无 PII）──
export const usageStats: UsageStat[] = [
  { key: "modules", label: "模块总数", value: 1842 },
  { key: "exchanges", label: "交换总数", value: 12857 },
  { key: "activeUsers", label: "活跃用户", value: 2196 },
  {
    key: "privacyPassRate",
    label: "隐私门通过率",
    value: 98.6,
    trend: [
      { x: "1 月", y: 97.1 },
      { x: "2 月", y: 97.8 },
      { x: "3 月", y: 98.0 },
      { x: "4 月", y: 98.4 },
      { x: "5 月", y: 98.6 },
    ],
  },
];

// ── ENT-015 ReviewItem（MOCK-016 审核台）──
export const reviewQueue: ReviewItem[] = [
  {
    id: "rv-1",
    kind: "submission",
    subject: "私有部署脚本集",
    risk: "block",
    riskSummary: "疑似包含私有路径 /Users/.../secrets，需脱敏后重提。",
    status: "pending",
    createdAt: "2026-06-21",
  },
  {
    id: "rv-2",
    kind: "submission",
    subject: "AI 产品增长实验库",
    risk: "pass",
    riskSummary: "无隐私发现。",
    status: "pending",
    createdAt: "2026-06-20",
  },
  {
    id: "rv-3",
    kind: "report",
    subject: "举报：疑似抄袭清单",
    risk: "warn",
    riskSummary: "举报方称清单与其模块高度相似。",
    reporterLogin: "knowledge-trader",
    status: "pending",
    createdAt: "2026-06-19",
  },
];

// ── ENT-018 AuditLog ──
export const auditLog: AuditEntry[] = [
  {
    id: "a-1",
    actorLogin: "zyongzhu24",
    action: "approve-submission",
    target: "AI 产品增长实验库",
    createdAt: "2026-06-20T10:00:00Z",
  },
  {
    id: "a-2",
    actorLogin: "zyongzhu24",
    action: "request-changes",
    target: "私有部署脚本集",
    createdAt: "2026-06-21T09:30:00Z",
  },
];

// ── ENT-005 PrivacyScan（MOCK-004 三态样本）──
export const privacyScans: Record<string, PrivacyScan> = {
  pass: { result: "pass", findings: [] },
  warn: {
    result: "warn",
    findings: [
      {
        level: "warn",
        message: "清单摘要中出现疑似内部项目代号。",
        suggestion: "建议泛化为通用描述后再发布。",
      },
    ],
  },
  block: {
    result: "block",
    findings: [
      {
        level: "block",
        message: "检测到私有文件路径 /Users/.../secrets。",
        suggestion: "移除路径与凭据后方可发布。",
      },
    ],
  },
};

// ── ENT-008 ContactInfo（MOCK-015 默认私密）──
export const contacts: ContactInfo[] = [
  { type: "github", maskedValue: "@zyongzhu24", visibility: "private" },
  { type: "email", maskedValue: "z****@example.com", visibility: "private" },
];
