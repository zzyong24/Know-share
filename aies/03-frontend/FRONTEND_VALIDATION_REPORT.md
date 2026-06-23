# 前端验证报告（FRONTEND_VALIDATION_REPORT）

## 摘要

阶段 12：对已实现的前端（10 模块、25 路由、MSW 驱动）做浏览器验证。用 Playwright（Chromium）对 dev server（MSW worker 启用）走 11 条核心路径，逐路由截图取证 + 断言「渲染且未落入错误边界」+ 关键隐私不变量软断言。**11/11 通过**，14 张截图归档于 `aies/03-frontend/validation-shots/`。

### 产物元数据

- Stage: `12-frontend-validation`
- Status: `passed`（2026-06-23 用户签字）
- Upstream IDs: `PAGE-001~105`、各 `COMP-*`、`INV-03/02/04`、`NFR-007`、`FR-140`
- Method: Playwright（FRONTEND_SPEC §9 / skill_registry playwright-mcp）
- 证据: `app/tests/e2e/validation.spec.ts`、`aies/03-frontend/validation-shots/*.png`

---

## Build or URL tested

- dev server：`npm run dev -- -p 3100`（`http://localhost:3100`），Next.js 16，**MSW worker 启用**（dev 模式 `MswInit` 启动 worker，全站数据走 `MOCK_DATA_SPEC` 种子）。
- 选 dev 而非 prod：MSW 仅在 dev 启用（prod 包不含 worker），验证 MOCK 驱动的完整界面需 dev。
- 会话：`demoSession`（登录态 + 管理员角色），以便一次走通公开/私域/审核全站。

## Environment

- macOS / Node v22 / Playwright Chromium（headless）。
- 命令：`npx playwright test --project=chromium tests/e2e/validation.spec.ts`（`playwright.config.ts` 自动起 dev server）。
- 数据：合成 MOCK（无真实 PII），种子见 `src/mocks/fixtures/`。

## Journey checks（11 条，全过）

| # | 路径 | 验证点 | 截图 | 结果 |
| --- | --- | --- | --- | --- |
| 01 | `/` 发现/注册表（PAGE-002） | 外壳+Hero+筛选/排序+模块卡网格+平台统计；≥1 张模块卡 | 01-discovery | ✅ |
| 02 | `/modules/:id` 模块详情（PAGE-010） | 脱敏 Manifest（无 contact）+ 来源统计环形 + 隐私边界 + Contact Commitment 锁定占位（INV-03） | 02-module-detail | ✅ |
| 03 | `/exchanges` 交换记录（PAGE-030） | 公开台账（脱敏）渲染 | 03-exchanges | ✅ |
| 03b | `/exchanges/EX-2024-8842` 交换详情（PAGE-031） | 状态机时间线 + 双方卡 + 披露入口（按状态门控，INV-03） | 03b-exchange-detail | ✅ |
| 04 | `/trust` 信任网络（PAGE-043） | 可信贡献者索引（审核新增的导航着陆缺口已闭合） | 04-trust-network | ✅ |
| 04b | `/u/zyongzhu24` 信任档案（PAGE-040） | 信任分环/趋势/徽章/反馈质量，可解释（HARD-03） | 04b-trust-profile | ✅ |
| 05 | `/skills` Agent 技能（PAGE-050） | 技能网格 + 安装/来源 | 05-skills | ✅ |
| 06 | `/submit` 提交向导（PAGE-020~024） | 多步向导外壳（含隐私门步骤） | 06-submit | ✅ |
| 07 | `/me` 个人中心（PAGE-060） | 概览 StatBlock + 子导航 + 列表 | 07-me | ✅ |
| 07b | `/notifications` 通知中心（PAGE-062） | 筛选 Tab + 已读/未读流 | 07b-notifications | ✅ |
| 08 | `/settings/contact` 设置·联系方式（PAGE-063） | **默认私密（"私密" 可见 + 设为公开开关 OFF，INV-03/DEC-010）** + 披露策略 Callout + 同意记录 | 08-settings-contact | ✅ |
| 09 | `/admin` 审核控制台（PAGE-080，管理员） | 风险摘要 + 评审队列 + 审计 | 09-admin | ✅ |
| 10 | `/developers` 开放 API（PAGE-090） | 零泄露横幅 + 端点 + 示例 JSON（无 contact，ASM-055） | 10-developers | ✅ |
| 11 | `/about` 关于/平台统计（PAGE-100） | 开源 Hero + 平台聚合统计（无 PII，INV-09）+ FAQ | 11-about | ✅ |

每条均断言：AppShell 渲染（MSW 就绪）、未出现错误边界文案（"出错了"/"Application error"）。隐私不变量软断言：模块详情联系方式锁定、设置默认私密 —— 均通过。

## Accessibility observations

- 外壳/导航键盘可达，焦点态可见（主色环）；StatusPill/未读态以文字+图标承载（非仅颜色，NFR-007）——组件单测（292 例）已固化这些断言，浏览器层目视一致。
- 待加强：见下「缺陷」中列表行用 `onClick` 跳转（非 `<a>`）对键盘/可爬取的影响。

## Spec mismatches

- 无功能性偏离规格。所有路由与 `PAGE_SPEC` 的 route 一致；隐私/同意/无经济模型等不变量在界面层兑现。

## Defects found（均为非阻断小项，建议在发布前打磨）

1. **列表行经 `onClick(router.push)` 跳转、非 `<a href>`**（交换台账、信任网络贡献者）。功能与键盘（button+Enter）可用，但**不利于 SEO/可爬取/新标签打开**，与 NFR-002「agent 可读/公开可索引」张力。建议公开详情入口改为真实 `<Link>`。严重度：中。
2. **icon-map 缺映射**：`priority_high`、`smart_toy`（控制台 warn，回退占位字形）。补 `src/lib/icon-map.ts` 即可。严重度：低。
3. **Recharts 容器尺寸 0 警告**：个别图表在初始/未定尺寸容器渲染时报 width/height -1（关于页/信任档案）。需给图表容器显式 min 高或 aspect。严重度：低（视觉偶发）。
4. lint 残留 6 处非阻断 warning（WizardNav `step`、fixtures `ex` 未用、admin useMemo deps、2 处 ARIA role 提示）——见阶段 11 记录。严重度：低。

## Evidence links or logs

- 测试：`app/tests/e2e/validation.spec.ts`（11 用例，11 passed）。
- 截图：`aies/03-frontend/validation-shots/01-discovery.png` … `11-about.png`（14 张，含 03b/04b/07b）。
- 配套：阶段 11 实跑 `lint`(0 err) / `typecheck`(0) / `vitest`(292 passed) / `next build`(25 路由) 全绿。

## Disposition

- **核心路径全部通过**，隐私不变量在浏览器层验证落地。4 项缺陷均非阻断、已分级并定位修复点；建议「缺陷 1（详情入口改真链接）」在阶段 17 发布前修，缺陷 2/3/4 作打磨项。
- 进入阶段 13 后端规格前，issues 已 triage（gate-10 要求）。

## 质量门结果

```text
Gate: 10-frontend-validation-gate
Status: pass（用户 2026-06-23 已签字确认）
Evidence: app/tests/e2e/validation.spec.ts（11/11 通过）；aies/03-frontend/validation-shots/*.png（14 张）；dev server + MSW
Findings: 4 项非阻断缺陷（列表行 onClick 跳转/icon-map 缺映射/Recharts 尺寸警告/6 lint warning），已分级与定位
Decision: 核心路径与隐私不变量通过、issues 已 triage → 待用户确认 → 转 passed → 进入 13-backend-spec
```
