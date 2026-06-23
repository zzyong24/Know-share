/*
  MOCK 种子（module-detail 模块特有）：在共享 modules/manifests/topics 基础上
  补齐详情页所需的「owner 身份 / 信任侧栏 / 隐私边界 / 完整脱敏 Manifest / 生命周期」字段。
  复用 src/mocks/fixtures/modules.ts 的 modules/manifests/topics，不重复造（守跨模块一致）。

  硬约束（INV-01/03/04）：
  - 完整 Manifest 中即便混入 contact 字段（模拟 API 误传），前端 ManifestPreview 也屏蔽（ASM-024）。
  - 永不含原始知识内容 / 私有 URL。
*/
import type {
  PrivacyResult,
  TrustLevel,
  TrustBadgeItem,
} from "@/lib/types";
import { modules, manifests } from "./modules";

/** 详情页 owner 身份（ENT-001 公开投影 + ENT-012 badges）。 */
export interface ModuleOwner {
  handle: string;
  githubVerified: boolean;
  avatarUrl: string;
  joinedAt: string;
  creditScore: number;
  badges: TrustBadgeItem[];
}

/** 详情页信任侧栏（ENT-011 派生只读）。 */
export interface ModuleTrust {
  level: TrustLevel;
  explanation: string;
  favorites: number;
  endorsements: number;
}

/** 详情页隐私边界（ENT-005 仅分级摘要 + ENT-004 脱敏字段，INV-01）。 */
export interface ModulePrivacy {
  sensitivity: "low" | "medium" | "high";
  gate: Exclude<PrivacyResult, "block">; // 已发布态只可能 pass/warn（INV-02）
  gateExplanation: string;
  redactionNotes?: string;
  contentCommitment?: string;
}

/** 完整脱敏 Manifest（PAGE-013 形状；含被屏蔽的 contact 以验证 INV-03/ASM-024）。 */
export interface FullManifest {
  id: string;
  title: string;
  summary: string;
  topics: string[];
  tags: string[];
  language: string;
  owner_handle: string;
  exchange_intent: string;
  sensitivity: string;
  covered_questions: string[];
  source_types: { label: string; ratio: number }[];
  freshness: string;
  redaction_notes: string;
  private_exchange_options: string[];
  license: string;
  updated_at: string;
  version: string;
  /** PII：示例 JSON 含 contact，但前端必须屏蔽（INV-03/DEC-010/ASM-024）。 */
  contact?: string;
}

/** 详情页聚合响应（GET /api/modules/:id/detail）。 */
export interface ModuleDetail {
  module: (typeof modules)[number];
  manifest: (typeof manifests)[number];
  owner: ModuleOwner;
  trust: ModuleTrust;
  privacy: ModulePrivacy;
  fullManifest: FullManifest;
  lifecycleState: "Published" | "Draft" | "Delisted" | "NotFound";
}

const OWNERS: Record<string, ModuleOwner> = {
  zyongzhu24: {
    handle: "zyongzhu24",
    githubVerified: true,
    avatarUrl: "https://avatars.example.com/zyongzhu24.png",
    joinedAt: "2023-05-12",
    creditScore: 824,
    badges: [{ type: "early", label: "早期贡献者" }],
  },
  "knowledge-trader": {
    handle: "knowledge-trader",
    githubVerified: true,
    avatarUrl: "https://avatars.example.com/knowledge-trader.png",
    joinedAt: "2023-08-01",
    creditScore: 712,
    badges: [{ type: "curator", label: "优质策展" }],
  },
  "rag-builder": {
    handle: "rag-builder",
    githubVerified: true,
    avatarUrl: "https://avatars.example.com/rag-builder.png",
    joinedAt: "2024-01-15",
    creditScore: 645,
    badges: [],
  },
  "growth-lab": {
    handle: "growth-lab",
    githubVerified: false,
    avatarUrl: "https://avatars.example.com/growth-lab.png",
    joinedAt: "2024-03-02",
    creditScore: 410,
    badges: [],
  },
  "sec-researcher": {
    handle: "sec-researcher",
    githubVerified: true,
    avatarUrl: "https://avatars.example.com/sec-researcher.png",
    joinedAt: "2023-11-20",
    creditScore: 690,
    badges: [{ type: "privacy", label: "隐私守护者" }],
  },
  "ops-bot": {
    handle: "ops-bot",
    githubVerified: false,
    avatarUrl: "https://avatars.example.com/ops-bot.png",
    joinedAt: "2024-05-30",
    creditScore: 0,
    badges: [],
  },
};

function fallbackOwner(handle: string): ModuleOwner {
  return {
    handle,
    githubVerified: false,
    avatarUrl: `https://avatars.example.com/${handle}.png`,
    joinedAt: "2024-06-01",
    creditScore: 0,
    badges: [],
  };
}

/** 来源类型分布（DonutChart 段）。由 sourceStats 派生为带 label 的占比段。 */
function sourceSegments(stats: {
  notes: number;
  links: number;
  files: number;
}): { label: string; ratio: number }[] {
  const total = stats.notes + stats.links + stats.files || 1;
  return [
    { label: "个人笔记", ratio: Math.round((stats.notes / total) * 100) },
    { label: "项目记录", ratio: Math.round((stats.files / total) * 100) },
    { label: "公开文章", ratio: Math.round((stats.links / total) * 100) },
  ];
}

const COVERED_QUESTIONS: Record<string, string[]> = {
  "m-agent-memory": [
    "如何分层组织长期与短期记忆？",
    "摘要压缩在什么阈值触发？",
    "检索召回如何避免上下文污染？",
  ],
};

function lifecycleFromStatus(
  status: string
): ModuleDetail["lifecycleState"] {
  if (status === "Delisted") return "Delisted";
  if (status === "Draft") return "Draft";
  return "Published";
}

/** 构造单个模块详情聚合。 */
export function buildModuleDetail(id: string): ModuleDetail | null {
  const mod = modules.find((m) => m.id === id);
  const manifest = manifests.find((m) => m.moduleId === id);
  if (!mod || !manifest) return null;

  const owner = OWNERS[mod.ownerLogin] ?? fallbackOwner(mod.ownerLogin);
  const covered =
    COVERED_QUESTIONS[id] ??
    Array.from({ length: Math.max(mod.topics.length, 1) }, (_, i) => `覆盖问题 ${i + 1}`);

  const segments = sourceSegments(mod.sourceStats);

  const trust: ModuleTrust = {
    level: mod.trustLevel,
    explanation:
      mod.exchangeCount > 0
        ? "信任主要来自已完成交换的参与方反馈，其权重高于收藏与认可等社交信号（INV-10）。"
        : "信任随交换积累；该贡献者暂无交换历史。",
    favorites: mod.favoriteCount,
    endorsements: Math.round(mod.favoriteCount * 0.4),
  };

  const privacy: ModulePrivacy = {
    sensitivity:
      mod.trustLevel === "low" ? "high" : mod.id === "m-privacy-redact" ? "medium" : "low",
    gate: mod.id === "m-privacy-redact" ? "warn" : "pass",
    gateExplanation:
      mod.id === "m-privacy-redact"
        ? "隐私扫描提示需人工复核个别泛化项，但不含可发布阻断项（warn）。"
        : "隐私扫描通过：未发现需阻断的敏感内容（pass）。",
    redactionNotes:
      "已移除姓名、私有仓库、内部项目细节与逐字笔记片段。",
    contentCommitment: manifest.contentCommitment,
  };

  const fullManifest: FullManifest = {
    id: mod.id,
    title: mod.title,
    summary: mod.summary,
    topics: mod.topics,
    tags: mod.topics.map((t) => t.toLowerCase()),
    language: "zh-CN",
    owner_handle: owner.handle,
    exchange_intent: "希望交换 Agent 工程或知识管理方向的实践清单",
    sensitivity: privacy.sensitivity,
    covered_questions: covered,
    source_types: segments,
    freshness: mod.freshness,
    redaction_notes: privacy.redactionNotes ?? "",
    private_exchange_options: ["直接消息", "私下交付包"],
    license: "CC BY-NC-SA 4.0",
    updated_at: "2026-06-20",
    version: manifest.version,
    // 模拟 API 误传 contact（前端必须屏蔽，INV-03/ASM-024）。
    contact: "private@example.com",
  };

  return {
    module: mod,
    manifest,
    owner,
    trust,
    privacy,
    fullManifest,
    lifecycleState: lifecycleFromStatus(mod.status),
  };
}

export { sourceSegments };
