import { Suspense } from "react";
import { SubmitWizard } from "@/components/submission/SubmitWizard";
import { SkeletonBlock } from "@/components/shared/skeleton-block";

/* PAGE-021 第 2 步：生成或导入 Manifest 清单（/submit/manifest）。 */
export default function SubmitManifestPage() {
  return (
    <Suspense fallback={<SkeletonBlock variant="card" count={2} />}>
      <SubmitWizard submissionId={null} initialStep={2} />
    </Suspense>
  );
}
