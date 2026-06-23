/*
  shell-discovery 模块特有组件出口（COMP-041~049）。
  发现页 / 搜索结果面的编排/控制类组件；卡片/统计/标签等基元复用 @/components/shared。
*/
export { DiscoveryHero } from "./DiscoveryHero"; // COMP-041
export { DiscoveryFilters } from "./DiscoveryFilters"; // COMP-042
export { SortControl } from "./SortControl"; // COMP-043
export { TopicChipRow } from "./TopicChipRow"; // COMP-044
export { PlatformStatsStrip } from "./PlatformStatsStrip"; // COMP-045
export { SearchScopeTabs } from "./SearchScopeTabs"; // COMP-046
export { SearchResultGroup } from "./SearchResultGroup"; // COMP-047
export { UserResultRow } from "./UserResultRow"; // COMP-048
export { ExchangeResultRow } from "./ExchangeResultRow"; // COMP-049

export type { DiscoveryHeroProps } from "./DiscoveryHero";
export type { DiscoveryFiltersProps } from "./DiscoveryFilters";
export type { SortControlProps } from "./SortControl";
export type { TopicChipRowProps } from "./TopicChipRow";
export type {
  PlatformStatsStripProps,
  PlatformStats,
  StatsNote,
} from "./PlatformStatsStrip";
export type { SearchScopeTabsProps } from "./SearchScopeTabs";
export type { SearchResultGroupProps } from "./SearchResultGroup";
export type { UserResultRowProps } from "./UserResultRow";
export type { ExchangeResultRowProps } from "./ExchangeResultRow";
