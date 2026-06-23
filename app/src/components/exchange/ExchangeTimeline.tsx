"use client";

import { Timeline, type TimelineItem } from "@/components/shared";
import type { ExchangeTimelineStep } from "@/lib/queries/exchange";

/*
  COMP-093 ExchangeTimeline（生命周期时间线）。
  组合共享 COMP-036 Timeline 基元；步骤名严格对齐 FLOW-003（ASM-087 折叠中间态）。
  异常态（拒绝/取消/过期/审核中）= terminated 步骤 + 中性说明（不泄私有原因 INV-01/FLOW-005）。
  绝不读取或展示交付物内容（INV-01）。
*/
export interface ExchangeTimelineProps {
  steps: ExchangeTimelineStep[];
}

export function ExchangeTimeline({ steps }: ExchangeTimelineProps) {
  const items: TimelineItem[] = steps.map((s) => ({
    key: s.key,
    title: s.label,
    description: [
      s.actorLogin ? `由 @${s.actorLogin} 发起` : null,
      s.note ?? null,
    ]
      .filter(Boolean)
      .join(" · "),
    timestamp: s.timestamp ?? "",
    relativeTime: s.timestamp,
    status:
      s.status === "completed"
        ? "completed"
        : s.status === "active"
          ? "active"
          : s.status === "terminated"
            ? "terminated"
            : "pending",
  }));

  return <Timeline items={items} />;
}
