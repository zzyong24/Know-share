/*
  公开投影序列化器（守 INV-04）——后端是权威脱敏边界（前端 stripSensitiveFields 仅纵深防御）。
  统一把内部实体行投影为公开输出：白名单字段、剥离 contact/原始内容/私有 URL。
  形状对齐 app/src/lib/types.ts（前端 query hooks 消费形状）。
*/
import type {
  KnowledgeModule,
  Manifest,
  Topic,
  TrustLevel,
  ModuleStatus,
  UsageStat,
} from "@/lib/types";

/** 公开投影中**绝不允许**出现的字段（PII / 原始内容 / 私有 URL）。INV-01/03/04。 */
// 注：不列 "value"——它是 UsageStat.value 等合法聚合字段名；
// contact_info.value 的保护靠「公开投影从不读取/输出 contact_info 表」实现（INV-03）。
export const FORBIDDEN_PUBLIC_FIELDS = [
  "contact",
  "contactInfo",
  "contact_info",
  "email",
  "phone",
  "privateUrl",
  "rawContent",
  "content",
  "embeddings",
  "draftData",
  "draft_data",
] as const;

/** 纵深防御：深度剥离对象中的禁止公开字段（任何投影最后过一道）。 */
export function assertNoForbidden<T>(obj: T, context = "public"): T {
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if ((FORBIDDEN_PUBLIC_FIELDS as readonly string[]).includes(k)) {
          throw new Error(
            `[公开投影守卫] ${context} 含禁止公开字段 "${k}"（INV-01/04）。`
          );
        }
        visit(v);
      }
    }
  };
  visit(obj);
  return obj;
}

const TRUST_LEVELS: TrustLevel[] = ["high", "medium", "low", "new"];

function asTrustLevel(v: unknown): TrustLevel {
  return TRUST_LEVELS.includes(v as TrustLevel) ? (v as TrustLevel) : "new";
}

function asModuleStatus(v: unknown): ModuleStatus {
  const allowed: ModuleStatus[] = ["Draft", "Published", "Updated", "Delisted"];
  return allowed.includes(v as ModuleStatus)
    ? (v as ModuleStatus)
    : "Published";
}

/** 内部模块行（schema + 派生字段）→ 公开 KnowledgeModule 投影。 */
export interface ModuleRowLike {
  id: string;
  title: string;
  summary: string;
  topics: string[];
  sourceStats: KnowledgeModule["sourceStats"];
  trustLevel: TrustLevel;
  status: string;
  exchangeCount: number;
  favoriteCount: number;
  freshness: string;
  ownerLogin: string;
}

export function projectModule(row: ModuleRowLike): KnowledgeModule {
  const out: KnowledgeModule = {
    id: row.id,
    title: row.title,
    summary: row.summary,
    topics: row.topics,
    sourceStats: row.sourceStats,
    trustLevel: asTrustLevel(row.trustLevel),
    status: asModuleStatus(row.status),
    exchangeCount: row.exchangeCount,
    favoriteCount: row.favoriteCount,
    freshness: row.freshness,
    ownerLogin: row.ownerLogin,
  };
  return assertNoForbidden(out, "module");
}

/** 内部 manifest 行 → 公开 Manifest 投影（剥离 contact/原始内容；INV-03/ASM-024）。 */
export interface ManifestRowLike {
  moduleId: string;
  summary: string;
  topics: string[];
  freshness?: string | null;
  sourceStats: Manifest["sourceStats"];
  contentCommitment?: string | null;
  privacyBoundary?: string | null;
  version: string;
}

export function projectManifest(row: ManifestRowLike): Manifest {
  const out: Manifest = {
    moduleId: row.moduleId,
    summary: row.summary,
    topics: row.topics,
    freshness: row.freshness ?? "",
    sourceStats: row.sourceStats,
    contentCommitment: row.contentCommitment ?? undefined,
    privacyBoundary: row.privacyBoundary ?? undefined,
    version: row.version,
  };
  return assertNoForbidden(out, "manifest");
}

/** Topic 投影。 */
export function projectTopic(row: {
  id: string;
  label: string;
  moduleCount?: number;
}): Topic {
  return {
    id: row.id,
    label: row.label,
    ...(row.moduleCount != null ? { moduleCount: row.moduleCount } : {}),
  };
}

/** UsageStat 投影（聚合标量，无 PII；INV-09）。 */
export function projectUsageStat(row: {
  key: string;
  label: string;
  value: number;
  trend?: { x: string; y: number }[];
}): UsageStat {
  const out: UsageStat = {
    key: row.key,
    label: row.label,
    value: row.value,
    ...(row.trend ? { trend: row.trend } : {}),
  };
  return assertNoForbidden(out, "usage-stat");
}
