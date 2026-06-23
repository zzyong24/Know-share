/*
  轻量 fetch 客户端 + 公开字段守卫（FRONTEND_SPEC §8 / INV-01/04）。
  开发期对接 MSW（src/mocks），阶段 15 后形状以 SERVICE_CONTRACT 为准。
*/

/** 基础 JSON 请求 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`请求失败 ${res.status}: ${path}`);
  }
  return (await res.json()) as T;
}

/*
  零私有内容守卫（INV-01/04）：前端按字段白名单渲染公开数据。
  若公开对象异常携带敏感字段（contact / 原始内容 / 私有 URL），剥离并开发期告警。
  组件层（如 ModuleCard / CodeBlock）在渲染前调用，作为纵深防御（后端仍是权威边界）。
*/
const FORBIDDEN_PUBLIC_FIELDS = [
  "contact",
  "contactInfo",
  "email",
  "phone",
  "privateUrl",
  "rawContent",
  "content",
  "embeddings",
];

export function stripSensitiveFields<T extends Record<string, unknown>>(
  obj: T,
  context = "public-data"
): T {
  const leaked = FORBIDDEN_PUBLIC_FIELDS.filter((f) => f in obj);
  if (leaked.length > 0 && process.env.NODE_ENV !== "production") {
    console.warn(
      `[白名单守卫] ${context} 含禁止公开字段 [${leaked.join(", ")}]，已丢弃（INV-04）。`
    );
  }
  if (leaked.length === 0) return obj;
  const clone = { ...obj };
  for (const f of leaked) delete (clone as Record<string, unknown>)[f];
  return clone;
}
