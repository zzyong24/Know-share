import { Suspense } from "react";
import { SkillsView } from "@/components/agent-skills";
import { SkeletonBlock } from "@/components/shared/skeleton-block";

/*
  PAGE-050 Agent 技能目录（route /skills）。匿名可访问、零私有内容（INV-04）。
  技能卡网格 + 本地优先隐私流程 + 安装方式 / 示例命令 / 适配来源。
  本页只做发现/安装/文档，不执行技能、不读本地、不越同意（NFR-005）。
*/
export default function SkillsPage() {
  return (
    <Suspense fallback={<SkeletonBlock variant="card" count={2} />}>
      <SkillsView />
    </Suspense>
  );
}
