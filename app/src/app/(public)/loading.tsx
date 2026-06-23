import { SkeletonBlock } from "@/components/shared/skeleton-block";

/* 公开段加载态（FRONTEND_SPEC §3）。结构骨架，外壳即时可用不阻塞浏览。 */
export default function PublicLoading() {
  return (
    <div aria-busy aria-label="加载中" className="space-y-4">
      <SkeletonBlock variant="text" width="40%" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} variant="card" />
        ))}
      </div>
    </div>
  );
}
