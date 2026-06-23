"use client";

import { ListRow } from "@/components/shared/list-row";
import { StatusPill, EXCHANGE_STATUS_META } from "@/components/shared/status-pill";
import { Icon } from "@/components/shared/icon";
import { stripSensitiveFields } from "@/lib/api";
import type { ExchangeResult, Tone } from "@/lib/types";

/*
  COMP-049 ExchangeResultRow（交换记录搜索结果行）。PAGE-003。
  基于共享 COMP-016 ListRow + COMP-011 StatusPill。
  仅 ENT-007 脱敏台账（方向/状态/时间/目标模块标题）；不含私有通道内容/私有 URL（INV-04）。
  状态/方向非仅颜色（图标 + 文字）。点击 → 交换台账/详情（IA-005/IA-006）。
*/
const DIRECTION_META: Record<
  ExchangeResult["direction"],
  { icon: string; label: string }
> = {
  incoming: { icon: "south_west", label: "收到" },
  outgoing: { icon: "north_east", label: "发起" },
  mutual: { icon: "swap_horiz", label: "互惠" },
};

const FALLBACK_STATUS = { tone: "neutral" as Tone, label: "未知状态" };

export interface ExchangeResultRowProps {
  exchange: ExchangeResult;
  onActivate?: (id: string) => void;
}

export function ExchangeResultRow({ exchange, onActivate }: ExchangeResultRowProps) {
  // 二次防线：剥离异常私有字段（INV-04 / ASM-076）。
  const safe = stripSensitiveFields(
    exchange as unknown as Record<string, unknown>,
    "ExchangeResultRow"
  ) as unknown as ExchangeResult;

  const dir = DIRECTION_META[safe.direction];
  const status = EXCHANGE_STATUS_META[safe.status] ?? FALLBACK_STATUS;

  return (
    <ListRow
      leading={
        <span className="inline-flex items-center gap-1 text-xs text-text-muted">
          <Icon name={dir.icon} size={16} aria-hidden />
          <span>{dir.label}</span>
        </span>
      }
      title={safe.targetModuleTitle ?? safe.id}
      href={`/exchanges/${safe.id}`}
      onClick={onActivate ? () => onActivate(safe.id) : undefined}
      datetime={safe.updatedAt}
      relativeTime={new Date(safe.updatedAt).toLocaleDateString("zh-CN")}
      meta={<StatusPill tone={status.tone} label={status.label} icon={status.icon} size="sm" />}
    />
  );
}
