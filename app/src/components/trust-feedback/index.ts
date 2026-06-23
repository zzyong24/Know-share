/*
  trust-feedback 模块组件出口（COMP-110~119 + 页面视图）。
  跨模块复用入口：COMP-116 FeedbackForm 为全站结构化反馈表单单一真源，
  exchange 模块从此 barrel 引用：import { FeedbackForm } from "@/components/trust-feedback";
*/
export { TrustScoreRing } from "./TrustScoreRing"; // COMP-110
export { TrustBreakdown } from "./TrustBreakdown"; // COMP-111
export { ReputationTrend } from "./ReputationTrend"; // COMP-112
export { BadgeWall } from "./BadgeWall"; // COMP-113
export { FeedbackQualityPanel } from "./FeedbackQualityPanel"; // COMP-114
export { TrustNetworkIndex } from "./TrustNetworkIndex"; // COMP-115
export {
  FeedbackForm, // COMP-116（单一真源；exchange 嵌入）
  FEEDBACK_DIMENSIONS,
  detectSensitive,
} from "./FeedbackForm";
export type {
  FeedbackFormProps,
  FeedbackFormPayload,
  FeedbackSubmissionState,
} from "./FeedbackForm";
export { TrustProfileHeader } from "./TrustProfileHeader"; // COMP-117
export { TrustExplanationLink } from "./TrustExplanationLink"; // COMP-118
export { WeightDisclosureNote } from "./WeightDisclosureNote"; // COMP-119

// 页面视图
export { TrustProfileView } from "./TrustProfileView"; // PAGE-040/041
export { TrustNetworkView } from "./TrustNetworkView"; // PAGE-043
export { FeedbackSurface } from "./FeedbackSurface"; // PAGE-042（exchange 嵌入）
export type { FeedbackSurfaceProps } from "./FeedbackSurface";
