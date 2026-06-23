"use client";

import { Card, EmptyState, SecondaryButton, SkeletonBlock } from "@/components/shared";
import { SkillCard } from "./SkillCard";
import type { AgentSkillDetail } from "@/lib/queries/agent-skills";

/*
  COMP-131 SkillGrid（技能网格）。
  数据驱动渲染 N 张 SkillCard（不硬编码 5 张，支持扩展，RISK-001 处置）。
  响应式：桌面 ≥1280px 多列、平板 2 列、移动 1 列（UI_RULES）。
  状态：default / loading（骨架）/ empty（EmptyState）/ error（区块内联错误卡 + 重试，不阻塞整页）。
*/
export interface SkillGridProps {
  skills: AgentSkillDetail[];
  isLoading?: boolean;
  error?: unknown;
  onOpenDetail?: (slug: string) => void;
  onDocsClick?: (slug: string) => void;
  onRetry?: () => void;
}

const GRID_CLS =
  "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5";

export function SkillGrid({
  skills,
  isLoading,
  error,
  onOpenDetail,
  onDocsClick,
  onRetry,
}: SkillGridProps) {
  if (isLoading) {
    return (
      <div className={GRID_CLS} aria-busy="true" data-testid="skill-grid-loading">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={i} variant="card" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-danger">技能目录加载失败，请稍后重试。</p>
          {onRetry && (
            <SecondaryButton size="sm" iconLeft="swap_horiz" onClick={onRetry}>
              重试
            </SecondaryButton>
          )}
        </div>
      </Card>
    );
  }

  if (!skills.length) {
    return (
      <EmptyState
        icon="inventory_2"
        title="技能目录加载中或暂不可用"
        description="技能目录稍后将恢复。你也可以查看开放 API 文档或仓库了解如何接入。"
        action={{ label: "查看开放 API", href: "/open-api" }}
        secondaryAction={{ label: "前往仓库", href: "/about" }}
      />
    );
  }

  return (
    <ul role="list" className={GRID_CLS}>
      {skills.map((skill) => (
        <li key={skill.id}>
          <SkillCard
            skill={skill}
            onOpenDetail={onOpenDetail}
            onDocsClick={onDocsClick}
          />
        </li>
      ))}
    </ul>
  );
}
