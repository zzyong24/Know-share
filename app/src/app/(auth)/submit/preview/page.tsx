import { Suspense } from "react";
import { SubmitWizard } from "@/components/submission/SubmitWizard";
import { SkeletonBlock } from "@/components/shared/skeleton-block";

/* PAGE-023 第 4 步：卡片预览（/submit/preview）。 */
export default function SubmitPreviewPage() {
  return (
    <Suspense fallback={<SkeletonBlock variant="card" count={2} />}>
      <SubmitWizard submissionId={null} initialStep={4} />
    </Suspense>
  );
}
