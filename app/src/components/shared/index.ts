/*
  全站共享组件库统一出口（COMP-001~040）。
  各模块批次 2 从此 barrel 引用共享组件，不重复定义（FRONTEND_SPEC §6）。
*/

// 外壳与导航
export { AppShell } from "./app-shell"; // COMP-001
export { TopNav, DEFAULT_NAV_ITEMS } from "./top-nav"; // COMP-002
export { GlobalSearchBar } from "./global-search-bar"; // COMP-003
export { GitHubAuthButton } from "./github-auth-button"; // COMP-004
export { SubmitModuleCTA } from "./submit-module-cta"; // COMP-005
export { Footer } from "./footer"; // COMP-006

// 按钮
export { PrimaryButton } from "./primary-button"; // COMP-007
export { SecondaryButton } from "./secondary-button"; // COMP-008

// 卡片与内容
export { Card } from "./card"; // COMP-009
export { ModuleCard } from "./module-card"; // COMP-010

// 状态 / 标记
export {
  StatusPill,
  EXCHANGE_STATUS_META,
  PRIVACY_RESULT_META,
} from "./status-pill"; // COMP-011
export { TrustBadge } from "./trust-badge"; // COMP-012
export { IconChip } from "./icon-chip"; // COMP-013
export { TopicChip } from "./topic-chip"; // COMP-022
export { MethodPill } from "./method-pill"; // COMP-023

// 数据展示
export { StatBlock } from "./stat-block"; // COMP-014
export { DataTable } from "./data-table"; // COMP-015
export { ListRow } from "./list-row"; // COMP-016
export { LineChart } from "./line-chart"; // COMP-017
export { DonutChart } from "./donut-chart"; // COMP-018
export { CodeBlock } from "./code-block"; // COMP-024
export { Timeline } from "./timeline"; // COMP-036

// 流程 / 表单
export { Stepper } from "./stepper"; // COMP-019
export { ConsentGate } from "./consent-gate"; // COMP-020
export { FormField } from "./form-field"; // COMP-030
export { VisibilityToggle } from "./visibility-toggle"; // COMP-031
export { RatingInput } from "./rating-input"; // COMP-035

// 反馈 / 容器 / 交互
export { EmptyState } from "./empty-state"; // COMP-021
export { ConfirmDialog } from "./confirm-dialog"; // COMP-025
export { Drawer } from "./drawer"; // COMP-026
export { FilterTabs } from "./filter-tabs"; // COMP-027
export { FaqAccordion } from "./faq-accordion"; // COMP-028
export { notify } from "./toast"; // COMP-029
export { Pagination } from "./pagination"; // COMP-032
export { SkeletonBlock } from "./skeleton-block"; // COMP-033
export { Avatar } from "./avatar"; // COMP-034

// 公共基元
export { Icon } from "./icon";
export { Octocat } from "./octocat";

// 类型
export type { ColumnDef, RowAction } from "./data-table";
export type { HttpMethod } from "./method-pill";
export type { Step, StepStatus } from "./stepper";
export type { TimelineItem, TimelineStatus } from "./timeline";
export type { NavItem } from "./top-nav";
