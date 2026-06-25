"use client";

import { Card, IconChip, StatusPill, SecondaryButton } from "@/components/shared";
import { RUN_LOCATION_META } from "@/mocks/fixtures/agent-skills";
import type { AgentSkillDetail } from "@/lib/queries/agent-skills";

/*
  COMP-130 SkillCard（技能卡）。
  着色 IconChip + 中英名 + runLocation 标签（文字+色，NFR-007）+ 一句描述 + 输入/输出 + 查看文档。
  点击卡片主体 → onOpenDetail（打开 PAGE-051 详情）；点击「查看文档」→ onDocsClick（不冒泡打开详情）。
  非动作：不执行技能、不读取本地、不发起提交/交换（NFR-005 / PROJECT_CONTEXT 非目标）。
*/
export interface SkillCardProps {
  skill: AgentSkillDetail;
  onOpenDetail?: (slug: string) => void;
  onDocsClick?: (slug: string) => void;
}

export function SkillCard({ skill, onOpenDetail, onDocsClick }: SkillCardProps) {
  // 防御：后端目录形状可能缺部分展示字段（与卡片契约偏差）——一律回退，绝不让整页错误边界。
  const run = RUN_LOCATION_META[skill.runLocation] ?? {
    tone: "neutral" as const,
    label: skill.runLocation ?? "—",
    icon: "smart_toy",
  };
  const hasDocs = !!skill.docsUrl;
  const displayName = skill.zhName ?? skill.name;
  const glyph = skill.iconChip?.glyph ?? "smart_toy";
  const glyphTone = skill.iconChip?.tone ?? "primary";

  return (
    <Card
      interactive
      aria-label={`查看技能详情：${displayName}`}
      onClick={() => onOpenDetail?.(skill.slug)}
      header={
        <div className="flex items-start justify-between gap-2">
          <IconChip icon={glyph} tone={glyphTone} size="lg" />
          <StatusPill tone={run.tone} label={run.label} icon={run.icon} size="sm" />
        </div>
      }
    >
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text">{displayName}</h3>
          <p className="font-mono text-xs text-text-muted">{skill.name}</p>
        </div>
        <p className="text-sm text-text-muted">{skill.summary}</p>
        <dl className="flex flex-col gap-1 text-xs text-text-muted">
          <div className="flex gap-1">
            <dt className="shrink-0 font-medium text-text">输入</dt>
            <dd>{skill.input ?? "—"}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="shrink-0 font-medium text-text">输出</dt>
            <dd>{skill.output ?? "—"}</dd>
          </div>
        </dl>
        <div
          className="mt-1"
          /* 阻止文档链接点击冒泡到卡片主体（避免同时打开详情）。 */
          onClick={(e) => e.stopPropagation()}
        >
          {hasDocs ? (
            <SecondaryButton
              size="sm"
              variant="ghost"
              iconRight="chevron_right"
              onClick={() => onDocsClick?.(skill.slug)}
            >
              查看文档
            </SecondaryButton>
          ) : (
            <SecondaryButton
              size="sm"
              variant="ghost"
              disabled
              title="该技能暂无文档链接"
            >
              查看文档
            </SecondaryButton>
          )}
        </div>
      </div>
    </Card>
  );
}
