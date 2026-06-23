"use client";

import { IconChip } from "@/components/shared";

/*
  COMP-119 WeightDisclosureNote（权重声明文案块）。
  显式陈述「实际交换参与方的结构化反馈，权重高于社交信号」（INV-10）。
  强约束：不可被配置隐藏/置空（无任何 hide prop）——三处复用单一真源，防文案漂移。
  在 COMP-114（profile）/ COMP-111（explanation）/ COMP-116（feedback-form）三处出现。
*/
export type WeightDisclosureContext = "profile" | "explanation" | "feedback-form";

const TEXT: Record<WeightDisclosureContext, string> = {
  profile: "以下反馈来自实际交换参与方，权重高于收藏 / 认可等社交信号。",
  explanation:
    "实际交换参与方的结构化反馈，对信任分的影响高于收藏 / 认可等社交信号。",
  "feedback-form":
    "你的反馈作为交换参与方，对对方信任分的影响高于普通社交信号。",
};

export interface WeightDisclosureNoteProps {
  context: WeightDisclosureContext;
  /** 仅 explanation 上下文使用：公开评分规则链接（NFR-004） */
  rulesLink?: string;
  onRulesLinkClick?: () => void;
}

export function WeightDisclosureNote({
  context,
  rulesLink,
  onRulesLinkClick,
}: WeightDisclosureNoteProps) {
  return (
    <p
      data-testid="weight-disclosure"
      className="flex items-start gap-2 rounded-control bg-info/5 p-2.5 text-xs text-text-muted"
    >
      <IconChip icon="info" tone="info" size="sm" />
      <span>
        {TEXT[context]}
        {context === "explanation" && rulesLink && (
          <>
            {" "}
            <a
              href={rulesLink}
              onClick={onRulesLinkClick}
              className="font-medium text-primary underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              了解评分规则
            </a>
          </>
        )}
      </span>
    </p>
  );
}
