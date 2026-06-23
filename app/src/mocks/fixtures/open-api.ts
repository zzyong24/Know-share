/*
  open-api 模块静态文档配置（ASM-103：端点清单为前端静态文档配置，非运行时查询）。
  落地 PAGE-090 / IA-012：端点清单、分类导航、字段说明表、响应/请求示例。

  内容不变量（INV-01 / INV-04 / INV-03 / ASM-055）：
  - 所有响应示例字段经脱敏，绝不含 contact / 私有 URL / 原始知识内容 / 凭据。
  - 公开读响应不含 contact 字段（PII 收紧，ASM-055 / INV-03）。
  这些不变量在 tests/unit/open-api 以断言核验（PAGE-090 验收 1/4/5）。
*/

export type ApiCategoryId =
  | "discovery"
  | "modules"
  | "exchanges"
  | "feedback"
  | "stats";

export interface ApiCategory {
  id: ApiCategoryId;
  label: string;
  anchor: string;
  /** 该分类下端点数（静态计数，不依赖运行时私有数据） */
  count: number;
}

/** 分类导航（5 类固定，对齐 IA-012 端点分组；锚点对齐 PAGE-090 ASM-054） */
export const API_CATEGORIES: ApiCategory[] = [
  { id: "discovery", label: "发现", anchor: "#discovery", count: 0 },
  { id: "modules", label: "模块", anchor: "#modules", count: 2 },
  { id: "exchanges", label: "交换", anchor: "#exchanges", count: 2 },
  { id: "feedback", label: "反馈", anchor: "#feedback", count: 1 },
  { id: "stats", label: "统计", anchor: "#stats", count: 1 },
];

export interface EndpointFieldRow {
  field: string;
  type: string;
  /** 来源实体（如 ENT-004 Manifest 脱敏视图） */
  source: string;
  /** 追溯标注（data-contract 必需/推荐字段 或 派生 ENT-011） */
  trace: string;
  note?: string;
}

export interface ApiEndpoint {
  id: string;
  category: ApiCategoryId;
  method: "GET" | "POST";
  path: string;
  summary: string;
  auth: "public-read" | "auth-write";
  anchorId: string;
  /** 公开读端点受速率限制（FR-110 / NFR-006 / ASM-057） */
  rateLimited: boolean;
  /** 仅 POST：JSON 请求示例（响应不回显任何私有内容，INV-04） */
  requestExample?: Record<string, unknown>;
  /** JSON 响应示例（脱敏，绝不含 contact / 私有 URL / 原始内容，INV-01/04/ASM-055） */
  responseExample: Record<string, unknown>;
  /** 响应/入参字段说明（可逐字段追溯 data-contract 或标派生，PAGE-090 验收 4） */
  fields: EndpointFieldRow[];
}

/*
  端点清单（PAGE-090 Data required 表）。与 docs/data-contract.md 公共清单字段对齐，
  作为下游 API-* 源材料。剔除 contact（ASM-055 / INV-03）。
*/
export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: "modules-list",
    category: "modules",
    method: "GET",
    path: "/api/modules",
    summary: "列出公开知识模块（脱敏清单），支持分页 / 筛选。",
    auth: "public-read",
    anchorId: "modules",
    rateLimited: true,
    responseExample: {
      items: [
        {
          id: "mod_8f3a",
          title: "Agent 记忆系统设计笔记",
          summary: "围绕长期记忆与检索的脱敏要点清单。",
          topics: ["agent", "memory"],
          tags: ["rag", "vector-db"],
          language: "zh",
          owner_handle: "zyongzhu24",
          source_types: ["notes", "papers"],
          freshness: "近 30 天",
          sensitivity: "low",
          updated_at: "2026-06-20",
          trust_level: "high",
        },
      ],
      page: 1,
      page_size: 20,
      total: 1842,
    },
    fields: [
      { field: "id", type: "string", source: "ENT-004 Manifest 脱敏视图", trace: "data-contract 必需" },
      { field: "title", type: "string", source: "ENT-004", trace: "data-contract 必需" },
      { field: "summary", type: "string", source: "ENT-004", trace: "data-contract 推荐" },
      { field: "topics", type: "string[]", source: "ENT-004", trace: "data-contract 推荐" },
      { field: "tags", type: "string[]", source: "ENT-004", trace: "data-contract 推荐" },
      { field: "language", type: "string", source: "ENT-004", trace: "data-contract 推荐" },
      { field: "owner_handle", type: "string", source: "ENT-004", trace: "data-contract 推荐", note: "公开 handle，非联系方式" },
      { field: "source_types", type: "string[]", source: "ENT-004", trace: "data-contract 推荐" },
      { field: "freshness", type: "string", source: "ENT-004", trace: "data-contract 推荐" },
      { field: "sensitivity", type: "string", source: "ENT-004", trace: "data-contract 推荐" },
      { field: "updated_at", type: "string (ISO)", source: "ENT-004", trace: "data-contract 推荐" },
      { field: "trust_level", type: "string", source: "ENT-011", trace: "派生 ENT-011", note: "信任级别派生值，非 data-contract 原字段" },
    ],
  },
  {
    id: "module-detail",
    category: "modules",
    method: "GET",
    path: "/api/modules/{id}",
    summary: "获取单个模块的完整脱敏清单。",
    auth: "public-read",
    anchorId: "module-detail",
    rateLimited: true,
    responseExample: {
      id: "mod_8f3a",
      title: "Agent 记忆系统设计笔记",
      summary: "围绕长期记忆与检索的脱敏要点清单。",
      topics: ["agent", "memory"],
      tags: ["rag", "vector-db"],
      language: "zh",
      owner_handle: "zyongzhu24",
      source_types: ["notes", "papers"],
      freshness: "近 30 天",
      sensitivity: "low",
      updated_at: "2026-06-20",
      trust_level: "high",
      covered_questions: ["如何为 agent 设计长期记忆？", "检索与遗忘如何权衡？"],
      redaction_notes: "已移除全部原文摘录与私有路径。",
      content_commitment: "平台不存储原始知识内容，仅存清单与公开关系。",
      exchange_intent: "open",
    },
    fields: [
      { field: "covered_questions", type: "string[]", source: "ENT-004", trace: "data-contract 推荐" },
      { field: "redaction_notes", type: "string", source: "ENT-004", trace: "INV-01/04 脱敏说明" },
      { field: "content_commitment", type: "string", source: "ENT-004", trace: "INV-01 承诺" },
      { field: "exchange_intent", type: "string", source: "ENT-004", trace: "FLOW-002" },
    ],
  },
  {
    id: "exchanges-list",
    category: "exchanges",
    method: "GET",
    path: "/api/exchanges",
    summary: "列出公开交换记录（脱敏台账，不含内容 / 私有 URL）。",
    auth: "public-read",
    anchorId: "exchanges",
    rateLimited: true,
    responseExample: {
      items: [
        {
          exchange_id: "exh_4c21",
          status: "Completed",
          target_module_id: "mod_8f3a",
          offered_module_id: "mod_1b07",
          requested_at: "2026-06-10",
          completed_at: "2026-06-14",
        },
      ],
      page: 1,
      page_size: 20,
      total: 327,
    },
    fields: [
      { field: "exchange_id", type: "string", source: "ENT-007 公开视图", trace: "FR-040" },
      { field: "status", type: "string", source: "ENT-007", trace: "FLOW-003 状态机" },
      { field: "target_module_id", type: "string", source: "ENT-007", trace: "FR-040" },
      { field: "offered_module_id", type: "string | null", source: "ENT-007", trace: "FR-040" },
      { field: "requested_at", type: "string (ISO)", source: "ENT-007", trace: "FR-040" },
      { field: "completed_at", type: "string (ISO) | null", source: "ENT-007", trace: "FR-040" },
    ],
  },
  {
    id: "stats",
    category: "stats",
    method: "GET",
    path: "/api/stats",
    summary: "获取平台聚合使用统计（不含 PII）。",
    auth: "public-read",
    anchorId: "stats",
    rateLimited: true,
    responseExample: {
      users_count: 5120,
      modules_count: 1842,
      exchanges_count: 327,
      privacy_gate_pass_rate: 0.93,
      window: "30d",
      as_of: "2026-06-23",
    },
    fields: [
      { field: "users_count", type: "number", source: "ENT-019 UsageStat", trace: "FLOW-008 聚合" },
      { field: "modules_count", type: "number", source: "ENT-019", trace: "FLOW-008 聚合" },
      { field: "exchanges_count", type: "number", source: "ENT-019", trace: "FLOW-008 聚合" },
      { field: "privacy_gate_pass_rate", type: "number (0-1)", source: "ENT-019", trace: "INV-09 聚合" },
      { field: "window", type: "string", source: "ENT-019", trace: "FLOW-008" },
      { field: "as_of", type: "string (ISO)", source: "ENT-019", trace: "FLOW-008" },
    ],
  },
  {
    id: "exchanges-create",
    category: "exchanges",
    method: "POST",
    path: "/api/exchanges",
    summary: "发起交换请求（触发 Requested 态）。需 GitHub 认证 + 同意门。",
    auth: "auth-write",
    anchorId: "exchanges-create",
    rateLimited: false,
    requestExample: {
      target_module_id: "mod_8f3a",
      offered_module_id: "mod_1b07",
      message: "希望就 agent 记忆设计交换清单要点。",
    },
    responseExample: {
      exchange_id: "exh_9d55",
      status: "Requested",
      target_module_id: "mod_8f3a",
      requested_at: "2026-06-23",
    },
    fields: [
      { field: "target_module_id", type: "string", source: "ENT-007 入参", trace: "FR-040 / FLOW-003" },
      { field: "offered_module_id", type: "string (可选)", source: "ENT-007 入参", trace: "FR-040" },
      { field: "message", type: "string (可选)", source: "ENT-007 入参", trace: "FLOW-003" },
    ],
  },
  {
    id: "feedback-create",
    category: "feedback",
    method: "POST",
    path: "/api/feedback",
    summary: "提交结构化反馈。需 GitHub 认证。",
    auth: "auth-write",
    anchorId: "feedback",
    rateLimited: false,
    requestExample: {
      exchange_id: "exh_4c21",
      ratings: {
        manifest_consistency: 5,
        privacy_boundary: 5,
        structure_clarity: 4,
        usefulness: 5,
        rerequest_intent: 4,
      },
      comment: "清单一致、隐私边界清晰。",
    },
    responseExample: {
      feedback_id: "fb_2a10",
      exchange_id: "exh_4c21",
      created_at: "2026-06-23",
    },
    fields: [
      { field: "exchange_id", type: "string", source: "ENT-010 入参", trace: "FR-050 / FLOW-004" },
      { field: "ratings", type: "object", source: "ENT-010 入参", trace: "FR-050", note: "5 维评分（清单一致性 / 隐私边界 / 结构清晰度 / 有用性 / 再次交换意愿）" },
      { field: "comment", type: "string (可选公开文本)", source: "ENT-010 入参", trace: "FR-050" },
    ],
  },
];

/** 写操作要求要点（AuthNoteBlock，引用上游约束 ID；本块只引用不重写细则） */
export const WRITE_OP_POINTS: string[] = [
  "需 GitHub 登录身份核查（DEC-006）",
  "需所有者同意门（NFR-005）",
  "经隐私门校验，不回显任何私有内容（INV-04）",
  "受唯一性约束与速率限制（NFR-006）",
];

/** 可选真实聚合统计（MOCK；与 IA-013 平台统计同源，纯聚合零 PII，INV-09） */
export const STATS_TEASER_MOCK = {
  usersCount: 5120,
  modulesCount: 1842,
  exchangesCount: 327,
  privacyGatePassRate: 0.93,
  window: "30d",
  asOf: "2026-06-23",
};

/** 开发者资源外链（中性集成支持，无任何付费 / 企业措辞，DEC-007） */
export const DEVELOPER_RESOURCES: {
  label: string;
  href: string;
  external?: boolean;
}[] = [
  { label: "访问文档库", href: "/about", external: false },
  { label: "查看仓库与示例", href: "https://github.com/know-share", external: true },
];
