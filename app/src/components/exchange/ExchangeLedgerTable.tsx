"use client";

import {
  Avatar,
  DataTable,
  StatusPill,
  TopicChip,
  TrustBadge,
  EXCHANGE_STATUS_META,
  type ColumnDef,
} from "@/components/shared";
import { ExchangeDirectionMarker } from "./ExchangeDirectionMarker";
import type { ExchangeLedgerRow } from "@/lib/queries/exchange";
import type { ReactNode } from "react";

/*
  COMP-090 ExchangeLedgerTable（公开脱敏台账表）。
  每行 = 一次 Exchange 脱敏投影（ENT-007）；不承载内容（INV-01），仅消费脱敏字段。
  组合 DataTable + ListRow 语义 + StatusPill + DirectionMarker + Avatar + TopicChip + TrustBadge。
  状态名严格映射 FLOW-003（经 EXCHANGE_STATUS_META）。窄屏转卡片行（responsive）。
*/
export interface ExchangeLedgerTableProps {
  rows: ExchangeLedgerRow[];
  isLoading?: boolean;
  emptyState?: ReactNode;
  onRowClick: (exchangeId: string) => void;
  onPartyClick?: (login: string) => void;
  onTopicClick?: (topic: string) => void;
}

function statusPill(status: ExchangeLedgerRow["status"]) {
  const meta = EXCHANGE_STATUS_META[status] ?? {
    tone: "neutral" as const,
    label: status,
  };
  return <StatusPill tone={meta.tone} label={meta.label} icon={meta.icon} size="sm" />;
}

function partyCell(
  party: ExchangeLedgerRow["requester"],
  onPartyClick?: (login: string) => void
) {
  return (
    <span
      className="inline-flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <Avatar
        login={party.login}
        src={party.avatarUrl}
        size="xs"
        verified={party.verified}
        onClick={onPartyClick ? () => onPartyClick(party.login) : undefined}
      />
      <span className="truncate text-sm text-text">@{party.login}</span>
    </span>
  );
}

export function ExchangeLedgerTable({
  rows,
  isLoading = false,
  emptyState,
  onRowClick,
  onPartyClick,
  onTopicClick,
}: ExchangeLedgerTableProps) {
  const columns: ColumnDef<ExchangeLedgerRow>[] = [
    {
      id: "exchangeId",
      header: "交换号",
      cell: (r) => (
        <span className="font-mono text-xs text-text-muted">#{r.exchangeId}</span>
      ),
    },
    {
      id: "parties",
      header: "双方",
      cell: (r) => (
        <div className="flex items-center gap-2">
          {partyCell(r.requester, onPartyClick)}
          <ExchangeDirectionMarker direction={r.direction} />
          {partyCell(r.target, onPartyClick)}
        </div>
      ),
    },
    {
      id: "module",
      header: "目标模块",
      cell: (r) => (
        <div className="min-w-0">
          <span className="block truncate text-sm font-medium text-text">
            {r.targetModuleName}
          </span>
          {r.offeredModuleName && (
            <span className="block truncate text-xs text-text-subtle">
              对等：{r.offeredModuleName}
            </span>
          )}
          <div
            className="mt-1 flex flex-wrap gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {r.topics.map((t) => (
              <TopicChip
                key={t}
                label={t}
                onClick={onTopicClick ? () => onTopicClick(t) : undefined}
              />
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "trust",
      header: "信任",
      cell: (r) => <TrustBadge level={r.target.trustLevel} size="sm" />,
    },
    {
      id: "status",
      header: "状态",
      cell: (r) => statusPill(r.status),
    },
    {
      id: "updatedAt",
      header: "更新",
      cell: (r) => (
        <time dateTime={r.updatedAt} title={r.updatedAt} className="text-xs text-text-subtle">
          {r.updatedAt}
        </time>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(r) => r.exchangeId}
      onRowClick={(r) => onRowClick(r.exchangeId)}
      loading={isLoading}
      emptyState={emptyState}
      density="compact"
      caption="公开交换记录（脱敏台账）"
    />
  );
}
