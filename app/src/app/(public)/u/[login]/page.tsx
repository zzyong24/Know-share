import { Suspense } from "react";
import { TrustProfileView } from "@/components/trust-feedback";
import { SkeletonBlock } from "@/components/shared/skeleton-block";

/*
  PAGE-040 用户信任档案页（route /u/:login，规范公开档案路由 DEC-006/ASM-038）。
  + PAGE-041 信任分解释（抽屉，深链 ?explain=trust）。公开匿名可看（INV-04）。
  客户端视图读 params + searchParams 深链 → 用 Suspense 包裹。
*/
export default async function TrustProfilePage({
  params,
}: {
  params: Promise<{ login: string }>;
}) {
  const { login } = await params;
  return (
    <Suspense fallback={<SkeletonBlock variant="card" count={3} />}>
      <TrustProfileView login={decodeURIComponent(login)} />
    </Suspense>
  );
}
