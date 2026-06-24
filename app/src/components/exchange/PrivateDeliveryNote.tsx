"use client";

import { Card, Icon, PrimaryButton, SecondaryButton, notify } from "@/components/shared";
import type { ExchangeDeliveryChannel } from "@/lib/queries/exchange";

/*
  COMP-096 PrivateDeliveryNote（私下交付通道提示）。
  提示约定的平台外私有交付通道（默认 GitHub 私有仓库邀请 ASM-007）+ 交付指引。
  通道仅为状态/约定文案，绝不含真实私有仓库 URL/邀请链接（INV-04）。
  「在线沟通(IM)」仅对方已披露 IM 类联系方式后启用，平台不内置 IM（ASM-033/INV-01）。
*/
export interface PrivateDeliveryNoteProps {
  channel: ExchangeDeliveryChannel;
  channelLabel: string;
  deliveryHint: string;
  /** Accepted 态：参与方可「开始私下准备」（Accepted→PrivatePreparing）。 */
  canStartPreparing?: boolean;
  canMarkDelivered: boolean;
  imButtonEnabled: boolean;
  onStartPreparing?: () => void;
  onMarkDelivered: () => void;
  onOpenIm: () => void;
}

export function PrivateDeliveryNote({
  channelLabel,
  deliveryHint,
  canStartPreparing = false,
  canMarkDelivered,
  imButtonEnabled,
  onStartPreparing,
  onMarkDelivered,
  onOpenIm,
}: PrivateDeliveryNoteProps) {
  return (
    <Card>
      <div className="rounded-control border border-primary/20 bg-primary-subtle/30 p-4">
        <div className="mb-1 flex items-center gap-2">
          <Icon name="info" size={16} aria-hidden className="text-primary" />
          <h4 className="text-sm font-semibold text-primary">私下交付协议</h4>
        </div>
        <p className="text-xs text-text-muted">
          该交换已约定通过{" "}
          <span className="rounded border border-primary/10 bg-surface px-1 py-0.5 font-mono">
            {channelLabel}
          </span>{" "}
          方式进行。{deliveryHint}
        </p>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {canStartPreparing && (
          <PrimaryButton iconLeft="play_arrow" onClick={onStartPreparing} fullWidth>
            开始私下准备
          </PrimaryButton>
        )}
        {canMarkDelivered && (
          <PrimaryButton iconLeft="check_circle" onClick={onMarkDelivered} fullWidth>
            标记为已交付
          </PrimaryButton>
        )}
        <SecondaryButton
          iconLeft="forum"
          disabled={!imButtonEnabled}
          aria-disabled={!imButtonEnabled}
          onClick={
            imButtonEnabled
              ? onOpenIm
              : () => notify("对方尚未披露 IM 账号，无法在线沟通。", "info")
          }
          fullWidth
        >
          在线沟通 (IM)
        </SecondaryButton>
        {!imButtonEnabled && (
          <p className="text-[11px] text-text-subtle">
            「在线沟通」需对方先披露 IM 类联系方式；平台不内置即时通讯。
          </p>
        )}
      </div>
    </Card>
  );
}
