"use client";

import { Avatar, Card, TrustBadge } from "@/components/shared";
import type { ExchangePartyDetail } from "@/lib/queries/exchange";

/*
  COMP-094 ExchangePartyCard（双方身份/信任卡）。
  组合 Card + Avatar + TrustBadge；信任为只读轻量信号，详细解释留信任档案（ASM-035）。
  仅公开身份字段（ENT-001/DEC-006）+ 派生信任 + 公开成功交换次数；不含联系方式（INV-03）。
*/
export interface ExchangePartyCardProps {
  requester: ExchangePartyDetail;
  target: ExchangePartyDetail;
  onPartyClick?: (login: string) => void;
}

const ROLE_LABEL: Record<ExchangePartyDetail["role"], string> = {
  requester: "请求发起方",
  owner: "模块拥有者",
};

function PartyRow({
  party,
  onPartyClick,
}: {
  party: ExchangePartyDetail;
  onPartyClick?: (login: string) => void;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Avatar
        login={party.login}
        src={party.avatarUrl}
        size="md"
        verified={party.verified}
        onClick={onPartyClick ? () => onPartyClick(party.login) : undefined}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPartyClick ? () => onPartyClick(party.login) : undefined}
            aria-label={`查看 @${party.login}（${ROLE_LABEL[party.role]}）的信任档案`}
            className="truncate text-sm font-semibold text-text hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded"
          >
            @{party.login}
          </button>
          <span className="rounded-pill bg-muted px-1.5 text-[11px] text-text-muted">
            {ROLE_LABEL[party.role]}
          </span>
        </div>
        <div className="mt-1">
          <TrustBadge level={party.trustLevel} size="sm" />
        </div>
        <p className="mt-1 text-xs text-text-subtle">
          公开成功交换 {party.successfulExchanges} 次
        </p>
      </div>
    </div>
  );
}

export function ExchangePartyCard({
  requester,
  target,
  onPartyClick,
}: ExchangePartyCardProps) {
  return (
    <Card
      header={
        <h3 className="text-xs font-bold tracking-widest text-text-subtle uppercase">
          交换参与方
        </h3>
      }
    >
      <div className="divide-y divide-border">
        <PartyRow party={requester} onPartyClick={onPartyClick} />
        <PartyRow party={target} onPartyClick={onPartyClick} />
      </div>
    </Card>
  );
}
