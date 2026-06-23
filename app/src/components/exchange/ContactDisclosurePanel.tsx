"use client";

import { useState } from "react";
import {
  Card,
  ConfirmDialog,
  Icon,
  PrimaryButton,
  SecondaryButton,
  notify,
} from "@/components/shared";
import type {
  ExchangeContactInfo,
  ExchangeDisclosureSnapshot,
} from "@/lib/queries/exchange";
import type { ExchangeStatus } from "@/lib/types";

/*
  COMP-095 ContactDisclosurePanel（联系方式披露/撤回区）★核心。
  仅在 Accepted 及之后、且当前用户为该次参与方时可用（INV-03/DEC-010）。
  - 锁定态（< Accepted / 非参与方 / 未登录）：不渲染任何真实联系方式，仅占位说明。
  - 可披露态（Accepted+ 参与方未披露）：可多选方式 + 披露按钮 + 说明。
  - 已披露态：展示我已披露方式（含快照时间）+ 撤回 + 撤回不可收回语义；含对方快照。
  披露/撤回均二次确认（ConfirmDialog 同意门）；披露写 Consent。失败不产生部分快照。
*/
export interface ContactDisclosurePanelProps {
  exchangeStatus: ExchangeStatus;
  viewerRole: "requester" | "owner" | "spectator";
  isAuthenticated: boolean;
  myContacts: ExchangeContactInfo[];
  myDisclosure?: ExchangeDisclosureSnapshot;
  peerDisclosure?: ExchangeDisclosureSnapshot;
  onDisclose: (selectedTypes: ExchangeContactInfo["type"][]) => Promise<void> | void;
  onRevoke: () => Promise<void> | void;
}

const ACCEPTED_PLUS: ExchangeStatus[] = [
  "Accepted",
  "PrivatePreparing",
  "Delivered",
  "Completed",
  "WaitingForFeedback",
  "Closed",
];

export function ContactDisclosurePanel({
  exchangeStatus,
  viewerRole,
  isAuthenticated,
  myContacts,
  myDisclosure,
  peerDisclosure,
  onDisclose,
  onRevoke,
}: ContactDisclosurePanelProps) {
  const isParticipant = viewerRole === "requester" || viewerRole === "owner";
  const unlocked =
    isAuthenticated && isParticipant && ACCEPTED_PLUS.includes(exchangeStatus);

  const [selected, setSelected] = useState<Set<ExchangeContactInfo["type"]>>(
    new Set()
  );
  const [discloseOpen, setDiscloseOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── 锁定态：绝不渲染真实联系方式（INV-03）──────────────
  if (!unlocked) {
    return (
      <Card>
        <div className="flex items-start gap-2 text-sm text-text-muted">
          <Icon name="lock" size={16} aria-hidden className="mt-0.5 text-text-subtle" />
          <p>
            交换被接受后可披露联系方式。联系方式默认私密，仅在 Accepted 后对该次对方可见。
          </p>
        </div>
      </Card>
    );
  }

  const toggle = (type: ExchangeContactInfo["type"]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const confirmDisclose = async () => {
    setSubmitting(true);
    try {
      await onDisclose(Array.from(selected));
      setDiscloseOpen(false);
      setSelected(new Set());
      notify("已披露所选联系方式。", "success");
    } catch {
      // 失败不产生部分披露快照（后端事务保证）；提示重试。
      notify("披露失败，请重试。", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmRevoke = async () => {
    setSubmitting(true);
    try {
      await onRevoke();
      setRevokeOpen(false);
      notify("已停止未来披露。", "success");
    } catch {
      notify("撤回失败，请重试。", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      header={
        <h3 className="text-sm font-semibold text-text">联系方式披露</h3>
      }
    >
      {/* 对方已对我披露的快照（ENT-009） */}
      {peerDisclosure && peerDisclosure.contacts.length > 0 && (
        <div className="mb-3 rounded-control border border-border bg-muted/30 p-3">
          <p className="mb-1 text-xs font-semibold text-text">对方已向你披露</p>
          <ul className="space-y-0.5">
            {peerDisclosure.contacts.map((c) => (
              <li key={c.type} className="text-xs text-text-muted">
                {c.label}：<span className="font-mono">{c.value}</span>
              </li>
            ))}
          </ul>
          <time
            dateTime={peerDisclosure.disclosedAt}
            className="mt-1 block text-[11px] text-text-subtle"
          >
            披露于 {peerDisclosure.disclosedAt}
          </time>
        </div>
      )}

      {myDisclosure ? (
        // ── 已披露态 ──────────────────────────────────
        <div>
          <p className="mb-1 text-xs font-semibold text-text">你已披露</p>
          <ul className="mb-2 space-y-0.5">
            {myDisclosure.contacts.map((c) => (
              <li key={c.type} className="text-xs text-text-muted">
                {c.label}：<span className="font-mono">{c.value}</span>
              </li>
            ))}
          </ul>
          <p className="mb-3 text-[11px] text-text-subtle">
            撤回仅停止未来披露；已披露的快照对方仍可见，无法收回。
          </p>
          <SecondaryButton
            iconLeft="visibility_off"
            onClick={() => setRevokeOpen(true)}
            fullWidth
          >
            撤回披露
          </SecondaryButton>
        </div>
      ) : (
        // ── 可披露态 ──────────────────────────────────
        <div>
          <fieldset className="mb-3">
            <legend className="mb-1.5 text-xs font-semibold text-text">
              选择要披露的方式
            </legend>
            <div className="flex flex-col gap-1.5">
              {myContacts.map((c) => (
                <label
                  key={c.type}
                  className="flex items-center gap-2 text-sm text-text"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(c.type)}
                    onChange={() => toggle(c.type)}
                    className="size-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-primary"
                  />
                  <span>
                    {c.label}
                    <span className="ml-1 font-mono text-xs text-text-subtle">
                      {c.masked}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="mb-3 text-[11px] text-text-subtle">
            * 披露将允许对方查看你选择的 GitHub、邮箱或 IM 账号。
          </p>
          <PrimaryButton
            iconLeft="visibility"
            disabled={selected.size === 0}
            onClick={() => setDiscloseOpen(true)}
            fullWidth
          >
            披露联系方式
          </PrimaryButton>
        </div>
      )}

      {/* 披露二次确认（同意门，不可逆/隐私敏感） */}
      <ConfirmDialog
        open={discloseOpen}
        title="确认披露联系方式？"
        description="披露后对方将能查看你选择的联系方式。此动作记录同意，且已生成的披露快照无法收回。"
        confirmLabel="确认披露"
        tone="default"
        loading={submitting}
        onConfirm={confirmDisclose}
        onCancel={() => setDiscloseOpen(false)}
        onOpenChange={setDiscloseOpen}
      />
      {/* 撤回二次确认 */}
      <ConfirmDialog
        open={revokeOpen}
        title="确认撤回披露？"
        description="撤回仅停止未来披露；已披露给对方的快照对方仍可见，无法收回。"
        confirmLabel="确认撤回"
        tone="danger"
        loading={submitting}
        onConfirm={confirmRevoke}
        onCancel={() => setRevokeOpen(false)}
        onOpenChange={setRevokeOpen}
      />
    </Card>
  );
}
