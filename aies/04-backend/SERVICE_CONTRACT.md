# 服务契约（Service Contract）

> 前后端契约的唯一来源，逐端点定义。**契约为准**；与前端 MSW 不一致处明确标注并记「前端 MSW 待对齐」。所有公开读端点不得输出 `contact`/原始内容/私有 URL（`INV-03`/`INV-04`/`ASM-055`）。

## Artifact metadata

- Stage: `15-service-contract`
- Status: `needs-user-confirmation`
- Upstream IDs: `FR-001`~`FR-140`、`NFR-002/006`、`FLOW-001`~`FLOW-008`、`ENT-*`、`INV-01`~`INV-11`、`PAGE-001`~`PAGE-105`
- Decision IDs: `DEC-006/007/009/010/011/017`
- 前端对齐基线: `app/src/lib/queries/*.ts`、`app/src/mocks/handlers/*.ts`、`app/src/lib/types.ts`
- 新增假设: `ASM-113`（`request schema` 用 zod，与前端 TS 形状互为镜像）、`ASM-118`（外部 agent 签名身份为扩展面）、`ASM-120`（创建/接受/拒绝交换端点为契约新增，前端 MSW 待补）
- 新增风险: `RISK-004`（前端两套 trust/skills 路径并存，需收敛）
- Manifest status: stage `15-service-contract` = `needs-user-confirmation`

## 契约名 / 消费方 / 提供方

- **契约名**：Know-share Unified HTTP API（Next.js Route Handlers，`app/api/**/route.ts`）。
- **消费方**：站内前端（TanStack Query hooks）、外部 agent（公开读 + 认证写，`FR-110`）。
- **提供方**：同一 Next.js 应用后端（`DEC-017`）。
- **通用约定**：JSON；鉴权经 Auth.js 会话 cookie；请求体 zod 校验（`ASM-113`）；列表统一 `{ items, total? }`（除已存在差异端点）；错误体 `{ error: string, message?: string, missing?: string[] }`；写操作限流（Upstash，`NFR-006`）。
- **鉴权级别**：`公开读` / `需认证写(user)` / `参与方(user+角色)` / `管理员(admin)`。

---

## 端点清单（API-*）

> 「MSW」列：✅ 与前端一致；⚠️ 存在差异（含说明）；➕ 契约新增（前端 MSW 待补）。

### A. 会话与身份

| API | 方法 路径 | 用途 | 鉴权 | MSW |
|---|---|---|---|---|
| `API-001` | `GET /api/session` | 当前会话或 `null`（降级匿名 `ASM-019`） | 公开 | ⚠️ 多个 handler 各自返回不同 demo 身份；契约：`Session \| null` |

- 响应（200）：`Session` = `{ login, avatarUrl, isAdmin, verified? }` 或 `null`。
- 错误：失败时前端按 `null` 处理（不抛阻断）。

### B. 发现 / 模块 / 详情 / Manifest（`FR-010`/`FR-020`）

| API | 方法 路径 | 用途 | 鉴权 | MSW |
|---|---|---|---|---|
| `API-002` | `GET /api/modules` | 发现列表（筛选/排序/q/empty/分页） | 公开读 | ✅ |
| `API-003` | `GET /api/modules/:id` | 模块卡片投影 | 公开读 | ✅ |
| `API-004` | `GET /api/modules/:id/manifest` | 脱敏 Manifest | 公开读 | ✅ |
| `API-005` | `GET /api/modules/:id/detail` | 详情聚合（模块+Manifest+owner+trust+privacy） | 公开读 | ✅ |
| `API-006` | `GET /api/topics` | 主题目录 | 公开读 | ✅ |

- `API-002` 请求 query（zod）：`type[]?`、`topic[]?`、`trustLevel[]?`（`high|medium|low|new`）、`verifiedOnly?(bool)`、`q?`、`sort?(relevance|latest|popular|trust)`、`empty?(bool 测试)`、`page?`。响应：`{ items: KnowledgeModule[], total }`（`KnowledgeModule` 见 types.ts；零私有 `INV-04`）。
- `API-005` 响应：`ModuleDetail`（聚合；Manifest 不含 contact，`INV-03`/`ASM-024`）。
- 错误：未知 id → `404`。

### C. 搜索（`FR-001`）

| API | 方法 路径 | 用途 | 鉴权 | MSW |
|---|---|---|---|---|
| `API-007` | `GET /api/search?q=` | 四类分组结果 + counts | 公开读 | ✅ |
| `API-008` | `GET /api/search/suggest?q=` | 联想（≤8） | 公开读 | ✅ |

- `API-007` 响应：`SearchResults`（modules/topics/users/exchanges + counts）；`users`/`exchanges` 为脱敏投影（`UserResult`/`ExchangeResult`，无 PII，`INV-04`）。空 `q` → 空分组。

### D. 提交 + 隐私门（`FR-030`/`FR-090`，W-1）

| API | 方法 路径 | 用途 | 鉴权 | 幂等 | MSW |
|---|---|---|---|---|---|
| `API-009` | `GET /api/submissions/draft` | 新建草稿 | 需认证写 | 读 | ✅ |
| `API-010` | `GET /api/submissions/:id` | 恢复草稿 | 参与方(本人) | 读 | ✅ |
| `API-011` | `GET /api/submissions/skills` | 本机技能目录 | 需认证写 | 读 | ✅ |
| `API-012` | `POST /api/submissions/privacy-scan` | 上报脱敏 Manifest → 脱敏 findings | 需认证写 | 是 | ✅ |
| `API-013` | `POST /api/submissions/:id/submit` | 提交（写 Consent+Audit） | 参与方(本人) | 否 | ✅ |

- `API-012` 请求（zod）：`{ manifest: ManifestDraft }`（**仅脱敏**；后端拒绝原始私有值，`INV-01`）。响应：`PrivacyScanResult`（`findings[]`/`overallStatus`/`sensitivityDeclaration`/`scannerVersion`/`scannedAt`）。`findings.locationRef` 仅指向字段，不回显原值（`INV-01`/`INV-04`）。
- `API-013` 请求（zod）：`{ consent: { actionType: "submit", scope } }`。校验：缺 Consent → `422`（`INV-08`）；`overallStatus=block` → `409`（`INV-02`）。响应：`SubmitResult`（`status: Submitted|InReview`，`privacyOverall: pass|warn`）。

### E. 交换（`FR-040`/`FR-130`，W-2）

| API | 方法 路径 | 用途 | 鉴权 | 幂等 | MSW |
|---|---|---|---|---|---|
| `API-014` | `GET /api/exchanges` | 公开脱敏台账（筛选/排序） | 公开读 | 读 | ⚠️ |
| `API-015` | `GET /api/exchanges/:id` | 详情聚合（viewerRole+披露门控） | 公开读(私域门控) | 读 | ✅ |
| `API-016` | `POST /api/exchanges/:id/disclose` | 披露联系方式（写快照+Consent+Audit） | 参与方+`Accepted+` | 否 | ✅ |
| `API-017` | `POST /api/exchanges/:id/revoke` | 撤回披露（只影响未来） | 参与方 | 是 | ✅ |
| `API-018` | `POST /api/exchanges/:id/mark-delivered` | 己方确认交付 | 参与方 | 是 | ✅ |
| `API-019` | `POST /api/exchanges` | **创建交换请求**（目标+可选自有模块） | 需认证写 | 否 | ➕ |
| `API-020` | `POST /api/exchanges/:id/accept` | 目标所有者接受（→ 触发披露准备） | 目标所有者 | 否 | ➕ |
| `API-021` | `POST /api/exchanges/:id/reject` | 目标所有者拒绝（必填原因可选） | 目标所有者 | 否 | ➕ |
| `API-022` | `POST /api/exchanges/:id/cancel` | 请求方/所有者中止（必填原因） | 参与方 | 否 | ➕ |

- `API-014` **MSW 差异**：exchange 模块 handler 返回 `{ items, total, topics }`（含 topics 用于筛选 chip），聚合器返回 `{ items, total }`。**契约以 `{ items, total, topics }` 为准**（详情页需要主题清单）；前端 MSW 聚合器待对齐。响应行 `ExchangeLedgerRow`（脱敏，`INV-04`）；`Flagged` 不列出（`FLOW-005`；前端 `InReview` 为 `Flagged` 的中性展示投影 `ASM-032`，非独立持久态，同样不列出）。query：`status(active|completed|unfulfilled|all)`、`topic`、`q`、`sort(latest|mostActive)`、`page`、`empty`。
- `API-015` 响应：`ExchangeDetail`（含 `viewerRole: requester|owner|spectator`；`disclosure` 仅参与方且 `Accepted+` 含真实联系方式，`INV-03`）。
- `API-016` 请求（zod）：`{ types: string[], consent: true }`（前端实际形状；后端据此写 `actionType: "contact"` 的 Consent，对齐 W-2a）。校验：状态 `≥ Accepted` 且调用者参与方，否则 `403`；缺 Consent（`consent !== true`）→ `422`（`INV-03`/`INV-08`；与 `TEST-007`、错误码约定、`API-013`/`API-019` 一致）。响应：更新后的 `ExchangeDetail`（含 `disclosure.myDisclosure` 快照）。
- `API-018` 校验：仅置己方确认；双方齐才 `Completed`（`INV-06`）。
- `API-019`（➕，`ASM-120`）请求（zod）：`{ targetModuleId, offeredModuleId?, consent: { actionType:"exchange" } }`（`offeredModuleId` 可空，`INV-05`/`DEC-009`）。校验：目标模块 `Published`；缺 Consent → `422`。响应：`{ exchangeId, status:"Requested" }`。
- 状态写动作均校验**合法迁移**（见 `MODULE_WORKFLOW_SPEC.md` W-2），非法 → `409`。

### F. 信任与反馈（`FR-050`/`FR-060`，W-3）

| API | 方法 路径 | 用途 | 鉴权 | MSW |
|---|---|---|---|---|
| `API-023` | `GET /api/trust-profiles/:login` | 信任档案聚合（可解释） | 公开读 | ✅ |
| `API-024` | `GET /api/trust-network` | 信任网络索引（筛选/排序） | 公开读 | ✅ |
| `API-025` | `GET /api/exchanges/:id/feedback` | 反馈资格/上下文 | 参与方 | ✅ |
| `API-026` | `POST /api/exchanges/:id/feedback` | 提交五维反馈 | 参与方+`WaitingForFeedback` | ✅ |
| `API-027` | `GET /api/trust/:login` | 精简信任档案（旧投影） | 公开读 | ⚠️ |

- `API-023` 响应：`TrustProfileAggregate`（含 `dimensions` 四类来源解释、`trend`、`publishedModules`、`exchangeHistory` 脱敏、`badges`、`feedbackAverages`、`social`；零 PII，`INV-04`/`INV-09`）。`explanationAvailable=false` 时降级「解释生成中」（`HARD-03`）。
- `API-026` 请求（zod）：`{ exchangeId, scores: { checklistConsistency, privacyBoundary, structureClarity, usefulness, rebuyIntent }, publicComment? }`。校验：资格非 editable → `409`；五维缺失 → `422 { missing[] }`；唯一性（`NFR-006`）。响应：`{ ok: true, exchangeId }`。触发信任重算（`INV-10`）+ 通知。
- `API-027` **MSW 差异 / `RISK-004`**：前端并存两套——`misc.ts#useTrustProfile` 调 `/api/trust/:login`（精简 `TrustProfile`），`trust-feedback.ts#useTrustProfileAggregate` 调 `/api/trust-profiles/:login`（完整聚合）。**契约以 `API-023` 为主**；`API-027` 标为兼容投影/待收敛（前端应统一到 `API-023`）。

### G. 技能（`FR-080`）

| API | 方法 路径 | 用途 | 鉴权 | MSW |
|---|---|---|---|---|
| `API-028` | `GET /api/skills/catalog` | 完整技能目录（含 sources/flow/install） | 公开读 | ✅ |
| `API-029` | `GET /api/skills/catalog/:slug` | 单技能详情 | 公开读 | ✅ |
| `API-030` | `GET /api/skills` | 精简技能列表（旧投影） | 公开读 | ⚠️ |

- `API-030` **MSW 差异 / `RISK-004`**：`misc.ts#useSkills` 调 `/api/skills`（`{items: AgentSkill[]}`），agent-skills 页用 `/api/skills/catalog`。**契约以 `API-028` 为主**，`API-030` 为兼容投影/待收敛。命令/配置仅占位，零私有（`INV-01`/`INV-04`）。

### H. 账户 / 通知 / 设置·联系方式（`FR-120`/`FR-130`，W-5）

| API | 方法 路径 | 用途 | 鉴权 | 幂等 | MSW |
|---|---|---|---|---|---|
| `API-031` | `GET /api/me/dashboard` | 个人中心概览 | 本人 | 读 | ✅ |
| `API-032` | `GET /api/me/sections/:section` | 分区（modules/drafts/received/sent/favorites） | 本人 | 读 | ✅ |
| `API-033` | `GET /api/notifications` | 通知列表（type 过滤 + unreadCount） | 本人 | 读 | ✅ |
| `API-034` | `POST /api/notifications/:id/read` | 单条已读 | 本人 | 是 | ✅ |
| `API-035` | `POST /api/notifications/read-all` | 全部已读 | 本人 | 是 | ✅ |
| `API-036` | `GET /api/me/contacts` | 联系方式（脱敏，默认私密） | 本人 | 读 | ✅ |
| `API-037` | `PUT /api/me/contacts` | 保存联系方式（写 Consent+Audit） | 本人 | 是 | ✅ |
| `API-038` | `GET /api/me/consents?mode=` | 同意/披露记录（disclosure\|all-consent） | 本人 | 读 | ✅ |
| `API-039` | `POST /api/me/consents/:id/revoke` | 撤回披露（只影响未来） | 本人 | 是 | ✅ |
| `API-040` | `GET /api/me/account` | 账户身份（只读 GitHub） | 本人 | 读 | ✅ |
| `API-041` | `GET /api/me/notification-prefs` | 通知偏好 | 本人 | 读 | ✅ |
| `API-042` | `PUT /api/me/notification-prefs` | 保存通知偏好 | 本人 | 是 | ✅ |

- `API-036`/`API-037`：`contact_info` 默认 `private`（`INV-03`/`DEC-010`）；公开面从不返回真实值；保存写 `consents`(contact) + `audit_log`（`INV-08`/`INV-11`）。
- `API-033` 响应：`{ items: Notification[], unreadCount }`（`unreadCount` 为契约必含；MSW 聚合器旧 `/api/notifications` 仅 `{items}` — 以 account handler 的 `{items,unreadCount}` 为准，聚合器待对齐）。

### I. 审核（`FR-100`，W-4，管理员）

| API | 方法 路径 | 用途 | 鉴权 | MSW |
|---|---|---|---|---|
| `API-043` | `GET /api/admin/review-queue` | 评审队列 | 管理员 | ✅ |
| `API-044` | `GET /api/admin/review-queue/:id` | 评审项详情 | 管理员 | ✅ |
| `API-045` | `GET /api/admin/summary` | 风险摘要（聚合） | 管理员 | ✅ |
| `API-046` | `GET /api/admin/audit` | 审计日志 | 管理员 | ✅ |
| `API-047` | `POST /api/admin/moderate` | 单项处置 | 管理员 | ✅ |
| `API-048` | `POST /api/admin/bulk-approve` | 批量通过 | 管理员 | ✅ |

- `API-047` 请求（zod）：`{ reviewItemId, action: approve|return|delist|dismiss-report|resolve, reason? }`。校验：`approve` + `gate=block` → `409 {error:"block-cannot-approve"}`（`INV-02`）；`return/delist/dismiss-report` 缺 reason → `400 {error:"reason-required"}`。响应：`{ ok:true, audit: AuditEntry }`（`INV-11`）。
- `API-048` 请求：`{ ids: string[] }`；仅 `pass` 且无未决举报子集获批，响应 `{ ok:true, approved: string[] }`（`ASM-050`/`INV-02`）。
- 非管理员访问 `/api/admin/**` → `403`。

### J. 社交信号与举报（`FR-070`，W-7，契约新增）

| API | 方法 路径 | 用途 | 鉴权 | MSW |
|---|---|---|---|---|
| `API-049` | `POST /api/modules/:id/favorite` | 收藏/取消（唯一） | 需认证写 | ➕ |
| `API-050` | `POST /api/social/endorse` | 认可 | 需认证写 | ➕ |
| `API-051` | `POST /api/reports` | 举报（→ 评审队列） | 需认证写 | ➕ |

- `API-049` 校验唯一（`INV-07`）+ 限流；`API-051` 请求 `{ targetType: module|user|exchange, targetId, reason }`，写 `reports`(pending) + 入 `review_items`（`NFR-006`）。`➕` 前端 MSW 待补（页面有举报入口，写端点未 mock）。

### K. 统计（`FR-140`，W-6）

| API | 方法 路径 | 用途 | 鉴权 | MSW |
|---|---|---|---|---|
| `API-052` | `GET /api/stats/usage` | 平台聚合统计 | 公开读 | ✅ |
| `API-053` | `GET /api/about/stats` | 关于页统计 + 月度序列 | 公开读 | ✅ |

- 均聚合、无 PII（`INV-09`）。`API-053` 响应：`{ stats, monthlyActiveSeries, meta }`。

### L. 开放 API（`FR-110`/`HARD-05`）

- 复用上述公开读端点（`API-002`~`API-008`、`API-014`/`API-015`、`API-023`/`API-024`、`API-028`、`API-052`）作为 agent 可读注册表；认证写复用 `API-013`/`API-019`/`API-026` 等（GitHub 会话）。统一限流（`NFR-006`）；输出零私有（`INV-04`）。外部 agent 签名身份 = 扩展面（`ASM-118`）。

---

## 错误码约定（统一 error schema）

`{ error: string, message?: string, missing?: string[] }`，HTTP：`400`（参数/缺原因）、`401`（未登录写）、`403`（越权/非参与方/非管理员/披露门）、`404`（资源不存在）、`409`（非法迁移 / block 冲突 / 资格不符）、`422`（缺 Consent / 校验缺字段）、`429`（限流）、`500`（服务端）。

## 限流（`NFR-006`）

Upstash 令牌桶，按 `userId`/IP。写操作（提交/交换/反馈/披露/社交/举报）与公开 API 均限流；超限 `429`。

## 兼容规则（Compatibility rules）

- 公开投影字段**只增不减**；新增字段可选。
- 移除字段需经决策记录；`API-027`/`API-030` 兼容投影在前端收敛到 `API-023`/`API-028` 后可弃用（`RISK-004`）。
- 列表统一 `{ items, total? }`；分页向后兼容。

## 前端 MSW 不一致汇总（契约为准、前端 MSW 待对齐）

1. `API-014` `/api/exchanges`：聚合器 `{items,total}` vs 模块 `{items,total,topics}` → 以 `{items,total,topics}` 为准。
2. `API-033` `/api/notifications`：聚合器 `{items}` vs account `{items,unreadCount}` → 以 `{items,unreadCount}` 为准。
3. `API-027`/`API-030`：两套 trust/skills 路径并存（`RISK-004`）→ 收敛到 `API-023`/`API-028`。
4. `API-001` `/api/session`：多 handler 返回不同 demo 身份 → 契约 `Session|null`，真实以 GitHub 会话为准。
5. `API-019`~`API-022`、`API-049`~`API-051`：写端点契约新增，前端 MSW 待补（`ASM-120`）。

---

## 关键契约 / 不变量测试场景（TEST-*）

| TEST | 场景 | 验证不变量/契约 | 类型 |
|---|---|---|---|
| `TEST-001` | 公开模块/详情/Manifest 输出不含 contact/原始内容/私有 URL | `INV-01`/`INV-04` | 不变量 |
| `TEST-002` | `block` 级隐私门提交被拒（`409`）；`block` 项不可 `approve`（`409`） | `INV-02` | 不变量 |
| `TEST-003` | 联系方式默认私密；仅 `Accepted+` 参与方披露返回真实值；非参与方 `403` | `INV-03`/`DEC-010` | 不变量 |
| `TEST-004` | 创建单向交换（无 offeredModule）成功 | `INV-05`/`DEC-009` | 契约 |
| `TEST-005` | `Delivered→Completed` 需双方确认；单方确认不迁移 | `INV-06` | 状态机 |
| `TEST-006` | 同一 (User,Module) 重复 favorite 被去重 | `INV-07` | 不变量 |
| `TEST-007` | 提交/披露/交换缺 Consent → `422` | `INV-08`/`NFR-005` | 不变量 |
| `TEST-008` | 统计端点输出无 PII、仅聚合 | `INV-09` | 不变量 |
| `TEST-009` | 信任重算中参与方反馈权重 > 社交信号 | `INV-10`/`HARD-03` | 单元 |
| `TEST-010` | 处置/提交/状态变更写 `audit_log` | `INV-11` | 集成 |
| `TEST-011` | 非法状态迁移（如 `Requested→Completed`）→ `409` | `HARD-02`/`RISK-003` | 状态机 |
| `TEST-012` | 反馈资格非 `editable` → `409`；五维缺失 → `422 {missing}` | `API-026`/`NFR-006` | 契约 |
| `TEST-013` | 非管理员访问 `/api/admin/**` → `403` | 权限矩阵 | 契约 |
| `TEST-014` | 端点响应 schema 与前端 query hooks/types.ts 形状一致 | 契约对齐 | 契约 |
| `TEST-015` | 写端点超限 → `429` | `NFR-006` | 集成 |
| `TEST-016` | 任何端点不接受/返回经济字段 | `DEC-007` | 不变量 |

## 完成证据 / 待确认

- 端点覆盖前端在用的全部路径（B~K 的 ✅ 项）+ 必要写端点（➕）。
- 待用户确认：见返回「待确认/决策点」。
