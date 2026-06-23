/*
  发现页 / 搜索面 URL searchParams ↔ 类型化状态（PAGE-002/003）。
  白名单解析：非法值忽略 / 回退默认（PAGE-002 Validation「参数非法→回退默认」）。
  作为模板：其余模块的列表页可照此模式做 URL 深链。
*/
import type {
  FilterValue,
  ModuleType,
  SearchScope,
  SortKey,
  TrustLevel,
} from "@/lib/types";

export const ALL_MODULE_TYPES: ModuleType[] = ["Draft", "Published", "Updated", "Delisted"];
const VALID_TRUST: TrustLevel[] = ["high", "medium", "low", "new"];
const VALID_SORT: SortKey[] = ["relevance", "latest", "popular", "trust"];
const VALID_SCOPE: SearchScope[] = ["all", "modules", "topics", "users", "exchanges"];

/** 类 URLSearchParams 的最小只读接口（兼容 Next ReadonlyURLSearchParams 与原生）。 */
export interface ReadonlyParams {
  get(name: string): string | null;
  getAll(name: string): string[];
}

export function parseDiscoveryParams(sp: ReadonlyParams): {
  filters: FilterValue;
  sort: SortKey;
  q: string;
  empty: boolean;
} {
  const type = sp.getAll("type").filter((t): t is ModuleType =>
    ALL_MODULE_TYPES.includes(t as ModuleType)
  );
  const trustLevel = sp.getAll("trustLevel").filter((t): t is TrustLevel =>
    VALID_TRUST.includes(t as TrustLevel)
  );
  const topic = sp.getAll("topic").filter(Boolean);
  const verifiedOnly = sp.get("verifiedOnly") === "true";
  const sortRaw = sp.get("sort");
  const sort: SortKey = VALID_SORT.includes(sortRaw as SortKey)
    ? (sortRaw as SortKey)
    : "relevance";
  const q = (sp.get("q") ?? "").slice(0, 200);
  const empty = sp.get("empty") === "true";

  const filters: FilterValue = {};
  if (type.length) filters.type = type;
  if (topic.length) filters.topic = topic;
  if (trustLevel.length) filters.trustLevel = trustLevel;
  if (verifiedOnly) filters.verifiedOnly = true;

  return { filters, sort, q, empty };
}

export function parseSearchScope(raw: string | null): SearchScope {
  return VALID_SCOPE.includes(raw as SearchScope) ? (raw as SearchScope) : "all";
}
