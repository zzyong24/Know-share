import { Suspense } from "react";
import { SubmitWizard } from "@/components/submission/SubmitWizard";
import { SkeletonBlock } from "@/components/shared/skeleton-block";

/* PAGE-022 第 3 步：隐私 Gate 校验（强约束节点，/submit/privacy-gate）。 */
export default function SubmitPrivacyGatePage() {
  return (
    <Suspense fallback={<SkeletonBlock variant="card" count={2} />}>
      <SubmitWizard submissionId={null} initialStep={3} />
    </Suspense>
  );
}
