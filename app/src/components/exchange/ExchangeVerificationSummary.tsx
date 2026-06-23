"use client";

import { Card, StatusPill } from "@/components/shared";
import type { ExchangeVerificationItem } from "@/lib/queries/exchange";
import type { Tone } from "@/lib/types";

/*
  COMP-098 ExchangeVerificationSummary（可公开验证摘要）。
  组合 Card + StatusPill。只引用身份/所有权/状态信号（ASM-034），
  绝不读取或展示交付物内容（INV-01）；交付物完整性在交付前为状态占位。
*/
export interface ExchangeVerificationSummaryProps {
  items: ExchangeVerificationItem[];
}

const STATUS_META: Record<
  ExchangeVerificationItem["status"],
  { tone: Tone; label: string; icon: string }
> = {
  verified: { tone: "success", label: "已核实", icon: "check_circle" },
  pending: { tone: "neutral", label: "待交付", icon: "hourglass_empty" },
  na: { tone: "neutral", label: "不适用", icon: "trending_flat" },
};

export function ExchangeVerificationSummary({
  items,
}: ExchangeVerificationSummaryProps) {
  return (
    <Card
      header={
        <h3 className="flex items-center gap-2 text-base font-semibold text-text">
          自动验证状态
          <span className="text-xs font-normal text-text-muted">
            由 Know-share 协议自动执行
          </span>
        </h3>
      }
    >
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {items.map((it) => {
          const meta = STATUS_META[it.status];
          return (
            <li
              key={it.key}
              className="rounded-control border border-border bg-muted/30 p-3"
            >
              <div className="mb-1 flex items-center gap-2">
                <StatusPill tone={meta.tone} label={meta.label} icon={meta.icon} size="sm" />
                <span className="text-xs font-semibold text-text">{it.label}</span>
              </div>
              {it.note && <p className="text-[11px] text-text-muted">{it.note}</p>}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
