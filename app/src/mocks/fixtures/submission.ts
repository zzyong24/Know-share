/*
  提交向导 MOCK fixtures（PAGE-020~024）。
  全部脱敏：不含原始知识内容 / 私有路径 / 凭据（NFR-001/INV-01）。
  阶段 15 形状以 SERVICE_CONTRACT 为准。
*/
import type { AgentSkill } from "@/lib/types";
import type {
  ManifestDraft,
  PrivacyScanResult,
  SubmissionDraft,
} from "@/lib/queries/submission";

// ── 第 1 步选项 ──────────────────────────────────────────────────────
export const MODULE_TYPE_OPTIONS = [
  { value: "knowledge", label: "知识模块" },
  { value: "workflow", label: "工作流 / 方法论" },
  { value: "dataset", label: "脱敏数据集" },
  { value: "agent-skill", label: "Agent 技能包" },
] as const;

export const SOURCE_TYPE_OPTIONS = [
  { value: "obsidian", label: "Obsidian", icon: "description" },
  { value: "logseq", label: "Logseq", icon: "description" },
  { value: "notion", label: "Notion", icon: "description" },
  { value: "markdown", label: "Markdown", icon: "code" },
  { value: "yuque", label: "语雀", icon: "description" },
  { value: "feishu-doc", label: "飞书文档", icon: "description" },
  { value: "local-folder", label: "本地文件夹", icon: "folder" },
  { value: "custom", label: "自定义", icon: "settings" },
] as const;

// ── 脱敏 Manifest 范例（对齐 examples/knowledge-module.manifest.json）──
export const sampleManifest: ManifestDraft = {
  id: "agent-memory-design-patterns",
  title: "Agent 记忆系统设计模式",
  summary:
    "关于个人 Agent 记忆系统设计的脱敏模块，涵盖检索习惯、笔记结构与同意边界。",
  topics: ["个人 Agent", "知识管理", "记忆系统", "隐私"],
  tags: ["agent", "pkm", "mcp", "privacy"],
  language: "zh-CN",
  owner_handle: "example-user",
  exchange_intent: "希望换取关于 Agent 评测、长期规划或个人知识工作流的模块。",
  sensitivity: "medium",
  covered_questions: [
    "Agent 应如何决定记住什么？",
    "如何在不泄露原文的前提下摘要私有笔记？",
  ],
  source_types: ["personal notes", "project notes", "public articles"],
  freshness: "actively maintained",
  redaction_notes: "已移除姓名、私有仓库、内部项目细节与逐字摘录。",
  private_exchange_options: ["github_private_repo", "direct_message"],
  license: "CC-BY-4.0（仅限本清单）",
  updated_at: "2026-06-22",
  version: "1.0.0",
};

/** 含 contact 的范例（驱动「默认私密」提示与 contact-exposure 发现）。 */
export const manifestWithContact: ManifestDraft = {
  ...sampleManifest,
  contact: { type: "github", value: "example-user" },
};

// ── Agent 技能 / MCP（ENT-016；本机 local 隐私级别）──────────────────
export const submissionSkills: AgentSkill[] = [
  {
    id: "skill-manifest-build",
    name: "清单生成器",
    category: "manifest",
    description: "在本机扫描所选来源并生成脱敏 Manifest，不上传原始内容。",
    privacyLevel: "local",
    docsUrl: "/skills/skill-manifest-build",
  },
  {
    id: "skill-redact",
    name: "脱敏助手",
    category: "redaction",
    description: "本机识别并泛化密钥 / 邮箱 / 路径 / 长摘录，输出脱敏建议。",
    privacyLevel: "local",
    docsUrl: "/skills/skill-redact",
  },
  {
    id: "skill-privacy-scan",
    name: "隐私门扫描器",
    category: "validation",
    description: "本机运行隐私扫描，平台仅接收脱敏后的 findings（INV-01）。",
    privacyLevel: "local",
    docsUrl: "/skills/skill-privacy-scan",
  },
];

// ── 隐私扫描结果范例（三态）────────────────────────────────────────
export const scanPass: PrivacyScanResult = {
  findings: [
    {
      ruleCategory: "long-excerpt",
      severity: "pass",
      locationRef: "summary",
      suggestion: "摘要已充分泛化，无需修改。",
      explanation: "未检出疑似逐字原文。",
    },
  ],
  sensitivityDeclaration: "medium",
  overallStatus: "pass",
  scannedAt: "2026-06-23T02:00:00Z",
  scannerVersion: "privacy-scan@1.4.0",
};

export const scanWarn: PrivacyScanResult = {
  findings: [
    {
      ruleCategory: "contact-exposure",
      severity: "warn",
      locationRef: "contact",
      suggestion: "联系方式默认私密；建议保持不在公开清单展示（DEC-010）。",
      explanation: "检出 contact 字段，将默认私密处理。",
    },
    {
      ruleCategory: "email",
      severity: "pass",
      locationRef: "redaction_notes",
      suggestion: "无需修改。",
      explanation: "脱敏说明中未检出邮箱明文。",
    },
  ],
  sensitivityDeclaration: "medium",
  overallStatus: "warn",
  scannedAt: "2026-06-23T02:05:00Z",
  scannerVersion: "privacy-scan@1.4.0",
};

export const scanBlock: PrivacyScanResult = {
  findings: [
    {
      ruleCategory: "secret/credential",
      severity: "block",
      locationRef: "summary",
      suggestion: "移除疑似密钥片段，改用泛化描述后重跑扫描。",
      explanation: "检出疑似凭据 / 密钥模式（已隐藏原始值）。",
    },
    {
      ruleCategory: "path",
      severity: "warn",
      locationRef: "redaction_notes",
      suggestion: "将本地路径替换为来源类别描述。",
      explanation: "检出疑似本地 / 私有路径。",
    },
  ],
  sensitivityDeclaration: "high",
  overallStatus: "block",
  scannedAt: "2026-06-23T02:10:00Z",
  scannerVersion: "privacy-scan@1.4.0",
};

// ── 提交草稿：新建 + 恢复两场景（COMP-070）────────────────────────
export const newDraft: SubmissionDraft = {
  id: "SUB-NEW-0001",
  status: "Draft",
  step: 1,
  module: { title: "", oneLineIntent: "", moduleType: "", sourceTypes: [] },
  manifest: null,
  privacyScan: null,
  consents: {},
  updatedAt: "2026-06-23T01:00:00Z",
};

export const restoredDraft: SubmissionDraft = {
  id: "SUB-2026-0042",
  status: "Draft",
  step: 2,
  module: {
    title: "Agent 记忆系统设计模式",
    oneLineIntent: "把个人 Agent 记忆设计经验脱敏后开放交换。",
    moduleType: "knowledge",
    sourceTypes: ["obsidian", "markdown"],
  },
  manifest: sampleManifest,
  privacyScan: null,
  consents: {
    generateScope: {
      id: "C-GEN-001",
      actionType: "generate",
      scope: "SUB-2026-0042",
      at: "2026-06-23T01:10:00Z",
    },
  },
  updatedAt: "2026-06-23T01:30:00Z",
};

export const PRIVATE_EXCHANGE_NOTE =
  "提交后，私下交换包将在交换被接受后于 GitHub 私有仓库准备（ASM-007）；本步不上传任何内容（INV-01）。";
