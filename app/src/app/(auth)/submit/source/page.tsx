import { Suspense } from "react";
import { SubmitWizard } from "@/components/submission/SubmitWizard";
import { SkeletonBlock } from "@/components/shared/skeleton-block";

/*
  PAGE-020 第 1 步：向导外壳 + 选择类型 / 来源（受保护段，需登录 NFR-005）。
  路由 /submit/source。外壳与跨步状态由 COMP-070 SubmitWizard 持有。
*/
export default function SubmitSourcePage() {
  return (
    <Suspense fallback={<SkeletonBlock variant="card" count={2} />}>
      <SubmitWizard submissionId={null} initialStep={1} />
    </Suspense>
  );
}
