/*
  规范化的 query key 工厂（FRONTEND_SPEC §8）。
  各模块 query hooks 复用这些 key，便于精确失效。
*/
export const queryKeys = {
  modules: {
    all: ["modules"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["modules", "list", filters ?? {}] as const,
    detail: (id: string) => ["modules", "detail", id] as const,
    manifest: (id: string) => ["modules", "manifest", id] as const,
  },
  exchanges: {
    all: ["exchanges"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["exchanges", "list", filters ?? {}] as const,
    detail: (id: string) => ["exchanges", "detail", id] as const,
  },
  trust: {
    profile: (login: string) => ["trust", "profile", login] as const,
    network: ["trust", "network"] as const,
  },
  skills: {
    all: ["skills"] as const,
    detail: (id: string) => ["skills", "detail", id] as const,
  },
  notifications: {
    all: ["notifications"] as const,
  },
  topics: {
    all: ["topics"] as const,
  },
  stats: {
    usage: ["stats", "usage"] as const,
  },
  admin: {
    reviewQueue: ["admin", "review-queue"] as const,
    audit: ["admin", "audit"] as const,
  },
  search: {
    suggest: (q: string) => ["search", "suggest", q] as const,
  },
  account: {
    contacts: ["account", "contacts"] as const,
  },
} as const;
