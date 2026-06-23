# 发布评审（RELEASE_REVIEW）

## 摘要

Know-share —— 隐私优先的「个人 agent 之间知识模块交换与撮合平台」—— 从产品意图经 17 阶段 product-to-code 流水线走到可发布状态：完整目标产品（无版本切片）、前端实现 + 浏览器验证、后端实现 + TDD、前后端契约一致、跨域集成、关键不变量服务端强制。本评审汇总发布就绪度，交用户最终签字。

### 产物元数据

- Stage: `17-integration-release`
- Status: `needs-user-confirmation`
- 关联：`INTEGRATION_REPORT.md`、全套 `aies/` 产物、`app/` 实现

---

## Release scope（发布范围）

完整目标产品（DEC-005/008，不切 V0.1/V0.2）：
- **公开面**：发现/注册表（脱敏卡片+筛选+平台统计）、模块详情（脱敏 Manifest+来源统计+隐私边界+请求交换）、公开交换记录台账、交换详情（状态机+披露门）、信任网络+信任档案（可解释信任分）、Agent 技能目录、开放 API 文档（零泄露承诺）、关于/平台统计。
- **私域（GitHub 登录）**：个人中心、通知中心、设置·联系方式（默认私密）、提交向导（隐私门）。
- **管理**：审核控制台（评审队列/处置/审计）。
- **3 条产品边界**（仅此三条，DEC-008）：不托管原始知识内容（INV-01）、无经济模型（DEC-007）、不自动越过人类同意（NFR-005）。
- **栈**：前端 Next.js+TS+Tailwind+shadcn（DEC-014）；后端零氪 serverless（DEC-017：Vercel+Neon/Drizzle+Upstash+Resend+Auth.js/GitHub）。

## Artifacts reviewed（已评审产物）

- 产品：`PRODUCT_SPEC`/`BUSINESS_FLOW`/`LIGHT_DOMAIN_MODEL`/`FUNCTION_OUTLINE`（FR-001~140、NFR-001~007、FLOW-001~008、ENT-001~021、INV-01~11、HARD-01~09）。
- 设计：`IA_SPEC`(IA-001~014)、`UI_RULES`(UI-001~004) + 7 张真源图 + 7 屏 Stitch 生成、10 模块 `PAGE_SPEC`(PAGE-001~105)、`_shared`+10 模块 `COMPONENTS_SPEC`(COMP-001~229)、`MOCK_DATA_SPEC`(MOCK-001~020)。
- 前端：`FRONTEND_SPEC` + `app/` 实现 + `FRONTEND_VALIDATION_REPORT`(11/11)。
- 后端：`BACKEND_SPEC`/`MODULE_WORKFLOW_SPEC`/`SERVICE_CONTRACT`(API-001~053) + `app/src/server`+`app/src/app/api` 实现 + `TEST-001~016`。
- 控制：`ARTIFACT_MANIFEST`/`ID_REGISTRY`/`DECISION_LOG`(DEC-001~018)/`DEFAULT_ASSUMPTIONS`(ASM-001~120)/`TRACEABILITY_MATRIX`/`CHANGE_IMPACT`；reconcile 0 错误。

## Verification evidence（验证证据 — 实跑）

- **前端**：阶段12 Playwright 11/11 核心路径浏览器验证 + 14 截图；组件/页面 Vitest 292 通过。
- **后端**：6 域 TDD 红→绿；契约/不变量 Vitest 176 通过（含 TEST-001~016）。
- **集成**：跨域端到端 12 用例（交换生命周期/提交发布/隐私不变量/契约形状）。
- **全量**：`npm run test:run` **480 passed**、`npm run typecheck` 0、`npm run lint` 0 错误。
- **不变量服务端强制**：INV-01（schema 无原始内容列）、INV-02（block→409）、INV-03（披露门）、INV-04（公开投影守卫）、INV-06（双方确认）、INV-07（收藏唯一）、INV-08（consent→422）、INV-09（统计聚合无 PII）、INV-10（反馈权重）、INV-11（audit），均有 TEST 守。

## Open risks（开放风险）

- **部署凭据未配**：真实运行需 Neon/Upstash/GitHub-OAuth env（免费额度）；未配前以 pglite+mock 验证。
- **FE↔真实BE 浏览器联调未做**：浏览器验证走 MSW；真实后端在 API/服务层集成验证。
- **next build 字体网络依赖**：next/font 拉 Google Fonts，离线构建失败（Vercel 有网络则正常）。
- 阶段12 的 4 项非阻断前端缺陷（列表行 onClick 非<a>/icon-map 缺映射/Recharts 尺寸/6 lint warning）。
- 12 个非阻断 lint warning（后端域引入若干未用变量等）。

## Deferred work（延后工作 — 经用户确认延后，非范围缩减）

- 写 UI 接线补全：owner 视角 accept/reject/cancel 按钮、`/exchanges/new` 互惠 offeredModule 选择表单（后端+MSW+hook 已就绪，ASM-120）。
- 外部 agent 签名身份（ASM-118，本版 Agent=User 行动者角色）。
- 邮件/webhook 通道（Resend，本版站内通知优先 ASM-048）。
- 交换 `PrivatePreparing` 用户侧端点（如需）。
- 色值像素级核对（ASM-015）、移动端响应式逐面细化（ASM-016）。
- FE↔真实BE 浏览器联调（建议 pglite-backed dev 或云 env）。

## Rollback or recovery notes（回滚 / 恢复）

- 全程 git 提交、可逐阶段回退；reconcile 校验 manifest 与现实一致。
- 部署回滚：Vercel 即时回滚到上一 deployment；DB 迁移用 drizzle-kit（`db:generate` 生成可审阅迁移，非破坏性 push 前先 review）。
- 数据：Neon 分支/快照；Upstash 计数可重算（物化自事件，非真源）。
- MSW 与真实 API 解耦，前端可在 BE 不可用时降级（ASM-019 匿名只读）。

## Approval decision（批准决策）

- 待用户最终签字。建议：**接受为"规格+实现完整、契约一致、关键路径与不变量验证通过"的可发布基线**；剩余风险均显式且为部署配置/打磨/已确认延后项，不阻断核心产品成立。
- 完成标准（skill）核对：产品范围 ✅、前端 ✅、后端 ✅、契约 ✅、测试 ✅（480）、浏览器验证 ✅（11/11）、已知风险显式 ✅、用户批准 ⏳（本签字）。

## Follow-up triggers（后续触发）

- 配置 Vercel + Neon/Upstash/GitHub-OAuth env → 真实部署 → 跑 FE↔真实BE 浏览器联调。
- 接线延后写 UI → 重跑相关浏览器路径。
- 若启用邮件/外部 agent 身份 → 重开对应规格（DEC 复议）。
- 像素级色值/移动端核对 → 更新 UI_RULES/PAGE_SPEC。

## 质量门结果

```text
Gate: 14-integration-gate（发布评审）
Status: pass — 待用户签字
Evidence: INTEGRATION_REPORT.md；480 测试通过；reconcile 0 错误；DEC-001~018/全套 aies 产物追溯一致
Findings: 完整目标产品规格→实现→验证闭环；前后端契约一致；不变量服务端强制；剩余风险显式且为部署/打磨/已确认延后
Decision: 待用户签字接受可发布基线 → stage 17 转 passed → 流水线完成
```
