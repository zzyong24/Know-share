# 前端规格（FRONTEND_SPEC）

## 摘要

本产物把已通过的页面规格（10 模块 `PAGE-001~105`）、信息架构（`IA-001~014`）与 UI 规则（`UI-001~004`）落成可实现的前端架构：技术栈、工程结构、路由、状态与数据获取约定、设计令牌→Tailwind 映射、图标策略、**全站共享组件库**（落地 `UI-003` 规范组件），以及各模块 `COMPONENTS_SPEC.md` 的 `COMP-*` ID 段分配与协作规则。模块特有组件由各模块 `aies/02-design/<模块>/COMPONENTS_SPEC.md` 定义；共享组件在此统一定义、各模块只引用不重复。

### 产物元数据

- Stage: `09-frontend-spec`
- Status: `passed（2026-06-23 用户签字）`
- Upstream IDs: `PAGE-001~105`、`IA-001~014`、`UI-001~004`、`FR-*`/`NFR-*`、`ENT-*`、`INV-*`
- Decision IDs: `DEC-006`（GitHub 身份）、`DEC-007`（无经济模型）、`DEC-011`（轻后端）、`DEC-012`（Material Symbols 规范图标族）、`DEC-014`（前端栈 Next.js+TS+Tailwind+shadcn/ui）
- 新增假设: `ASM-062`~`ASM-067`（见文末）
- 关联：阶段 10 `MOCK_DATA_SPEC.md`、阶段 15 `SERVICE_CONTRACT.md`、阶段 12 前端验证、`TEST_PLAN.md`

---

## 1. 技术栈（DEC-014）

| 层 | 选型 | 说明 |
| --- | --- | --- |
| 框架 | **Next.js（App Router）+ TypeScript** | 公开发现/注册表/档案/关于走 SSR/SSG 利于 SEO 与 agent 可读（`NFR-002`）；私域（个人中心/设置/审核）走客户端渲染 + 受保护路由 |
| 样式 | **Tailwind CSS** | 承载 `UI-001` 设计令牌（见 §4） |
| 组件底座 | **shadcn/ui**（Radix 之上、源码可拥有） | 落地 `UI-003` 规范组件与无障碍底线（`NFR-007`） |
| 图标 | 规范族 **Material Symbols Outlined**（`DEC-012`）；实现以 `lucide-react`（shadcn 默认）作 1:1 等价替换 | 维护 `docs/icon-map.md` 图标名映射；二者择一，全站单一族（见 §5） |
| 数据获取 | **TanStack Query**（服务端状态）+ fetch | 缓存/失效/乐观更新（如通知已读 `ASM-045`） |
| 表单 | **react-hook-form + zod** | 提交向导/设置/反馈的校验（`ASM-029` 同意门、字段校验） |
| 图表 | 轻量图表库（如 Recharts），主题对齐 `--color-accent` | 信任趋势折线、信任分环形（`UI-003` LineChart/DonutChart） |
| 测试 | 单元/组件 **Vitest + Testing Library**；E2E/浏览器验证 **Playwright**（阶段 12） | 见 §9 |

> 约束：所有选型服务于已批准范围，不得引入与 `DEC-007`（无经济模型）冲突的支付/计费类库。

## 2. 工程结构（仓库根 `app/`，阶段 11 Task Zero 建立）

```
app/
  app/                      # Next.js App Router（路由段对齐 PAGE_SPEC 的 route）
    (public)/               # 公开可匿名访问段（INV-04）
      page.tsx              # 发现/注册表 (PAGE-002, /)
      modules/[id]/         # 模块详情 (PAGE-010)
      exchanges/            # 交换记录 (PAGE-030) + [id] 详情 (PAGE-031)
      trust/                # 信任网络着陆 (PAGE-043) ; u/[login] 档案 (PAGE-040)
      skills/               # Agent 技能 (PAGE-050)
      developers/           # 开放 API 文档 (PAGE-090)
      about/                # 关于/仓库/统计 (PAGE-100)
    (auth)/                 # 需登录段（受保护）
      me/                   # 个人中心 (PAGE-060/061)
      notifications/        # 通知中心 (PAGE-062)
      settings/             # 设置 (PAGE-063/064)
      submit/               # 提交向导 (PAGE-020~024)
    (admin)/                # 仅管理员段
      admin/                # 审核控制台 (PAGE-080~085)
  components/
    ui/                     # shadcn/ui 基元（Button/Dialog/Tabs/...）
    shared/                 # 全站共享组件 COMP-001~040（见 §6）
    <module>/               # 模块特有组件（按 COMPONENTS_SPEC）
  lib/                      # api 客户端、query hooks、zod schema、工具
  styles/                   # tailwind 令牌、全局样式
  mocks/                    # MOCK 数据（阶段 10 MOCK_DATA_SPEC）
tests/                      # 单元/组件/E2E
```

路由命名严格对齐各 `PAGE_SPEC.md` 的 Route 字段（交叉审核已统一：`/me`、`/u/:login`、`/trust`、`/exchanges/:id`、`/settings/:section`、`/submit/*`、`/developers`、`/admin` 等）。

## 3. 路由 / 渲染 / 权限

- **公开段**（`(public)`）：SSR/SSG，匿名可看，零私有内容（`INV-04`）。
- **受保护段**（`(auth)`/`(admin)`）：GitHub 登录后可达（`DEC-006`/`NFR-005`）；中间件校验会话与角色；管理段需管理员角色（`FR-100`）。
- 联系方式/披露相关界面遵循 `INV-03`（默认私密、仅 Accepted 后披露）。
- 错误/空/加载态在每个路由段提供（`error.tsx`/`loading.tsx`/`not-found.tsx`），对齐各 PAGE 的 States 字段。

## 4. 设计令牌 → Tailwind 映射（落地 UI-001）

- 在 `tailwind.config` 的 `theme.extend.colors` 注册：`primary #017A6E`（+ `hover #016458`、`tint #E6F4F1`）、`accent #019997`、`bg #FBFCFD`、`surface #FFFFFF`、`border #E7EAEE`、`text/muted/subtle`、语义 `success #16A34A`/`warning #D97706`/`danger #DC2626`/`info #2563EB`。
- 圆角 `--radius`：card 12px、control 8px、pill full；阴影 `shadow-card`；字体 Inter（UI）+ JetBrains Mono（代码）；间距 4px 栅格。
- 与已生成 HTML 的 `tailwind.config` 命中一致（已验证）；色值若像素级核对调整（`ASM-015`）只改令牌一处。

## 5. 图标策略（DEC-012）

- **全站单一图标族**。规范参照 = Material Symbols Outlined；实现默认用 `lucide-react`（shadcn 生态）作 1:1 等价替换。
- 维护 `docs/icon-map.md`：Material 名 → Lucide 组件名（如 `search`→`Search`、`verified`→`BadgeCheck`、`check_circle`→`CheckCircle2`、`swap_horiz`→`ArrowLeftRight`、`hourglass_empty`→`Hourglass`）。
- `IconChip`（`UI-003`）= 着色圆角方块容器 + 单一族字形。GitHub Octocat 为唯一品牌例外（登录/身份）。
- 禁止混用第二图标族或 filled 变体（交叉审核硬项）。

## 6. 全站共享组件库（COMP-001~040，本规格拥有）

落地 `UI-003` 规范组件；各模块只**引用**这些 `COMP-*`，不得重复定义。模块特有组件见各模块 `COMPONENTS_SPEC.md`。每个共享组件的完整契约（props/events/states/a11y/data/tests）在 `aies/02-design/_shared/COMPONENTS_SPEC.md`（本阶段一并产出）逐一展开；下表为索引与边界。

| COMP | 组件 | 落地 | 主要使用 PAGE |
| --- | --- | --- | --- |
| `COMP-001` | `AppShell`（外壳布局） | UI-003 AppShell | 全部 |
| `COMP-002` | `TopNav`（主导航） | shadcn NavigationMenu | 全部 |
| `COMP-003` | `GlobalSearchBar` | shadcn Input + Command | IA-001 |
| `COMP-004` | `GitHubAuthButton`（登录态/Octocat） | shadcn Button | 全部 |
| `COMP-005` | `SubmitModuleCTA`（主色 CTA） | shadcn Button(primary) | 全部 |
| `COMP-006` | `Footer` | — | 全部 |
| `COMP-007` | `PrimaryButton` / `COMP-008` `SecondaryButton` | shadcn Button variants | 全站 |
| `COMP-009` | `Card` | shadcn Card | 全站 |
| `COMP-010` | `ModuleCard` | Card 组合 | 发现/详情/档案/个人中心 |
| `COMP-011` | `StatusPill`（语义药丸+文字） | shadcn Badge | 交换/隐私门/Verified |
| `COMP-012` | `TrustBadge` | Badge 组合 | 信任 |
| `COMP-013` | `IconChip`（着色方块+字形） | — | 技能/通知/统计 |
| `COMP-014` | `StatBlock`（大数字+标签+图标+趋势） | — | 发现/信任/统计/审核 |
| `COMP-015` | `DataTable`（紧凑、hover、表头关联） | shadcn Table + TanStack Table | 交换记录/审核 |
| `COMP-016` | `ListRow` | — | 列表/通知/审计 |
| `COMP-017` | `LineChart`（accent） / `COMP-018` `DonutChart`（主色分段） | Recharts | 信任/详情/统计 |
| `COMP-019` | `Stepper`（左侧竖向步骤） | — | 提交向导 |
| `COMP-020` | `ConsentGate`（pass/warn/block 三态） | — | 提交向导 |
| `COMP-021` | `EmptyState`（图标+说明+CTA） | — | 各空状态 |
| `COMP-022` | `TopicChip`（主题标签） | Badge | 发现/详情 |
| `COMP-023` | `MethodPill`（GET/POST 文字+色） | Badge | 开放 API |
| `COMP-024` | `CodeBlock`（等宽 + 复制） | — | 详情/提交/API |
| `COMP-025` | `ConfirmDialog`（破坏性二次确认） | shadcn AlertDialog | 审核/设置/披露 |
| `COMP-026` | `Drawer`（抽屉/子 surface） | shadcn Sheet | 信任解释/审核详情/技能详情 |
| `COMP-027` | `Tabs`（筛选 Tab） | shadcn Tabs | 通知/设置/API |
| `COMP-028` | `Accordion`（FAQ） | shadcn Accordion | 关于 |
| `COMP-029` | `Toast`（保存成功等） | shadcn Sonner | 设置/各写动作 |
| `COMP-030` | `FormField`（label 关联+错误） | rhf + shadcn Form | 设置/反馈/提交 |
| `COMP-031` | `VisibilityToggle`（私密/公开+状态文字） | shadcn Switch | 设置·联系方式 |
| `COMP-032` | `Pagination` / `LoadMore` | — | 列表/通知 |
| `COMP-033` | `Skeleton`（加载占位） | shadcn Skeleton | 全站加载态 |
| `COMP-034` | `Avatar`（GitHub 头像） | shadcn Avatar | 全站 |
| `COMP-035` | `RatingInput`（结构化反馈维度） | — | 反馈 |
| `COMP-036` | `Timeline`（通用竖向时间线基元） | — | 交换详情（模块特化见 exchange） |
| `COMP-037`~`COMP-040` | 预留（分页器变体/筛选条/通知项基元等，按需） | — | — |

## 7. 各模块 COMPONENTS_SPEC 的 COMP-* ID 段分配（防并行碰撞）

| 模块 | COMPONENTS_SPEC 路径 | COMP 段（模块特有） |
| --- | --- | --- |
| 共享（本规格 + `_shared`） | `aies/02-design/_shared/COMPONENTS_SPEC.md` | `COMP-001~040` |
| shell-discovery | `aies/02-design/shell-discovery/COMPONENTS_SPEC.md` | `COMP-041~049` |
| module-detail | `aies/02-design/module-detail/COMPONENTS_SPEC.md` | `COMP-050~069` |
| submission | `aies/02-design/submission/COMPONENTS_SPEC.md` | `COMP-070~089` |
| exchange | `aies/02-design/exchange/COMPONENTS_SPEC.md` | `COMP-090~109` |
| trust-feedback | `aies/02-design/trust-feedback/COMPONENTS_SPEC.md` | `COMP-110~129` |
| agent-skills | `aies/02-design/agent-skills/COMPONENTS_SPEC.md` | `COMP-130~149` |
| account | `aies/02-design/account/COMPONENTS_SPEC.md` | `COMP-150~169` |
| admin | `aies/02-design/admin/COMPONENTS_SPEC.md` | `COMP-170~189` |
| open-api | `aies/02-design/open-api/COMPONENTS_SPEC.md` | `COMP-190~209` |
| about | `aies/02-design/about/COMPONENTS_SPEC.md` | `COMP-210~229` |

规则：模块特有组件用本模块段编号；引用共享组件直接写 `COMP-001` 等，不重定义。

## 8. 状态 / 数据获取约定

- 服务端状态走 TanStack Query：每模块在 `lib/queries/<module>.ts` 定义 query/mutation hooks，key 规范化；写动作（交换、反馈、披露、审核处置、设置）走 mutation + 失效相关 query。
- 客户端 UI 状态（抽屉开合、向导步进、筛选）就近用组件/`useState`/URL searchParams（深链，`ASM-027`/`ASM-036`/`ASM-043`）。
- 全部数据获取先对接 MOCK（阶段 10 `MOCK_DATA_SPEC`），再在阶段 15 服务契约就绪后切真实 API；接口形状以 `SERVICE_CONTRACT` 为准（本阶段不固化后端契约）。
- 零私有内容守卫（`INV-01/04`）：前端按字段白名单渲染公开数据，异常含敏感字段则丢弃并告警。

## 9. 测试策略（更新 TEST_PLAN）

- 组件单测（Vitest + Testing Library）：每个共享组件与关键模块组件覆盖 states + a11y（角色/标签/键盘）；隐私门 block 不可继续、披露仅 Accepted 后可见等不变量写成断言。
- 页面级集成：路由渲染 + 空/加载/错误态。
- E2E/浏览器（Playwright，阶段 12）：核心路径 发现→详情→请求交换→（接受后）披露→反馈；提交向导隐私门；管理审核处置。
- 无障碍底线（`NFR-007`）：对比度、键盘可达、状态非仅颜色、aria 标签——纳入组件测试与 12 阶段验证。

## 10. 无障碍 / 响应式

- 无障碍底线见 UI_RULES `NFR-007`：对比度≥4.5:1、焦点可见、状态文字化、表单 label 关联、图表文字摘要。
- 响应式（`ASM-016`）：桌面优先；`<768/768-1279/≥1280` 三断点；两栏在窄屏折叠为 Tab/抽屉/单列；`DataTable` 窄屏转卡片行。

## 11. 未决假设（见文末表）

`ASM-062`~`ASM-067`，均为前端实现取向、非阻塞，登记待确认。

---

## 本阶段新增假设（未写入 DEFAULT_ASSUMPTIONS.md，待编排者登记）

| ID | 假设 | 风险 | 确认 |
| --- | --- | --- | --- |
| `ASM-062` | 公开段用 Next.js SSR/SSG、私域段客户端渲染 + 受保护路由 | 若全站要 SSR 或全 SPA，结构需调 | 前端实现确认 |
| `ASM-063` | 服务端状态用 TanStack Query；表单用 react-hook-form + zod | 团队若偏好别的库需替换 | 前端实现确认 |
| `ASM-064` | 图表库用 Recharts（主题对齐 accent） | 若需更强图表能力可换 | 前端实现确认 |
| `ASM-065` | 共享组件库 COMP-001~040 由 `_shared/COMPONENTS_SPEC.md` 拥有，模块只引用 | 若团队偏好组件就近各模块，需调归属 | 组件规格确认 |
| `ASM-066` | 实现图标库用 lucide-react（Material Symbols 的 1:1 替换），维护 icon-map | 若坚持 Material Symbols 字体，改用 symbol 组件 | 前端实现确认 |
| `ASM-067` | 数据先对接 MOCK，接口形状最终以阶段 15 SERVICE_CONTRACT 为准 | 契约与 MOCK 不一致需回填 query hooks | 服务契约阶段 |

## 质量门结果

```text
Gate: 07-frontend-spec-gate
Status: pending（待组件规格扇出 + 交叉审核 + 用户确认）
Evidence: aies/03-frontend/FRONTEND_SPEC.md 对照 PAGE-001~105、IA_SPEC、UI_RULES、PRODUCT_SPEC；DEC-014 栈决策
Findings（当前）:
  - 架构/路由/状态/数据获取/测试策略可执行且追溯页面规格。✅
  - 设计令牌→Tailwind、图标策略（DEC-012）落地路径明确。✅
  - 共享组件库 COMP-001~040 与各模块 COMP 段已分配、防并行碰撞。✅
  - 待办：扇出 10 模块 COMPONENTS_SPEC + 共享 _shared/COMPONENTS_SPEC → 跑 spec 交叉审核 → 登记 COMP-* → 用户确认栈与组件边界。
Decision: 待组件规格产出并交叉审核、用户确认栈与组件边界 → passed → 进入 10-mock-data-spec
```
