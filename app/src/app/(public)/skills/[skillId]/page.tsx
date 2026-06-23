import { Suspense } from "react";
import { SkillsView } from "@/components/agent-skills";
import { SkeletonBlock } from "@/components/shared/skeleton-block";

/*
  PAGE-051 技能详情子 surface 深链（route /skills/:skillId）。
  复用 PAGE-050 SkillsView 并经 initialSkillSlug 初始打开对应技能抽屉（ASM-042）。
  无效 id → 抽屉内空态 + 返回目录（不崩溃）。
*/
export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ skillId: string }>;
}) {
  const { skillId } = await params;
  return (
    <Suspense fallback={<SkeletonBlock variant="card" count={2} />}>
      <SkillsView initialSkillSlug={skillId} />
    </Suspense>
  );
}
