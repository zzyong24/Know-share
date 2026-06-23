"use client";

import { Card } from "@/components/shared/card";
import { IconChip } from "@/components/shared/icon-chip";
import { StatusPill } from "@/components/shared/status-pill";
import { SecondaryButton } from "@/components/shared/secondary-button";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import type { AgentSkill } from "@/lib/types";

/*
  COMP-073 AgentSkillCard（第 2 步右栏：Agent 技能 / MCP，PAGE-021）。
  只读展示本机可用技能（ENT-016）+ 跳 IA-008 安装/文档；不执行技能、不接收原始内容（NFR-001）。
*/
const PRIVACY_META: Record<AgentSkill["privacyLevel"], { label: string; tone: "success" | "warning" }> =
  {
    local: { label: "本机执行", tone: "success" },
    remote: { label: "远程执行", tone: "warning" },
  };

export interface AgentSkillCardProps {
  skills: AgentSkill[];
  selectedSkillId?: string;
  onSelectSkill?: (id: string) => void;
  onOpenDoc?: (id: string) => void;
  onOpenCatalog?: () => void;
}

export function AgentSkillCard({
  skills,
  selectedSkillId,
  onSelectSkill,
  onOpenDoc,
  onOpenCatalog,
}: AgentSkillCardProps) {
  if (skills.length === 0) {
    return (
      <Card header={<h3 className="text-sm font-semibold text-text">Agent 技能 / MCP</h3>}>
        <EmptyState
          icon="auto_awesome"
          title="未发现可用本机技能"
          description="去技能目录安装清单生成 / 脱敏技能，或改用「导入 JSON」。"
          action={{ label: "去技能目录", onClick: onOpenCatalog }}
        />
      </Card>
    );
  }

  return (
    <Card
      header={
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-text">Agent 技能 / MCP</h3>
          <button
            type="button"
            onClick={onOpenCatalog}
            className="inline-flex items-center gap-1 rounded text-xs text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            技能目录
          </button>
        </div>
      }
    >
      <ul className="flex flex-col gap-2">
        {skills.map((s) => {
          const meta = PRIVACY_META[s.privacyLevel];
          const selected = s.id === selectedSkillId;
          return (
            <li
              key={s.id}
              className={cn(
                "rounded-control border p-3",
                selected ? "border-primary ring-1 ring-primary" : "border-border"
              )}
            >
              <div className="flex items-start gap-2">
                <IconChip icon="auto_awesome" size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-text">{s.name}</span>
                    <StatusPill tone={meta.tone} label={meta.label} size="sm" />
                  </div>
                  <p className="mt-0.5 text-xs text-text-muted">{s.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <SecondaryButton
                      size="sm"
                      variant="subtle"
                      onClick={() => onSelectSkill?.(s.id)}
                      aria-pressed={selected}
                    >
                      {selected ? "已选用" : "选用生成"}
                    </SecondaryButton>
                    <SecondaryButton
                      size="sm"
                      variant="ghost"
                      iconRight="open_in_new"
                      onClick={() => onOpenDoc?.(s.id)}
                      aria-label={`查看 ${s.name} 文档`}
                    >
                      文档
                    </SecondaryButton>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
