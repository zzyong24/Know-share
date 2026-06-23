"use client";

/*
  COMP-055 TrustSignalAside（信任信号与贡献者侧栏，PAGE-014）。
  GitHub 身份卡（Avatar + Verified StatusPill + Octocat）+ 信任级别（TrustBadge）+「信任如何形成」可展开解释 +
  社交计数（权重低于参与方反馈，视觉次要 INV-10）+ 跳档案链接。
  无信任历史显引导文案而非 0；Verified=false 不渲染 Verified 徽。
*/
import { useState } from "react";
import {
  Card,
  Avatar,
  StatusPill,
  TrustBadge,
  SecondaryButton,
  Octocat,
  Icon,
} from "@/components/shared";
import type { TrustLevel, TrustBadgeItem } from "@/lib/types";

export interface TrustSignalAsideProps {
  owner: {
    handle: string;
    githubVerified: boolean;
    avatarUrl: string;
    joinedAt: string;
    creditScore: number;
    badges: TrustBadgeItem[];
  };
  trustLevel: TrustLevel;
  trustExplanation: string;
  socialCounts: { favorites: number; endorsements: number };
  hasTrustHistory?: boolean;
  onOpenProfile?: () => void;
}

export function TrustSignalAside({
  owner,
  trustLevel,
  trustExplanation,
  socialCounts,
  hasTrustHistory = true,
  onOpenProfile,
}: TrustSignalAsideProps) {
  const [explainerOpen, setExplainerOpen] = useState(false);

  return (
    <Card
      header={
        <h2 className="text-base font-semibold text-text">贡献者与信任</h2>
      }
    >
      <div className="flex flex-col gap-4">
        {/* GitHub 身份卡 */}
        <div className="flex items-center gap-3">
          <Avatar
            src={owner.avatarUrl}
            login={owner.handle}
            size="lg"
            verified={owner.githubVerified}
            onClick={onOpenProfile}
          />
          <div className="flex flex-col gap-1">
            <span className="font-medium text-text">@{owner.handle}</span>
            {owner.githubVerified && (
              <span className="inline-flex items-center gap-1.5">
                <StatusPill
                  tone="success"
                  label="GitHub Verified"
                  icon="verified"
                  size="sm"
                />
                <Octocat className="text-text-muted" />
              </span>
            )}
            <span className="text-xs text-text-muted">
              加入于 {owner.joinedAt}
            </span>
          </div>
        </div>

        {/* 信任级别（视觉权重高于社交信号 INV-10） */}
        <div className="flex flex-col gap-2">
          {hasTrustHistory ? (
            <TrustBadge
              level={trustLevel}
              score={owner.creditScore}
              showScore
              badges={owner.badges}
              onExplain={() => setExplainerOpen((o) => !o)}
            />
          ) : (
            <p className="text-sm text-text-muted">
              信任随交换积累；该贡献者暂无交换历史。
            </p>
          )}

          <button
            type="button"
            aria-expanded={explainerOpen}
            onClick={() => setExplainerOpen((o) => !o)}
            className="inline-flex w-fit items-center gap-1 text-xs text-text-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded"
          >
            <Icon
              name={explainerOpen ? "expand_less" : "expand_more"}
              size={14}
              aria-hidden
            />
            信任如何形成
          </button>
          {explainerOpen && (
            <p className="rounded-control bg-muted p-3 text-sm text-text-muted">
              {trustExplanation}
            </p>
          )}
        </div>

        {/* 社交计数：视觉与语义层级低于信任级别（INV-10） */}
        <dl className="flex gap-6 border-t border-border pt-3 text-xs text-text-subtle">
          <div className="flex flex-col">
            <dt>收藏</dt>
            <dd className="tabular-nums text-text-muted">
              {socialCounts.favorites}
            </dd>
          </div>
          <div className="flex flex-col">
            <dt>认可</dt>
            <dd className="tabular-nums text-text-muted">
              {socialCounts.endorsements}
            </dd>
          </div>
        </dl>

        <SecondaryButton
          variant="outline"
          size="sm"
          fullWidth
          iconRight="chevron_right"
          onClick={onOpenProfile}
        >
          查看信任档案
        </SecondaryButton>
      </div>
    </Card>
  );
}
