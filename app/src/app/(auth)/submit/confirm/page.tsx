import { Suspense } from "react";
import { SubmitWizard } from "@/components/submission/SubmitWizard";
import { SkeletonBlock } from "@/components/shared/skeleton-block";

/* PAGE-024 第 5 步：提交确认（/submit/confirm）。 */
export default function SubmitConfirmPage() {
  return (
    <Suspense fallback={<SkeletonBlock variant="card" count={2} />}>
      <SubmitWizard submissionId={null} initialStep={5} />
    </Suspense>
  );
}
