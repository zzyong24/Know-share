"use client";

import { Card, Icon, TopicChip } from "@/components/shared";
import { ExchangeDirectionMarker } from "./ExchangeDirectionMarker";
import type { ExchangeModuleSummary } from "@/lib/queries/exchange";

/*
  交换内容摘要（PAGE-031 Data·目标模块 + 可选提供模块 + 中间方向标记）。
  仅公开元数据，无私有内容（INV-01/04）。单向交换时对等侧显示「未提供对等模块」（INV-05）。
  归 COMP-090~109 段（详情内容摘要子区，复用共享 Card/TopicChip + COMP-091）。
*/
export interface ExchangeContentSummaryProps {
  direction: "reciprocal" | "oneway";
  targetModule: ExchangeModuleSummary;
  offeredModule?: ExchangeModuleSummary;
}

function ModuleBlock({
  badge,
  module,
  accent,
}: {
  badge: string;
  module: ExchangeModuleSummary;
  accent?: boolean;
}) {
  return (
    <div className="space-y-2">
      <span
        className={
          accent
            ? "inline-block rounded bg-muted px-2 py-0.5 text-[11px] font-bold uppercase text-text-muted"
            : "inline-block rounded bg-primary-subtle px-2 py-0.5 text-[11px] font-bold uppercase text-primary"
        }
      >
        {badge}
      </span>
      <div className="rounded-control border border-border p-4">
        <h4 className="text-sm font-semibold text-text">{module.title}</h4>
        <p className="mt-1 line-clamp-2 text-xs text-text-muted">{module.summary}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {module.signal && (
            <span className="inline-flex items-center gap-1 text-[11px] text-text-subtle">
              <Icon name="verified" size={12} aria-hidden />
              {module.signal}
            </span>
          )}
          {module.topics.map((t) => (
            <TopicChip key={t} label={t} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ExchangeContentSummary({
  direction,
  targetModule,
  offeredModule,
}: ExchangeContentSummaryProps) {
  return (
    <Card
      header={<h3 className="text-base font-semibold text-text">交换内容摘要</h3>}
    >
      <div className="relative grid grid-cols-1 gap-6 md:grid-cols-2">
        <ModuleBlock badge="请求交换" module={targetModule} />
        {/* 中间方向连接标记（COMP-091，primary） */}
        <div
          className="pointer-events-none absolute inset-0 hidden items-center justify-center md:flex"
          aria-hidden
        >
          <span className="flex size-9 items-center justify-center rounded-full border border-border bg-surface shadow-sm">
            <ExchangeDirectionMarker direction={direction} size="md" tone="primary" />
          </span>
        </div>
        {offeredModule ? (
          <ModuleBlock badge="对等提供" module={offeredModule} accent />
        ) : (
          <div className="flex items-center justify-center rounded-control border border-dashed border-border p-4 text-xs text-text-subtle">
            未提供对等模块（单向请求）
          </div>
        )}
      </div>
    </Card>
  );
}
