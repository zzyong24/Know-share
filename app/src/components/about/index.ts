/*
  关于模块组件出口（COMP-210~214）。整页编排由 AboutView 承担（PAGE-100）。
*/
export { AboutHero } from "./AboutHero"; // COMP-210
export { PlatformStatsSection } from "./PlatformStatsSection"; // COMP-211
export {
  PrivacyTrustCards,
  DEFAULT_PRIVACY_TRUST_CARDS,
} from "./PrivacyTrustCards"; // COMP-212
export { AboutFaq, DEFAULT_FAQ_ITEMS } from "./AboutFaq"; // COMP-213
export { AuditLinkRow, DEFAULT_AUDIT_LINKS } from "./AuditLinkRow"; // COMP-214
export { AboutView } from "./AboutView";

export type { AboutHeroProps } from "./AboutHero";
export type { PlatformStatsSectionProps } from "./PlatformStatsSection";
export type {
  PrivacyTrustCardsProps,
  PrivacyTrustCardItem,
} from "./PrivacyTrustCards";
export type { AboutFaqProps, AboutFaqItem } from "./AboutFaq";
export type { AuditLinkRowProps, AuditLink } from "./AuditLinkRow";
