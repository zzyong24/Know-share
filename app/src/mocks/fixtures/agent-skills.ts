/*
  MOCK 种子：Agent 技能目录（agent-skills 模块 / PAGE-050·PAGE-051 / ENT-016）。
  全合成、平台只读目录；零私有内容（INV-01/INV-04）：示例命令/配置只含占位路径（./my-notes 等），
  绝不注入真实路径、密钥、私有 URL（PAGE-050 一致性/隐私不变量）。
  复用 misc.ts 的 agentSkills 作为「id/name/category/privacyLevel」骨架，再补 PAGE/COMP 所需的
  iconChip/runLocation/输入输出/cliCommand/mcpToolName/consentNote/flowRef 等展示字段。

  说明：本文件定义的 AgentSkillDetail 是「前端目录消费形状」（占位，阶段 15 对齐 SERVICE_CONTRACT）；
  它比 @/lib/types 的 AgentSkill（最小公共投影）字段更全，故在本模块本地定义，不改全局 types.ts。
*/
import type { Tone } from "@/lib/types";
import { agentSkills } from "./misc";

/** 技能运行位置（NFR-001/INV-01：多数本地，submit-feedback 平台运行）。 */
export type SkillRunLocation = "local" | "platform";

/** 着色图标徽：单一图标族（Material 名）+ 语义色调（DEC-012）。 */
export interface SkillIconChip {
  glyph: string;
  tone: Tone;
}

/** ENT-016 AgentSkill 的前端目录完整形状（PAGE-050/051 字段全集）。 */
export interface AgentSkillDetail {
  id: string;
  /** 英文标识，如 create-manifest（也是深链 :skillId）。 */
  slug: string;
  name: string;
  zhName: string;
  iconChip: SkillIconChip;
  runLocation: SkillRunLocation;
  summary: string;
  input: string;
  output: string;
  /** 等宽示例 CLI 命令（占位路径，INV-01）。 */
  cliCommand: string;
  /** MCP 工具名（占位，ASM-040）。 */
  mcpToolName: string;
  /** 隐私级别说明（关联 NFR-001）。 */
  privacyLevel: "local" | "remote";
  privacyNote: string;
  /** 同意要求说明：技能实际运行时才触发同意门，本页/抽屉不自动越过（NFR-005/ASM-041）。 */
  consentNote: string;
  /** 关联业务流（FLOW-001 / FLOW-004 等）。 */
  flowRef: string;
  docsUrl?: string;
}

/* runLocation → 中文标签 + 色调（非仅颜色，NFR-007）。 */
export const RUN_LOCATION_META: Record<
  SkillRunLocation,
  { tone: Tone; label: string; icon: string }
> = {
  local: { tone: "success", label: "本地运行", icon: "lock" },
  platform: { tone: "info", label: "平台运行", icon: "send" },
};

/*
  5 个规范技能（设计真源 docs/design/know-share-agent-skills.png 固定 5 项）。
  以 misc.ts agentSkills 的 id/name/category/privacyLevel 为骨架，按 slug 对齐补全展示字段。
  注：iconChip.glyph 仅取 icon-map.ts 已映射的 Material 名，避免引入第二图标族（DEC-012）。
  submit-feedback 设计稿 glyph 为 rate_review（未在 icon-map），归一化为已映射的 forum（评审/反馈语义）。
*/
const SKILL_DETAIL_BY_SLUG: Record<
  string,
  Omit<AgentSkillDetail, "id" | "name" | "privacyLevel" | "docsUrl">
> = {
  "create-manifest": {
    slug: "create-manifest",
    zhName: "创建脱敏清单",
    iconChip: { glyph: "description", tone: "primary" },
    runLocation: "local",
    summary: "从本地知识来源生成脱敏清单草稿与关系图，原始内容不离机。",
    input: "本地知识库路径（如 ./my-notes）",
    output: "manifest.json + 关系图（仅元数据，无原始笔记）",
    cliCommand: "know-share create-manifest --notes ./my-notes",
    mcpToolName: "create_manifest",
    privacyNote: "全程本地运行；仅产出脱敏元数据，原始笔记不离开本机（NFR-001 / INV-01）。",
    consentNote:
      "实际生成在你的机器上进行，发布前由你人工确认；本目录不代为运行、不读取你的本地路径。",
    flowRef: "FLOW-001",
  },
  "redact-knowledge": {
    slug: "redact-knowledge",
    zhName: "内容脱敏处理",
    iconChip: { glyph: "shield", tone: "info" },
    runLocation: "local",
    summary: "对原始笔记/文档做隐私脱敏与泛化，产出摘要、隐私边界与关键词。",
    input: "原始笔记 / 文档目录（如 ./notes）",
    output: "脱敏摘要、隐私边界、关键词",
    cliCommand: "know-share redact-knowledge --input ./notes --level medium",
    mcpToolName: "redact_knowledge",
    privacyNote: "在本机执行脱敏；不上传原始内容，隐私由你掌控（NFR-001 / INV-01）。",
    consentNote: "脱敏在本地完成，结果由你审阅后才进入下一步；不自动提交、不自动交换。",
    flowRef: "FLOW-001",
  },
  "validate-manifest": {
    slug: "validate-manifest",
    zhName: "验证清单合规",
    iconChip: { glyph: "verified", tone: "warning" },
    runLocation: "local",
    summary: "校验 manifest 字段与隐私边界一致性，产出验证报告与问题清单。",
    input: "manifest.json",
    output: "验证报告、问题清单",
    cliCommand: "know-share validate-manifest ./manifest.json",
    mcpToolName: "validate_manifest",
    privacyNote: "仅读取你提供的 manifest 元数据；不触及原始知识内容（INV-02）。",
    consentNote: "校验是只读检查，不修改你的文件，也不发起任何提交或交换。",
    flowRef: "FLOW-001",
  },
  "package-private-repo": {
    slug: "package-private-repo",
    zhName: "打包私有仓库",
    iconChip: { glyph: "inventory_2", tone: "accent" },
    runLocation: "local",
    summary: "为已接受的交换生成私有仓库配置与邀请链接，仅生成配置、不自动建协作。",
    input: "本地项目目录",
    output: "私有仓库配置、邀请链接（仅引用）",
    cliCommand: "know-share package-private-repo --init-repo",
    mcpToolName: "package_private_repo",
    privacyNote: "仅产出仓库配置与邀请链接草稿；接受邀请、建立协作与提交内容均由你手动完成。",
    consentNote:
      "本技能不自动建立协作、不自动发起 PR、不越过同意边界（ASM-041 / NFR-005）；越过同意的动作需你本人确认。",
    flowRef: "FLOW-003",
  },
  "submit-feedback": {
    slug: "submit-feedback",
    zhName: "提交反馈信用",
    iconChip: { glyph: "forum", tone: "danger" },
    runLocation: "platform",
    summary: "交换完成后提交结构化反馈，更新对方信用分。",
    input: "交换记录 / 模块 ID",
    output: "反馈记录、信用分提升",
    cliCommand: "know-share submit-feedback --exchange-id EX123 --rating 5",
    mcpToolName: "submit_feedback",
    privacyNote: "在平台侧记录聚合反馈与信用；不携带原始知识内容（INV-09）。",
    consentNote: "提交反馈是你主动发起的动作；本目录页不代为提交。",
    flowRef: "FLOW-004",
  },
};

/** slug 推导：用 misc.ts 的 id（sk-create-manifest → create-manifest），个别拼写差异手动对齐。 */
const ID_TO_SLUG: Record<string, string> = {
  "sk-create-manifest": "create-manifest",
  "sk-reduct-manifest": "redact-knowledge",
  "sk-validate-manifest": "validate-manifest",
  "sk-package-repo": "package-private-repo",
  "sk-submit-feedback": "submit-feedback",
};

/** 合成完整技能目录：骨架（misc.agentSkills）+ 本模块展示字段。 */
export const agentSkillCatalog: AgentSkillDetail[] = agentSkills.map((base) => {
  const slug = ID_TO_SLUG[base.id] ?? base.id;
  const detail = SKILL_DETAIL_BY_SLUG[slug];
  return {
    id: base.id,
    name: base.name,
    privacyLevel: base.privacyLevel,
    docsUrl:
      base.docsUrl ?? `https://docs.example.com/skills/${slug}`,
    ...detail,
  };
});

/** 按 slug 查单个技能（供 /skills/:skillId 深链与抽屉）。 */
export function findSkillBySlug(slug: string): AgentSkillDetail | undefined {
  return agentSkillCatalog.find((s) => s.slug === slug);
}

/* MCP 安装配置（静态文档；包名 know-share-mcp 为占位 ASM-040；无密钥/私有 URL INV-01/04）。 */
export const MCP_CONFIG = {
  mcpServers: {
    "know-share": {
      command: "npx",
      args: ["-y", "know-share-mcp"],
      env: { KNOW_SHARE_MODE: "local-first" },
    },
  },
} as const;

export const MCP_CONFIG_JSON = JSON.stringify(MCP_CONFIG, null, 2);

/* Skill 安装说明（静态文本）。 */
export const SKILL_INSTALL_TEXT =
  "npm install -g know-share\nknow-share --help";

/* 适配的知识来源类别（8 类；LIGHT_DOMAIN_MODEL 来源外部引用）。 */
export interface SupportedSource {
  id: string;
  name: string;
  iconChip: SkillIconChip;
  href?: string;
}

export const supportedSources: SupportedSource[] = [
  { id: "obsidian", name: "Obsidian", iconChip: { glyph: "description", tone: "accent" } },
  { id: "logseq", name: "Logseq", iconChip: { glyph: "inventory_2", tone: "info" } },
  { id: "notion", name: "Notion", iconChip: { glyph: "folder", tone: "neutral" } },
  { id: "markdown", name: "MarkDown", iconChip: { glyph: "code", tone: "primary" } },
  { id: "yuque", name: "语雀", iconChip: { glyph: "label", tone: "success" } },
  { id: "feishu", name: "飞书文档", iconChip: { glyph: "forum", tone: "info" } },
  { id: "local-folder", name: "本地文件夹", iconChip: { glyph: "folder", tone: "warning" } },
  { id: "custom", name: "其他自定义格式", iconChip: { glyph: "auto_awesome", tone: "accent" } },
];

/* 本地优先隐私流程 6 步（PAGE-050 区块 3；NFR-001 / INV-01 / FLOW-001）。 */
export interface PrivacyFlowStep {
  id: string;
  label: string;
  glyph: string;
}

export const privacyFlowSteps: PrivacyFlowStep[] = [
  { id: "select", label: "选择知识库", glyph: "folder" },
  { id: "redact", label: "本地脱敏", glyph: "shield" },
  { id: "manifest", label: "生成 Manifest", glyph: "description" },
  { id: "confirm", label: "人工确认", glyph: "check_circle" },
  { id: "submit", label: "提交平台", glyph: "send" },
  { id: "exchange", label: "私有仓库交换", glyph: "swap_horiz" },
];

/* 核心原则横幅文案（静态；NFR-001 / INV-01）。 */
export const corePrinciple = {
  title: "Know-share 的核心原则",
  points: [
    "只交换 manifest，不上传原始笔记。",
    "脱敏与生成全在本地运行，隐私由你掌控。",
  ],
};

/* 示例命令列表（5 条 CLI；占位路径 INV-01）。 */
export const exampleCommands = agentSkillCatalog.map((s) => ({
  skillId: s.id,
  label: s.zhName,
  command: s.cliCommand,
}));
