/*
  account 集群组件统一出口（COMP-150~157）。仅复用 @/components/shared，不重定义共享组件。
*/
export { DashboardOverview } from "./DashboardOverview"; // COMP-150
export { AccountSubNav } from "./AccountSubNav"; // COMP-151
export { MySectionList } from "./MySectionList"; // COMP-152
export { NotificationFeed } from "./NotificationFeed"; // COMP-153
export { NotificationItem } from "./NotificationItem"; // COMP-154
export { ContactMethodsForm } from "./ContactMethodsForm"; // COMP-155
export { DisclosurePolicyCallout } from "./DisclosurePolicyCallout"; // COMP-156
export { ConsentRecordList } from "./ConsentRecordList"; // COMP-157

// 页面级视图容器（取数 + 组合）
export { MeDashboardView } from "./MeDashboardView";
export { NotificationsView } from "./NotificationsView";
export { SettingsContactView } from "./SettingsContactView";
export { SettingsSectionView } from "./SettingsSectionView";

export type { AccountSubNavItem } from "./AccountSubNav";
export type { MeSection } from "./MySectionList";
