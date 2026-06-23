"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, IconChip } from "@/components/shared";
import { SkillGrid } from "./SkillGrid";
import { SkillDetailDrawer } from "./SkillDetailDrawer";
import { McpConfigBlock } from "./McpConfigBlock";
import { InstallSnippet } from "./InstallSnippet";
import { SupportedSourceBadge } from "./SupportedSourceBadge";
import { LocalPrivacyFlow } from "./LocalPrivacyFlow";
import { useSkillCatalog } from "@/lib/queries/agent-skills";
import type { AgentSkillDetail } from "@/lib/queries/agent-skills";

/*
  SkillsView —— PAGE-050 客户端视图 + PAGE-051 子 surface（抽屉）。
  - 取数 useSkillCatalog（聚合：技能/来源/流程/安装/示例命令/核心原则）。
  - 卡片点击/查看文档 → 打开技能详情抽屉（深链 /skills/:slug 由路由层经 initialSkillSlug 注入）。
  - 本页只做发现/安装/文档：导航、复制、切 Tab；不执行技能、不读本地、不越同意（NFR-005）。
  - 遥测仅聚合无 PII（FR-140）：此处用 onCopy/onOpen 回调位（实际埋点接入聚合层时挂载）。
*/
export interface SkillsViewProps {
  /** 深链 /skills/:skillId 注入；命中则初始打开对应技能抽屉。 */
  initialSkillSlug?: string;
}

export function SkillsView({ initialSkillSlug }: SkillsViewProps) {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useSkillCatalog();

  const [openSlug, setOpenSlug] = useState<string | undefined>(initialSkillSlug);

  // 深链（initialSkillSlug）变化时在渲染期同步抽屉，避免 effect 内 setState。
  const [prevSlug, setPrevSlug] = useState(initialSkillSlug);
  if (prevSlug !== initialSkillSlug) {
    setPrevSlug(initialSkillSlug);
    setOpenSlug(initialSkillSlug);
  }

  const skills = data?.skills ?? [];
  const activeSkill: AgentSkillDetail | undefined = openSlug
    ? skills.find((s) => s.slug === openSlug)
    : undefined;
  // 目录已加载但 slug 无效 → 视为未找到。
  const notFound =
    !!openSlug && !isLoading && skills.length > 0 && !activeSkill;

  const openDetail = (slug: string) => setOpenSlug(slug);
  const closeDetail = () => {
    setOpenSlug(undefined);
    // 若是从深链进入，关闭后回到目录（不留在 /skills/:slug）。
    if (initialSkillSlug) router.push("/skills");
  };

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-4 py-8">
      {/* 1. 页头 + 核心原则横幅 */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Agent 技能</h1>
          <p className="mt-1 max-w-xl text-sm text-text-muted">
            让你的 Agent 本地生成、脱敏并安全交换知识。
          </p>
        </div>
        {data?.corePrinciple && (
          <Card padding="sm" className="max-w-md border-success/30 bg-success/10">
            <div className="flex gap-3">
              <IconChip icon="shield" tone="success" size="md" />
              <div>
                <h2 className="text-sm font-semibold text-success">
                  {data.corePrinciple.title}
                </h2>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-text">
                  {data.corePrinciple.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}
      </header>

      {/* 2. 技能总览网格 */}
      <section aria-labelledby="skills-overview">
        <h2 id="skills-overview" className="mb-3 text-lg font-semibold text-text">
          技能总览
        </h2>
        <SkillGrid
          skills={skills}
          isLoading={isLoading}
          error={isError ? new Error("加载失败") : null}
          onOpenDetail={openDetail}
          onDocsClick={openDetail}
          onRetry={() => refetch()}
        />
      </section>

      {/* 3. 本地优先隐私流程 */}
      {data?.flowSteps && (
        <section aria-labelledby="privacy-flow">
          <h2 id="privacy-flow" className="mb-3 text-lg font-semibold text-text">
            本地优先隐私流程
          </h2>
          <Card>
            <LocalPrivacyFlow steps={data.flowSteps} />
          </Card>
        </section>
      )}

      {/* 4. 三栏：安装方式 / 示例命令 / 适配来源 */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-text">安装方式</h2>
          {data?.install && (
            <McpConfigBlock
              mcpConfig={data.install.mcpConfig}
              skillInstallText={data.install.skillInstallText}
            />
          )}
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-text">示例命令</h2>
          <div className="flex flex-col gap-3">
            {(data?.exampleCommands ?? []).map((cmd) => (
              <InstallSnippet
                key={cmd.skillId}
                command={cmd.command}
                label={cmd.label}
                skillId={cmd.skillId}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-text">适配的知识来源</h2>
          <div className="flex flex-wrap gap-2">
            {(data?.sources ?? []).map((src) => (
              <SupportedSourceBadge key={src.id} source={src} />
            ))}
          </div>
        </div>
      </section>

      {/* PAGE-051 技能详情抽屉 */}
      <SkillDetailDrawer
        open={!!openSlug}
        skill={activeSkill}
        loading={isLoading && !!openSlug}
        notFound={notFound}
        onOpenChange={(o) => {
          if (!o) closeDetail();
        }}
      />
    </div>
  );
}
