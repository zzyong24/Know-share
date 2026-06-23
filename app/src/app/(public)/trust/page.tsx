import { Suspense } from "react";
import { TrustNetworkView } from "@/components/trust-feedback";
import { SkeletonBlock } from "@/components/shared/skeleton-block";

/*
  PAGE-043 信任网络索引 / 着陆页（route /trust，呼应主导航「信任网络」IA-007）。
  发现可信贡献者 + 信任机制说明；非竞争/非付费榜（DEC-007/ASM-061）。公开匿名可看（INV-04）。
  客户端视图读 URL searchParams 深链 → 用 Suspense 包裹。
*/
export default function TrustNetworkPage() {
  return (
    <Suspense fallback={<SkeletonBlock variant="card" count={2} />}>
      <TrustNetworkView />
    </Suspense>
  );
}
