"use client";

import { IconChip } from "@/components/shared";
import { Icon } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { PrivacyFlowStep } from "@/lib/queries/agent-skills";

/*
  COMP-136 LocalPrivacyFlow（本地优先隐私流程条）。
  展示性横向流程（非共享 Stepper 向导态，ASM-094）：6 步 IconChip + 序号 + 标签。
  传达原始内容不离机、只交换 manifest（NFR-001 / INV-01 / FLOW-001）。
  窄屏折叠为竖向堆叠（ASM-016）。无任何交互/执行动作（PAGE-050 边界）。
*/
export interface LocalPrivacyFlowProps {
  steps: PrivacyFlowStep[];
}

export function LocalPrivacyFlow({ steps }: LocalPrivacyFlowProps) {
  return (
    <ol
      role="list"
      className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-stretch"
    >
      {steps.map((step, i) => (
        <li
          key={step.id}
          className="flex items-center gap-2 md:flex-1 md:flex-col md:gap-2 md:text-center"
        >
          <span className="flex items-center gap-2 md:flex-col">
            <IconChip icon={step.glyph} tone="primary" size="md" />
            <span className="flex items-center gap-1">
              <span className="text-xs font-semibold tabular-nums text-text-muted">
                {i + 1}
              </span>
              <span className="text-sm text-text">{step.label}</span>
            </span>
          </span>
          {i < steps.length - 1 && (
            <Icon
              name="chevron_right"
              size={16}
              className={cn("text-text-muted", "hidden md:block")}
              aria-hidden
            />
          )}
        </li>
      ))}
    </ol>
  );
}
