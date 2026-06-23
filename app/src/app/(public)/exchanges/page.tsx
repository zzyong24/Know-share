import { Suspense } from "react";
import { ExchangeLedgerView } from "@/components/exchange";
import { SkeletonBlock } from "@/components/shared/skeleton-block";

/*
  PAGE-030 公开交换记录（脱敏台账，route /exchanges）。
  公开匿名可看（INV-04）；状态/主题/搜索/排序映射到 URL searchParams（可分享深链）。
  视图为客户端组件（useSearchParams + query hooks），用 Suspense 包裹。
*/
export default function ExchangesPage() {
  return (
    <Suspense fallback={<SkeletonBlock variant="row" count={6} />}>
      <ExchangeLedgerView />
    </Suspense>
  );
}
