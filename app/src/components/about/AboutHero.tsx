"use client";

import { SecondaryButton } from "@/components/shared/secondary-button";
import { IconChip } from "@/components/shared/icon-chip";
import { Octocat } from "@/components/shared/octocat";
import { cn } from "@/lib/utils";

/*
  COMP-210 AboutHero（PAGE-101）：产品理念 + 开源徽 + 「在 GitHub 查看仓库」外链按钮。
  对外兑现 NFR-004（仓库链接 = 可审计入口）。文案追溯 PRODUCT_SPEC 核心理念，
  归正真源 HTML 漂移——不出现「链上 / 区块链 / E2EE / 语义向量」等措辞。
  GitHub Octocat 为唯一品牌图标例外（UI-002）；其余图标 Material Symbols Outlined（lucide 替换）。
  decorativeStat 默认 null：不渲染硬编码「512 Nodes」（ASM-060）。
*/
export interface AboutHeroProps {
  tagline: string;
  subcopy: string;
  repoUrl: string;
  openSourceBadgeLabel?: string;
  decorativeStat?: { label: string; value: string } | null;
}

export function AboutHero({
  tagline,
  subcopy,
  repoUrl,
  openSourceBadgeLabel = "开源 (Open Source)",
  decorativeStat = null,
}: AboutHeroProps) {
  return (
    <section
      id="hero"
      aria-labelledby="about-hero-title"
      className="flex flex-col items-start gap-8 py-12 md:flex-row md:items-center md:justify-between"
    >
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-primary-subtle px-3 py-1 text-sm font-medium text-primary">
          <IconChip icon="code" tone="primary" size="sm" />
          {openSourceBadgeLabel}
        </span>
        <h1
          id="about-hero-title"
          className="mt-4 text-3xl font-semibold tracking-tight text-text md:text-4xl"
        >
          {tagline}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-text-muted">{subcopy}</p>
        <div className="mt-6">
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="在 GitHub 查看 Know-share 仓库，在新窗口打开"
            className="inline-block rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <SecondaryButton tabIndex={-1}>
              <Octocat />
              在 GitHub 查看仓库
            </SecondaryButton>
          </a>
        </div>
      </div>

      {decorativeStat && (
        <div
          className={cn(
            "shrink-0 rounded-card border border-border bg-surface px-6 py-5 shadow-card"
          )}
        >
          <div className="text-2xl font-semibold tabular-nums text-primary">
            {decorativeStat.value}
          </div>
          <div className="mt-1 text-sm text-text-muted">{decorativeStat.label}</div>
        </div>
      )}
    </section>
  );
}
