/*
  agent-skills 模块 query hooks（PAGE-050/051 / FRONTEND_SPEC §8）。
  取数在本层、组件只接 props（ASM-068）。query-key 本地定义（勿改 lib/query-keys.ts）。
  形状为占位，阶段 15 对齐 SERVICE_CONTRACT（ASM-067/111）。零私有内容（INV-01/04）。
*/
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  AgentSkillDetail,
  SupportedSource,
  PrivacyFlowStep,
} from "@/mocks/fixtures/agent-skills";

/** 技能目录页聚合响应（GET /api/skills/catalog）。 */
export interface SkillCatalogResponse {
  skills: AgentSkillDetail[];
  sources: SupportedSource[];
  flowSteps: PrivacyFlowStep[];
  exampleCommands: { skillId: string; label: string; command: string }[];
  install: { mcpConfig: string; skillInstallText: string };
  corePrinciple: { title: string; points: string[] };
}

export type {
  AgentSkillDetail,
  SupportedSource,
  PrivacyFlowStep,
} from "@/mocks/fixtures/agent-skills";

/** 本模块本地 query-key（不污染全局 query-keys.ts）。 */
export const agentSkillKeys = {
  all: ["agent-skills"] as const,
  catalog: (empty?: boolean) =>
    ["agent-skills", "catalog", { empty: !!empty }] as const,
  detail: (slug: string) => ["agent-skills", "detail", slug] as const,
};

/** 技能目录聚合数据（PAGE-050）。 */
export function useSkillCatalog(opts: { empty?: boolean } = {}) {
  const qs = opts.empty ? "?empty=true" : "";
  return useQuery<SkillCatalogResponse>({
    queryKey: agentSkillKeys.catalog(opts.empty),
    queryFn: () => apiFetch<SkillCatalogResponse>(`/api/skills/catalog${qs}`),
  });
}

/** 单个技能详情（PAGE-051 深链 /skills/:skillId）。 */
export function useSkillDetail(slug: string | undefined) {
  return useQuery<AgentSkillDetail>({
    queryKey: agentSkillKeys.detail(slug ?? ""),
    queryFn: () => apiFetch<AgentSkillDetail>(`/api/skills/catalog/${slug}`),
    enabled: !!slug,
  });
}
