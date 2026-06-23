/*
  skills 域服务层（API-028 技能目录，只读）。
  注：旧 API-030 GET /api/skills 已 DEC-018 弃用，**本服务不实现**；统一走 /api/skills/catalog。
  从 agent_skills（ENT-016）读出只读目录 → 投影为前端 SkillCatalogResponse 形状。
  零私有内容（INV-01/04）：install/命令仅占位，绝不含真实路径/密钥/私有 URL；
  公开输出末尾过 assertNoForbidden 兜底。
*/
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { assertNoForbidden } from "@/server/projection";

/** 前端目录消费形状（对齐 src/mocks/fixtures/agent-skills.ts AgentSkillDetail 的核心字段）。 */
export interface SkillDetailDto {
  id: string;
  slug: string;
  name: string;
  category: string;
  summary: string;
  privacyLevel: "local" | "remote";
  runLocation: "local" | "platform";
  supportedSources: string[];
  cliCommand: string;
  docsUrl?: string;
}

export interface SkillCatalogDto {
  skills: SkillDetailDto[];
  sources: { id: string; name: string }[];
  flowSteps: { id: string; label: string }[];
  exampleCommands: { skillId: string; label: string; command: string }[];
  install: { mcpConfig: string; skillInstallText: string };
  corePrinciple: { title: string; points: string[] };
}

/* 静态目录区块（平台只读文档；占位包名/命令，无密钥/私有 URL，INV-01/04）。 */
const SUPPORTED_SOURCES = [
  { id: "obsidian", name: "Obsidian" },
  { id: "logseq", name: "Logseq" },
  { id: "notion", name: "Notion" },
  { id: "markdown", name: "MarkDown" },
  { id: "yuque", name: "语雀" },
  { id: "feishu", name: "飞书文档" },
  { id: "local-folder", name: "本地文件夹" },
  { id: "custom", name: "其他自定义格式" },
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

const SKILL_INSTALL_TEXT = "npm install -g know-share\nknow-share --help";

const CORE_PRINCIPLE = {
  title: "Know-share 的核心原则",
  points: [
    "只交换 manifest，不上传原始笔记。",
    "脱敏与生成全在本地运行，隐私由你掌控。",
  ],
};

/** privacyLevel → runLocation（remote→platform，其余→local）。 */
function runLocation(privacyLevel: string): "local" | "platform" {
  return privacyLevel === "remote" ? "platform" : "local";
}

function toDto(row: typeof schema.agentSkills.$inferSelect): SkillDetailDto {
  const cliCommand =
    (row.installConfig as Record<string, unknown> | null)?.command;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    summary: row.description,
    privacyLevel: row.privacyLevel === "remote" ? "remote" : "local",
    runLocation: runLocation(row.privacyLevel),
    supportedSources: row.supportedSources ?? [],
    cliCommand: typeof cliCommand === "string" ? cliCommand : `know-share ${row.slug}`,
    docsUrl: row.docsUrl ?? undefined,
  };
}

/** API-028 GET /api/skills/catalog（empty=true → 空 skills，仍带静态区块）。 */
export async function getSkillCatalog(
  opts: { empty?: boolean } = {}
): Promise<SkillCatalogDto> {
  let skills: SkillDetailDto[] = [];
  if (!opts.empty) {
    const db = await getDb();
    const rows = await db.select().from(schema.agentSkills);
    skills = rows.map(toDto);
  }
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
  const db = await getDb();
  const [row] = await db
    .select()
    .from(schema.agentSkills)
    .where(eq(schema.agentSkills.slug, slug))
    .limit(1);
  if (!row) return null;
  return assertNoForbidden(toDto(row), "skill-detail");
}
