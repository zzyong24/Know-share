import { SkeletonBlock } from "@/components/shared/skeleton-block";

export default function AuthLoading() {
  return (
    <div aria-busy aria-label="加载中" className="space-y-4">
      <SkeletonBlock variant="text" width="40%" />
      <SkeletonBlock variant="card" count={2} />
    </div>
  );
}
