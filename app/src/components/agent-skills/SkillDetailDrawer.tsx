"use client";

import {
  Drawer,
  IconChip,
  StatusPill,
  SecondaryButton,
  EmptyState,
} from "@/components/shared";
import { InstallSnippet } from "./InstallSnippet";
import { RUN_LOCATION_META } from "@/mocks/fixtures/agent-skills";
import type { AgentSkillDetail } from "@/lib/queries/agent-skills";

/*
  COMP-133 SkillDetailDrawer（技能详情抽屉）= PAGE-051 子 surface（ASM-042）。
  承载单个技能（ENT-016）全字段：描述、输入/输出、CLI 命令（等宽+复制）、MCP 工具名、
  隐私级别+本地优先说明、同意要求（consentNote）、所属流程、查看完整文档外链。
  基于共享 COMP-026 Drawer（焦点陷入/Esc 关闭/aria-modal，Radix 提供）。
  非动作：不执行技能、不读取本地、不发起提交/交换/协作（NFR-005 / ASM-041）。
*/
export interface SkillDetailDrawerProps {
  skill?: AgentSkillDetail | null;
  open: boolean;
  loading?: boolean;
  /** 已打开但 slug 无效（深链命中无效 id）。 */
  notFound?: boolean;
  onOpenChange: (open: boolean) => void;
  onCliCopy?: (slug: string, success: boolean) => void;
  onDocsClick?: (slug: string) => void;
}

export function SkillDetailDrawer({
  skill,
  open,
  loading,
  notFound,
  onOpenChange,
  onCliCopy,
  onDocsClick,
}: SkillDetailDrawerProps) {
  const title = skill ? `${skill.zhName} / ${skill.name}` : "技能详情";

  return (
    <Drawer
      open={open}
      title={title}
      side="right"
      size="lg"
      loading={loading}
      onOpenChange={onOpenChange}
    >
      {notFound || (!loading && !skill) ? (
        <EmptyState
          icon="error"
          title="未找到该技能"
          description="链接中的技能标识无效或已下线。"
          action={{ label: "返回技能目录", href: "/skills" }}
        />
      ) : skill ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <IconChip
              icon={skill.iconChip.glyph}
              tone={skill.iconChip.tone}
              size="lg"
            />
            <StatusPill
              tone={RUN_LOCATION_META[skill.runLocation].tone}
              label={RUN_LOCATION_META[skill.runLocation].label}
              icon={RUN_LOCATION_META[skill.runLocation].icon}
            />
          </div>

          <section>
            <h4 className="text-xs font-semibold text-text-muted">描述</h4>
            <p className="text-sm text-text">{skill.summary}</p>
          </section>

          <section className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold text-text-muted">输入</h4>
              <p className="text-sm text-text">{skill.input}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-text-muted">输出</h4>
              <p className="text-sm text-text">{skill.output}</p>
            </div>
          </section>

          <section className="flex flex-col gap-1">
            <h4 className="text-xs font-semibold text-text-muted">CLI 命令</h4>
            <InstallSnippet
              command={skill.cliCommand}
              label="bash"
              skillId={skill.id}
              onCopy={(ok) => onCliCopy?.(skill.slug, ok)}
            />
          </section>

          <section>
            <h4 className="text-xs font-semibold text-text-muted">MCP 工具名</h4>
            <p className="font-mono text-sm text-text">{skill.mcpToolName}</p>
          </section>

          <section className="rounded-control bg-success/10 p-3">
            <h4 className="text-xs font-semibold text-success">隐私级别与本地优先</h4>
            <p className="text-sm text-text">{skill.privacyNote}</p>
          </section>

          <section className="rounded-control bg-warning/10 p-3">
            <h4 className="text-xs font-semibold text-warning">同意要求</h4>
            <p className="text-sm text-text">{skill.consentNote}</p>
          </section>

          <section className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-text-muted">所属流程</span>
            <StatusPill tone="neutral" label={skill.flowRef} icon="swap_horiz" size="sm" />
          </section>

          {skill.docsUrl && (
            <a
              href={skill.docsUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => onDocsClick?.(skill.slug)}
            >
              <SecondaryButton size="sm" iconRight="open_in_new">
                查看完整文档
              </SecondaryButton>
            </a>
          )}
        </div>
      ) : null}
    </Drawer>
  );
}
