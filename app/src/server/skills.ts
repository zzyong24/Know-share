/*
  skills 域服务层（API-028 技能目录，只读）。
  注：旧 API-030 GET /api/skills 已 DEC-018 弃用，**本服务不实现**；统一走 /api/skills/catalog。
  目录为「平台预置参考内容」：5 个规范技能 + 来源/流程/安装区块，**静态定义**（不依赖
  agent_skills 表 seed，避免空库→目录空）。零私有内容（INV-01/04）：install/命令仅占位，
  绝不含真实路径/密钥/私有 URL；公开输出末尾过 assertNoForbidden 兜底。
*/
import { assertNoForbidden } from "@/server/projection";
import type { Tone } from "@/lib/types";

/** 前端目录消费形状（对齐 src/mocks/fixtures/agent-skills.ts AgentSkillDetail）。 */
export interface SkillDetailDto {
  id: string;
  name: string;
  slug: string;
  zhName: string;
  category: string;
  summary: string;
  privacyLevel: "local" | "remote";
  runLocation: "local" | "platform";
  iconChip: { glyph: string; tone: Tone };
  input: string;
  output: string;
  cliCommand: string;
  mcpToolName: string;
  privacyNote: string;
  consentNote: string;
  flowRef: string;
  docsUrl?: string;
}

export interface SkillCatalogDto {
  skills: SkillDetailDto[];
  sources: { id: string; name: string; iconChip: { glyph: string; tone: Tone } }[];
  flowSteps: { id: string; label: string }[];
  exampleCommands: { skillId: string; label: string; command: string }[];
  install: { mcpConfig: string; skillInstallText: string };
  corePrinciple: { title: string; points: string[] };
}

/* 静态目录区块（平台只读文档；占位包名/命令，无密钥/私有 URL，INV-01/04）。 */
const SUPPORTED_SOURCES: SkillCatalogDto["sources"] = [
  { id: "obsidian", name: "Obsidian", iconChip: { glyph: "description", tone: "accent" } },
  { id: "logseq", name: "Logseq", iconChip: { glyph: "inventory_2", tone: "info" } },
  { id: "notion", name: "Notion", iconChip: { glyph: "folder", tone: "neutral" } },
  { id: "markdown", name: "MarkDown", iconChip: { glyph: "code", tone: "primary" } },
  { id: "yuque", name: "语雀", iconChip: { glyph: "label", tone: "success" } },
  { id: "feishu", name: "飞书文档", iconChip: { glyph: "forum", tone: "info" } },
  { id: "local-folder", name: "本地文件夹", iconChip: { glyph: "folder", tone: "warning" } },
  { id: "custom", name: "其他自定义格式", iconChip: { glyph: "auto_awesome", tone: "accent" } },
];

const FLOW_STEPS = [
  { id: "select", label: "选择知识库" },
  { id: "redact", label: "本地脱敏" },
  { id: "manifest", label: "生成 Manifest" },
  { id: "confirm", label: "人工确认" },
  { id: "submit", label: "提交平台" },
  { id: "exchange", label: "私有仓库交换" },
];

const MCP_CONFIG_JSON = JSON.stringify(
  {
    mcpServers: {
      "know-share": {
        command: "npx",
        args: ["-y", "know-share-mcp"],
        env: { KNOW_SHARE_MODE: "local-first" },
      },
    },
  },
  null,
  2
);

const SKILL_INSTALL_TEXT = "npm install -g know-share-mcp\nknow-share --help";

const CORE_PRINCIPLE = {
  title: "Know-share 的核心原则",
  points: [
    "只交换 manifest，不上传原始笔记。",
    "脱敏与生成全在本地运行，隐私由你掌控。",
  ],
};

/*
  5 个规范平台技能（设计真源固定 5 项）——平台只读参考内容，静态定义。
  不读 agent_skills 表（该表用于未来扩展/用户态；目录页是平台预置内容）。
  占位命令/路径，无密钥/私有 URL（INV-01/04）。
*/
const CANONICAL_SKILLS: SkillDetailDto[] = [
  {
    id: "sk-create-manifest",
    name: "Create Manifest",
    slug: "create-manifest",
    zhName: "创建脱敏清单",
    category: "清单",
    privacyLevel: "local",
    runLocation: "local",
    iconChip: { glyph: "description", tone: "primary" },
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
  {
    id: "sk-reduct-manifest",
    name: "Reduct Manifest",
    slug: "redact-knowledge",
    zhName: "内容脱敏处理",
    category: "隐私",
    privacyLevel: "local",
    runLocation: "local",
    iconChip: { glyph: "shield", tone: "info" },
    summary: "对原始笔记/文档做隐私脱敏与泛化，产出摘要、隐私边界与关键词。",
    input: "原始笔记 / 文档目录（如 ./notes）",
    output: "脱敏摘要、隐私边界、关键词",
    cliCommand: "know-share redact-knowledge --input ./notes --level medium",
    mcpToolName: "redact_knowledge",
    privacyNote: "在本机执行脱敏；不上传原始内容，隐私由你掌控（NFR-001 / INV-01）。",
    consentNote: "脱敏在本地完成，结果由你审阅后才进入下一步；不自动提交、不自动交换。",
    flowRef: "FLOW-001",
  },
  {
    id: "sk-validate-manifest",
    name: "Validate Manifest",
    slug: "validate-manifest",
    zhName: "验证清单合规",
    category: "校验",
    privacyLevel: "local",
    runLocation: "local",
    iconChip: { glyph: "verified", tone: "warning" },
    summary: "校验 manifest 字段与隐私边界一致性，产出验证报告与问题清单。",
    input: "manifest.json",
    output: "验证报告、问题清单",
    cliCommand: "know-share validate-manifest ./manifest.json",
    mcpToolName: "validate_manifest",
    privacyNote: "仅读取你提供的 manifest 元数据；不触及原始知识内容（INV-02）。",
    consentNote: "校验是只读检查，不修改你的文件，也不发起任何提交或交换。",
    flowRef: "FLOW-001",
  },
  {
    id: "sk-package-repo",
    name: "Package Private Repo",
    slug: "package-private-repo",
    zhName: "打包私有仓库",
    category: "交付",
    privacyLevel: "local",
    runLocation: "local",
    iconChip: { glyph: "inventory_2", tone: "accent" },
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
  {
    id: "sk-submit-feedback",
    name: "Submit Feedback",
    slug: "submit-feedback",
    zhName: "提交反馈信用",
    category: "反馈",
    privacyLevel: "remote",
    runLocation: "platform",
    iconChip: { glyph: "forum", tone: "danger" },
    summary: "交换完成后提交结构化反馈，更新对方信用分。",
    input: "交换记录 / 模块 ID",
    output: "反馈记录、信用分提升",
    cliCommand: "know-share submit-feedback --exchange-id EX123 --rating 5",
    mcpToolName: "submit_feedback",
    privacyNote: "在平台侧记录聚合反馈与信用；不携带原始知识内容（INV-09）。",
    consentNote: "提交反馈是你主动发起的动作；本目录页不代为提交。",
    flowRef: "FLOW-004",
  },
];

/** API-028 GET /api/skills/catalog（empty=true → 空 skills，仍带静态区块）。 */
export async function getSkillCatalog(
  opts: { empty?: boolean } = {}
): Promise<SkillCatalogDto> {
  const skills: SkillDetailDto[] = opts.empty ? [] : CANONICAL_SKILLS;
  const exampleCommands = skills.map((s) => ({
    skillId: s.id,
    label: s.name,
    command: s.cliCommand,
  }));
  const dto: SkillCatalogDto = {
    skills,
    sources: SUPPORTED_SOURCES,
    flowSteps: FLOW_STEPS,
    exampleCommands,
    install: { mcpConfig: MCP_CONFIG_JSON, skillInstallText: SKILL_INSTALL_TEXT },
    corePrinciple: CORE_PRINCIPLE,
  };
  return assertNoForbidden(dto, "skill-catalog");
}

/** GET /api/skills/catalog/:slug（未知 → null，handler 转 404）。 */
export async function getSkillBySlug(
  slug: string
): Promise<SkillDetailDto | null> {
  const skill = CANONICAL_SKILLS.find((s) => s.slug === slug);
  if (!skill) return null;
  return assertNoForbidden(skill, "skill-detail");
}
