"use client";

import { Icon } from "@/components/shared";

/*
  COMP-156 DisclosurePolicyCallout（披露策略说明，PAGE-063）。
  把 INV-03 / DEC-010 / ASM-013 在 UI 显式声明：默认私密 + 仅交换接受后对该次对方披露 +
  可选可编辑可撤回（撤回只影响未来）。纯展示，role=note。
*/
const DEFAULT_TEXT =
  "联系方式默认完全私密，仅在一次交换被接受后对该次对方披露，可选择披露哪些、可编辑或撤回；撤回只影响未来披露，已披露的快照无法收回。";

export interface DisclosurePolicyCalloutProps {
  text?: string;
}

export function DisclosurePolicyCallout({
  text = DEFAULT_TEXT,
}: DisclosurePolicyCalloutProps) {
  return (
    <div
      role="note"
      aria-label="联系方式披露策略"
      className="flex items-start gap-3 rounded-card border border-primary/20 bg-primary-subtle/40 p-4"
    >
      <Icon name="info" size={20} className="mt-0.5 text-primary" aria-hidden />
      <p className="text-sm font-medium leading-relaxed text-primary">{text}</p>
    </div>
  );
}
