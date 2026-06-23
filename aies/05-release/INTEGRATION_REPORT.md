# 集成报告（INTEGRATION_REPORT）

## 摘要

阶段 17：验证前端（10 模块/25 页面路由）与后端（6 域/46 API 路由）在同一契约（`SERVICE_CONTRACT` API-001~053）下协同。后端按 DEC-017 零氪 serverless 栈实现于 `app/`（Next Route Handlers + Drizzle/Neon(prod)/pglite(test) + Auth.js GitHub + Upstash），前端开发/演示走 MSW（形状已对齐契约）。跨域端到端生命周期 + 隐私不变量 + 契约形状一致性测试全绿。

### 产物元数据

- Stage: `17-integration-release`
- Status: `needs-user-confirmation`
- Upstream: `SERVICE_CONTRACT`(API-001~053)、`BACKEND_SPEC`/`MODULE_WORKFLOW_SPEC`、`FRONTEND_SPEC`、`FRONTEND_VALIDATION_REPORT`、`INV-01~11`、`DEC-006/007/011/017`
- 证据: `app/tests/server/integration/cross-domain.test.ts`、全量 `npm run test:run`、阶段12 Playwright 截图

---

## Integrated components（已集成组件）

- **前端**：Next.js 16 App Router，25 路由（公开 `(public)` + 受保护 `(auth)`/`(admin)`），共享组件库 `COMP-001~040` + 10 模块组件 `COMP-041~229`，TanStack Query + MSW（`src/mocks/`）。
- **后端**：6 域 Route Handlers（`app/src/app/api/**`，46 路由）+ 服务层（`app/src/server/{discovery,exchange,submission,trust,account,admin,community,skills,about}.ts`）+ Drizzle schema（ENT-001~021 全表）+ Auth.js(GitHub) + Upstash 封装 + 公开投影守卫。
- **共享契约**：前端 query hooks/MSW 与后端 handlers 同源于 `SERVICE_CONTRACT`；`src/lib/types.ts` 为前后端形状单一真源。

## Environment（环境）

- macOS / Node v22 / Next.js 16（Turbopack）。
- 测试：Vitest（jsdom 前端 + pglite 后端，进程内 Postgres）；浏览器验证 Playwright（阶段12）。
- 后端运行时：prod=Neon serverless + Upstash（需 env：`DATABASE_URL`/`UPSTASH_*`/`AUTH_GITHUB_*`/`AUTH_SECRET`，见 `app/.env.example`）；test=pglite + 内存 redis + mock session。
- MSW 仅 dev 浏览器/测试启用；prod 包不含 worker（真实走 Route Handlers）。

## Contract checks（契约检查）

- **双向孤儿扫描（阶段15 交叉审核）**：前端所有 query hooks 调用的路径均命中 API-001~053；每个 API 追溯 FR/PAGE；无孤儿/越权端点。
- **形状一致性（集成测试场景4，5 用例）**：抽样断言 handler 返回形状 == 前端 `types.ts`/hooks 期望：`/api/exchanges`→`{items,total,topics}`、`/api/notifications`→`{items,unreadCount}`、`/api/trust-network`→`{overview,contributors,featured,total}`、`/api/trust-profiles/:login`→聚合（dimensions/trend/badges/...）、`/api/modules`→`{items,total}`。
- **MSW↔真实 API 对齐**（阶段16 收尾）：MSW 形状统一到契约（含上述两处形状修正）；反馈端点统一 `POST /api/feedback`（API-013）；弃用旧 trust/skills 双路径（DEC-018，API-027/030 deprecated，前端死 hook 已删）。

## Data flow checks（数据流检查 — 跨域端到端，集成测试 12 用例全绿）

- **交换完整生命周期**（exchange+account/contact+trust+audit）：createExchange→accept→disclose(consent)→双方 mark-delivered→Completed→feedback→**被评方信任分重算上升**；贯穿 INV-03（披露仅 Accepted 后对该次对方、旁观者零泄漏）、INV-06（双方确认才 Completed）、INV-08（缺 consent→422）、INV-10（参与方反馈权重>社交）、INV-11（五条 audit 落库）；非法迁移→409（FLOW-003/HARD-02）。
- **提交→审核→发布**（submission+admin+discovery）：pass 提交→review pending→管理员 approve→module Published→进入发现列表；**block 提交无法 approve 发布（INV-02→409）**。
- **隐私不变量端到端**：7 个公开读端点经 `assertNoForbidden` + 真实邮箱串扫描，全程零私有（INV-01/03/04）；manifest 无 contact 键。

## Known issues（已知问题 — 集成中发现）

1. **[已修]** 公开 `/api/modules` 列表未按状态过滤，Draft/Delisted 模块会出现在公开发现列表（违反"approve→Published 才公开"语义）。
2. **[已记/待 stage17 后]** 交换状态机 `Accepted→PrivatePreparing→Delivered` 无对应用户侧 route 端点（仅 accept/mark-delivered 存在）；当前由服务内部/测试直推。若产品需要用户侧"开始准备/标记交付"动作，需补端点。
3. **[环境]** `next build` 当前因 `next/font/google` 拉 fonts.googleapis.com 网络受限而失败；同配置本会话稍早多次 build✓、Vercel（有网络）正常——环境项非回归。

## Fixes applied（已应用修复）

- 修复 Known issue #1：`src/server/discovery.ts#listModules`（及 MSW `filterAndSortModules` 镜像）默认只暴露 `Published`/`Updated` 态，排除 Draft/Delisted（集成缺口闭合）。
- 阶段16 收尾：MSW 形状对齐 + 写端点 handlers 补齐 + 反馈端点统一 + 死 hook 清理 + 模块详情写动作（收藏/认可/举报/请求交换）接 mutation。

## Regression evidence（回归证据 — 实跑）

- `npm run test:run`：**480 passed (41 files)** = 292 前端组件/页面 + 176 后端契约/不变量 + 12 跨域集成（无回归）。
- `npm run typecheck`：0 错误。
- `npm run lint`：0 错误（12 非阻断 warning）。
- 阶段12 Playwright：11/11 核心路径浏览器验证通过（14 截图）。
- TDD 红→绿：6 后端域均有 import-红 + 断言级不变量-红 → 实现转绿证据（阶段16）。

## Remaining risks（剩余风险）

- **部署凭据未配**：Neon/Upstash/GitHub-OAuth 需真实 env 才能跑真实后端（zero-cost 免费额度）；本地/CI 以 pglite+mock 验证。部署到 Vercel + 配 env 是用户的一步。
- **FE↔真实BE 浏览器联调未做**：当前前端浏览器验证走 MSW；真实后端经 pglite 在 API/服务层集成验证（480 测试）。完整"前端浏览器↔真实API"联调需 pglite-backed dev 或云 env（见发布评审「延后」）。
- **写 UI 未全接线**：owner 视角的 accept/reject/cancel 按钮、`/exchanges/new` 互惠选择表单尚未在 UI 暴露（后端+MSW+hook 已就绪）。
- **next build 字体网络依赖**（Known #2）+ 阶段12 的 4 项非阻断前端缺陷（列表行 onClick 非<a>/icon-map 缺映射/Recharts 尺寸/6 lint warning）。

## 质量门结果

```text
Gate: 14-integration-gate
Status: pass — 待用户确认
Evidence: app/tests/server/integration/cross-domain.test.ts（12 跨域用例）；npm run test:run 480 passed；npm run typecheck 0；阶段12 Playwright 11/11；SERVICE_CONTRACT 双向孤儿扫描
Findings: 前后端契约/数据一致（形状对齐、孤儿扫描清）；release-critical 路径（交换生命周期/提交发布/隐私不变量）端到端覆盖；集成发现 1 缺陷已修；剩余风险均显式（部署凭据/真实BE浏览器联调/写UI接线/字体构建）
Decision: 契约与数据一致、关键路径端到端通过、风险显式 → 待用户确认 → 转 passed → 进入发布评审签字
```
